# CAP Theorem & Consistency Models

## Why this matters day to day
Every "should we use Postgres or Mongo/Cassandra/DynamoDB for this service" and "can this read ever return stale data" conversation is really a CAP/consistency-model conversation, whether or not anyone names it that. Architects use this framework constantly when picking a data store or designing a distributed feature.

## CAP theorem, precisely

In the presence of a **network Partition** between nodes, a distributed system must choose between:
- **Consistency (C)**: every read receives the most recent write, or an error.
- **Availability (A)**: every request receives a (non-error) response, without guaranteeing it's the most recent write.

You cannot have both C and A during a partition — only one. Outside of a partition (the common case), most systems try to offer both.

**Common misreading to avoid**: CAP is not "pick 2 of 3 permanently." Partition tolerance isn't really optional for any real distributed system — networks *will* partition. So in practice the meaningful choice is **CP vs AP during a partition**, not a free choice among three properties.

## Where common systems land

| System | Typical stance |
|---|---|
| **PostgreSQL / MySQL (single primary)** | CP by nature — a single writable node means no partition-induced inconsistency, but the primary becoming unreachable makes writes unavailable until failover |
| **MongoDB (default)** | CP-leaning — reads/writes go to a primary; during a partition, a minority side loses write availability |
| **Cassandra / DynamoDB** | AP by default — tunable per-request consistency (`QUORUM`, `ONE`, `ALL`), can favor availability and self-heal via eventual consistency |
| **ZooKeeper / etcd (consensus stores)** | CP — explicitly sacrifice availability during a partition to guarantee a single consistent view, used for coordination/leader-election, not general app data |

## Consistency models beyond the CAP binary

CAP's "C" is really shorthand for **linearizability** (strong consistency). In practice there's a spectrum:

- **Strong consistency / linearizability**: every read sees the latest committed write, as if there were only one copy of the data. Simplest to reason about, most expensive to guarantee across a distributed system.
- **Eventual consistency**: if no new writes occur, all replicas *eventually* converge to the same value — but a read right after a write can return stale data. Cheap, highly available, requires the application to tolerate staleness.
- **Causal consistency**: writes that are causally related (e.g. "post a comment" happens after "read the post") are seen in the correct order by everyone, but unrelated writes can be seen in different orders on different nodes. A practical middle ground — e.g. "you won't see a reply before the comment it replies to."
- **Read-your-writes consistency**: a specific, narrower guarantee — a user who just wrote data will see their own write on their next read (even if other users might not yet), often achieved by routing a user's reads to the same replica/session that handled their write.
- **Monotonic reads**: once you've seen a value, you'll never see an older value on a subsequent read (protects against "flickering" data when reads hit different replicas).

## Applying this: how to actually pick

1. **Does losing availability during a rare network partition matter more, or does serving stale data matter more, for this specific feature?** A bank balance display probably needs strong consistency; a "likes" counter or activity feed can tolerate eventual consistency.
2. **Most systems let you tune this per-operation, not just per-database.** Cassandra/DynamoDB let you choose `QUORUM` vs `ONE` per query. Postgres read replicas let you route consistency-sensitive reads to the primary and everything else to a replica (accepting replication lag on the replica reads).
3. **"We need strong consistency everywhere" is usually an overcorrection.** Identify which specific reads actually require it (usually far fewer than assumed) and only pay the consistency cost there.

## PACELC — the more complete framework architects should actually use

CAP only describes behavior *during a partition*. **PACELC** extends it: **if Partitioned, choose A or C; Else (normal operation), choose Latency or Consistency.** This captures a real, everyday trade-off CAP ignores entirely: even with no partition, do you wait for a quorum of replicas to confirm a write (higher consistency, higher latency) or acknowledge as soon as the primary/one replica has it (lower latency, weaker consistency)? This is the trade-off behind read-replica lag, multi-region write latency, and most "how many replicas must ack before we return success" configuration knobs (e.g. Kafka's `acks`, Cassandra's write consistency level, Postgres synchronous replication).
