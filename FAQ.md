## Let's dive into **DDL** and **DML**, and then we’ll see which operations require a **COMMIT** and **ROLLBACK**.

### 1. **DDL (Data Definition Language)**

**DDL** includes commands that define or modify the **structure** of the database objects (such as tables, schemas, indexes, etc.). These commands are used to create, alter, or delete database objects.

#### Common DDL Commands:
- **CREATE**: Used to create new database objects (tables, views, indexes, etc.).
  - Example: `CREATE TABLE employees (emp_id NUMBER, name VARCHAR2(50));`
- **ALTER**: Used to modify existing database objects (adding columns, changing constraints, etc.).
  - Example: `ALTER TABLE employees ADD salary NUMBER;`
- **DROP**: Used to delete database objects.
  - Example: `DROP TABLE employees;`
- **TRUNCATE**: Removes all records from a table, but the table structure remains.
  - Example: `TRUNCATE TABLE employees;`

#### DDL and **COMMIT**/**ROLLBACK**:
- **DDL operations are auto-committed**: This means that after you run a DDL command, the change is immediately committed to the database, and there’s no need to explicitly write a `COMMIT` statement. Once a DDL statement is executed, it **cannot be rolled back**.
- You **cannot rollback** a DDL operation after it has been executed because the changes are automatically saved.

---

### 2. **DML (Data Manipulation Language)**

**DML** includes commands that are used to **manipulate data** within the database objects (insert, update, delete records). It deals with the actual data within the database.

#### Common DML Commands:
- **INSERT**: Adds new records to a table.
  - Example: `INSERT INTO employees (emp_id, name) VALUES (1, 'Alice');`
- **UPDATE**: Modifies existing records in a table.
  - Example: `UPDATE employees SET name = 'Bob' WHERE emp_id = 1;`
- **DELETE**: Removes specific records from a table.
  - Example: `DELETE FROM employees WHERE emp_id = 1;`
- **MERGE**: Performs an `INSERT`, `UPDATE`, or `DELETE` based on certain conditions. (This is a more advanced command used to synchronize data between two tables.)

#### DML and **COMMIT**/**ROLLBACK**:
- **DML operations require an explicit `COMMIT`** to permanently save the changes. 
  - Example: After an `INSERT` or `UPDATE`, the changes are **not saved** until you run a `COMMIT`.
- If you make a mistake while using DML (e.g., inserting the wrong data or updating the wrong row), you can use **`ROLLBACK`** to undo the changes.
  - Example: If you realize you've inserted incorrect data, you can issue a `ROLLBACK` before `COMMIT` to undo the changes.

---

### Key Differences Between DDL and DML

| **Property**        | **DDL**                               | **DML**                               |
|---------------------|---------------------------------------|---------------------------------------|
| **Full Form**        | Data Definition Language              | Data Manipulation Language            |
| **Purpose**          | Defines the structure of the database | Manipulates the data within the database |
| **Examples**         | CREATE, ALTER, DROP, TRUNCATE         | INSERT, UPDATE, DELETE, MERGE         |
| **Auto-commit?**     | Yes (immediate commit, no rollback)   | No (manual commit needed)             |
| **Rollback Allowed?**| No                                    | Yes, you can roll back uncommitted changes |

---

### 3. **TCL (Transaction Control Language)**

Just to complete the picture, there are also **TCL (Transaction Control Language)** commands that manage transactions in DML:

- **COMMIT**: Saves the changes made by DML commands.
  - Example: `COMMIT;`
- **ROLLBACK**: Undoes changes since the last `COMMIT`.
  - Example: `ROLLBACK;`
- **SAVEPOINT**: Sets a point within a transaction to which you can later roll back.
  - Example: `SAVEPOINT sp1;`
  
---

### Example Scenario

Let’s say you have a `products` table, and you're inserting some new products:

```sql
-- Step 1: Start inserting data
INSERT INTO products (product_id, name, price) VALUES (1, 'Laptop', 1500);
INSERT INTO products (product_id, name, price) VALUES (2, 'Smartphone', 800);

-- Step 2: Oops! You realize the price of the Smartphone was incorrect. You can roll back.
ROLLBACK;

-- Step 3: Insert the correct data
INSERT INTO products (product_id, name, price) VALUES (2, 'Smartphone', 750);

-- Step 4: Finally, commit the correct changes
COMMIT;
```

Here, if you didn’t commit your first `INSERT` statements, you can `ROLLBACK` to undo the incorrect insertions. After you insert the correct data, you can issue a `COMMIT` to save it permanently.

---

### In Summary:
- **DDL** commands define the structure of the database, and they are **auto-committed** (no rollback).
- **DML** commands manipulate the actual data in the database, and you must **commit** them manually. You can use **rollback** to undo any uncommitted changes.
- **TCL** helps manage transactions (commit and rollback).




##  **Connecting to a Database**
You can connect to a database in several ways, depending on the type of DBMS:

#### A. **Using SQL Clients (for manual querying)**
   - SQL clients like **SQL Developer** (for Oracle), **pgAdmin** (for PostgreSQL), and **MySQL Workbench** are GUI tools that let you interact with the database by running SQL queries manually.

#### B. **Programmatically (for building applications)**
   - Applications written in languages like Java, Python, or Node.js typically connect to databases using **JDBC**, **ODBC**, or **ORM frameworks** (like Hibernate or JPA in Java).
   - Example (using Spring Boot and JDBC):
     ```properties
     spring.datasource.url=jdbc:oracle:thin:@localhost:1522/mainschema
     spring.datasource.username=ashu
     spring.datasource.password=ashu
     spring.datasource.driver-class-name=oracle.jdbc.OracleDriver
     ```

#### C. **Web-based Admin Panels**
   - Tools like **phpMyAdmin** or **Adminer** provide web-based interfaces to manage databases.
