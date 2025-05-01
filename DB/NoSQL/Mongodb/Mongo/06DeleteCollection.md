## 🧹 MongoDB Delete Operations

We'll focus on two main methods:

- `deleteOne()` → deletes the *first matching document*
- `deleteMany()` → deletes *all matching documents*

---

### ✅ 1. `deleteOne()` – Like `DELETE ... WHERE ... LIMIT 1`

```js
db.users.deleteOne({ username: "ashfaq" });
```

> 🔍 Deletes the first user with `username = "ashfaq"`.

---

### ✅ 2. `deleteMany()` – Like `DELETE ... WHERE ...`

```js
db.users.deleteMany({ isActive: false });
```

> 🔍 Deletes all users where `isActive = false`.

---

### ✅ 3. Delete with multiple conditions

```js
db.users.deleteMany({
  roles: { $in: ["guest"] },
  createdAt: { $lt: new Date("2024-01-01") }
});
```

> 🔍 Delete all users who are `guest` and created before Jan 1, 2024.

---

### 🔒 MongoDB Does Not Have a TRUNCATE Equivalent
we can drop an entire collection with:

```js
db.users.drop(); // ⚠️ deletes entire collection!
```