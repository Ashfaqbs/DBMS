# Backup & Disaster Recovery — RPO vs RTO

## Why this matters day to day
"We have backups" is not a strategy — it's an input to one. The actual decision leads/architects need to make explicitly (and revisit as the business changes) is: **how much data can we afford to lose, and how long can we afford to be down**, and does our current backup approach actually deliver that.

## The two numbers that define every DR strategy

- **RPO (Recovery Point Objective)**: the maximum acceptable amount of data loss, measured in time. "RPO of 15 minutes" means: after a disaster, we can tolerate having lost up to the last 15 minutes of writes, but no more.
- **RTO (Recovery Time Objective)**: the maximum acceptable time to actually get the system back up and serving traffic after a disaster is declared. "RTO of 1 hour" means: from the moment of failure, the system must be usable again within an hour.

**These are business decisions, not technical ones** — they should come from asking "what does it cost the business per minute of downtime / per unit of lost data" for a given system, not from what a database's default backup schedule happens to provide. A leads/architect's job is translating those business numbers into a concrete technical design, then being honest about what the current setup actually delivers versus what was promised.

## How backup strategy maps to RPO

| Strategy | Typical RPO | Notes |
|---|---|---|
| **Nightly full backup (`pg_dump`, `mysqldump`)** | Up to 24 hours | Simple, but a disaster right before the next backup loses a full day of data. Also often quite slow to restore (RTO) on large databases. |
| **Nightly full + periodic incremental/differential** | Hours | Reduces backup window/storage cost but restore requires the full + a chain of incrementals — restore complexity (and RTO) increases. |
| **Continuous WAL/binlog archiving (Postgres WAL-E/pgBackRest, MySQL binlog shipping) + periodic base backup** | Seconds to low minutes | The write-ahead log is continuously shipped/archived; recovery replays the log up to (or just before) the failure point — this is how **point-in-time recovery (PITR)** works, letting you restore to any specific timestamp, not just the last full backup. |
| **Synchronous replication to a standby (physically separate)** | Near-zero | The standby has (synchronously) confirmed receipt of every committed transaction — see the Replication & Failover doc for the durability trade-offs this introduces on write latency. |

**Important distinction**: replication is not a backup. A replica faithfully applies every change from the primary — including an accidental `DROP TABLE` or a bad application bug that corrupts data. Replication protects against *hardware/node* failure; it does nothing against *logical* corruption or human error. **Both a real backup strategy (with retention, ideally including point-in-time recovery) and replication (for availability) are needed — they solve different failure modes.**

## How restore strategy maps to RTO

- Restoring a large database from a full backup file (especially a logical dump like `pg_dump`/`mysqldump`, which has to re-run every `INSERT` and rebuild every index from scratch) can take **hours** on a multi-hundred-GB+ database — this is frequently far slower than teams assume until they've actually timed a full restore.
- **Physical/binary backups** (Postgres `pg_basebackup`, MySQL Percona XtraBackup) restore much faster than logical dumps because they copy raw data files rather than replaying SQL — a meaningful RTO improvement at scale.
- **A warm/hot standby already running and ready to be promoted** gives by far the lowest RTO (minutes, sometimes seconds with automated failover) — because there's no restore step at all, just a failover/promotion.
- **RTO must include everything**, not just "how long does `pg_restore` take": detecting the failure, deciding to fail over, DNS/connection-string cutover, warming caches, verifying application health. Teams that only measure the restore command's runtime consistently underestimate real RTO.

## The step almost everyone skips: actually testing restores

A backup that has never been restored is an assumption, not a guarantee. Corruption in the backup file itself, a missed table/schema in the backup scope, credentials that expired, or a restore script that silently fails midway are all real, commonly-discovered-too-late failure modes. **Restore drills on a schedule** (quarterly is a common minimum cadence for anything business-critical) are the only way to know the RPO/RTO numbers on paper actually match reality — and they frequently reveal that they don't, which is far better to discover in a drill than during an actual incident.

## Geographic/regional disaster scope

Backups stored in the same region/data center as the primary database protect against hardware failure and logical corruption, but not against a regional outage or physical disaster affecting that entire location. For systems where regional failure is in scope, backups (and ideally a standby capable of being promoted) need to live in a genuinely separate region — this is a deliberate, usually more expensive design choice, and should be a conscious decision tied to the business's actual RTO/RPO requirements rather than a default.
