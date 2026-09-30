# Locking & Deadlocks

## Why this matters day to day
"The app hung" and "we got a deadlock error in production logs" are two of the most common on-call pages tied directly to database locking behavior. Understanding lock granularity and deadlock resolution turns a mystery hang into a five-minute diagnosis.

## Lock granularity

| Level | Example | Trade-off |
|---|---|---|
| **Row-level** | `UPDATE t SET x=1 WHERE id=5` locks only row 5 | High concurrency, more lock bookkeeping overhead |
| **Page-level** | Some engines lock a whole data page | Middle ground, less common in modern OLTP engines |
| **Table-level** | `LOCK TABLE t`, or DDL like `ALTER TABLE` | Blocks everything on that table — necessary for schema changes, disastrous if held during peak traffic |

Modern OLTP engines (Postgres, InnoDB) default to row-level locking for DML, escalating to table locks only for specific operations (DDL, explicit `LOCK TABLE`, or some bulk operations).

## Shared vs Exclusive locks

- **Shared (S) lock**: taken by readers under locking reads (`SELECT ... FOR SHARE`); multiple transactions can hold a shared lock on the same row simultaneously.
- **Exclusive (X) lock**: taken by writers (`UPDATE`, `DELETE`, `SELECT ... FOR UPDATE`); only one transaction can hold it, and it blocks both other exclusive and shared lock attempts on that row.

Plain MVCC `SELECT` (no `FOR UPDATE`/`FOR SHARE`) in Postgres/Oracle/InnoDB typically doesn't take row locks at all — it reads a consistent snapshot, which is why readers usually don't block writers in these engines.

## `SELECT ... FOR UPDATE` and `FOR SHARE`

```sql
BEGIN;
SELECT * FROM accounts WHERE id = 1 FOR UPDATE; -- takes an exclusive row lock
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;
```

This is the standard pattern to prevent a lost update when the application needs to read a value, make a decision in code, then write back — the row lock is held from the `SELECT` until the transaction ends, blocking any other transaction trying to lock or modify that row.

`FOR UPDATE SKIP LOCKED` (Postgres, MySQL 8+) is the standard pattern for building a **job queue** table — multiple workers can each grab a different unlocked row without blocking on each other.

## Deadlocks: what actually happens

A deadlock occurs when two (or more) transactions each hold a lock the other needs:

```
Transaction A: locks row 1, then tries to lock row 2
Transaction B: locks row 2, then tries to lock row 1
-- neither can proceed
```

The database's deadlock detector (runs periodically, e.g. Postgres checks every `deadlock_timeout`, default 1s) identifies the cycle and **kills one transaction** (the "victim", usually the one that did less work or was chosen by a heuristic), rolling it back with an error, letting the other proceed.

**This is not a bug — it's the database working as designed.** The correct fix is in application code: catch the deadlock error and retry the transaction (with backoff/jitter), rather than treating it as a fatal error to surface to the user.

## The #1 practical way to prevent deadlocks

**Always acquire locks on multiple rows in the same, consistent order across all transactions.** If every transaction that needs to touch both row 1 and row 2 always locks row 1 first, then row 2, a deadlock between them becomes impossible — the classic example is a funds-transfer function that should always lock accounts in a fixed order (e.g. by ascending account ID), never in the order the two account IDs happen to arrive as function arguments.

```sql
-- Wrong: order depends on argument order, can deadlock
-- transfer(from=1, to=2) locks 1 then 2
-- transfer(from=2, to=1) locks 2 then 1  <- opposite order, deadlock risk

-- Right: always lock in a fixed canonical order regardless of direction
SELECT * FROM accounts WHERE id IN (LEAST(1,2), GREATEST(1,2)) ORDER BY id FOR UPDATE;
```

## Lock timeouts and diagnosing a stuck transaction

Set `lock_timeout` (Postgres) or `innodb_lock_wait_timeout` (MySQL) so a transaction waiting too long for a lock fails fast with a clear error instead of hanging indefinitely and piling up connections behind it.

To diagnose a live hang:
- **Postgres**: query `pg_locks` joined with `pg_stat_activity` to see who's blocking whom (`pg_blocking_pids(pid)` is the direct helper function).
- **MySQL**: `SHOW ENGINE INNODB STATUS` includes a `LATEST DETECTED DEADLOCK` section and current lock waits; `information_schema.innodb_lock_waits` for live blocking chains.
- **Oracle**: query `v$lock` and `v$session` joined together, or use `DBMS_LOCK`/AWR reports for historical contention analysis.

## Long-running transactions are the usual root cause

A transaction that's open for minutes (e.g. someone left a `psql` session mid-transaction, or an app leaked a connection without committing) holds its locks the whole time and blocks everything behind it. This is far more common in practice than a "true" two-way deadlock — always check for long-idle-in-transaction sessions first when diagnosing a lock pileup.
