## 🛠️ Types of MongoDB Updates

We'll use:

- `updateOne()` → like SQL `UPDATE ... WHERE ... LIMIT 1`
- `updateMany()` → like SQL `UPDATE ... WHERE ...`
- `$set` → to set/change fields
- `$unset` → to remove fields
- `$inc` → increment numeric values

---

### ✅ 1. `updateOne()` – Update a single document

```js
db.users.updateOne(
  { username: "ashfaq" },               // WHERE
  { $set: { isActive: true } }          // SET isActive = true
);
```

---

### ✅ 2. `updateMany()` – Update multiple documents

```js
db.users.updateMany(
  { isActive: false },                  // WHERE
  { $set: { isActive: true } }          // SET isActive = true
);
```

---

### ✅ 3. Update with multiple conditions

```js
db.users.updateOne(
  {
    username: "ashfaq",
    roles: { $in: ["user"] }           // WHERE username = 'ashfaq' AND 'user' ∈ roles
  },
  {
    $set: { isActive: true }
  }
);
```

---

### ✅ 4. Add a new field (or update existing)

```js
db.users.updateOne(
  { username: "ashfaq" },
  { $set: { location: "Bangalore" } }
);
```

---

### ✅ 5. Remove a field (`$unset`)

```js
db.users.updateOne(
  { username: "ashfaq" },
  { $unset: { location: "" } }
);
```

---

### ✅ 6. Increment a number field (`$inc`)

```js
db.users.updateOne(
  { username: "ashfaq" },
  { $inc: { loginCount: 1 } }   // loginCount += 1
);
```