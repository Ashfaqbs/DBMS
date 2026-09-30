# Database Structure Hierarchy Cheatsheet

## Why this matters
The moment you can picture "I'm at *this* level of *this* database's structure" before you write a query, everything else (which client command to run, what a fully-qualified name looks like, why a `JOIN` across two things does or doesn't work) starts making sense on its own. This is the mental model to build first, before syntax — the same one that made Postgres click.

Every engine below is drawn the same way: outermost container at the top, down to the actual data at the bottom.

---

## PostgreSQL

```
PostgreSQL Server (a "cluster" — one running postgres process, one port)
│
├── Database: postgres          (default admin database)
├── Database: mydb
│     │
│     ├── Schema: public        <-- default schema, always exists, most people never leave it
│     │     ├── Table: users
│     │     │     ├── Row: id=1, name="John"
│     │     │     └── Row: id=2, name="Jane"
│     │     ├── Table: orders
│     │     ├── View: active_users
│     │     ├── Sequence: users_id_seq
│     │     └── Index: idx_users_email
│     │
│     └── Schema: reporting     <-- a second, custom namespace inside the SAME database
│           └── Table: monthly_summary
│
└── Database: another_app_db    <-- fully separate — no JOIN across this and mydb
                                     without an extension (dblink/postgres_fdw)
```

**Key facts**: one server hosts many databases; databases are fully isolated from each other (this is why you can't accidentally `JOIN` two apps' data together — you have to opt in via `dblink`/foreign data wrappers). Inside one database, schemas are just namespaces — `public` is the default, but you can have several schemas in one database (common for multi-module apps, or separating raw data from reporting views). Fully-qualified name: `database` (via connection) `.schema.table`.

---

## MySQL / InnoDB

```
MySQL Server (instance)
│
├── "Database" == "Schema"       <-- MySQL treats these as literal synonyms, unlike Postgres!
│     mydb
│       ├── Table: users
│       │     └── Row: id=1, name="John"
│       ├── Table: orders
│       ├── View: active_users
│       └── Index: idx_users_email   (always attached directly to one table)
│
└── another_db
      └── Table: products
```

**Key facts**: MySQL has no separate schema layer *inside* a database — `CREATE DATABASE` and `CREATE SCHEMA` do exactly the same thing. Unlike Postgres, a plain `SELECT * FROM mydb.users JOIN another_db.products ...` **is allowed** across databases on the same server — there's no Postgres-style hard isolation.

---

## Oracle

```
Oracle Database Instance
│
├── Tablespace: SYSTEM, USERS, ...   <-- physical storage container (an implementation
│                                         detail you rarely think about day to day)
│
├── Schema / User: HR                <-- in Oracle, a "schema" IS a user account (1:1, tightly coupled)
│     ├── Table: EMPLOYEES
│     │     └── Row: EMP_ID=1, FIRST_NAME='John'
│     ├── Table: DEPARTMENTS
│     ├── View: EMP_DETAILS_VIEW
│     ├── Sequence: EMP_ID_SEQ
│     ├── Trigger: TRG_EMP_AUDIT
│     └── Stored Procedure: PROC_HIRE_EMPLOYEE
│
└── Schema / User: SCOTT
      └── Table: DEPT
```

**Key facts**: this is the model most different from Postgres/MySQL — there's no "USE database" step. You connect directly *as* a schema/user, and everything you create lands in your own schema unless you explicitly qualify another one (`HR.EMPLOYEES`). Tablespaces are where things are physically stored, but that's a DBA/ops concern, not something you switch between while writing queries. (Modern Oracle's multitenant CDB/PDB architecture adds another layer above this for consolidating multiple databases on one instance — an advanced topic, not needed to get comfortable day to day.)

---

## MongoDB

```
MongoDB Server (mongod instance) / Replica Set
│
├── Database: admin              (system default)
├── Database: mydb
│     ├── Collection: users
│     │     ├── Document: { _id: 1, name: "John", tags: ["a","b"] }
│     │     └── Document: { _id: 2, name: "Jane" }        <-- note: different shape, both valid!
│     ├── Collection: orders
│     └── Index: { email: 1 }    (attached to one collection)
│
└── Database: another_app_db
      └── Collection: products
```

**Key facts**: same top two layers as Postgres (Server -> Database), but no schema layer, and the third layer is a **Collection** (like a table) holding **Documents** (like rows) — except documents have no fixed structure. Two documents in the same collection can have completely different fields; the "schema" only exists as a convention your application enforces, not something the database requires (this is what "schema-on-read" means).

---

## Redis

```
Redis Server (a single redis-server process)
│
├── Logical DB 0   (default; SELECT 0)
│     ├── Key: "user:1001"       -> Hash    { name: "John", age: "30" }
│     ├── Key: "session:abc123"  -> String  "active"   (TTL: 300s)
│     ├── Key: "leaderboard"     -> Sorted Set  { alice: 100, bob: 95 }
│     └── Key: "queue:jobs"      -> List    [ "job1", "job2", "job3" ]
│
├── Logical DB 1   (SELECT 1)
│     └── Key: "cache:page:home" -> String  "<html>...</html>"
│
└── ... up to DB 15 by default (configurable)
```

**Key facts**: the most different model here — there's no table/schema/collection concept at all. Just one flat keyspace per numbered logical database on the same server (`SELECT n` switches which one your connection is looking at — these are namespaces, not separate processes). Every key has exactly one **value**, and the value's data type (String, Hash, List, Set, Sorted Set, Stream, ...) is what determines which commands you can run against it.

---

## Elasticsearch

```
Elasticsearch Cluster
│
├── Node: es-node-1  ─┐
├── Node: es-node-2   ├── together form the cluster
├── Node: es-node-3  ─┘
│
└── Index: products                     <-- the unit you create/query, like a "table"
      ├── Shard 0 (primary)  ─┐
      ├── Shard 0 (replica)   ├── shards are spread across nodes for scale + availability
      ├── Shard 1 (primary)   │
      └── Shard 1 (replica)  ─┘
            │
            └── Document: { "_id": "1", "name": "Widget", "price": 9.99 }
                  (a "mapping" defines each field's type, per-index — the
                   closest equivalent to column types)
```

**Key facts**: no database layer at all — an **Index** is the top-level thing you create and query, roughly like a table. Each index is split into **shards** for horizontal scale, and each shard can have **replicas** for availability. (If you ever see "Types" mentioned between index and document in older material — that layer was deprecated and removed in ES 7+, don't design around it.)

---

## Azure Cosmos DB

```
Cosmos DB Account
│
├── Database: mydb
│     ├── Container: Products         <-- roughly a "table"/"collection"
│     │     ├── Item: { "id": "1", "category": "Widgets", ... }
│     │     └── Item: { "id": "2", "category": "Gadgets", ... }
│     │           (Items are physically partitioned by a "partition key"
│     │            you choose per container, e.g. /category)
│     │
│     └── Container: Orders
│
└── Database: another_db
      └── Container: Logs
```

**Key facts**: Account -> Database -> Container -> Item is the shape *regardless* of which API you connect with (Core/SQL API, MongoDB API, Cassandra API, ...) — the API just changes the query language and driver, not the underlying structure. The **partition key** you pick per container is the single biggest design decision (same idea as a shard key — see [[Sharding-Strategies]]).

---

## Vector Databases (two flavors — both live in this repo)

**(a) pgvector — vector search bolted onto Postgres's normal hierarchy** (see `DB/Vector/vector-db/sb-pg-vector`):

```
PostgreSQL Server -> Database -> Schema (public) -> Table: embeddings
      ├── Column: id
      ├── Column: content              (text)
      ├── Column: embedding vector(768)   <-- pgvector's special column type
      └── Index: embedding_hnsw_idx USING hnsw (embedding vector_cosine_ops)
```

**(b) Purpose-built vector DB** (Qdrant / Pinecone / Milvus-style — the general concept):

```
Vector DB Instance
│
└── Collection: documents
      ├── Vector Index (HNSW / IVF — built over the whole collection, a first-class object)
      └── Point/Record: { id: "1", vector: [0.12, -0.45, ...], payload: { text: "...", category: "..." } }
```

**Key facts**: pgvector reuses Postgres's exact hierarchy above — you're still thinking in Database -> Schema -> Table, just with one special column type and index method added. A purpose-built vector DB instead organizes everything around a **Collection** of vector+payload records, with the similarity index as a core part of the collection itself rather than something added onto an existing table.

---

## One-line summary table

| Engine | Top-level unit | Namespace layer | "Table" equivalent | "Row" equivalent |
|---|---|---|---|---|
| PostgreSQL | Server (cluster) | Database -> Schema | Table | Row |
| MySQL | Server | Database (== Schema) | Table | Row |
| Oracle | Instance | Schema (== User) | Table | Row |
| MongoDB | Server | Database | Collection | Document |
| Redis | Server | Logical DB (0-15) | (none — flat keyspace) | Key -> typed Value |
| Elasticsearch | Cluster | (none) | Index | Document |
| Cosmos DB | Account | Database | Container | Item |
| Vector DB (purpose-built) | Instance | (none) | Collection | Point/Record |
