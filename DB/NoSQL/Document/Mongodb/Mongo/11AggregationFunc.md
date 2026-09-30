###  **MongoDB Aggregation** using our existing `users` collection.

Aggregation in MongoDB is similar in purpose to SQL's `GROUP BY`, `HAVING`, `SUM()`, `AVG()`, etc., but it’s **pipeline-based** — each stage transforms the data step-by-step.

---

## 🔧 Basic Structure

```js
db.users.aggregate([
  { $stage1: { ... } },
  { $stage2: { ... } },
  ...
])
```

---

## 🔍 Sample `users` Data Recap (simplified)

```json
{
  "username": "junaid",
  "email": "junaid@example.com",
  "roles": ["user", "moderator"],
  "isActive": true,
  "createdAt": ISODate("2024-02-15T00:00:00.000Z")
}
```

---

## 🎯 Examples of Aggregate Functions (on `users`)

---

### ✅ Count All Users

```js
db.users.aggregate([
  { $count: "totalUsers" }
])
```

🟩 SQL Equivalent:
```sql
SELECT COUNT(*) FROM users;
```

---

### ✅ Count Users by Role (Unwind + Group)

```js
db.users.aggregate([
  { $unwind: "$roles" },
  { $group: { _id: "$roles", count: { $sum: 1 } } }
])
```

🟩 SQL Equivalent:
```sql
SELECT role, COUNT(*) FROM user_roles GROUP BY role;
```

---

### ✅ Find Total & Average Users Created Per Month

```js
db.users.aggregate([
  {
    $group: {
      _id: { $month: "$createdAt" },
      total: { $sum: 1 }
    }
  },
  { $sort: { "_id": 1 } }
])
```

🟩 SQL Equivalent:
```sql
SELECT MONTH(created_at), COUNT(*) FROM users GROUP BY MONTH(created_at);
```

---

### ✅ Group by Active Status

```js
db.users.aggregate([
  {
    $group: {
      _id: "$isActive",
      total: { $sum: 1 }
    }
  }
])
```

---

### ✅ Filter + Aggregate (like WHERE + GROUP BY)

```js
db.users.aggregate([
  { $match: { isActive: true } },
  { $group: { _id: "$roles", total: { $sum: 1 } } }
])
```

---

## 🧠 Common Stages in Aggregation Pipeline

| Stage        | Purpose                                  |
|--------------|------------------------------------------|
| `$match`     | Filter documents (like `WHERE`)          |
| `$group`     | Group & calculate aggregates             |
| `$project`   | Reshape document fields (like `SELECT`)  |
| `$sort`      | Sort results                             |
| `$limit`     | Limit results                            |
| `$skip`      | Skip N results (for pagination)          |
| `$unwind`    | Break arrays into individual documents   |

---

## 🧮 Most Common Aggregate Operators

| Operator     | Meaning                  |
|--------------|--------------------------|
| `$sum`       | Add values               |
| `$avg`       | Average                  |
| `$min`       | Minimum                  |
| `$max`       | Maximum                  |
| `$push`      | Collect into array       |
| `$first`     | First item in group      |
| `$addToSet`  | Unique values into array |

---


```
mymongodb> db.users.aggregate([
...   { $count: "totalUsers" }
... ])
[ { totalUsers: 4 } ]
mymongodb> db.users.aggregate([
...   { $unwind: "$roles" },
...   { $group: { _id: "$roles", count: { $sum: 1 } } }
... ])
[
  { _id: 'moderator', count: 1 },
  { _id: 'user', count: 3 },
  { _id: 'admin', count: 1 }
]
mymongodb> db.users.aggregate([
...   {
...     $group: {
...       _id: { $month: "$createdAt" },
...       total: { $sum: 1 }
...     }
...   },
...   { $sort: { "_id": 1 } }
... ])
[
  { _id: 1, total: 1 },
  { _id: 2, total: 1 },
  { _id: 4, total: 1 },
  { _id: 5, total: 1 }
]
mymongodb> db.users.aggregate([
...   {
...     $group: {
...       _id: "$isActive",
...       total: { $sum: 1 }
...     }
...   }
... ])
[ { _id: true, total: 4 } ]
mymongodb>
```