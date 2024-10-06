- Creating tables and adding data :

```

CREATE TABLE departments (
    department_id NUMBER PRIMARY KEY,
    department_name VARCHAR2(100) NOT NULL
);

CREATE TABLE projects (
    project_id NUMBER PRIMARY KEY,
    project_name VARCHAR2(100) NOT NULL,
    department_id NUMBER REFERENCES departments(department_id)
);
CREATE TABLE salaries (
    emp_id NUMBER REFERENCES employees(emp_id),
    salary NUMBER NOT NULL,
    effective_date DATE NOT NULL,
    PRIMARY KEY (emp_id, effective_date)
);

-- data 

CREATE TABLE departments (
    department_id NUMBER PRIMARY KEY,
    department_name VARCHAR2(50)
);

CREATE TABLE employees (
    emp_id NUMBER PRIMARY KEY,
    first_name VARCHAR2(50),
    last_name VARCHAR2(50),
    email VARCHAR2(100),
    hire_date DATE,
    department_id NUMBER,
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);

CREATE TABLE salaries (
    salary_id NUMBER PRIMARY KEY,
    emp_id NUMBER,
    salary_amount NUMBER(10, 2),
    salary_date DATE,
    FOREIGN KEY (emp_id) REFERENCES employees(emp_id)
);

INSERT INTO departments (department_id, department_name) VALUES (1, 'HR');
INSERT INTO departments (department_id, department_name) VALUES (2, 'Engineering');
INSERT INTO departments (department_id, department_name) VALUES (3, 'Finance');
INSERT INTO departments (department_id, department_name) VALUES (4, 'Marketing');


INSERT INTO employees (emp_id, first_name, last_name, email, hire_date, department_id) 
VALUES (1, 'John', 'Doe', 'john.doe@example.com', SYSDATE, 1);

INSERT INTO employees (emp_id, first_name, last_name, email, hire_date, department_id) 
VALUES (2, 'Jane', 'Doe', 'jane.doe@example.com', SYSDATE, 2);

INSERT INTO employees (emp_id, first_name, last_name, email, hire_date, department_id) 
VALUES (3, 'Alice', 'Smith', 'alice.smith@example.com', SYSDATE, 3);

INSERT INTO employees (emp_id, first_name, last_name, email, hire_date, department_id) 
VALUES (4, 'Bob', 'Johnson', 'bob.johnson@example.com', SYSDATE, 4);



INSERT INTO salaries (salary_id, emp_id, salary_amount, salary_date)
VALUES (1, 1, 50000, SYSDATE);

INSERT INTO salaries (salary_id, emp_id, salary_amount, salary_date)
VALUES (2, 2, 60000, SYSDATE);

INSERT INTO salaries (salary_id, emp_id, salary_amount, salary_date)
VALUES (3, 3, 55000, SYSDATE);

INSERT INTO salaries (salary_id, emp_id, salary_amount, salary_date)
VALUES (4, 4, 45000, SYSDATE);

COMMIT;


```





## QRY to get the oracle version:

```sql
SELECT * FROM v$version;
```

This will return information about your Oracle version, including the Oracle Database version and any patches applied.

Alternatively, if you're specifically looking for the Oracle database version:

```sql
SELECT banner FROM v$version WHERE banner LIKE 'Oracle%';
```

This will give you the version details in a more concise manner.

Result :

![image](https://github.com/user-attachments/assets/35f7ab39-c1d2-4ad0-b9a2-88aeb9e7076d)


### 1. Joins
#### What:
Joins are used to combine rows from two or more tables based on a related column.

#### Why:
Joins allow you to retrieve data from multiple tables in a single query, enabling complex queries that provide more comprehensive insights.

#### Types:

- **INNER JOIN**: Returns only the rows that have matching values in both tables.
- **LEFT JOIN (or LEFT OUTER JOIN)**: Returns all rows from the left table and the matched rows from the right table. If no match is found, NULL values are returned for columns from the right table.
- **RIGHT JOIN (or RIGHT OUTER JOIN)**: Returns all rows from the right table and the matched rows from the left table. If no match is found, NULL values are returned for columns from the left table.
- **FULL OUTER JOIN**: Returns all rows when there is a match in either left or right table records.

#### Syntax:
```sql
SELECT columns
FROM table1
INNER JOIN table2 ON table1.common_column = table2.common_column;
```

#### Example:
```sql
SELECT e.first_name, e.last_name, d.department_name
FROM employees e
INNER JOIN departments d ON e.department_id = d.department_id;




SELECT e.first_name, e.last_name, d.department_name
FROM employees e
INNER JOIN departments d
ON e.department_id = d.department_id;


SELECT e.first_name, e.last_name, d.department_name
FROM employees e
LEFT JOIN departments d
ON e.department_id = d.department_id;



SELECT e.first_name, e.last_name, d.department_name
FROM employees e
RIGHT JOIN departments d
ON e.department_id = d.department_id;


SELECT e.first_name, e.last_name, d.department_name
FROM employees e
FULL OUTER JOIN departments d
ON e.department_id = d.department_id;


```

### 2. Aggregate Functions

#### What:
Aggregate functions perform calculations on a set of values and return a single value.

#### Why:
They are useful for summarizing data, such as finding averages, counts, or totals.

#### Common Functions:
- **COUNT()**: Returns the number of rows that match a specified criterion.
- **SUM()**: Returns the total sum of a numeric column.
- **AVG()**: Returns the average value of a numeric column.
- **MIN()**: Returns the smallest value in a set.
- **MAX()**: Returns the largest value in a set.

#### Syntax:
```sql
SELECT aggregate_function(column)
FROM table
WHERE condition;
```

#### Example:
```sql
SELECT COUNT(*) AS employee_count
FROM employees;
```

### 3. GROUP BY

#### What:
The GROUP BY statement is used to arrange identical data into groups.

#### Why:
It is often used in conjunction with aggregate functions to perform calculations on each group of data.

#### Syntax:
```sql
SELECT column1, aggregate_function(column2)
FROM table
GROUP BY column1;
```

#### Example:
```sql
SELECT department_id, COUNT(*) AS employee_count
FROM employees
GROUP BY department_id;




SELECT department_id, COUNT(emp_id) AS employee_count
FROM springbootdev.employees
GROUP BY department_id;



SELECT e.department_id, SUM(s.salary_amount) AS total_salary
FROM springbootdev.employees e
JOIN springbootdev.salaries s ON e.emp_id = s.emp_id
GROUP BY e.department_id;


SELECT e.department_id, AVG(s.salary_amount) AS average_salary
FROM springbootdev.employees e
JOIN springbootdev.salaries s ON e.emp_id = s.emp_id
GROUP BY e.department_id;


SELECT e.department_id, MIN(s.salary_amount) AS min_salary
FROM springbootdev.employees e
JOIN springbootdev.salaries s ON e.emp_id = s.emp_id
GROUP BY e.department_id;

SELECT e.department_id, MAX(s.salary_amount) AS max_salary
FROM springbootdev.employees e
JOIN springbootdev.salaries s ON e.emp_id = s.emp_id
GROUP BY e.department_id;





SELECT e.department_id, d.department_name, SUM(s.salary_amount) AS total_salary
FROM springbootdev.employees e
JOIN springbootdev.salaries s ON e.emp_id = s.emp_id
JOIN springbootdev.departments d ON e.department_id = d.department_id
GROUP BY e.department_id, d.department_name;




```

### 4. Indexes
#### What:
Indexes are database objects that improve the speed of data retrieval operations on a database table.

#### Why:
They are particularly useful for speeding up queries that search for specific rows, especially in large tables.

#### Considerations:
- Indexes require additional space and can slow down write operations (INSERT, UPDATE, DELETE).
- Choosing the right columns for indexing is critical.

#### Syntax:
```sql
CREATE INDEX index_name
ON table_name(column_name);
```

#### Example:
```sql
CREATE INDEX idx_employee_email
ON employees(email);

-- index 

CREATE INDEX idx_email ON employees (email);

CREATE INDEX idx_empDeptID ON employees (DEPARTMENT_ID);

--Composite Index

CREATE INDEX idx_dept_emp ON employees (FIRST_NAME, LAST_NAME);


EXPLAIN PLAN FOR
SELECT * FROM EMPLOYEES WHERE DEPARTMENT_ID = 1 ;
SELECT * FROM table(dbms_xplan.display);


EXPLAIN PLAN FOR
SELECT * FROM employees WHERE FIRST_NAME = 'John' AND LAST_NAME ='Doe';
SELECT * FROM table(dbms_xplan.display);


EXPLAIN PLAN FOR
SELECT * FROM employees WHERE emp_id = 1;
SELECT * FROM table(dbms_xplan.display);

```

### 5. Functions
#### What:
Functions are predefined operations that can perform calculations or transformations on data.

#### Why:
They simplify complex calculations and can be reused throughout SQL queries.

#### Common Functions:
- **UPPER()**: Converts a string to uppercase.
- **LOWER()**: Converts a string to lowercase.
- **TRIM()**: Removes specified prefixes or suffixes from a string.
- **SUBSTR()**: Returns a substring from a string.

#### Syntax:
```sql
SELECT function_name(column)
FROM table;
```

#### Example:
```sql
SELECT UPPER(first_name) AS upper_name
FROM employees;

CREATE OR REPLACE FUNCTION get_full_name (
    p_first_name VARCHAR2,
    p_last_name VARCHAR2
)
RETURN VARCHAR2
IS
  v_full_name VARCHAR2(100); -- Declare a variable to store the result
BEGIN
  v_full_name := p_first_name || ' ' || p_last_name; -- Concatenate the first and last name
  RETURN v_full_name; -- Return the concatenated result
END get_full_name;


SELECT emp_id, get_full_name(first_name, last_name) AS full_name
FROM employees;


CREATE OR REPLACE FUNCTION calculate_annual_salary (
    p_monthly_salary NUMBER
)
RETURN NUMBER
IS
  v_annual_salary NUMBER;
BEGIN
  v_annual_salary := p_monthly_salary * 12; -- Multiply monthly salary by 12
  RETURN v_annual_salary;
END calculate_annual_salary;

SELECT emp_id, salary_amount, calculate_annual_salary(salary_amount) AS annual_salary
FROM salaries;



SELECT e.emp_id, get_full_name(e.first_name, e.last_name) AS full_name ,
s.SALARY_AMOUNT AS montly_salary , calculate_annual_salary(s.salary_amount) AS annual_salary
FROM EMPLOYEES e 
JOIN salaries s ON e.emp_id = s.emp_id;
SELECT * FROM  SALARIES s ;
SELECT * FROM EMPLOYEES e ;


CREATE OR REPLACE FUNCTION calculate_bonus (
    p_salary NUMBER,
    p_department_id NUMBER
)
RETURN NUMBER
IS
  v_bonus NUMBER;
BEGIN
  -- Conditional logic for calculating bonus
  IF p_salary > 5000 THEN
    v_bonus := p_salary * 0.20; -- 20% bonus for high salaries
  ELSE
    v_bonus := p_salary * 0.10; -- 10% bonus for lower salaries
  END IF;
  
  -- Further conditions based on department
  IF p_department_id = 1 THEN
    v_bonus := v_bonus + 1000; -- Extra bonus for department 1
  END IF;
  
  RETURN v_bonus;
END calculate_bonus;

SELECT e.emp_id, get_full_name(e.first_name, e.last_name) AS full_name ,
s.SALARY_AMOUNT AS montly_salary , calculate_bonus(s.salary_amount,E.DEPARTMENT_ID) AS BONUS
FROM EMPLOYEES e 
JOIN salaries s ON e.emp_id = s.emp_id;


```

### 6. Views
#### What:
A view is a virtual table based on the result set of a SELECT query.

#### Why:
Views simplify complex queries, provide an additional layer of security by restricting access to specific data, and can present data in a specific format.

#### Syntax:
```sql
CREATE VIEW view_name AS
SELECT columns
FROM table
WHERE condition;
```

#### Example:
```sql
CREATE VIEW employee_basic_info AS
SELECT emp_id, first_name, email
FROM employees;



modifying the existing view 

--CREATE VIEW employee_basic_info AS
--SELECT emp_id, first_name, email
--FROM employees; to add hire_date

CREATE OR REPLACE VIEW employee_basic_info AS
SELECT emp_id, first_name, email, hire_date
FROM employees;

-- verify 

SELECT * FROM employee_basic_info;


-- Deleting a view 
DROP VIEW employee_basic_info;


```

### 7. Stored Procedures
#### What:
Stored procedures are precompiled collections of SQL statements that can be executed as a single unit.

#### Why:
They promote code reusability, improve performance, and enhance security.

#### Syntax:
```sql
CREATE PROCEDURE procedure_name AS
BEGIN
   -- SQL statements
END;
```

#### Example:
```sql
CREATE PROCEDURE GetEmployeeCount AS
BEGIN
   SELECT COUNT(*) FROM employees;
END;




CREATE OR REPLACE PROCEDURE list_all_employees AS
BEGIN
  -- Output all employees
  FOR emp IN (SELECT emp_id, first_name, last_name, email FROM employees) LOOP
    DBMS_OUTPUT.PUT_LINE('ID: ' || emp.emp_id || ' Name: ' || emp.first_name || ' ' || emp.last_name);
  END LOOP;
END;
--- verify
BEGIN
  list_all_employees;
END;



CREATE OR REPLACE PROCEDURE get_employee_by_id (
    emp_id_in IN employees.emp_id%TYPE
) AS
BEGIN
  -- Fetch the employee with the given ID
  FOR emp IN (SELECT emp_id, first_name, last_name, email FROM employees WHERE emp_id = emp_id_in) LOOP
    DBMS_OUTPUT.PUT_LINE('ID: ' || emp.emp_id || ', Name: ' || emp.first_name || ' ' || emp.last_name || ', Email: ' || emp.email);
  END LOOP;
END;


BEGIN
  get_employee_by_id(111);  -- Replace 101 with a valid emp_id
END;



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

-- verify 
DECLARE
  emp_name VARCHAR2(100);
  emp_email VARCHAR2(100);
BEGIN
  get_employee_details(111, emp_name, emp_email);  -- Replace 101 with a valid emp_id
  DBMS_OUTPUT.PUT_LINE('Name: ' || emp_name || ', Email: ' || emp_email);
END;




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



DECLARE
  total_salary NUMBER;
BEGIN
  get_total_salary(111, total_salary);  -- Replace 101 with a valid emp_id
  DBMS_OUTPUT.PUT_LINE('Total Salary: ' || total_salary);
END;



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



DECLARE
  emp_name VARCHAR2(100);
  dept_name VARCHAR2(100);
BEGIN
  get_employee_and_department(8, emp_name, dept_name);  -- Replace 101 with a valid emp_id
  DBMS_OUTPUT.PUT_LINE('Employee: ' || emp_name || ', Department: ' || dept_name);
END;

```

### 8. Triggers
#### What:
Triggers are special types of stored procedures that automatically execute in response to certain events on a particular table or view.

#### Why:
They are used for enforcing business rules, maintaining data integrity, and automatically updating related tables.

#### Syntax:
```sql
CREATE TRIGGER trigger_name
BEFORE/AFTER INSERT/UPDATE/DELETE ON table_name
FOR EACH ROW
BEGIN
   -- SQL statements
END;
```

#### Example:
```sql
--ONLY works WHEN inserting, updating ,DELETE  

CREATE TRIGGER before_employee_insert
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
   -- Logic before inserting a new employee
END;




--ok WHEN adding DATA IN emp TABLE we have TO make use the email stays IN lowercase 

CREATE OR REPLACE TRIGGER before_insert_employee_email
BEFORE INSERT ON employees
FOR EACH ROW
BEGIN
  :NEW.email := LOWER(:NEW.email); -- Ensure the email is in lowercase before inserting
END;

SELECT * FROM employees;

INSERT INTO employees (emp_id, first_name, last_name, email, hire_date,DEPARTMENT_ID)
VALUES (111, 'Sonu', 'Khan', 'SONU.KHAN@EXAMPLE.COM', SYSDATE,1);

COMMIT ;
SELECT emp_id, first_name, last_name, email FROM employees WHERE emp_id = 111;
--o/p
--111	Sonu	Khan	sonu.khan@example.com


--AFTER INSERT Trigger for Audit Trail

CREATE TABLE employee_audit (
    audit_id NUMBER GENERATED BY DEFAULT AS IDENTITY,
    emp_id NUMBER,
    email VARCHAR2(50),
    action VARCHAR2(50),
    action_time TIMESTAMP
);

SELECT * FROM employee_audit;

CREATE OR REPLACE TRIGGER after_insert_employee_audit
AFTER INSERT ON employees
FOR EACH ROW
BEGIN
  INSERT INTO employee_audit (emp_id, EMAIL,action, action_time)
  VALUES (:NEW.emp_id, :NEW.email ,'INSERT', SYSTIMESTAMP); -- Log the insert action
END;

--AUDIT_ID	EMP_ID	EMAIL	"ACTION"	ACTION_TIME columns name

INSERT INTO employees (emp_id, first_name, last_name, email, hire_date,DEPARTMENT_ID)
VALUES (112, 'Jon', 'Jones', 'JON.smith@example.com', SYSDATE,1);
COMMIT;
SELECT * FROM employees;

SELECT * FROM employee_audit;



```



### 8 . String manipulation 

```
SELECT UPPER(first_name) AS upper_first_name,
       LOWER(last_name) AS lower_last_name
FROM employees;


SELECT INITCAP(first_name) AS formatted_first_name
FROM employees;

SELECT CONCAT(first_name,last_name) AS full_name
FROM employees;


SELECT first_name || ' ' || last_name AS full_name
FROM employees;


SELECT SUBSTR(first_name, 1, 3) AS name_abbreviation
FROM employees;

SELECT LENGTH(email) AS email_length
FROM employees;


SELECT INSTR(email, '@') AS at_symbol_position
FROM employees;

```




