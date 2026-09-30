# Connection Pooling

## Why this matters day to day
"Increase max_connections" is the most common wrong answer to a connection-exhaustion incident. Understanding pooling correctly is one of the highest-leverage, most misunderstood pieces of production database configuration.

## Why connections are expensive in the first place

Each database connection (especially in Postgres, which forks a full OS process per connection) consumes real memory and CPU just to exist, independent of whether it's actively running a query. Postgres in particular gets meaningfully slower per additional idle connection well before hitting any hard `max_connections` limit — high idle connection counts alone degrade throughput. This is why "just raise max_connections to 1000" is usually the wrong fix.

## The core idea: pool at the right layer, size it correctly

A connection pool maintains a small number of real database connections and hands them out to application threads/requests on demand, returning them to the pool when done — instead of opening a new physical connection per request.

**Sizing rule of thumb** (from HikariCP's own documented guidance, and broadly applicable): pool size should be **small**, roughly `((core_count * 2) + effective_spindle_count)` as a starting formula for a single-purpose OLTP workload — often in the 10–30 range even for a fairly busy service, *not* hundreds. A pool that's too large doesn't help throughput (the database becomes the bottleneck, not the number of waiting application threads) and actively hurts it by causing context-switching and lock contention on the database side.

**Counter-intuitive but well-established**: increasing pool size beyond the point where the database's CPU/IO is saturated makes things *slower*, not faster, because queued queries now compete for the same finite resources with more overhead. If queries are queuing at the pool, the fix is usually to make queries faster or add read replicas — not to raise the pool size indefinitely.

## Application-side pooling vs a dedicated pooler (PgBouncer)

- **HikariCP** (Java/Spring default) or equivalent per-app-instance pools work well when you have a **small number of application instances**, each with a reasonably sized pool.
- **Problem at scale**: if you have 50 application instances each with a HikariCP pool of 20, that's up to 1,000 real database connections even if each pool is individually well-sized — this is the actual, common cause of `max_connections` exhaustion in a microservices/horizontally-scaled deployment.
- **PgBouncer** (or ProxySQL for MySQL) sits between the application fleet and the database as a single shared pooler, multiplexing many application-side "connections" onto a much smaller number of real backend connections. This decouples "how many app instances we run" from "how many real DB connections exist."

## PgBouncer pool modes matter

- **Session mode**: a client connection maps 1:1 to a server connection for the client's entire session — safest, supports all Postgres features (e.g. `LISTEN/NOTIFY`, prepared statements, advisory locks), but doesn't reduce connection count much.
- **Transaction mode**: a server connection is only held for the duration of a single transaction, then returned to the pool for another client — the setting that actually achieves high connection multiplexing, but **breaks session-level features** (session-level advisory locks, `SET` statements meant to persist across statements, `LISTEN/NOTIFY`, some prepared-statement caching) since the underlying server connection can change between statements/transactions.
- **Statement mode**: even more aggressive multiplexing, breaks multi-statement transactions entirely — rarely appropriate.

**Practical takeaway**: transaction mode is the usual choice for high-connection-count microservices architectures, but application code must be audited for anything that assumes session persistence (a common source of subtle bugs when adopting PgBouncer transaction mode for the first time).

## Diagnosing pool exhaustion in production

- Symptom: requests timing out waiting to *acquire* a connection from the pool, while the database itself may not even be under heavy load — this is a pool-sizing/leak problem, not a database-capacity problem.
- **Connection leaks** (code path that acquires a connection but doesn't release it on an exception path) are a very common root cause — check for `try/finally` or try-with-resources discipline around every connection checkout.
- Monitor pool metrics directly (HikariCP exposes active/idle/waiting-thread counts via JMX/Micrometer) rather than inferring pool health from downstream symptoms alone.
