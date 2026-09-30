# Multi-Tenancy Patterns

## Why this matters day to day
Almost every B2B SaaS product eventually has this design review: "how do we isolate tenant data — and how expensive is it to change our minds later?" This is a foundational architecture decision made early and lived with for years.

## The three standard models

### 1. Database-per-tenant
Each tenant gets a fully separate database instance/schema at the storage-engine level.
- **Isolation**: strongest — a bug or runaway query for one tenant cannot affect another; per-tenant backup/restore/compliance is straightforward.
- **Cost**: highest — connection pool overhead multiplies per tenant, schema migrations must run against every tenant database, and "how many tenants can one physical server host" has a hard ceiling.
- **Best fit**: small number of large, high-value tenants (e.g. enterprise customers with strict compliance/data-residency requirements), or regulatory requirements that mandate physical data separation.

### 2. Schema-per-tenant (shared database, separate schemas)
One database instance, but each tenant gets its own schema/namespace within it.
- **Isolation**: good — still logically separated, easier to reason about than shared tables, but tenants now share the same underlying database resources (connections, buffer cache, I/O).
- **Cost**: middle ground — migrations still need to run per-schema, but connection pooling and server count don't multiply per tenant.
- **Best fit**: moderate tenant counts (dozens to low hundreds) where isolation matters but full database-per-tenant cost isn't justified.

### 3. Shared schema with a tenant discriminator column
All tenants' data lives in the same tables, distinguished by a `tenant_id` column on every row.
- **Isolation**: weakest by default — a missing `WHERE tenant_id = ?` in any query is a **cross-tenant data leak**, one of the most common and severe classes of bugs in multi-tenant systems.
- **Cost**: lowest — one schema, one set of migrations, most efficient use of database resources, easiest to scale to thousands of small tenants.
- **Best fit**: large numbers of small/medium tenants where per-tenant infrastructure cost would be prohibitive (typical for consumer-facing or SMB-focused SaaS).

## Making shared-schema safe: enforce isolation at the database layer, not just in application code

Relying on every developer to remember `WHERE tenant_id = ?` on every single query, forever, does not scale as a safety strategy. Two real mitigations:

- **Row-Level Security (RLS)** (Postgres, and similar features in other engines): define a policy on the table that automatically filters every query by the current session's tenant context, enforced by the database itself regardless of what the application query looks like. This turns "developer forgot the WHERE clause" from a data leak into a non-issue, because the database adds the filter transparently.
  ```sql
  ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
  CREATE POLICY tenant_isolation ON orders
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
  ```
- **A repository/ORM layer that structurally cannot construct a query without a tenant filter** (e.g. a base repository class that always injects the tenant predicate) — a code-level defense-in-depth alongside RLS, not a replacement for it.

## Composite indexing and query patterns

In shared-schema, **every meaningful index should lead with (or include) `tenant_id`** — an index on `(tenant_id, created_at)` rather than just `(created_at)` — otherwise queries scoped to one tenant end up scanning across all tenants' data before filtering. This is a common, easy-to-miss performance mistake distinct from the isolation/security concern above.

## The migration cost most teams underestimate

Moving from shared-schema to schema-per-tenant or database-per-tenant later (e.g. because one enterprise customer now demands physical isolation) is a substantial, risky data-migration project — essentially an online resharding effort (see the Sharding doc for the general mechanics). **This is why the initial choice matters**: if there's any realistic chance a subset of future customers will require stronger isolation (common in enterprise sales), it's worth designing the shared-schema model so that a given tenant *can* be "peeled off" into its own database later with a bounded, well-understood migration — rather than discovering the coupling is pervasive only when a contract demands it.

## Hybrid approaches are common and reasonable

Many real systems mix models: most tenants live in a shared schema, but a small number of enterprise tenants (with contractual isolation/compliance requirements, or simply outlier scale) get promoted to their own dedicated schema or database. This isn't a compromise — it's usually the right answer, since the cost/isolation trade-off is genuinely different at the two ends of a typical SaaS customer distribution.
