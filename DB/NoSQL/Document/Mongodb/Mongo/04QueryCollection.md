## 🔍 FIND OPERATIONS

### ✅ 1.1 Find All Users
```js
db.users.find().pretty();
```

> Like `SELECT * FROM users;` in SQL

---

### ✅ 1.2 Find One User (by any condition)
```js
db.users.findOne({ username: "ashfaq" });
```

> Like `SELECT * FROM users WHERE username = 'ashfaq' LIMIT 1;`

---

### ✅ 1.3 Find Users with **Multiple Conditions** (AND logic)
```js
db.users.find({
  isActive: true,
  roles: { $in: ["admin"] }
});
```

> Like `SELECT * FROM users WHERE isActive = true AND 'admin' IN roles;`

---

### ✅ 1.4 Find Using Date Comparison (e.g., created after Feb 1, 2024)
```js
db.users.find({
  createdAt: { $gt: new Date("2024-02-01") }
});
```

> Like `SELECT * FROM users WHERE createdAt > '2024-02-01';`

---

### ✅ 1.5 Find by Array Matching (roles contain "moderator")
```js
db.users.find({
  roles: "moderator"
});
```

> This matches any user whose `roles` array **contains** `"moderator"`.

---

### ✅ 1.6 Pattern Match on Email (Regex)
```js
db.users.find({
  email: { $regex: /@example\.com$/ }
});
```

> Like `SELECT * FROM users WHERE email LIKE '%@example.com';`

---

### ✅ 1.7 Projection: Only return selected fields
```js
db.users.find(
  { isActive: true },
  { username: 1, email: 1, _id: 0 }
);
```

> Like `SELECT username, email FROM users WHERE isActive = true;`

---



 **MongoDB supports sorting and pagination** very similar to SQL's `ORDER BY`, `LIMIT`, and `OFFSET`.

---

## 🔄 Sort + Paginate in MongoDB

We’ll use:
- `.sort()` → like `ORDER BY`
- `.limit()` → like `LIMIT`
- `.skip()` → like `OFFSET`

---

### ✅ 1. Sort by `createdAt` descending (newest first)

```js
db.users.find().sort({ createdAt: -1 });
```

> Like: `ORDER BY createdAt DESC`

---

### ✅ 2. Sort by `username` ascending

```js
db.users.find().sort({ username: 1 });
```

> Like: `ORDER BY username ASC`

---

### ✅ 3. Limit to first 2 documents

```js
db.users.find().limit(2);
```

> Like: `LIMIT 2`

---

### ✅ 4. Skip first 2, then return next 2

```js
db.users.find().skip(2).limit(2);
```

> Like: `OFFSET 2 LIMIT 2`

---

### ✅ 5. Combine Sort + Skip + Limit

```js
db.users.find()
  .sort({ createdAt: -1 }) // Newest users first
  .skip(2)                 // Skip top 2
  .limit(2);               // Show next 2
```

---

### ⚠️ Tip for Large Pagination

For large datasets, `.skip()` gets slower — use **range-based pagination** with `createdAt` or `_id` as cursors instead (like "infinite scroll" with bookmarks).