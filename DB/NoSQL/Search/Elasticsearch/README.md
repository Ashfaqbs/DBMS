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

---

## FAQ — things that trip people up first

**Q: Is Elasticsearch a database, or a search engine?**
Both, in practice — but it's built as a *search engine* (on top of Lucene)
that's used as a database. That distinction explains a lot of the other
answers below: it's fast at search because of an inverted index, not because
it's "a database that happens to be quick."

**Q: Is an index "schemaless" like MongoDB?**
Not quite. More precise: *dynamically typed, but statically locked once set.*
- You **can** add a brand-new field at write time — ES auto-detects
  ("dynamic mapping") a type for it.
- You **cannot** change the type of a field that already exists in the
  mapping, ever, without reindexing.
- Mongo has no enforced schema at all by default. ES always has a mapping —
  either you define it upfront or ES infers one on first write. Either way,
  once a field's type is locked, it's locked.
- Documents *can* have different shapes (doc A: `{name, age}`, doc B:
  `{name, age, dept}}`) in the same index — that's the schemaless-*ish* part.
  What's rigid is the *type* of a given field name, not the shape of a doc.

**Q: What actually happens when I insert `"dog"` and then `"dog is an animal"`?**
If the field is `text`, ES runs each value through an **analyzer** (default:
`standard`) at write time: split into words, lowercase, build the term table.

```
doc1: "dog"                 -> terms: ["dog"]
doc2: "dog is an animal"    -> terms: ["dog", "is", "an", "animal"]

term     -> doc list
"dog"    -> [doc1, doc2]
"is"     -> [doc2]
"an"     -> [doc2]
"animal" -> [doc2]
```

Searching `"dog"` matches both — but they're **ranked**, not just returned.
BM25 scores doc1 higher than doc2: doc1 is shorter and "dog" is 100% of its
content, vs. 1-of-4 words in doc2. Field-length normalization penalizes
longer, more diluted matches.

**Q: `text` vs `keyword` — which one do I actually want?**
The short version: `text` = "does this word appear *anywhere inside* the
value" (tokenized, ranked, partial/word-level match). `keyword` = "is this
value, *in full*, identical to what I'm asking for" (exact whole-string
equality, case-sensitive, no partial match at all).

Concrete trap — don't think of `keyword` as "text search but stricter on
partial matches." It doesn't look inside the string at all:

```
doc1: dept = "Engineering"
doc2: dept = "Software Engineering"
```

- `dept` as `keyword`, query `term: "Engineering"` → matches **only doc1**.
  doc2's value is the single atomic string `"Software Engineering"`, which
  is not equal to `"Engineering"` — no match, not even a lower-ranked one.
- `dept` as `text`, query `match: "Engineering"` → matches **both**. doc2
  tokenizes to `["software", "engineering"]`, and "engineering" is one of
  those tokens.

Rule of thumb: pick `text` for anything you want to search like a sentence
(description, title, body). Pick `keyword` for anything you filter on
exactly, aggregate (`GROUP BY`-style), or sort by (status, SKU, category,
ID). When unsure, map both on the same value at no duplication cost:

```json
"content": {
  "type": "text",
  "fields": {
    "raw": { "type": "keyword" }
  }
}
```
`content` does full-text search; `content.raw` does exact match/aggregation
on the identical underlying value.

**Q: Who routes a request to the right shard — is there a broker in front of the cluster?**
No dedicated broker/router process. Any node can act as the **coordinating
node** for a given request. Write path: coordinator computes
`shard = hash(_routing) % number_of_primary_shards` (`_routing` defaults to
the doc's `_id`), forwards the write to whichever node currently hosts that
primary shard, which indexes it and then synchronously replicates to its
replica copies before acknowledging. Read path is scatter-gather: the
coordinator fans the query out to one copy of every shard, each searches
locally, and the coordinator merges/re-ranks the combined results.

**Q: Can I add a shard to an index at runtime?**
No — primary shard count is fixed forever at index creation, because it's
baked into the routing hash formula above; changing it would scramble where
every existing document lives. To get more shards: `_reindex` into a new
index created with more primary shards (then alias-swap), or the `_split`
API (original shard count must evenly divide the target, index must be
read-only during the operation). Replica count, by contrast, **can** be
changed freely at runtime — replicas are just copies, not part of the
routing hash.

**Q: Can I add a node at runtime, and what happens?**
Yes. The new node discovers and joins the cluster; the master node (elected
via Raft-like consensus, managing metadata only — it doesn't route data
traffic itself) triggers shard rebalancing, physically copying Lucene
segment files onto the new node. No rehashing, no resharding — primary
shard count never changes, only shard-to-node *placement* does.

**Q: Why is my single-node dev cluster "yellow" instead of "green"?**
Replica shards are configured but can't be assigned — there's no second
node to host them. This is expected on `discovery.type=single-node`, not a
bug; set `number_of_replicas: 0` for single-node dev setups.

---

### System design: shard rebalancing and storage, as a Q&A

**My question:** "So it's like I start with 1 node but I keep 3 shards,
assuming in future the storage can get 3-4 nodes — so now once I add nodes
the shard will automatically get divided into the nodes? And for that index
we will get more storage as that node/VM will configure how much that
elastic can use the storage, and that index shard will use this — am I
right?"

**Answer:**

Rebalancing — yes, exactly as described:
> Start with 1 node, 3 shards (all 3 sitting on that one node). Add 2 more
> nodes → 3 nodes total. The master node automatically triggers
> rebalancing: it physically copies 2 of those 3 shards' Lucene segment
> files onto the new nodes, until you land at ~1 shard per node. No
> reindex, no manual step, no shard-count change — just *placement*
> changing.

Storage — needs one correction. It's not "the node configures how much
Elasticsearch can use, and the shard uses that." More precisely:

- Each node has whatever disk is mounted at its data path (in this
  project's `docker-compose.yml`, that's the `es-data` volume).
  Elasticsearch doesn't get an explicit storage *allocation* from you — it
  just writes into that path until the disk is close to full.
- ES watches disk usage percentage via **watermarks**: ~85% (low) stops
  placing new shards on that node, ~90% (high) tries to move shards off,
  ~95% (flood-stage) makes indices on that node read-only. These are safety
  brakes, not a storage quota you set.
- **The catch:** a single shard is an atomic unit — it lives entirely on
  one node, it cannot be split across two nodes' disks. So with 3 shards
  and 4 nodes, only 3 nodes end up hosting a primary for this index; the
  4th either sits idle for this index or hosts a replica. Going from 1 node
  to 4 nodes does **not** mean this index "gets more storage"
  proportionally — the index's storage ceiling is capped by
  `(shard count) × (disk available on whichever node each shard lands on)`.
  More nodes helps you spread load and parallelize search, but it only
  increases *this index's* total usable storage if you also have enough
  shards to spread across those nodes.

**Takeaway:** adding nodes gives an index more storage only up to the
number of shards it has to place on them. If you anticipate needing more
total capacity, more nodes alone doesn't solve it — the shard count has to
be sized for that too, decided back at index-creation time (since it can
never change afterward without reindexing).

---

### System design: master node vs. primary shard — don't conflate them

**My question:** "So the flow is: when I use elastic, I have LB, I have the
coordination node which knows which shard to send, which can be sitting in
any node. And we have master which writes and reads, its backup is the
replica — and here the master is the actual node's backup — I'm not
getting this."

**Answer:** This mixes two completely different, unrelated concepts that
both sound like "the main one":

| | **Master node** | **Primary shard** |
|---|---|---|
| Scope | One per *cluster* | One per *shard* (5 shards → 5 independent primaries) |
| Job | Cluster admin only — tracks which nodes exist, which index/mapping exists, which node currently hosts which shard | Handles the actual document writes for *that one shard*, then pushes to its replica(s) |
| Involved in a document write? | **No**, not in its master capacity | **Yes** — this is what actually indexes the doc |
| Its backup/counterpart | None really — if the master node dies, another master-*eligible* node gets elected | The replica shard (a copy of that specific shard, on a different node) |

A single physical node can simultaneously be: the cluster's master (admin
role) **and** host the primary of shard 3 **and** host the replica of
shard 1 — three unrelated jobs layered on one machine by coincidence of
placement, not because they're the same thing.

**The one-line fix:** replace "the master writes and reads, its backup is
the replica" with — *"the primary shard writes and reads for its own
shard; its backup is the replica shard. The master does neither — it only
keeps the map of who's holding what."*

**Kafka analogy, for anyone coming from that background:**

| Kafka | Elasticsearch |
|---|---|
| Partition leader | Primary shard |
| Partition follower | Replica shard |
| Broker | Node |

Just like a Kafka broker can be leader for partition A and follower for
partition B at the same time, an ES node can hold the primary of shard X
and the replica of shard Y simultaneously — primary/replica is decided
per-shard, independently, not per-node.

---

### System design: the load balancer is not part of Elasticsearch

**My question:** "So I have to add an LB in prod systems, am I right, when
I'm hosting the Elastic?"

**Answer:** Yes, if self-hosting (own VMs/Kubernetes) — but it's worth
knowing this is a choice between two patterns, not a built-in ES feature:

- **Client-side round-robin** — the ES client library is configured with
  the full list of node addresses and round-robins (and can "sniff" the
  cluster to auto-discover new nodes) itself. No extra infra, but every
  client needs the node list, and there's no central health-checking/TLS
  termination point.
- **A real LB/reverse proxy in front** (nginx, HAProxy, a cloud LB) — what
  prod actually runs. Clients only know one stable address; the LB does
  health checks, TLS termination, and absorbs topology changes
  transparently. Often placed in front of dedicated **coordinating-only
  nodes** (`master: false, data: false` — a node role whose only job is to
  absorb client traffic and do the hash-routing/scatter-gather, without
  ever storing a shard), isolating client-traffic load from disk I/O.

**The exception:** on a *managed* service (Elastic Cloud, AWS OpenSearch
Service, etc.) you don't build any of this — they hand you a single
endpoint and run the LB/routing layer behind the scenes. You only need to
stand up your own LB when self-hosting raw Elasticsearch on your own
nodes — which is exactly what this project's `docker-compose.yml` would
need, if it ever grew past one node.

---

### System design: the "redirect" component post-LB — coordinating nodes

**My question:** "So post-LB we have this redirect component, right? Oh
it's like a normal node can act as a coordination node to redirect the
request to the respective shard, but in prod or heavy systems we have a
main coordinator node only does this job?"

**Answer:** The redirect step is real, but by default it isn't a separate
piece of infrastructure — it's a **role any node plays for a single
request**:

```
CLIENT → LB → [any ES node] → that node becomes coordinator for THIS
                                request only: hashes the doc id, looks up
                                cluster state, forwards to the node
                                holding the target shard, and (for
                                searches) merges results before replying.
```

Next request, the LB might pick a different node, and *that one* becomes
the coordinator that time. Nothing is fixed.

**Correction on "a main coordinator node":** not one — that recreates the
exact single-point-of-failure/throughput-ceiling problem this design is
meant to avoid. At scale, it's a **pool of dedicated coordinating-only
nodes** (`node.roles: []` — not master-eligible, holds zero shards), and
the LB round-robins across that pool the same way it would across data
nodes:

```
                    ┌─────┐
CLIENT ──► LB ──►  │ C1  │  ─┐
                    ├─────┤   │
                    │ C2  │  ─┼─► LB picks one of these per request.
                    ├─────┤   │     Each is coordinating-only: no shards,
                    │ C3  │  ─┘     not master-eligible. Job: hash →
                    └─────┘         redirect → merge → reply.
                       │
                       ▼ forwards to whichever node holds the target shard
                    ┌──────────────────────────┐
                    │ Data nodes (hold shards)  │
                    └──────────────────────────┘
```

Running several keeps the cluster reachable if one coordinator dies and
spreads request-handling load across them — the same redundancy reasoning
as running multiple data nodes, applied to this role instead.
