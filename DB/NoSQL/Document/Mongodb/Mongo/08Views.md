## 🪟 What is a View in MongoDB?

A **view** is a **read-only virtual collection** defined by an aggregation pipeline. It's similar to a **PostgreSQL view** created using a `SELECT` query.

- ✅ It *does not store data*; it reflects real-time results from the underlying collection.
- ❌ We **cannot insert/update/delete** on a view.

---

### 🧠 Use Case
Let’s create a view to **list only active users with selected fields**.

---

### 📦 Base Collection: `users`
You already have:
```json
{
  "username": "ashfaq",
  "email": "ashfaq@example.com",
  "createdAt": ISODate("..."),
  "isActive": true,
  "roles": ["user"]
}
```

---

## 🛠️ 1. Create View (like a filtered SELECT)

```js
db.createView(
  "active_users_view",      // 🪟 Name of the view
  "users",                  // 📦 Base collection
  [
    { $match: { isActive: true } },
    {
      $project: {
        _id: 0,
        username: 1,
        email: 1,
        roles: 1,
        createdAt: 1
      }
    }
  ]
)
```

---

## ✅ 2. Query the View (like SELECT * from view)

```js
db.active_users_view.find().pretty()
```

We'll get:
```json
{
  "username": "ashfaq",
  "email": "ashfaq@example.com",
  "roles": ["user"],
  "createdAt": ISODate("...")
}
```

---

## 🛑 Limitations
- **Read-only** (cannot modify documents)
- Follows the source collection’s changes
- No indexes on views themselves (indexes must exist on the base collection)

---

## 🚀 Example: Role-based View

```js
db.createView(
  "admin_users_view",
  "users",
  [
    { $match: { roles: "admin" } },
    { $project: { _id: 0, username: 1, email: 1 } }
  ]
)
```

- Output

```

mymongodb> db.createView(
...   "active_users_view",      // 🪟 Name of the view
...   "users",                  // 📦 Base collection
...   [
...     { $match: { isActive: true } },
...     {
...       $project: {
...         _id: 0,
...         username: 1,
...         email: 1,
...         roles: 1,
...         createdAt: 1
...       }
...     }
...   ]
... )
{ ok: 1 }
mymongodb> db.active_users_view.find().pretty()
[
  {
    username: 'ashfaq',
    email: 'ashfaq@example.com',
    createdAt: ISODate('2025-05-01T10:47:04.100Z'),
    roles: [ 'user' ]
  },
  {
    username: 'ashu',
    email: 'ashu@example.com',
    createdAt: ISODate('2024-01-01T00:00:00.000Z'),
    roles: [ 'user' ]
  },
  {
    username: 'junaid',
    email: 'junaid@example.com',
    createdAt: ISODate('2024-02-15T00:00:00.000Z'),
    roles: [ 'user', 'moderator' ]
  },
  {
    username: 'admin_user',
    email: 'admin@example.com',
    createdAt: ISODate('2024-04-10T00:00:00.000Z'),
    roles: [ 'admin' ]
  }
]
mymongodb>
```