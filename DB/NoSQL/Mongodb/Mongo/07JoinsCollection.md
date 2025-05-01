Already we have users collections:

And this is the data 


````
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
````

- lets add post collection and map some users to posts documents.

```
db.posts.insertMany([
  {
    title: "First Post",
    content: "Hello World",
    userId: ObjectId("68135128caec3e1f3796404a")  // ashfaq's _id
  },
  {
    title: "Second Post",
    content: "Learning Mongo Joins",
    userId: ObjectId("68135143caec3e1f3796404c")  // ashu's _id
  },
  {
    title: "Admin's Post",
    content: "Admin logs",
    userId: ObjectId("68135143caec3e1f3796404e")  // admin_user's _id
  }
])

```



Perfect — now let’s dive into **joins in MongoDB** using `$lookup`, and compare each step with how you’d do it in **PostgreSQL** using SQL `JOIN`s.

---

## 🧠 Concept Mapping: MongoDB vs PostgreSQL

| **Concept**            | **PostgreSQL (RDBMS)**                         | **MongoDB**                           |
|------------------------|------------------------------------------------|----------------------------------------|
| Table                  | Table                                          | Collection                             |
| Row                    | Row                                            | Document                               |
| Foreign Key            | `FOREIGN KEY` constraint                       | Manual linking via `ObjectId` or value |
| Join                   | `JOIN`, `LEFT JOIN`, `RIGHT JOIN`, etc.        | `$lookup` (only supports left join)    |

MongoDB only natively supports **left outer joins** (`$lookup`), no inner, right, or full joins — but you can emulate them using filters.

---

## 🧪 Scenario Setup: `users` ⬅️→ `posts` (1 user can have many posts)

### 1. Create `posts` collection

```js
db.posts.insertMany([
  {
    title: "First Post",
    content: "Hello World",
    userId: ObjectId("68135128caec3e1f3796404a")  // ashfaq's _id
  },
  {
    title: "Second Post",
    content: "Learning Mongo Joins",
    userId: ObjectId("68135143caec3e1f3796404c")  // ashu's _id
  },
  {
    title: "Admin's Post",
    content: "Admin logs",
    userId: ObjectId("68135143caec3e1f3796404e")  // admin_user's _id
  }
])
```

---

### 2. Perform a `$lookup` (LEFT JOIN equivalent)

#### 🔍 MongoDB:

```js
db.users.aggregate([
  {
    $lookup: {
      from: "posts",               // the target collection
      localField: "_id",           // field in 'users'
      foreignField: "userId",      // field in 'posts'
      as: "userPosts"              // output array field
    }
  },
  {
    $project: {
      username: 1,
      email: 1,
      userPosts: 1
    }
  }
])
```

#### 📘 PostgreSQL equivalent:

```sql
SELECT u.username, u.email, p.title
FROM users u
LEFT JOIN posts p ON u.id = p.user_id;
```

> ✅ This gives each user along with a list of posts written by them. If they’ve written none, `userPosts` will be an empty array — like a left join result with NULLs.

---

## ⚠️ What MongoDB **can’t** do natively:
- **Inner join**: we’d need to filter out `userPosts: []` manually.
- **Right join**, **full outer join**, **self join**: not supported.
- **Join more than one collection deeply**: possible but performance-heavy.

---

### 🔧 To filter users with at least one post (like INNER JOIN):

```js
db.users.aggregate([
  {
    $lookup: {
      from: "posts",
      localField: "_id",
      foreignField: "userId",
      as: "userPosts"
    }
  },
  {
    $match: {
      "userPosts.0": { $exists: true }  // ensures at least one post
    }
  }
])
```
---




- Output:

```
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
mymongodb> db.posts.insertMany([
...   {
...     title: "First Post",
...     content: "Hello World",
...     userId: ObjectId("68135128caec3e1f3796404a")  // ashfaq's _id
...   },
...   {
...     title: "Second Post",
...     content: "Learning Mongo Joins",
...     userId: ObjectId("68135143caec3e1f3796404c")  // ashu's _id
...   },
...   {
...     title: "Admin's Post",
...     content: "Admin logs",
...     userId: ObjectId("68135143caec3e1f3796404e")  // admin_user's _id
...   }
... ])
{
  acknowledged: true,
  insertedIds: {
    '0': ObjectId('68139054caec3e1f3796404f'),
    '1': ObjectId('68139054caec3e1f37964050'),
    '2': ObjectId('68139054caec3e1f37964051')
  }
}
mymongodb> db.users.aggregate([
...   {
...     $lookup: {
...       from: "posts",               // the target collection
...       localField: "_id",           // field in 'users'
...       foreignField: "userId",      // field in 'posts'
...       as: "userPosts"              // output array field
...     }
...   },
...   {
...     $project: {
...       username: 1,
...       email: 1,
...       userPosts: 1
...     }
...   }
... ])
[
  {
    _id: ObjectId('68135128caec3e1f3796404a'),
    username: 'ashfaq',
    email: 'ashfaq@example.com',
    userPosts: [
      {
        _id: ObjectId('68139054caec3e1f3796404f'),
        title: 'First Post',
        content: 'Hello World',
        userId: ObjectId('68135128caec3e1f3796404a')
      }
    ]
  },
  {
    _id: ObjectId('68135143caec3e1f3796404c'),
    username: 'ashu',
    email: 'ashu@example.com',
    userPosts: [
      {
        _id: ObjectId('68139054caec3e1f37964050'),
        title: 'Second Post',
        content: 'Learning Mongo Joins',
        userId: ObjectId('68135143caec3e1f3796404c')
      }
    ]
  },
  {
    _id: ObjectId('68135143caec3e1f3796404d'),
    username: 'junaid',
    email: 'junaid@example.com',
    userPosts: []
  },
  {
    _id: ObjectId('68135143caec3e1f3796404e'),
    username: 'admin_user',
    email: 'admin@example.com',
    userPosts: [
      {
        _id: ObjectId('68139054caec3e1f37964051'),
        title: "Admin's Post",
        content: 'Admin logs',
        userId: ObjectId('68135143caec3e1f3796404e')
      }
    ]
  }
]
mymongodb> db.users.aggregate([
...   {
...     $lookup: {
...       from: "posts",
...       localField: "_id",
...       foreignField: "userId",
...       as: "userPosts"
...     }
...   },
...   {
...     $match: {
...       "userPosts.0": { $exists: true }  // ensures at least one post
...     }
...   }
... ])
[
  {
    _id: ObjectId('68135128caec3e1f3796404a'),
    username: 'ashfaq',
    email: 'ashfaq@example.com',
    createdAt: ISODate('2025-05-01T10:47:04.100Z'),
    roles: [ 'user' ],
    isActive: true,
    userPosts: [
      {
        _id: ObjectId('68139054caec3e1f3796404f'),
        title: 'First Post',
        content: 'Hello World',
        userId: ObjectId('68135128caec3e1f3796404a')
      }
    ]
  },
  {
    _id: ObjectId('68135143caec3e1f3796404c'),
    username: 'ashu',
    email: 'ashu@example.com',
    passwordHash: 'hashed123',
    createdAt: ISODate('2024-01-01T00:00:00.000Z'),
    isActive: true,
    roles: [ 'user' ],
    userPosts: [
      {
        _id: ObjectId('68139054caec3e1f37964050'),
        title: 'Second Post',
        content: 'Learning Mongo Joins',
        userId: ObjectId('68135143caec3e1f3796404c')
      }
    ]
  },
  {
    _id: ObjectId('68135143caec3e1f3796404e'),
    username: 'admin_user',
    email: 'admin@example.com',
    passwordHash: 'hashed789',
    createdAt: ISODate('2024-04-10T00:00:00.000Z'),
    isActive: true,
    roles: [ 'admin' ],
    userPosts: [
      {
        _id: ObjectId('68139054caec3e1f37964051'),
        title: "Admin's Post",
        content: 'Admin logs',
        userId: ObjectId('68135143caec3e1f3796404e')
      }
    ]
  }
]
mymongodb>

```







###  **LEFT JOIN** in PostgreSQL with two simple tables.

---

### 🎯 **Goal**  
Understand how a `LEFT JOIN` works in SQL — it returns all rows from the **left table**, and matches from the **right table** where possible. If there's no match, it returns `NULL` for the right table's columns.

---

### 🧱 Tables & Sample Data

#### Table 1: `employees`
| id | name       |
|----|------------|
| 1  | Alice      |
| 2  | Bob        |
| 3  | Charlie    |
| 4  | Diana      |

#### Table 2: `departments`
| employee_id | department   |
|-------------|--------------|
| 1           | Sales        |
| 2           | HR           |
| 4           | Engineering  |

> Note: Charlie (`id = 3`) has **no department** assigned.

---

### 🔍 LEFT JOIN Query

```sql
SELECT 
    employees.id, 
    employees.name, 
    departments.department
FROM 
    employees
LEFT JOIN 
    departments 
ON 
    employees.id = departments.employee_id;
```

---

### 🧾 Result

| id | name    | department   |
|----|---------|--------------|
| 1  | Alice   | Sales        |
| 2  | Bob     | HR           |
| 3  | Charlie | NULL         |
| 4  | Diana   | Engineering  |

---

### ✅ What Happened?

- **All employees** are listed.
- For Charlie (no match in `departments`), the `department` column is `NULL`.