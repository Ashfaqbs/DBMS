# Sharding Strategies

## Why this matters day to day
Sharding is one of the biggest, hardest-to-reverse architectural decisions a team can make. Getting the shard key wrong is discovered months later as a painful, expensive resharding project — this is exactly the kind of decision leads/architects need a solid mental model for *before* committing.

## What sharding actually is

Splitting a single logical dataset across multiple independent database instances ("shards"), each holding a subset of the data, so that both storage and query load scale horizontally beyond what one machine can handle. Distinct from **replication** (which copies the *same* full dataset to multiple nodes for availability/read-scaling) — sharding partitions *different* data onto different nodes.

## The three main partitioning strategies

### 1. Range-based sharding
Rows are assigned to shards based on ranges of the shard key (e.g. user IDs 1–1,000,000 on shard A, 1,000,001–2,000,000 on shard B).
- **Pro**: range queries (`WHERE id BETWEEN x AND y`) stay within a single shard, efficient.
- **Con**: prone to **hot spots** — if the shard key correlates with insertion order (e.g. auto-incrementing IDs, or timestamps), all new writes land on the newest/last shard while older shards sit idle.

### 2. Hash-based sharding
The shard key is hashed, and the hash determines the shard (e.g. `hash(user_id) % num_shards`).
- **Pro**: distributes load evenly, no hot spots from sequential keys.
- **Con**: range queries now have to fan out to every shard (no locality), and **changing the number of shards requires rehashing/moving almost all data** unless consistent hashing is used.

### 3. Directory-based (lookup) sharding
A separate lookup service/table maps each shard key (or key range) explicitly to a shard.
- **Pro**: maximum flexibility — can rebalance by moving individual keys' mappings without a mathematical rehash, can shard by arbitrary business logic (e.g. "enterprise customers get their own dedicated shard").
- **Con**: the lookup service/table itself becomes a critical dependency and potential bottleneck/single point of failure if not made highly available.

## Consistent hashing: the practical fix for hash-sharding's rebalancing problem

Plain `hash(key) % N` means changing `N` (adding/removing a shard) reassigns almost every key to a different shard — a massive data-movement event. **Consistent hashing** places both shards and keys on a conceptual ring; adding or removing one shard only reassigns the keys that fall in that shard's specific arc of the ring, not the whole dataset. This is why systems like Cassandra and DynamoDB (and CDNs, for the same underlying reason) use consistent hashing rather than naive modulo hashing.

## Choosing the shard key — the decision that's hardest to undo

The single most important sharding decision. Bad shard key choices that come up repeatedly in practice:

- **A key with a highly skewed distribution** (e.g. sharding a multi-tenant SaaS product by `tenant_id` when one enterprise tenant is 1000x larger than a typical tenant) — that one shard becomes a hot spot regardless of hashing.
- **A key that doesn't match the application's actual query patterns.** If almost every query filters by `user_id`, but the data is sharded by `order_id`, most queries now have to fan out across every shard to find a user's orders — defeating much of the point of sharding.
- **A key that changes over the entity's lifetime** (e.g. sharding by a mutable "region" field that a user can later change) — moving a row between shards after the fact is expensive and error-prone.

**Rule of thumb**: pick the shard key based on the dominant, high-volume query pattern (usually "give me everything for this entity"), not based on what seems most "natural" from a data-modeling perspective alone.

## The problems sharding introduces (the part often glossed over)

- **Cross-shard joins/transactions become hard or impossible** — a `JOIN` across two tables that live on different shards generally has to be done in application code (fetch from shard A, fetch from shard B, join in memory), and a transaction spanning two shards needs a distributed transaction protocol (two-phase commit) or an eventual-consistency pattern like the Saga pattern — see the CDC/outbox doc for a related pattern.
- **Aggregate queries** ("total revenue across all customers") now require fanning out to every shard and combining results in application code, rather than a single `SUM()`.
- **Operational overhead multiplies**: N shards means N times the backup/monitoring/migration/failover surface area to manage.

## When to actually shard (and when not to)

Sharding should be a **last resort after** simpler scaling techniques are exhausted: read replicas for read-heavy load, caching (Redis) in front of hot reads, vertical scaling (bigger instance), and query/index optimization. Sharding is the right call specifically when a **single node can no longer hold the working dataset or handle the write throughput**, not as a default "scalability" pattern applied prematurely — the cross-shard complexity above is a permanent tax paid on every future feature that needs cross-entity data.
