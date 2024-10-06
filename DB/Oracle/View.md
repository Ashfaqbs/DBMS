Let's dive into **Views** in a database, understand their purpose, and see how to work with them using your `employees`, `departments`, and other tables.

### What is a View?
A **View** in a database is essentially a **virtual table** that is based on the result of a SQL query. It doesn't store data itself, but rather it pulls data from one or more tables dynamically. You can think of a view as a stored query that you can interact with like a table.

### Why Use Views?
There are several reasons to use views:
1. **Simplification**: Views can simplify complex queries by encapsulating them, making it easier to write and maintain queries.
2. **Security**: Views can be used to restrict access to specific columns or rows in a table. Users can be granted access to a view instead of the base table, and they will only see the data the view provides.
3. **Reusability**: You can reuse the same query logic across different parts of your application by creating a view.
4. **Data Abstraction**: Views provide a way to abstract underlying table structures. If the table structure changes, you can update the view instead of updating every query.
5. **Joins Across Tables**: Views allow you to easily join multiple tables and present the combined data as a single table.

### How to Create a View
The syntax for creating a view is straightforward. It uses a SELECT query to define what data should be included in the view.

#### Syntax:
```sql
CREATE VIEW view_name AS
SELECT column1, column2, ...
FROM table_name
WHERE condition;
```

### Simple Example Using the `employees` Table
Let’s say you want a view that only shows `emp_id`, `first_name`, and `email` from the `employees` table.

```sql
CREATE VIEW employee_basic_info AS
SELECT emp_id, first_name, email
FROM employees;
```

Now, whenever you query `employee_basic_info`, it will return the data from the `employees` table:

```sql
SELECT * FROM employee_basic_info;
```

### Example of a View Joining Multiple Tables
Let's create a view that joins data from both the `employees` and `departments` tables, to show each employee's name and their corresponding department name.

#### Query for Joining the Tables:
```sql
CREATE VIEW employee_department_info AS
SELECT e.emp_id, e.first_name, e.last_name, d.department_name
FROM employees e
JOIN departments d ON e.department_id = d.department_id;
```

In this example:
- We're pulling the employee details (`emp_id`, `first_name`, `last_name`) from the `employees` table.
- We're also retrieving the `department_name` from the `departments` table using a **JOIN** on the `department_id`.

You can now query this view just like a table:

```sql
SELECT * FROM employee_department_info;
```

### Things to Consider When Working with Views:
1. **Performance**: Since views are just stored queries, complex views (especially those with multiple joins or large datasets) can slow down query performance.
2. **Updating Data**: Some views are **read-only** depending on how they are created. Views that include multiple tables or aggregate functions (like `SUM`, `AVG`, etc.) are often not updatable, meaning you can't perform `INSERT`, `UPDATE`, or `DELETE` operations on them. However, simple views based on a single table without aggregates are often updatable.
3. **Materialized Views**: A **materialized view** is a special type of view that stores the data physically (unlike a regular view). It is useful when you need fast access to precomputed data, but the data in a materialized view can become stale and may need to be refreshed.

### Summary:
- **View**: A virtual table based on the result of a query.
- **Why**: Simplifies queries, enhances security, enables data abstraction, and allows reusability.
- **When to Use**: When you need to reuse complex queries, hide data from users, or simplify database interactions.
- **Considerations**: Be cautious about performance and whether the view is updatable.

- Error : 
The error `ORA-01031: insufficient privileges` occurs when the user trying to create the view does not have the necessary privileges.

To create a view, the user needs the `CREATE VIEW` privilege on the schema or the database.

Since you're using the `ashu` or `springbootdev` user to create this view, and it seems that these users don't have sufficient privileges, you need to grant the required privilege.

### Solution:
1. **Connect as a privileged user** (like SYSDBA or any user with administrative rights).
2. **Grant the `CREATE VIEW` privilege** to the user (for example, `ashu` or `springbootdev`).

Here’s how you can grant the necessary privileges:

```sql
-- Connect as SYSDBA or a user with administrative rights
GRANT CREATE VIEW TO ashu;  -- or replace 'ashu' with 'springbootdev' if needed
```

Once the privilege is granted, you can try creating the view again:

```sql
CREATE VIEW employee_basic_info AS
SELECT emp_id, first_name, email
FROM employees;
```

### Steps:
1. **Switch to SYSDBA**:
   - Connect as SYSDBA (`sqlplus / as sysdba` if you're on the command line, or use any tool like SQL Developer).
   
2. **Grant Privilege**:
   - Run the `GRANT CREATE VIEW` command to give `ashu` (or `springbootdev`) the required permissions.

3. **Switch back to the user** (e.g., `ashu` or `springbootdev`) and run the `CREATE VIEW` query again.

### Verifying the View:
Once the view is created successfully, you can verify it by querying it:

```sql
SELECT * FROM employee_basic_info;
```


let’s move on to intermediate or more advanced examples of views. We'll create views that join multiple tables and perform more complex queries using the tables you have (`employees`, `departments`, and `salaries`). We can also incorporate aggregations, joins, and filtering.

### 1. **View with Join Between Two Tables (Employees and Departments)**

In this view, we’ll create a view that joins the `employees` and `departments` tables, showing the department name for each employee.

#### Syntax:
```sql
CREATE VIEW employee_department_info AS
SELECT e.emp_id, e.first_name, e.last_name, e.email, d.department_name
FROM employees e
JOIN departments d ON e.department_id = d.department_id;
```

#### Why use this view?
- This view makes it easy to access information about employees and their departments, without needing to write the join every time. It simplifies queries for users who need this data.

#### Query the View:
```sql
SELECT * FROM employee_department_info;
```

### 2. **View with Aggregation (Average Salary per Department)**

This view will calculate the average salary for each department using the `salaries` and `departments` tables.

#### Syntax:
```sql
CREATE VIEW department_salary_summary AS
SELECT d.department_id, d.department_name, AVG(s.salary_amount) AS avg_salary
FROM departments d
JOIN employees e ON d.department_id = e.department_id
JOIN salaries s ON e.emp_id = s.emp_id
GROUP BY d.department_id, d.department_name;
```

#### Why use this view?
- This view simplifies the process of retrieving department salary statistics. You can quickly check the average salary per department without repeatedly writing the aggregation logic.

#### Query the View:
```sql
SELECT * FROM department_salary_summary;
```

### 3. **View with a Filter (Employees with Salaries Above a Certain Amount)**

This view will display employees who earn a salary above a certain threshold (say, 50,000).

#### Syntax:
```sql
CREATE VIEW high_earning_employees AS
SELECT e.emp_id, e.first_name, e.last_name, s.salary_amount
FROM employees e
JOIN salaries s ON e.emp_id = s.emp_id
WHERE s.salary_amount > 50000;
```

#### Why use this view?
- This is useful for HR or management who need to frequently query a subset of employees based on salary, without having to specify the filter in each query.

#### Query the View:
```sql
SELECT * FROM high_earning_employees;
```

### 4. **View with More Complex Filtering (Employees Hired After a Certain Date)**

Let’s say you want to view employees who were hired after January 1, 2020. We can filter by the hire date.

#### Syntax:
```sql
CREATE VIEW recent_hires AS
SELECT e.emp_id, e.first_name, e.last_name, e.hire_date
FROM employees e
WHERE e.hire_date > TO_DATE('2020-01-01', 'YYYY-MM-DD');
```

#### Why use this view?
- It allows users to quickly check recent hires and can be useful for reporting purposes.

#### Query the View:
```sql
SELECT * FROM recent_hires;
```

### 5. **View Combining Multiple Criteria (High-Earning, Recently Hired Employees)**

Now we can combine the two filters (salary and hire date) into one view.

#### Syntax:
```sql
CREATE VIEW high_earning_recent_hires AS
SELECT e.emp_id, e.first_name, e.last_name, s.salary_amount, e.hire_date
FROM employees e
JOIN salaries s ON e.emp_id = s.emp_id
WHERE s.salary_amount > 50000
  AND e.hire_date > TO_DATE('2020-01-01', 'YYYY-MM-DD');
```

#### Why use this view?
- This view is useful when you need to report on both high-earning and recently hired employees, allowing you to apply both filters without manually typing them each time.

#### Query the View:
```sql
SELECT * FROM high_earning_recent_hires;
```

### Things to Consider When Working with Views:
1. **Performance**: Views that include complex joins or aggregations can be slow, especially with large datasets. In such cases, using materialized views (which store the result of the query physically) might help improve performance.
2. **Security**: Views can be used to hide sensitive columns or to simplify access control by giving users access to a subset of data.
3. **Updatability**: In Oracle, views can be updatable, but there are restrictions, especially for views with joins, groupings, or aggregations.

---


### 1. **Modifying an Existing View**
In Oracle, if you need to modify an existing view (change its query), you can use the `CREATE OR REPLACE VIEW` statement. This allows you to redefine the view without having to first drop it.

#### Syntax:
```sql
CREATE OR REPLACE VIEW view_name AS
SELECT columns
FROM table
WHERE conditions;
```

#### Example:
Let’s say we want to modify the `employee_basic_info` view to include the `hire_date` column. You can use the following query:

```sql
CREATE OR REPLACE VIEW employee_basic_info AS
SELECT emp_id, first_name, email, hire_date
FROM employees;
```

#### Important Note:
- When you modify a view with `CREATE OR REPLACE`, Oracle automatically updates the view's definition but keeps its dependent objects intact (e.g., any stored procedures or other views that reference the modified view).
- If the view is complex and referenced by many other objects, be cautious, as changes might affect the dependent objects.

### 2. **Dropping (Removing) a View**
If you no longer need a view, you can remove it with the `DROP VIEW` statement.

#### Syntax:
```sql
DROP VIEW view_name;
```

#### Example:
To remove the `employee_basic_info` view:

```sql
DROP VIEW employee_basic_info;
```

#### Things to Consider:
- Dropping a view only removes the view, not the underlying data in the tables that the view references.
- If you drop a view that other objects (e.g., stored procedures, triggers, or other views) depend on, it might cause errors in those objects if they try to reference the dropped view.

---

### Quick Recap:

- **Modify a View**: Use `CREATE OR REPLACE VIEW` to modify an existing view.
- **Remove a View**: Use `DROP VIEW` to remove a view when it’s no longer needed.

