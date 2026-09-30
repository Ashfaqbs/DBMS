# Reading Execution Plans (EXPLAIN / EXPLAIN ANALYZE)

## Why this matters day to day
"The query is slow" is the single most common ticket a lead/architect triages. The only reliable way to answer it is reading the execution plan — guessing from the SQL text alone is how wrong indexes get added.

## EXPLAIN vs EXPLAIN ANALYZE

- **`EXPLAIN`** shows the planner's *estimated* plan and cost — it does not run the query.
- **`EXPLAIN ANALYZE`** actually executes the query and shows real timing/row counts alongside the estimates. **Use this for real diagnosis** — but be careful running it on `INSERT`/`UPDATE`/`DELETE` in production since it really executes them (wrap in a transaction and `ROLLBACK` if you need to test a write query's plan safely).

```sql
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE customer_id = 42;
```

`BUFFERS` (Postgres) shows shared-buffer hits/misses — critical for telling "slow because of disk I/O" apart from "slow because of CPU/algorithm".

## The scan types you need to recognize (Postgres terms; MySQL/Oracle have equivalents)

| Scan type | What it means | When it's a red flag |
|---|---|---|
| **Seq Scan** (Postgres) / **Full Table Scan** (Oracle/MySQL) | Reads every row in the table | Fine on small/lookup tables; a red flag on a large table when a selective `WHERE` clause exists and no index is being used |
| **Index Scan** | Uses an index to find matching rows, then fetches the full row from the table (heap fetch) | Good — but many random heap fetches can still be slow if the index isn't very selective |
| **Index Only Scan** | Answers the query entirely from the index, no heap fetch needed | Best case — requires all selected columns to be in the index (a "covering index") |
| **Bitmap Heap Scan / Bitmap Index Scan** | Builds a bitmap of matching pages first, then fetches — used when moderately selective | Normal for medium-selectivity predicates, not inherently bad |
| **Nested Loop Join** | For each row on one side, scans/probes the other side | Fine for small row counts on the outer side; catastrophic if the planner mis-estimates and the outer side turns out huge |
| **Hash Join** | Builds a hash table from one side, probes with the other | Good for larger, unsorted joins; watch for spilling to disk if `work_mem` is too small |
| **Merge Join** | Both sides sorted, merged in one pass | Efficient when inputs are already sorted (e.g. via an index) |

## The number one thing to check: estimated vs actual rows

```
Seq Scan on orders  (cost=0.00..18334.00 rows=5 width=97) (actual time=0.015..152.421 rows=48213 loops=1)
```

Here the planner estimated **5 rows** but actually got **48,213**. This kind of estimate mismatch (usually from stale statistics or a correlated predicate the planner can't model) is *the* most common root cause of a "good plan gone bad" — the optimizer picked a nested loop or a small hash table sizing based on a wildly wrong row estimate. Fix: `ANALYZE` the table to refresh statistics, increase `default_statistics_target` on that column, or restructure the query.

## Cost numbers are not milliseconds

`cost=0.00..18334.00` is an arbitrary planner unit (roughly "how many sequential page reads this would cost"), not a time estimate. Only `actual time=...` (from `EXPLAIN ANALYZE`) is real wall-clock time. Don't compare cost numbers across different queries or servers.

## A practical triage checklist

1. Is a **Seq Scan** happening on a large table where you expected an index to be used? Check `WHERE`/`JOIN` columns are actually indexed, and that the predicate isn't wrapped in a function (`WHERE LOWER(email) = ...` won't use a plain index on `email`).
2. Is the **estimated row count wildly off** from actual? Run `ANALYZE`/update statistics first before touching indexes.
3. Is a **Nested Loop** driving off a huge outer relation? Often fixable by adding an index on the inner join key, or forcing a hash/merge join via query restructuring (never via forcing hints in Postgres — it has none by default; that's usually the right call).
4. Are you seeing **"Sort" nodes with "Disk"** instead of "Memory" (`EXPLAIN (ANALYZE, BUFFERS)` shows this in Postgres)? That means `work_mem` is too small for the sort/hash operation and it spilled to disk — a common cause of surprising slowness on large `ORDER BY`/`GROUP BY`/hash joins.
5. Look at **loops=N** on a nested loop's inner node — the actual time shown is *per loop*, so total time contributed is `actual time * loops`, easy to misread.

## Tooling
- Postgres: `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` piped into a visualizer (e.g. explain.dalibo.com) makes large plans far easier to read than raw text.
- MySQL: `EXPLAIN ANALYZE` (8.0.18+) gives similar actual-vs-estimated data; `EXPLAIN FORMAT=JSON` for machine-readable detail.
- Oracle: `EXPLAIN PLAN FOR ...` then `SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY)`, or `SQL Trace` + `tkprof` for real execution stats.
