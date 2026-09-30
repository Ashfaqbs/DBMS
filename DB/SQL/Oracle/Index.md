Let's break down the concept of indexing and how it helps improve query performance, particularly for queries on columns like  `email`, and `department_id` in the `employees` table.

### 1. **What is an Index?**
An index is a database object that provides a quick way to look up data in a table. It’s like the index at the back of a book, where you can find specific topics quickly without reading the entire book. In a database, an index allows the system to quickly locate and retrieve the rows that match a query condition.

Without an index, the database will have to perform a **full table scan** to find the matching rows, which can be slow, especially when there’s a large volume of data. Indexes help avoid full table scans by storing a sorted version of the values in certain columns.

### 2. **Types of Indexes:**
- **B-tree indexes (default)**: Most commonly used. B-tree (balanced tree) indexes allow for efficient searching, sorting, and range queries.
- **Unique indexes**: Ensure that the values in the indexed columns are unique.
- **Composite indexes**: Created on multiple columns. Useful when queries often filter on more than one column.
- **Bitmap indexes**: Suitable for columns with a small number of distinct values (e.g., gender).
  
### 3. **Scenario: Employees Table**

Let's assume the following columns in the `employees` table are frequently used in queries:
- `EMP_ID` (likely used for finding a specific employee)
- `EMAIL` (might be queried to find an employee by email)
- `DEPARTMENT_ID` (used for grouping employees by department)

### 4. **When to Use Indexes**
Indexes are helpful when:
- You frequently query or filter rows based on a specific column (e.g., `EMP_ID`, `EMAIL`, `DEPARTMENT_ID`).
- You perform `JOIN` operations using that column.
- You use `ORDER BY` on that column.
- You often use the column in `WHERE` clauses to filter data.

However, indexes aren't free. They come with a cost:
- Indexes take up disk space.
- They can slow down `INSERT`, `UPDATE`, and `DELETE` operations, as the index has to be updated whenever the underlying data changes.

### 5. **How to Create Indexes**

Let’s say we frequently run queries on `FIRST_NAME` with `LAST_NAME`,  `EMAIL`, and `DEPARTMENT_ID` in the `employees` table. We can create indexes on these columns to speed up those queries.

**Example: Creating an Index on `FIRST_NAME` with `LAST_NAME`**

To make queries faster, you can create an index like this:
```sql
CREATE INDEX idx_dept_emp ON employees (FIRST_NAME, LAST_NAME);
```

**Example: Creating an Index on `EMAIL`**

If you're frequently looking up employees by their email addresses:
```sql
CREATE INDEX idx_email ON employees (email);
```

**Example: Composite Index on `DEPARTMENT_ID` and `EMP_ID`**

If you often query based on both `DEPARTMENT_ID` and `EMP_ID`, you can create a composite index:
```sql
CREATE INDEX idx_dept_emp ON employees (department_id, emp_id);

OR

CREATE INDEX idx_dept_emp ON employees (FIRST_NAME, LAST_NAME);
 for `FIRST_NAME` with `LAST_NAME`
```
This index would be particularly useful for queries like:
```sql
SELECT * FROM employees WHERE department_id = 1 AND emp_id = 101;
```

### 6. **Query Performance Improvement**
Let's see how indexing affects a simple query.

Without an index:
```sql
SELECT * FROM employees WHERE emp_id = 101;
```
This will likely trigger a full table scan, meaning the database has to read every row in the table to find the matching `emp_id`.

With an index:
```sql
CREATE INDEX idx_emp_id ON employees (emp_id);
```
Now, when you run the query, the database can quickly find the matching row(s) by consulting the index, improving query performance significantly.

### 7. **How to Measure Index Performance**
You can check the performance of queries with and without an index using `EXPLAIN` in Oracle. This shows the execution plan, including whether the query is using an index.

For example:
```sql
-- index 

CREATE INDEX idx_email ON employees (email);

CREATE INDEX idx_empDeptID ON employees (DEPARTMENT_ID);

--Composite Index

CREATE INDEX idx_dept_emp ON employees (FIRST_NAME, LAST_NAME);




EXPLAIN PLAN FOR
SELECT * FROM EMPLOYEES WHERE DEPARTMENT_ID = 1 ;
SELECT * FROM employees WHERE

EXPLAIN PLAN FOR
SELECT * FROM employees WHERE FIRST_NAME = 'John' AND LAST_NAME ='Doe';
SELECT * FROM table(dbms_xplan.display);


EXPLAIN PLAN FOR
SELECT * FROM employees WHERE email = 'samplemail.com';

SELECT * FROM table(dbms_xplan.display);


```
This will tell you if the database is using an index to optimize the query.

### 8. **Considerations for Indexing**
- **Too many indexes**: While indexes can speed up reads, having too many indexes can slow down writes (`INSERT`, `UPDATE`, `DELETE`), as the database needs to update the indexes as well.
- **Index maintenance**: Indexes should be regularly maintained to avoid fragmentation and ensure optimal performance.

### Summary:
- Indexes can significantly improve the performance of queries that involve filtering, sorting, or joining based on the indexed columns.
- You can create an index on individual columns or composite indexes on multiple columns.
- It's important to monitor performance and only add indexes where they will provide the most benefit, as they also have some overhead during write operations.

Would you like to try creating an index and testing a query performance with `EXPLAIN` to see the difference?
