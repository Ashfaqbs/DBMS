# Elastic RDBMS-style Explorer

A hands-on playground for learning Elasticsearch by comparing it directly against
PostgreSQL/RDBMS concepts — a live UI to browse, search, and CRUD data while seeing
both terminologies side by side.

## Tech stack

- **Elasticsearch 8.13** — runs in Docker
- **FastAPI (Python)** — thin backend that talks to Elasticsearch and exposes
  RDBMS-shaped endpoints (`/api/tables/...`) so the UI never has to talk to ES directly
- **React + Vite** — UI: tree browser, live comparison panel, and full CRUD

## How to run

Two ways to run this: a **hybrid** setup (Elasticsearch in Docker, backend
and frontend locally, for fast hot-reload) or a **container-only** setup
(`docker compose up -d`, everything in Docker). Run all commands below from
the repo root.

### Container-only

```
docker compose up -d
```

Brings up Elasticsearch, seeds sample data, and starts the backend
(`:8000`) and frontend (`:5173`, served by nginx — no hot-reload). Open
**http://localhost:5173**. For the MCP Chat tab, set `GROQ_API_KEY` in your
shell before running `docker compose up -d` (it's passed through to the
backend container).

### Hybrid (fast hot-reload while iterating)

**1) Elasticsearch (Docker):**
```
docker compose up -d elasticsearch
```

**2) Seed sample data (one-time):**
```
cd scripts
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py
```

**3) Backend (hot-reload):**
```
cd backend
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --port 8002
```
(`--reload` is intentionally omitted -- WatchFiles' reloader has repeatedly
launched its subprocess under the wrong Python interpreter and left orphaned
listeners on this Windows setup; restart manually after editing backend code.)

**4) Frontend (hot-reload):**
```
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**.

## The RDBMS ↔ Elasticsearch mapping

| RDBMS term | Elasticsearch term | Real in ES? |
|---|---|---|
| DB Server | Cluster | Yes |
| Database | *(none)* | No — simulated via index naming |
| Schema | *(none)* | No — simulated via index naming |
| Table | Index | Yes |
| Columns / table schema | Mapping | Yes |
| Row | Document | Yes |
| Column value | Field value | Yes |

Elasticsearch has exactly one real structural unit: the **index**. There is no
native "database" or "schema" layer above it — a cluster just holds a flat list
of indices. This project fakes that hierarchy for teaching purposes by naming
every index `{database}__{schema}__{table}` (see `scripts/seed_data.py`), e.g.
`ecommerce__inventory__products`.

## My understanding, in my own words

**Elastic is a cluster, no schema layer:**

- Elastic is like a cluster, i.e. a bunch of nodes (VMs) — minimum 1 VM.
- There is no concept of schema.
- Tables are called index here — "indices" is just the plural of "index" (one index = one
  table).
- Each row is a document, something like in MongoDB — thought it could take
  any type of data.

**Correction: mapping is real, but only in one direction:**

- There *is* a schema for the documents (rows), and it's called **mapping**.
- It cannot accept a change to an existing field's mapping — but it *can*
  accept new fields.
- Existing fields: cannot change the type. New fields: can add anytime.

## App structure

Organized around the concepts the app is teaching, not just technical layers
— each backend router maps to one row of the RDBMS↔ES table above:

```
docker-compose.yml         # elasticsearch service + seed/backend/frontend containers
scripts/
  seed_data.py              # creates indices + sample ecommerce + error-log data
backend/
  main.py                   # FastAPI app: CORS + router wiring only, no endpoint logic
  core/
    elastic.py               # shared ES client, index-name helpers (db__schema__table)
  routers/                  # one file per RDBMS<->ES concept, see table above
    cluster.py                # "database server" -- GET /api/cluster, /api/health
    tables.py                 # "database/schema/table" -- structure tree, table CRUD, mapping
    documents.py               # "row" -- sample, search, document CRUD
    shards.py                  # shard placement (no RDBMS equivalent)
    raw.py                     # raw ES REST passthrough, bypassing the RDBMS-shaped wrapper
    chat.py                    # POST /api/chat -- thin wrapper around mcp_app.client.run_chat
  mcp_app/                   # the MCP demo: LLM (Groq) <-> MCP client <-> MCP server <-> ES
    server.py                 # MCP server -- tools over the error_logs index (stdio)
    client.py                  # MCP client + Groq agent loop backing the "MCP Chat" tab
  .env.example               # copy to .env, add GROQ_API_KEY (never commit .env itself)
frontend/
  src/App.jsx                # tree browser, live PG<->ES comparison panel, CRUD forms, MCP chat UI
```

(The MCP package is named `mcp_app`, not `mcp` — naming it `mcp` would shadow
the real `mcp` SDK package that `mcp_app/client.py` and `mcp_app/server.py`
import from.)

## Try it hands-on

1. Create a table via "+ table" — pick a database/schema/table name and column
   types. This is `CREATE TABLE db.schema.table (col type, ...)`.
2. Add a row with a field name that doesn't exist yet in the mapping. Reopen the
   table's "Schema (mapping)" panel and watch the new field appear automatically.
3. Try adding a row where an existing numeric field is given a text value —
   watch it get rejected.
4. Search a table with a typo (e.g. "berak" instead of "brake") — notice it
   still matches, because the backend search uses `fuzziness: "AUTO"`. This is
   the kind of ranked, tolerant matching a SQL `LIKE` can never give you.

---

## Study notes: how search actually works (no app required)

Everything below is conceptual — it doesn't depend on the app running, so it's
readable straight from GitHub even without Docker/backend/frontend up.

### The inverted index — why search is fast

Take a `fruits` index with columns `id`, `name`, `cost`, `desc`. Insert:

```
id: 1, name: "Red Apple", cost: 50, desc: "A crisp sweet apple, great for snacking"
```

Two completely separate things get stored:

**1. The document store** — the whole row as-is, so ES can hand it back to you
when you ask for doc `id=1`. On its own this gives no search speed benefit —
if this were the only structure, finding "apple" would mean reading every
row's `desc`, exactly like Postgres without an index.

**2. One inverted index *per text field*.** For `name`, ES:
1. Splits the value into words: `"Red Apple"` → `["red", "apple"]`
2. Lowercases them
3. Writes each word into a table: *word → list of doc IDs containing it*

Insert two more fruits — `id:2 name:"Green Grape"`, `id:3 name:"Red Grape"` —
and the `name` field's table looks like:

| word | doc IDs |
|---|---|
| red | [1, 3] |
| apple | [1] |
| green | [2] |
| grape | [2, 3] |

It's called *inverted* because it's flipped from the natural way to think
about it — instead of "doc 1 has words red, apple" (doc → words), it's
"word red has docs 1, 3" (word → docs). It's the same idea as a book's index
at the back: instead of reading every page for "shard", you look up "shard"
and jump straight to the pages.

**The `desc` field gets its own separate word→doclist table.** Every `text`
field builds and maintains its own table, independently — they never merge.

When you search `name: "red"`, ES never touches the document store to find
matches. It opens the `name` field's table, looks up `"red"`, gets back
`[1, 3]` instantly, and *then* fetches those two full rows to show you. No
scanning — a lookup, whether the table has 10 rows or 10 million.

### Not every field type works this way

Different field types get different storage strategies — declared in the
**mapping** (see `scripts/seed_data.py`'s `PRODUCT_MAPPING`):

```python
"sku":   {"type": "keyword"},  # exact-match, NOT tokenized
"name":  {"type": "text", ...},  # tokenized into words
"price": {"type": "float"},    # numeric, NOT tokenized
```

- **`text`** (`name`, `desc`) → tokenized into words, each word mapped to a
  list of doc IDs, one table per field. Good for partial/fuzzy phrase search.
- **`keyword`** (`sku`, `id`) → NOT split. The whole value is one atomic
  token, mapped to doc IDs. Good for exact match only — no partial search.
- **numbers** (`price`, `stock_qty`) → not tokenized at all (splitting a
  number makes no sense). Stored in a different structure entirely — a
  **BKD-tree**, built for range queries like `price > 20`.

All of it lives inside that one index's own storage, built automatically the
moment a document is inserted, based on the field's declared (or guessed)
type. A search is always a lookup against one of these prebuilt structures —
never a scan of the documents.

### `match` vs `multi_match` vs `_msearch`

- **`match`** — search a value against **one named field**:
  `{"match": {"name": "audio"}}` → one lookup, in one field's table.
- **`multi_match`** — search a value against **several fields at once**,
  without needing to say which one: `{"multi_match": {"query": "audio",
  "fields": ["name", "description", "brand"]}}` → one lookup *per field*
  (still just table lookups, not scans), then the results are merged/scored.
  This is what this app's `/api/tables/{index}/search` endpoint uses —
  it reads the mapping, collects every `text` field automatically, and
  searches all of them so you never have to type `field:value`.
- **`_msearch`** — a *different* API entirely: bundles several *independent*
  queries (possibly across different indices) into one HTTP request. Not the
  same axis as `multi_match` — don't confuse "one query, many fields" with
  "many queries, one request".

### Indexing here is opt-out, not opt-in

In Postgres, a column has no index unless you run `CREATE INDEX` on it.
In Elasticsearch, **every field already gets indexed automatically** the
moment a document is inserted — an inverted index for `text`, a value map
for `keyword`, a BKD-tree for numbers. There's no step to add.

The real decision flips: whether to turn indexing *off* for a field you'll
only ever display and never search/filter/sort on, via `"index": false` in
the mapping. That saves disk space and write-time cost, at the price of that
field becoming unsearchable (it still comes back in `_source` when you fetch
the document by ID).

### Sharding — the distributed-systems piece

An RDBMS table lives whole on one server. An Elasticsearch index does not —
it's cut into **shards** the moment it's created, and those shards are spread
across the nodes in the cluster so a table's data and search load scale past
what one machine's disk/CPU/RAM could hold.

Worked example: a high-volume `orders` table. Say a large ecommerce retailer
logs 500 million order-line documents a year into one index, on a 6-node
cluster. You create it with `number_of_shards: 6`, `number_of_replicas: 1`.

1. ES immediately carves the index into 6 primary shards (P0..P5), each an
   independent Lucene index, and places one per node.
2. Each primary gets a replica shard (a backup copy) placed on a *different*
   node than its primary — so losing one node doesn't lose data.
3. **Shard count is fixed at index creation and never auto-splits as data
   grows.** This is the opposite of "auto-scaling" — if you undersized it,
   the fix is creating a new index with more shards and reindexing into it
   (or using time-based indices, see below).
4. **Write routing is a formula, not a choice:** `shard = hash(_id) %
   number_of_shards`. Every document's ID deterministically maps to exactly
   one primary shard.
5. **Reads fan out.** A search hits all 6 shards in parallel, and a
   coordinating node merges/re-scores the combined results before returning
   them to you — this is also why aggregations over huge indices stay fast.
6. **What's automatic vs manual:**
   - *Manual*: how many shards an index gets (decided once, at creation).
   - *Automatic*: the master node's placement of shards across nodes, and
     rebalancing when a node joins/leaves or hits a disk watermark. If a
     node holding a primary dies, the master promotes that primary's
     replica on another node automatically.

For genuinely unbounded growth (logs, time-series, an `orders` table that
never stops growing), the real-world pattern is **time-based indices +
ILM** (Index Lifecycle Management) — e.g. `orders-2026-01`, `orders-2026-02`,
... — so you're always writing into a fresh, right-sized index instead of
one that grows forever, with ILM automatically rolling over and eventually
deleting old ones. Not implemented in this project, but this is what
production ES does for exactly the scale problem the worked example above
describes.

> Live version: the app's **Distributed** tab has a real shard-placement
> panel backed by `GET /api/tables/{index_name}/shards` — pick any index and
> see which node actually holds each primary/replica shard right now (via
> `_cat/shards`). On a single-node dev cluster, replicas show as
> `UNASSIGNED` — that's expected, there's no second node to place them on.

### What RDBMS features have no ES equivalent

ES is a distributed search/analytics engine over independent, denormalized
documents — not a relational database enforcing integrity. Most classic
RDBMS features either don't exist here or have a weaker, differently-shaped
analogue:

| RDBMS feature | Elasticsearch | Notes |
|---|---|---|
| Joins | No equivalent | No `JOIN` across indices. Workarounds: denormalize at write time (embed what you'll read together), or `nested`/`parent-child` within *one* index (limited, slower). Real ES design: shape data for reads, don't join. |
| Functions / stored procedures | Partial — runtime fields, scripted queries | Runtime fields compute a value at query time (e.g. `price * 1.08`). `script_score` inlines Painless scripting logic. Aggregations cover most `GROUP BY`-style needs. No stored procs. |
| Triggers | No equivalent | Nothing fires inside ES on insert/update. "React to a change" logic lives in your app layer, Watcher/alerting (for conditions), or an external pipeline reacting to writes. |
| Views | Partial — index aliases | An alias (e.g. `orders_current`) can point at a real index, letting you query a stable name while the underlying index rotates — closer to a synonym than a SQL view. No virtual table defined by a query. |
| Foreign keys / constraints | No equivalent | No referential integrity. Nothing stops you inserting an order with a `customer_id` that doesn't exist. Enforcement, if needed, lives entirely in application code. |
| Transactions | Partial — single document only | A single document write is atomic. Multi-document ACID transactions ("update these 3 documents together or none") are not a native concept. |

Common real-world pattern: Postgres/MySQL stays the source of truth (joins,
triggers, constraints); a denormalized, search-optimized copy of the data is
synced into Elasticsearch for the query patterns SQL is bad at — full-text,
faceted search, log-scale aggregation.

### MCP — letting an LLM query this data itself

The **MCP Chat** tab adds a fourth index, `observability__logs__error_logs`
(50 documents: `id`, `error_name`, `error_message`, `timestamp`, `team`), and
a chat UI that lets an LLM answer questions about it by calling tools —
this is [MCP (Model Context Protocol)](https://modelcontextprotocol.io), an
open standard for exposing tools/data to an LLM in a structured way.

**Server vs. client, concretely, in this repo:**

- **MCP server** (`backend/mcp_server.py`) — a small standalone process that
  exposes 4 tools over the error_logs index: `search_errors`,
  `get_error_by_id`, `list_error_names`, `count_errors_by_team`,
  `count_errors_by_name`. It doesn't know anything about LLMs — it just
  answers tool calls by querying Elasticsearch and returning JSON. Built
  with the official `mcp` Python SDK's `FastMCP`, run over **stdio** (no
  network port — the client launches it as a subprocess and talks over its
  stdin/stdout, which is enough for a local, single-machine setup).
- **MCP client** (`backend/chat.py`) — launches `mcp_server.py`, asks it
  what tools exist (`list_tools`), converts those tool schemas into the
  format an LLM API expects, then runs the actual agent loop:

  ```
  user message
    -> LLM (Groq, openai/gpt-oss-120b) decides: answer directly, or call a tool?
    -> if a tool call: MCP client executes it against mcp_server.py -> gets a result
    -> result is fed back to the LLM as a "tool" message
    -> repeat (capped at MAX_TURNS) until the LLM answers in plain text
  ```

  This is the standard "plan → execute → observe → reflect" agent loop.
  The LLM never touches Elasticsearch directly — it only ever sees tool
  results, which is the whole point of MCP: a clean, typed boundary between
  "what the model can ask for" and "how that's actually fetched."

**Is Elasticsearch's MCP server open source?** Yes — Elastic maintains an
official one at
[`elastic/mcp-server-elasticsearch`](https://github.com/elastic/mcp-server-elasticsearch)
(Node.js, Apache-2.0), a general-purpose server exposing broad ES operations
(list indices, get mappings, run search/ES|QL queries) against *any* index.
This project builds its own minimal Python server instead, scoped to one
index, specifically so the whole request path — MCP client, MCP server,
Elasticsearch queries — stays in a few small, readable files rather than
behind a generic external tool.

**Running it:** copy `backend/.env.example` to `backend/.env` and set
`GROQ_API_KEY` (get one at [console.groq.com](https://console.groq.com)).
`.env` is git-ignored — never commit a real key. The backend loads it via
`python-dotenv` at startup.
