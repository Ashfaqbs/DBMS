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

Want to try these and confirm which ones you're interested in extending or modifying?

Then I’ll take you through **updateOne**, **updateMany**, and conditional updates in Step 2.

---