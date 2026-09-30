
### 1. **What Is a Stored Procedure?**

A **stored procedure** is a block of SQL statements that can be stored in the database and executed as needed. You can think of it as a function in programming languages that you can call whenever you need it. Stored procedures can accept input parameters, return output parameters, or simply execute a block of logic.

Stored procedures help to:
- Reuse logic: You can write a procedure once and execute it multiple times without having to rewrite the code.
- Optimize performance: They are precompiled, meaning they often run faster than executing SQL queries multiple times.
- Encapsulate business logic in one place: Complex operations can be written once and referenced easily.

---

### 2. **Stored Procedure Syntax**

Here’s the basic syntax for creating a stored procedure:

```sql
CREATE OR REPLACE PROCEDURE procedure_name (
    param1 IN data_type,   -- Input parameter
    param2 OUT data_type   -- Output parameter (optional)
) AS
BEGIN
  -- Your SQL logic here
END;
/
```

### 3. **Types of Stored Procedures**

- **With Input Parameters**: You pass values to the procedure, and it processes them.
- **With Output Parameters**: The procedure returns values after processing.
- **With INOUT Parameters**: Parameters that can be both passed into the procedure and updated within it.
- **Without Parameters**: A procedure that simply performs a task without requiring any input.

---

### 4. **Simple Example: Stored Procedure Without Parameters**

Let’s start with a simple stored procedure that lists all employees from the `employees` table.

#### **Step 1: Create the Procedure**

```sql
CREATE OR REPLACE PROCEDURE list_all_employees AS
BEGIN
  -- Output all employees
  FOR emp IN (SELECT emp_id, first_name, last_name, email FROM employees) LOOP
    DBMS_OUTPUT.PUT_LINE('ID: ' || emp.emp_id || ' Name: ' || emp.first_name || ' ' || emp.last_name);
  END LOOP;
END;
/
```

- This procedure doesn’t take any input. It simply loops through the `employees` table and prints the employee ID and name using `DBMS_OUTPUT.PUT_LINE`.

#### **Step 2: Execute the Procedure**

To run the procedure:

```sql
BEGIN
  list_all_employees;
END;
/
```

---

### 5. **Example: Stored Procedure With Input Parameters**

Now, let’s create a procedure that takes an **employee ID** as input and outputs the employee’s information.

#### **Step 1: Create the Procedure**

```sql
CREATE OR REPLACE PROCEDURE get_employee_by_id (
    emp_id_in IN employees.emp_id%TYPE
) AS
BEGIN
  -- Fetch the employee with the given ID
  FOR emp IN (SELECT emp_id, first_name, last_name, email FROM employees WHERE emp_id = emp_id_in) LOOP
    DBMS_OUTPUT.PUT_LINE('ID: ' || emp.emp_id || ', Name: ' || emp.first_name || ' ' || emp.last_name || ', Email: ' || emp.email);
  END LOOP;
END;
/
```

Here, `emp_id_in` is the **input parameter**, which accepts the employee ID to fetch.

#### **Step 2: Execute the Procedure**

To run this procedure and pass in an employee ID:

```sql
BEGIN
  get_employee_by_id(101);  -- Replace 101 with a valid emp_id
END;
/
```

---

### 6. **Example: Stored Procedure With Output Parameters**

Let’s modify the procedure to **return** the employee’s name and email based on the input employee ID.

#### **Step 1: Create the Procedure**

```sql
CREATE OR REPLACE PROCEDURE get_employee_details (
    emp_id_in IN employees.emp_id%TYPE,
    emp_name_out OUT VARCHAR2,
    emp_email_out OUT VARCHAR2
) AS
BEGIN
  -- Fetch the employee details
  SELECT first_name || ' ' || last_name, email
  INTO emp_name_out, emp_email_out
  FROM employees
  WHERE emp_id = emp_id_in;
END;
/
```

- `emp_id_in`: Input parameter (the employee ID).
- `emp_name_out`, `emp_email_out`: Output parameters (name and email of the employee).

#### **Step 2: Execute the Procedure**

To run this procedure and retrieve the output:

```sql
DECLARE
  emp_name VARCHAR2(100);
  emp_email VARCHAR2(100);
BEGIN
  get_employee_details(101, emp_name, emp_email);  -- Replace 101 with a valid emp_id
  DBMS_OUTPUT.PUT_LINE('Name: ' || emp_name || ', Email: ' || emp_email);
END;
/
```

---

### 7. **Example: Stored Procedure With Both Input and Output Parameters**

You can also have procedures that take in parameters, perform calculations or manipulations, and return results. Let’s say we want a procedure that accepts an employee ID and calculates the total salary of that employee from the `salaries` table.

#### **Step 1: Create the Procedure**

```sql
CREATE OR REPLACE PROCEDURE get_total_salary (
    emp_id_in IN salaries.emp_id%TYPE,
    total_salary_out OUT NUMBER
) AS
BEGIN
  -- Calculate the total salary for the given employee
  SELECT SUM(salary_amount)
  INTO total_salary_out
  FROM salaries
  WHERE emp_id = emp_id_in;
END;
/
```

- `emp_id_in`: Input parameter (the employee ID).
- `total_salary_out`: Output parameter (the total salary of the employee).

#### **Step 2: Execute the Procedure**

To run this procedure:

```sql
DECLARE
  total_salary NUMBER;
BEGIN
  get_total_salary(101, total_salary);  -- Replace 101 with a valid emp_id
  DBMS_OUTPUT.PUT_LINE('Total Salary: ' || total_salary);
END;
/
```

---

### 8. **Advanced Example: Stored Procedure With Multiple Tables**

Let’s now create a more advanced example. This procedure takes in an employee ID, checks the department, and returns both employee and department details.

#### **Step 1: Create the Procedure**

```sql
CREATE OR REPLACE PROCEDURE get_employee_and_department (
    emp_id_in IN employees.emp_id%TYPE,
    emp_name_out OUT VARCHAR2,
    dept_name_out OUT VARCHAR2
) AS
BEGIN
  -- Fetch employee name and department name
  SELECT e.first_name || ' ' || e.last_name, d.department_name
  INTO emp_name_out, dept_name_out
  FROM employees e
  JOIN departments d ON e.department_id = d.department_id
  WHERE e.emp_id = emp_id_in;
END;
/
```

- This procedure performs a `JOIN` between the `employees` and `departments` tables and returns both employee and department names.

#### **Step 2: Execute the Procedure**

To test it:

```sql
DECLARE
  emp_name VARCHAR2(100);
  dept_name VARCHAR2(100);
BEGIN
  get_employee_and_department(101, emp_name, dept_name);  -- Replace 101 with a valid emp_id
  DBMS_OUTPUT.PUT_LINE('Employee: ' || emp_name || ', Department: ' || dept_name);
END;
/
```

---

### 9. **Modifying and Dropping Stored Procedures**

- **Modifying**: You can modify a stored procedure by using the same `CREATE OR REPLACE` syntax to overwrite the existing one.
- **Dropping**: To remove a stored procedure from the database, use:

```sql
DROP PROCEDURE procedure_name;
```

---

### 10. **Things to Consider When Using Stored Procedures**

- **Performance**: Stored procedures are compiled and stored in the database, so they often perform better than running raw SQL multiple times.
- **Transaction Control**: You can use `COMMIT`, `ROLLBACK`, and transaction control within stored procedures, but remember that nested transactions are not supported in Oracle.
- **Error Handling**: Use `EXCEPTION` blocks inside procedures to catch and handle errors.
  
  Example of error handling:
  
  ```sql
  BEGIN
    -- your logic
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      DBMS_OUTPUT.PUT_LINE('No data found.');
    WHEN OTHERS THEN
      DBMS_OUTPUT.PUT_LINE('An error occurred.');
  END;
  ```

---

### 11. **Conclusion**

Stored procedures are powerful tools for encapsulating logic, reusing code, and improving database performance. You can pass parameters to customize the behavior, and they’re particularly useful for complex operations that involve multiple tables or queries.
