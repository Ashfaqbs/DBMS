Let's dive into **Change Streams** in MongoDB — one of the most powerful real-time features it offers. It's comparable to **PostgreSQL triggers + NOTIFY/LISTEN** or **Kafka change data capture (CDC)**.

---

## 🔄 What Are Change Streams?

**Change Streams** allow we to **watch real-time changes** (insert, update, delete, replace, etc.) in:

- A **collection**
- A **database**
- Or the **entire deployment**

It uses the **oplog (operation log)** internally (only available in **replica sets** or **sharded clusters** — but even a standalone Docker container with `--replSet` can simulate this).

---

## ✅ Requirements

we must:

1. Be on **MongoDB 3.6+**
2. Use a **replica set** (even a single-node replica set is fine)

---

## 🚀 Quick Setup (for Docker)

Update our `docker-compose.yml` to enable a replica set:

```yaml
command: ["--replSet", "rs0"]
```

Then initialize it in shell:

```js
rs.initiate()
```

---

## 🛠️ Basic Change Stream Example

Let’s say we want to **watch changes on the `users` collection**:

```js
const changeStream = db.users.watch()

changeStream.on("change", (next) => {
  printjson(next)
})
```

In **mongosh**, do this:

```js
const cs = db.users.watch()
cs.hasNext() && printjson(cs.next()) // This blocks until a change happens
```

Then in another terminal, insert:

```js
db.users.insertOne({
  username: "liveuser",
  email: "live@example.com",
  createdAt: new Date(),
  roles: ["user"],
  isActive: true
})
```

And we'll see output like:

```json
{
  "_id": { ... },
  "operationType": "insert",
  "fullDocument": { ... },
  "ns": {
    "db": "mymongodb",
    "coll": "users"
  },
  "documentKey": { "_id": ObjectId("...") }
}
```

---

## 🔍 Filter Only Certain Events

we can use aggregation pipeline to filter:

```js
db.users.watch([
  { $match: { "operationType": "update" } }
])
```

---

## 🌍 Scope Levels

we can watch:

- Specific collection: `db.collection.watch()`
- Entire DB: `db.watch()`
- All DBs: `Mongo.watch()` (in mongosh only)

---

## ⚠️ Limitations

- Only works on replica sets
- No rewind (not a history store)
- Not good for batch sync
- Needs proper error handling (reconnect on resume tokens etc.)

---

## 🔁 Use Cases

- Real-time notifications
- Audit logs
- Cache invalidation
- Trigger external pipelines (similar to `AFTER INSERT` triggers in RDBMS)

---