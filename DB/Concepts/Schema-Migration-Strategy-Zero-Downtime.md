# Schema Migration Strategy & Zero-Downtime Changes

## Why this matters day to day
Almost every feature that touches the database eventually needs a schema change, and "how do we ship this without downtime or breaking the currently-deployed version of the app" is a recurring lead/architect decision — this is where [[databases.md]]'s "always use migrations" rule actually gets applied in practice.

## The core problem: rolling deploys + schema change = two app versions, one database

During a rolling deploy, old and new application code run simultaneously against the *same* database for some window of time. A migration that the new code needs but the old code doesn't expect (or vice versa) will break one of the two versions unless the change is designed to be backward-compatible for that window.

## The Expand-Contract (aka Parallel Change) pattern

The standard technique for making a breaking-looking change safely, in three phases across separate deploys:

1. **Expand**: add the new structure alongside the old, without removing anything. Both old and new code can run against this schema.
   - Example: adding a column, adding a new table, adding a new index — additive only.
2. **Migrate/dual-write**: deploy application code that writes to *both* old and new structures (or backfills the new structure from the old), while still reading from whichever is authoritative. Backfill existing data in batches (not a single giant `UPDATE` — see below).
3. **Contract**: once all instances of old code are confirmed gone and the new structure is fully populated and verified, remove the old structure in a final migration.

**Rule of thumb**: never combine "add the new thing" and "remove the old thing" in the same deploy. There should always be at least one full deploy cycle where both old and new code can run against the current schema.

## Concrete examples of the pattern

**Renaming a column** (there is no safe atomic "rename" for a live rolling deploy):
1. Add new column `email_address`, dual-write it alongside `email` in application code.
2. Backfill `email_address` from `email` for existing rows.
3. Switch reads to `email_address`, confirm old code paths are fully retired.
4. Drop `email` column.

**Changing a column to `NOT NULL`:**
1. Add the column as nullable, backfill it.
2. Add a `CHECK` constraint validated separately from creation (Postgres: `ADD CONSTRAINT ... CHECK (...) NOT VALID` then `VALIDATE CONSTRAINT` — this avoids a long table-locking scan in one step).
3. Once fully backfilled and validated, convert to `NOT NULL`.

## Locking hazards during migrations (this is what actually causes the outage)

- **Postgres**: `ALTER TABLE ADD COLUMN ... DEFAULT <value>` used to rewrite the entire table (and take an `ACCESS EXCLUSIVE` lock for the duration) in versions before PG 11; PG 11+ makes adding a column with a constant default an instant metadata-only change. But **adding a column with a non-constant default, adding a `NOT NULL` without a pre-validated constraint, or changing a column's type** can still force a full table rewrite under an exclusive lock — on a large, high-traffic table, this can hang all reads/writes for the duration and is a classic self-inflicted outage.
- **MySQL/InnoDB**: many `ALTER TABLE` operations support `ALGORITHM=INPLACE` (avoids a full table copy) and `LOCK=NONE` (allows concurrent DML) — but not all change types qualify; check `ALGORITHM`/`LOCK` support for the specific alter before running it on a large production table.
- **General rule**: for any schema change on a large/hot table, test the `EXPLAIN`/lock behavior on a copy of production-scale data first, or use an online-schema-change tool (`pt-online-schema-change`/`gh-ost` for MySQL, or built-in concurrent-safe DDL patterns for Postgres) rather than a plain blocking `ALTER TABLE`.

## Backfills: never one giant statement

A single `UPDATE big_table SET new_col = ...` on a multi-million-row table holds locks and generates a huge amount of WAL/undo/redo in one transaction, risking replication lag, bloat, and lock contention. Standard practice: batch the backfill (e.g. 1,000–10,000 rows per transaction, looping with a short sleep/throttle between batches), so it interleaves with normal traffic instead of blocking it.

## Tooling: Flyway / Liquibase discipline

- Migrations are **versioned, ordered, and immutable once applied** to any shared environment (dev/staging/prod) — never edit an already-applied migration file; write a new one to fix a mistake.
- **Every migration should be reviewed for its lock behavior**, not just its SQL correctness — this is the review step teams most often skip, and it's the one that causes production incidents.
- Keep migrations and application code deploys decoupled enough that a migration can run (and be expand-phase-safe) slightly ahead of the code that depends on it, per the pattern above.
