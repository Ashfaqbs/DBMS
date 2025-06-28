
#  Azure Cosmos DB – Overview & FAQ

##  What is Azure Cosmos DB?

**Azure Cosmos DB** is a **fully managed**, **globally distributed**, **multi-model NoSQL database** service by Microsoft. It is designed to offer low latency, elastic scalability, and high availability.

Unlike traditional RDBMS systems, Cosmos DB supports a variety of data models through different APIs and is optimized for semi-structured data (like JSON).

---

##  Data Structure in Cosmos DB (SQL API)

```
Cosmos DB Account (Server)
  └── Database (DB)
        └── Container (like Collection or Table)
              └── Item (a JSON Document)
```

* **Account**: Top-level service instance.
* **Database**: Logical group of containers.
* **Container**: Stores JSON documents (can be compared to a table or collection).
* **Item**: A single document (record), stored as JSON.

---

##  APIs Supported in Cosmos DB

| API               | Data Model     | Query Language        | Best For                                              |
| ----------------- | -------------- | --------------------- | ----------------------------------------------------- |
| **SQL API**       | JSON documents | SQL-like syntax       | Native to Cosmos DB; flexible JSON document queries   |
| **MongoDB API**   | JSON documents | MongoDB syntax        | Applications using MongoDB syntax & tools             |
| **Cassandra API** | Wide-column    | CQL (Cassandra Query) | Large-scale time series, IoT, telemetry               |
| **Gremlin API**   | Graph          | Gremlin (TinkerPop)   | Graph-based apps: recommendations, social graphs      |
| **Table API**     | Key-Value      | OData / REST          | Simple, scalable key-value access (like Azure Tables) |

> Note: These APIs are just "front doors" — under the hood, Cosmos DB uses the same distributed engine.

---

##  Cosmos DB vs Other Databases

| Feature     | PostgreSQL      | MongoDB         | Redis         | Cosmos DB (SQL API)       |
| ----------- | --------------- | --------------- | ------------- | ------------------------- |
| Type        | Relational      | Document        | Key-Value     | Multi-model NoSQL         |
| Schema      | Strict          | Flexible        | None          | Flexible (schema-less)    |
| Joins       | Full            | Limited         | None          | Only within one container |
| Data Format | Rows            | JSON            | String/binary | JSON                      |
| Use Case    | Structured data | Semi-structured | Cache/session | Globally distributed JSON |

---

##  FAQ

### Can Cosmos DB store structured data?

Yes — you can store structured-looking data in Cosmos DB using well-defined JSON, but the structure isn’t enforced. There are no foreign keys or strict column types like in RDBMS. It's considered **semi-structured**.

###  Why are both SQL API and MongoDB API storing JSON?

Because Cosmos DB is fundamentally a document store. Both APIs store JSON, but:

* **SQL API** uses Cosmos’s native query syntax.
* **MongoDB API** is for compatibility with MongoDB syntax and tooling.

###  Is Cosmos DB a relational database?

No. Even though the SQL API supports SQL-like queries, Cosmos DB is a **NoSQL** database. It does not support joins across containers, foreign keys, or strict schemas.

###  When should I use Cosmos DB?

Use Cosmos DB when you need:

* Low-latency access to semi-structured data
* Global distribution and high availability
* Auto-scaling throughput (RU/s)
* Support for multiple APIs and models

---

##  Key Takeaways

* Cosmos DB is **not a relational DB** but a **multi-model NoSQL DB**.
* You can use it like MongoDB, Cassandra, or Graph DB based on the API.
* It works best with **semi-structured data** (like JSON).
* It’s great for **cloud-native, scalable, global applications**.

---