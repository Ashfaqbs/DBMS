# Replication & Failover Topologies

## Why this matters day to day
Basic master-slave replication (already covered elsewhere in this repo) is the starting point; the real architect-level decisions are about *failover behavior* and *how strict the durability guarantee is* — this is where "we lost data during failover" incidents come from.

## Synchronous vs asynchronous replication

- **Asynchronous**: the primary commits and acknowledges the client immediately; replicas apply the change afterward, whenever they catch up. Fast writes, but if the primary crashes before a replica applied the latest transactions, **those transactions are lost** on failover to that replica.
- **Synchronous**: the primary waits for at least one replica to confirm it has received (and possibly applied) the transaction before acknowledging the client. No data loss on failover to that replica, at the cost of write latency (and the primary can stall entirely if the synchronous replica becomes unreachable, unless the system degrades gracefully).
- **Semi-synchronous** (MySQL's term) / **quorum-based** (e.g. Postgres `synchronous_commit` with multiple standbys, `ANY 2 (replica_a, replica_b, replica_c)`): wait for acknowledgment from a subset, balancing latency against durability.

**The trade-off is explicit and configurable in most engines** — this isn't a fixed property of "replication," it's a per-cluster (sometimes per-transaction) durability decision.

## Failover: automatic vs manual, and the split-brain risk

- **Manual failover**: an operator promotes a replica to primary. Slower to recover, but no risk of two nodes both believing they're primary.
- **Automatic failover** (e.g. Patroni for Postgres, MySQL Group Replication, orchestrator for MySQL): a coordination layer detects the primary is unreachable and promotes a replica automatically. Faster recovery, but introduces the **split-brain risk**: if the old primary isn't actually dead (just network-partitioned from the coordinator) and comes back while a new primary has already been promoted, you now have two writable primaries accepting conflicting writes.
- **Fencing/STONITH ("Shoot The Other Node In The Head")**: the standard mitigation — before promoting a new primary, the old one must be forcibly prevented from accepting writes (network fencing, power-cycling, or a lease/consensus mechanism that only one node can hold at a time). **A failover design without a fencing mechanism is not actually safe** — this is the detail most home-grown failover scripts miss.

## Quorum-based consensus (how "real" HA systems avoid split-brain)

Systems like etcd/ZooKeeper/Raft-based stores use a quorum (majority) of nodes to agree on who the leader is. A minority partition can never elect its own leader because it can't reach a majority — this structurally prevents split-brain, at the cost of requiring an odd number of nodes (3, 5) and losing availability if too many nodes are down simultaneously. Many production Postgres/MySQL HA setups (Patroni + etcd/Consul, Orchestrator + Raft) borrow this consensus layer specifically to make failover decisions safely, rather than reinventing leader election.

## Read replica lag: the everyday operational reality

Even with otherwise-healthy async replication, replicas lag behind the primary by some amount (milliseconds to, under load or during a long-running query on the replica, seconds or more). Practical implications:

- A user who just wrote data and immediately reads it back **may not see their own write** if that read is routed to a lagging replica — see "read-your-writes consistency" in the CAP/consistency-models doc. Common fix: route a user's own post-write reads to the primary for a short window, or track a "read-after-write" token.
- Monitor replication lag explicitly (`pg_stat_replication`'s `replay_lag`, MySQL's `Seconds_Behind_Master`/`SHOW REPLICA STATUS`) and alert on it — an application silently reading from a badly lagging replica is a common source of confusing bug reports.

## Topology patterns beyond simple master-slave

- **Single primary, multiple read replicas**: the default scaling pattern for read-heavy workloads — writes go to one node, reads fan out.
- **Cascading replication**: replicas replicate from other replicas instead of all hitting the primary directly, reducing load on the primary when there are many replicas (common across regions).
- **Multi-primary / active-active**: more than one node accepts writes (e.g. across regions for low write latency everywhere). Requires explicit conflict resolution (last-write-wins, CRDTs, or application-level merge logic) since two primaries can accept conflicting writes to the same row independently. Significantly more operationally complex — only reach for this when single-region write latency is a proven, real problem, not by default.

## Practical checklist for evaluating a replication setup

1. What's the actual **RPO** (how much data can we afford to lose) this configuration provides — sync replicas give near-zero, async gives "however much wasn't replicated yet"?
2. Is failover **automatic**, and if so, is there a real **fencing mechanism**, or just a hope that the old primary is actually down?
3. Is replication **lag monitored and alerted on**, not just assumed to be near-zero?
4. For multi-region/multi-primary: is there an explicit, tested **conflict resolution strategy**, or is this an accident waiting to surface under real concurrent writes?
