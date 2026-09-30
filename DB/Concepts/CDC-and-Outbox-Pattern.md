# Change Data Capture (CDC) & the Outbox Pattern

## Why this matters day to day
In a microservices architecture, "how do we keep two services' data in sync without a distributed transaction" comes up constantly — search index updates, cache invalidation, event-driven notifications, data warehouse sync. CDC and the outbox pattern are the standard, battle-tested answers.

## The dual-write problem

The naive approach — write to the database, then separately publish a message to Kafka/a queue — has a fundamental flaw:

```
1. COMMIT the database transaction
2. Publish an event to Kafka
```

If the process crashes between steps 1 and 2 (or the message broker is briefly unreachable), the database change happened but the event was never published — **downstream consumers (search index, cache, other services) silently go out of sync with the source of truth, with no error raised anywhere.** Reversing the order (publish first, then commit) has the mirror-image problem: the event goes out but the transaction then fails to commit, so consumers act on a change that never actually happened.

## The Outbox Pattern: solving it with a single local transaction

Instead of writing to the database and a separate message broker as two independent operations, write the business data change **and** a representation of the event to an `outbox` table, in the **same local database transaction**:

```sql
BEGIN;
  UPDATE orders SET status = 'SHIPPED' WHERE id = 123;
  INSERT INTO outbox_events (id, aggregate_id, event_type, payload, created_at)
  VALUES (gen_random_uuid(), 123, 'OrderShipped', '{"orderId":123,...}', now());
COMMIT;
```

Because both statements are in one ACID transaction, they either both succeed or both roll back — there is no window where one happened without the other. A separate process then reads the `outbox_events` table and publishes each row to Kafka/the message broker, marking it published (or deleting it) once confirmed. **This separate publishing step can be built two ways:**

1. **Polling publisher**: a background job periodically queries `WHERE published = false ORDER BY created_at` and publishes, then marks rows published. Simple to build, adds polling latency, and needs care to avoid publishing the same row twice under concurrent worker instances (e.g. `SELECT ... FOR UPDATE SKIP LOCKED`).
2. **CDC-based publisher (the more robust, lower-latency approach)**: a tool like **Debezium** tails the database's own replication log (Postgres logical replication / MySQL binlog) and streams every row change from the `outbox_events` table directly into Kafka, with no polling delay and no risk of missing a row — because it's reading the database's own durable commit log, not querying application-visible state.

## CDC more broadly: not just for the outbox pattern

Change Data Capture — streaming every row-level insert/update/delete from a database's replication log — has uses well beyond the outbox pattern:

- **Keeping a search index (Elasticsearch) or cache (Redis) in sync** with the system-of-record database without the application having to remember to update both on every write path.
- **Feeding a data warehouse/lake** with a near-real-time stream of changes instead of nightly batch ETL jobs.
- **Building an audit log** of every change to a table, including changes made by processes other than the primary application (a manual `psql` fix, another service, etc.) — something application-level event publishing would miss entirely.

**Key property that makes CDC reliable**: it reads from the database's own transaction/replication log, which is the authoritative record of what was actually committed — this is strictly more reliable than any application-level "remember to also do X after every write" approach, because it's structurally impossible to commit a change without it appearing in the log.

## Trade-offs and operational reality

- CDC tooling (Debezium + Kafka Connect) adds real operational surface area — it needs to be run, monitored, and its lag tracked, similar to replication lag.
- Outbox tables grow unboundedly if nothing prunes published rows — add a retention/cleanup job.
- Schema changes to a CDC-tracked table need care — a column rename or type change can break downstream consumers that expect the old shape, similar in spirit to the API-versioning concerns of the Expand-Contract migration pattern.

## The relationship to distributed transactions / Saga pattern

The outbox pattern is one concrete building block for implementing the **Saga pattern** (a sequence of local transactions across services, each publishing an event that triggers the next step, with compensating actions to undo prior steps on failure) — it's how each individual service in a saga reliably publishes "I did my part" without needing a distributed two-phase-commit transaction spanning multiple services' databases, which doesn't scale well and most modern distributed systems deliberately avoid.
