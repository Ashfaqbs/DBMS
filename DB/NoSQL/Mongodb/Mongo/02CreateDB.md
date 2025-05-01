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
It will be **created only if we insert something** (lazy creation).

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

MongoDB doesn't force schema, so we **create the database by inserting into a collection**:

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

## Understanding Schema in mongoDB:

let’s break it down **super clearly** with **side-by-side comparison**, code examples, and what *schema* means in **PostgreSQL vs MongoDB**.

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
- No concept of **named schemas** like `hr` Directly under db add the collections.
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




## Understanding By Questions:

- Default Schemaless in MongoDB behavior.

In MongoDB, **collections are schemaless by default**, which means:
Note: here schema is not db > schema > table like how we have in PostgreSQL or other RDBMS, but the structure of the document inside the collection.


- We **can** insert documents with different structures into the same collection.
- There's **no requirement** for each document to have the same fields or data types.
- MongoDB will **not complain or reject** inserts based on structure differences (unless we're using schema validation explicitly).

So, using our example:

```json
{ "id": 1, "name": "ash" }
{ "id": 1, "name": "ash", "age": 25 }
{ "id": 1, "name": "ash", "no": 93812123141 }
```
- No problem, all are valid for mongo as long as we don't use schema validation or have defined the schema structure in advance.

All of these documents can coexist in the same `person` collection **without any issues**, as long as we haven't enforced a schema using [schema validation](https://www.mongodb.com/docs/manual/core/schema-validation/).

 

- Enforcing Schemas on collection in advance to override the default schemaless behavior.
lets say for abouve example we want to enforce a schema on the collection to only allow `id` and `name` and no other fields.

 To enforce that **only `id` and `name`** fields can exist in your MongoDB documents, we'll need to define a **JSON schema validator** when creating (or modifying) the collection.

Here's how to do it in MongoDB (via shell or using a driver):

### ✅ Example: Create Collection with Schema Validation

```javascript


db.createCollection("person", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "name"],
      additionalProperties: false,
      properties: {
        _id: {},  // Allow MongoDB's automatic _id field
        id: { bsonType: "int" },
        name: { bsonType: "string" }
      }
    }
  }
});



```

### ✅ Explanation:
-  we need to allow _id explicitly in our schema if we're using additionalProperties: false,  MongoDB automatically adds an _id field to every document unless we explicitly specify one. Because our schema has additionalProperties: false, it will reject the automatic _id field as an "extra" if not added.
- `required: ["id", "name"]`: Ensures both fields are present.
- `additionalProperties: false`: **Blocks** any fields other than `id` and `name`.
- `bsonType`: Ensures types are respected (`int`, `string`, etc.).

### 🧪 Inserting documents:

#### ✅ Allowed:
```javascript
db.person.insertOne({ id: 1, name: "ash" });
```

#### ❌ Rejected:
```javascript
db.person.insertOne({ id: 1, name: "ash", age: 25 }); // "age" is not allowed
```


- Schemaless example 

```
mymongodb> db.freestyle.insertOne({ id: 1, name: "ash" });
{
  acknowledged: true,
  insertedId: ObjectId('68130fe8caec3e1f37964038')
}
mymongodb> db.freestyle.insertOne({ id: 2, name: "misty", badge: "cascade" });
{
  acknowledged: true,
  insertedId: ObjectId('68130fefcaec3e1f37964039')
}
mymongodb> db.freestyle.insertOne({ foo: "bar", anything: [1, 2, 3] });
{
  acknowledged: true,
  insertedId: ObjectId('68130ff2caec3e1f3796403a')
}
mymongodb> db.freestyle.find().pretty()
[
  { _id: ObjectId('68130fe8caec3e1f37964038'), id: 1, name: 'ash' },
  {
    _id: ObjectId('68130fefcaec3e1f37964039'),
    id: 2,
    name: 'misty',
    badge: 'cascade'
  },
  {
    _id: ObjectId('68130ff2caec3e1f3796403a'),
    foo: 'bar',
    anything: [ 1, 2, 3 ]
  }
]
mymongodb>


```


