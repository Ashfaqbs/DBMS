### 🔹 Why Use Indexes?

Just like in PostgreSQL, **indexes in MongoDB improve query performance**. Without indexes, MongoDB performs **collection scans** — checking each document one by one. Indexes help MongoDB to **quickly locate matching documents**.

---

## 🔑 Common Index Types in MongoDB

| Index Type                  | Description                                                                 | Use Case Example                                                                 |
|----------------------------|-----------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| **Single Field**           | Index on a single field                                                     | `db.users.createIndex({ username: 1 })` → Efficient lookups on `username`       |
| **Compound**               | Index on multiple fields (order matters)                                    | `db.users.createIndex({ username: 1, email: -1 })` → Filters + sorts together   |
| **Multikey**               | Automatically created on array fields                                       | `roles: ["user", "admin"]` → enables `roles: "admin"` query                     |
| **Text Index**             | Full-text search on string fields                                           | `db.articles.createIndex({ content: "text" })` → Search keywords                |
| **Hashed Index**           | Hashes the value → uniform distribution for sharded collections             | `db.logs.createIndex({ userId: "hashed" })` → Sharding key                      |
| **Geospatial (2d/2dsphere)** | Index for location-based queries                                           | `db.places.createIndex({ location: "2dsphere" })` → Find nearby places          |
| **TTL Index (Time-to-Live)**| Automatically deletes expired documents                                     | `db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })`       |
| **Wildcard Index (`$**`)** | Indexes all fields or nested dynamic fields                                 | Useful for **schemaless** or **dynamic** fields                                 |
| **Unique Index**           | Prevents duplicate values                                                   | `db.users.createIndex({ email: 1 }, { unique: true })`                          |
| **Sparse Index**           | Only indexes documents **that have the field**                              | Skip missing field entries → avoids nulls                                       |
| **Partial Index**          | Indexes only documents matching filter condition                            | `db.orders.createIndex({ amount: 1 }, { partialFilterExpression: { status: "active" } })` |

---

### ⚠️ When to Use Which Index?

| Use Case                                | Recommended Index             |
|-----------------------------------------|-------------------------------|
| Lookup by unique username               | Single field + Unique         |
| Search over title/content               | Text index                    |
| Filter + sort by two fields             | Compound index                |
| Query inside array field                | Multikey index                |
| Automatically clean expired data        | TTL index                     |
| Find documents with dynamic keys        | Wildcard index                |
| Spatial queries (near, geoWithin)       | 2dsphere index                |
| High-cardinality shard key              | Hashed index                  |
| Only index when condition is true       | Partial index                 |

---

### 🔍 Index in Action

```js
// Create a compound + unique index on email and username
db.users.createIndex(
  { email: 1, username: 1 },
  { unique: true }
);

// Check existing indexes
db.users.getIndexes();

// Explain query performance
db.users.find({ email: "a@example.com" }).explain("executionStats")
```

---

### 🧠 Compare With PostgreSQL

| PostgreSQL                         | MongoDB                          |
|-----------------------------------|----------------------------------|
| B-tree Index (default)            | Default for most indexes         |
| Composite Index                   | Compound Index                   |
| GIN Index (for full text)         | Text Index                       |
| GIST/Spatial                      | 2dsphere Index                   |
| UNIQUE constraint                 | Unique Index                     |
| Partial Index                     | Same                             |
| Index on JSONB key                | Wildcard / Multikey              |

---