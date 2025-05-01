In MongoDB, **transactions** allow multiple read and write operations to execute in isolation — either all succeed or none do. This is very similar to **ACID** transactions in relational databases like PostgreSQL.

---

## ✅ When to Use Transactions in MongoDB

- When multiple documents/collections must stay consistent.
- When simulating financial operations (e.g., transfer from one account to another).
- When dealing with multiple related updates that **must not partially succeed**.

---

## 📌 Requirements

- Transactions work only in **replica sets** (even a single-node replica set works locally).
- MongoDB version **4.0+** for replica set, and **4.2+** for sharded clusters.

---

## 🧪 Test Local Transaction (on a Single-Node Replica Set)

### Step 1: Enable Replica Set in Docker (if not already)

In our `docker-compose.yml`:

```yaml
command: ["mongod", "--replSet", "rs0"]
```

Then after container starts:

```bash
docker exec -it mongo_local_standard mongosh
```

```js
rs.initiate()
```

---

### Step 2: Sample Transaction via Shell

Assume `users` and `logs` collections exist.

```js
const session = db.getMongo().startSession();
const users = session.getDatabase("mymongodb").users;
const logs = session.getDatabase("mymongodb").logs;

session.startTransaction();

try {
  users.insertOne({
    username: "txn_user",
    email: "txn@example.com",
    createdAt: new Date(),
    roles: ["user"],
    isActive: true
  });

  logs.insertOne({
    action: "User Created",
    user: "txn_user",
    time: new Date()
  });

  session.commitTransaction();
  print("✅ Transaction committed.");
} catch (e) {
  session.abortTransaction();
  print("❌ Transaction aborted. Reason:", e);
}
```

---

### 🧠 Notes

- **All operations are isolated**: If anything fails, nothing is saved.
- Works across **multiple collections**.
- Transactions have a **timeout** (default 60 seconds).
- Don't use transactions when **atomic operations** (like `$inc`, `$push`) suffice — MongoDB updates single documents atomically.

---

## 🔍 Comparison with SQL Transactions

| Feature                | PostgreSQL              | MongoDB                        |
|------------------------|-------------------------|--------------------------------|
| Multi-statement txn    | Yes                     | Yes                            |
| Rollback               | Yes                     | Yes                            |
| Isolation levels       | Configurable            | Snapshot isolation             |
| Savepoints             | Yes                     | No (not supported)             |
| Auto-commit            | Off by default          | Manual commit required         |

---
