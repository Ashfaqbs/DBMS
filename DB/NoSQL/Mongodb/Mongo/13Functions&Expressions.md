In MongoDB, **functions and expressions** are mostly used inside the **aggregation pipeline** — this is the heart of all computation and transformation logic.

Let’s walk through key categories of **functions & expressions** using our `users` collection:

---

## 📂 Sample Document (Reminder)

```json
{
  "_id": ObjectId("..."),
  "username": "ashfaq",
  "email": "ashfaq@example.com",
  "createdAt": ISODate("2025-05-01T10:47:04.100Z"),
  "roles": ["user", "admin"],
  "isActive": true
}
```

---

## 🧠 Categories of Expressions & Functions

---

### 🧮 1. **Arithmetic Operators**

```js
// Add 10 to a fake field (demo)
db.users.aggregate([
  { $project: { username: 1, newField: { $add: [10, 5] } } }
])
```

- `$add`, `$subtract`, `$multiply`, `$divide`, `$mod`

---

### 🔤 2. **String Operators**

```js
// Uppercase all usernames
db.users.aggregate([
  { $project: { username: 1, upperName: { $toUpper: "$username" } } }
])
```

- `$concat`, `$substr`, `$toUpper`, `$toLower`, `$trim`, `$strLenCP`

---

### 📆 3. **Date Operators**

```js
// Extract year from createdAt
db.users.aggregate([
  { $project: { username: 1, createdYear: { $year: "$createdAt" } } }
])
```

- `$year`, `$month`, `$dayOfMonth`, `$dateToString`, `$dateSubtract`, `$dateDiff`

---

### 🧠 4. **Conditional Operators**

```js
// Add a status field based on isActive
db.users.aggregate([
  {
    $project: {
      username: 1,
      status: {
        $cond: { if: "$isActive", then: "Active", else: "Inactive" }
      }
    }
  }
])
```

- `$cond`, `$ifNull`, `$switch`

---

### 📦 5. **Array Operators**

```js
// Show number of roles per user
db.users.aggregate([
  { $project: { username: 1, roleCount: { $size: "$roles" } } }
])
```

- `$size`, `$in`, `$arrayElemAt`, `$filter`, `$map`

---

### 🧩 6. **Type Conversion Operators**

```js
// Convert string number to integer
{ $toInt: "$someField" }
```

- `$toInt`, `$toString`, `$toDate`, `$convert`

---

### 🧮 7. **Comparison Operators**

```js
// Filter users created after 2024
db.users.aggregate([
  {
    $match: {
      createdAt: { $gt: ISODate("2024-01-01") }
    }
  }
])
```

- `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$cmp`

---

### 💡 Tip:

Most expressions are used inside `$project`, `$match`, `$group`, `$addFields`, `$set`.

---


- Output:

```

mymongodb> db.users.aggregate([
...   { $project: { username: 1, newField: { $add: [10, 5] } } }
... ])
[
  {
    _id: ObjectId('68135128caec3e1f3796404a'),
    username: 'ashfaq',
    newField: 15
  },
  {
    _id: ObjectId('68135143caec3e1f3796404c'),
    username: 'ashu',
    newField: 15
  },
  {
    _id: ObjectId('68135143caec3e1f3796404d'),
    username: 'junaid',
    newField: 15
  },
  {
    _id: ObjectId('68135143caec3e1f3796404e'),
    username: 'admin_user',
    newField: 15
  }
]
mymongodb> db.u
db.updateUser  db.updateRole  db.users

mymongodb> db.users.find().pretty()
[
  {
    _id: ObjectId('68135128caec3e1f3796404a'),
    username: 'ashfaq',
    email: 'ashfaq@example.com',
    createdAt: ISODate('2025-05-01T10:47:04.100Z'),
    roles: [ 'user' ],
    isActive: true
  },
  {
    _id: ObjectId('68135143caec3e1f3796404c'),
    username: 'ashu',
    email: 'ashu@example.com',
    passwordHash: 'hashed123',
    createdAt: ISODate('2024-01-01T00:00:00.000Z'),
    isActive: true,
    roles: [ 'user' ]
  },
  {
    _id: ObjectId('68135143caec3e1f3796404d'),
    username: 'junaid',
    email: 'junaid@example.com',
    passwordHash: 'hashed456',
    createdAt: ISODate('2024-02-15T00:00:00.000Z'),
    isActive: true,
    roles: [ 'user', 'moderator' ]
  },
  {
    _id: ObjectId('68135143caec3e1f3796404e'),
    username: 'admin_user',
    email: 'admin@example.com',
    passwordHash: 'hashed789',
    createdAt: ISODate('2024-04-10T00:00:00.000Z'),
    isActive: true,
    roles: [ 'admin' ]
  }
]
mymongodb>
```