# Transaction Isolation Levels & MVCC

## Why this matters day to day
Most "why did this query see stale/wrong data" or "why is this transaction blocking" incidents trace back to a misunderstanding of isolation levels. This is one of the most-used-but-least-understood areas in production databases.

## The anomalies isolation levels protect against

| Anomaly | Description |
|---|---|
| **Dirty Read** | Transaction A reads a row that Transaction B has modified but not yet committed. If B rolls back, A read data that never really existed. |
| **Non-Repeatable Read** | Transaction A reads a row twice, gets different values because B updated and committed the row in between. |
| **Phantom Read** | Transaction A re-runs a range query and gets a different *set of rows* because B inserted/deleted rows matching the condition. |
| **Lost Update** | Two transactions read the same row, both modify it, and one update silently overwrites the other's change. |

## The four standard isolation levels (SQL standard)

| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|---|---|---|---|
| **Read Uncommitted** | Possible | Possible | Possible |
| **Read Committed** | Prevented | Possible | Possible |
| **Repeatable Read** | Prevented | Prevented | Possible (mostly, DB-dependent) |
| **Serializable** | Prevented | Prevented | Prevented |

## How defaults differ across engines (this trips people up constantly)

- **PostgreSQL**: default is `READ COMMITTED`. Its `REPEATABLE READ` is actually stronger than the SQL standard requires — it uses snapshot isolation, so phantom reads are also prevented in practice (implemented via MVCC, not locking).
- **MySQL (InnoDB)**: default is `REPEATABLE READ`, and — unlike the standard — InnoDB's `REPEATABLE READ` also prevents phantom reads for locking reads via *next-key locking*, though a plain `SELECT` (snapshot read) can still see phantoms across the transaction relative to a concurrent writer in some scenarios.
- **Oracle**: does not offer true `READ UNCOMMITTED` or `REPEATABLE READ`. It offers `READ COMMITTED` (default) and `SERIALIZABLE`, both implemented via MVCC snapshots.
- **SQL Server**: default is `READ COMMITTED`, but its default implementation historically used locking, not MVCC, unless `READ_COMMITTED_SNAPSHOT` is enabled.

**Practical takeaway**: never assume a "standard" isolation level behaves identically across your Postgres, MySQL, and Oracle instances. Verify against the specific engine's docs before relying on isolation-level guarantees for correctness.

## MVCC (Multi-Version Concurrency Control) in one paragraph

Instead of readers blocking writers (and vice versa), MVCC engines keep multiple versions of a row. Each transaction sees a consistent *snapshot* of the data as of some point in time (transaction start, or statement start, depending on isolation level). Writers create a new row version rather than overwriting in place; old versions are cleaned up later (Postgres: `VACUUM`, Oracle: undo segments, MySQL/InnoDB: undo logs). This is why readers rarely block writers in Postgres/Oracle/InnoDB — a huge win for concurrent OLTP workloads, at the cost of needing garbage collection (vacuum bloat is a real, common Postgres ops problem).

## Serialization failures and how to handle them

At `SERIALIZABLE` (true serializable, e.g. Postgres's SSI — Serializable Snapshot Isolation), the database detects when concurrent transactions *would* violate serializability and aborts one of them with a serialization failure error, rather than silently producing an inconsistent result. **Application code using `SERIALIZABLE` must be written to catch this error and retry the transaction** — this isn't optional, it's part of the contract.

## Lost updates: the isolation-level gotcha

`READ COMMITTED` does **not** prevent lost updates by default. The classic pattern:

```sql
-- Both transactions run this concurrently under READ COMMITTED
BEGIN;
SELECT balance FROM accounts WHERE id = 1; -- both read 100
UPDATE accounts SET balance = balance - 10 WHERE id = 1; -- both compute 90, one silently overwrites the other's intent
COMMIT;
```

The `UPDATE ... SET balance = balance - 10` form is actually safe (it's a single atomic read-modify-write at the row level), but a **read-then-decide-then-write pattern split across a `SELECT` and a separate `UPDATE` with an application-computed new value** is not. Fix: use `SELECT ... FOR UPDATE` to take a row lock, use atomic column expressions (`balance = balance - 10`) instead of computing in application code, or use `SERIALIZABLE` and retry on conflict.

## When to reach for which level

- **Read Committed**: the right default for almost all OLTP workloads. Fast, avoids most contention.
- **Repeatable Read / Snapshot Isolation**: reports, multi-step read-heavy transactions that need a consistent view across several queries.
- **Serializable**: financial transactions, inventory decrement, anything where a lost update or write skew is unacceptable — and only when the app is prepared to retry on serialization failure.
