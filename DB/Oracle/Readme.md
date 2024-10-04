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
