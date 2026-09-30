# DBMS

Personal, hands-on reference for database fundamentals and applied practice — relational, NoSQL, vector, and multi-model databases, plus the cross-cutting concepts (isolation levels, sharding, replication, CDC, etc.) that come up regardless of which engine you're using.

This isn't a tutorial series — it's working notes, docker setups, code samples, and small runnable projects built while actually using each database, organized so a specific topic is quick to find later.

## Structure

```
DB/
├── Concepts/     # Cross-cutting fundamentals: ACID, isolation levels & MVCC, locking &
│                 # deadlocks, reading EXPLAIN plans, CAP theorem, schema migrations,
│                 # replication/failover, connection pooling, sharding, multi-tenancy,
│                 # CDC/outbox pattern, SQL vs NoSQL
├── SQL/
│   ├── Mysql/
│   ├── Oracle/
│   └── Postgres/
├── NoSQL/
│   ├── Document/     # MongoDB
│   ├── KeyValue/     # Redis
│   ├── Search/       # Elasticsearch (includes a small FastAPI + React cluster explorer app)
│   └── MultiModel/   # Azure Cosmos DB
└── Vector/           # Embeddings, semantic search, indexing, RAG, quantization
```

Each database folder generally has a `Readme.md` with the core notes, plus a `code/` folder with runnable examples (mostly Spring Boot for Java, some Python) and docker setup files for spinning the database up locally.

## Running the code samples

Most examples assume Docker for the database itself:

```bash
cd DB/<category>/<database>
docker compose up -d
```

Java samples are Maven/Spring Boot projects (`mvnw` included, no local Maven install needed). Python samples list their dependencies in a local `requirements.txt`.

## Scope

This repo covers the databases and concepts encountered directly — it's not meant to be an exhaustive catalog of every database technology. Contributions from others aren't expected, but if something here is wrong or you have a correction, feel free to open an issue.
