Excellent — let's **focus first on the database-level operations in MongoDB**, before diving into collections or documents.

---

# 🧠 What is a "Database" in MongoDB?

A **database** in MongoDB is a logical container for collections, like in PostgreSQL or MySQL.  
Each database contains its own **collections**, and each collection contains **documents** (like rows in SQL).

✅ Think of the hierarchy like this:

```
MongoDB
├── mymongodb          ← Database
│   ├── users          ← Collection
│   │   ├── {...}      ← Document (record)
```

---

# 🔹 How to Create and Switch to a Database?

In MongoDB, just using the database name will **create it on first insert**.

```javascript
use mymongodb
```

✅ This "switches" to the database `mymongodb`.  
It will be **created only if you insert something** (lazy creation).

---

# 🔍 Check Current Database

```javascript
db
```

Outputs the **current active database** (e.g., `mymongodb`).

---

# 📄 Show All Databases

```javascript
show dbs
```

✅ Lists all databases *that contain at least one document*.  
(empty databases don't show up until data is inserted)

---

# 📦 Show All Collections in the Current Database

```javascript
show collections
```

or:

```javascript
db.getCollectionNames()
```

✅ Lists all collections like `users`, `products`, etc., inside current database.

---

# 🧼 Drop a Database

```javascript
db.dropDatabase()
```

✅ Permanently deletes the current database.

---

# 🏗 Create Database with Initial Data (real-world style)

MongoDB doesn't force schema, so you **create the database by inserting into a collection**:

```javascript
use ecommerce
db.products.insertOne({ name: "Laptop", price: 75000 })
```

Now the `ecommerce` database is created (with `products` collection).

---

# 🔐 Optional: Create DB with User and Authentication (for secure DBs)

```javascript
use admin
db.createUser({
  user: "adminUser",
  pwd: "adminPass",
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" }
  ]
})
```

Then:

```javascript
use mymongodb
db.createUser({
  user: "ashfaq",
  pwd: "mypassword",
  roles: [ { role: "readWrite", db: "mymongodb" } ]
})
```

✅ This creates a user `ashfaq` with access to `mymongodb`.

(Useful for production-grade security.)

---

# 🧰 Useful Mongo Shell Commands Summary

| Command                        | What it does |
|-------------------------------|--------------|
| `use dbName`                  | Switch to / Create database |
| `db`                          | Show current DB |
| `show dbs`                    | List all databases |
| `show collections`            | List all collections in current DB |
| `db.dropDatabase()`           | Delete current database |
| `db.createUser({...})`        | Add a DB user with roles |
| `db.getCollectionNames()`     | List all collections in JS syntax |

---

Perfect — let’s break it down **super clearly** with **side-by-side comparison**, code examples, and what *schema* means in **PostgreSQL vs MongoDB**.

---

## 🧠 What does “Schema” mean?

| Term           | PostgreSQL                                    | MongoDB                                           |
|----------------|-----------------------------------------------|--------------------------------------------------|
| `schema`       | A **namespace** inside a database              | A **structure/blueprint** of documents (optional) |
| Example usage  | Organize tables into different schemas         | Define fields and their types in a document       |
| Enforced by    | SQL engine — strongly typed                   | Flexible (schema-less by default, validation optional) |

---

## ✅ PostgreSQL Example

```sql
-- Connect to a database `company_db`
CREATE SCHEMA hr;  -- Creating a schema called 'hr'

-- Create a table under schema 'hr'
CREATE TABLE hr.employees (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    age INTEGER
);
```

### 📌 Schema Breakdown (PostgreSQL)
- Database: `company_db`
- Schema: `hr`
- Table: `employees`
- Structure: Enforced — each row must follow this exact format.

---

## ✅ MongoDB Equivalent

```js
// Use or create the database
use company_db

// Create a collection with schema validation
db.createCollection("employees", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "age"],
      properties: {
        name: { bsonType: "string" },
        email: { bsonType: "string" },
        age: { bsonType: "int" }
      }
    }
  }
})
```

### 📌 Schema Breakdown (MongoDB)
- Database: `company_db`
- No concept of **named schemas** like `hr`
- Collection: `employees` (similar to table)
- Document structure: Optional by default, but above code **forces it** using validation
  - Each document (like a row) must contain name (string), email (string), age (int)

---

## 🧾 Sample Data in Both

### PostgreSQL Row
```sql
INSERT INTO hr.employees (name, email, age)
VALUES ('Ashfaq', 'ashfaq@example.com', 30);
```

### MongoDB Document
```js
db.employees.insertOne({
  name: "Ashfaq",
  email: "ashfaq@example.com",
  age: 30
})
```

---

## 🔄 Summary

| Concept              | PostgreSQL                                      | MongoDB                                                       |
|----------------------|--------------------------------------------------|----------------------------------------------------------------|
| Schema               | Namespace inside DB                              | Blueprint for document shape                                   |
| Required?            | Yes                                              | No (but can be added via validation)                           |
| Strict enforcement   | Yes                                              | No (optional, dynamic typing)                                  |
| Data unit            | Row in Table                                     | Document in Collection                                         |
| Organized by         | Database → Schema → Table → Row                  | Database → Collection → Document                               |

---


