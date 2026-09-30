- let's dive straight into : **Good Design Principles** focusing on:

1. **Normalization** (splitting data properly)
2. **Naming Conventions**
3. **Indexes** (basic introduction)

we are in the `public` schema of `mainDB`, we’ll work directly in there and build on these principles.

---

### **1. Normalization (Splitting Data Properly)**

**What is Normalization?**  
- **Normalization** is the process of organizing data to avoid redundancy and ensure integrity. It breaks down complex tables into smaller, related tables.  
- The goal is to eliminate **duplicate data**, improve **data integrity**, and make querying efficient.

**Normal Forms**  
- **1NF (First Normal Form)**: Remove repeating groups (ensure each column contains only atomic values).  
- **2NF (Second Normal Form)**: Achieved by removing partial dependencies (i.e., non-key attributes depend on the primary key).  
- **3NF (Third Normal Form)**: Remove transitive dependencies (i.e., non-key attributes should not depend on other non-key attributes).

**Real-Life Scenario:**  
Let’s say We're designing a **student** and **course registration** system. We want to store students, courses, and their registration details in an efficient way.

Here’s an example before and after **Normalization**.

#### **Before Normalization (1NF)**  
we might have a table like this:

| Student_ID | Name     | Courses                   |
|------------|----------|---------------------------|
| 1          | Alice    | Math, Science             |
| 2          | Bob      | English, History, Math     |

**Issues**:
- The **Courses** column violates 1NF because it holds multiple values.
- If we wanted to add or update courses, it would be difficult.

#### **After Normalization (3NF)**  
We break it down into three tables:  
1. **Students**  
2. **Courses**  
3. **Student_Courses** (Many-to-Many relationship)

**Students Table**:

| Student_ID | Name     |
|------------|----------|
| 1          | Alice    |
| 2          | Bob      |

**Courses Table**:

| Course_ID  | Course_Name |
|------------|-------------|
| 101        | Math        |
| 102        | Science     |
| 103        | English     |

**Student_Courses Table**:

| Student_ID | Course_ID |
|------------|-----------|
| 1          | 101       |
| 1          | 102       |
| 2          | 103       |
| 2          | 101       |

Now the data is organized, and we can easily query which courses each student is enrolled in.

---

### **2. Naming Conventions**

**Why Naming Conventions Matter**  
- **Consistency**: Helps we and our team understand and navigate the database structure easily.
- **Clarity**: Makes sure that each table, column, and constraint has a clear purpose.
- **Maintainability**: Reduces confusion as our system grows.

**Table and Column Naming Guidelines:**

- **Tables**: Always use **plural** form (e.g., `students`, `courses`) because they hold multiple rows.
- **Columns**: Use **clear, descriptive names**. E.g., `student_id` instead of just `id`.
- **Constraints**: Name constraints meaningfully (e.g., `pk_students`, `fk_student_courses`).
- **Foreign Keys**: Follow the convention `table_name_id` (e.g., `student_id`, `course_id`).
- **Avoid Abbreviations**: Unless commonly accepted (e.g., `id`, `url`, `email`).

---

### **3. Indexes (Basic Recap for Optimization)**

Since we know about indexes, let’s quickly highlight the importance of them in good database design:

- **Indexing** speeds up read queries but can slow down writes.
- **Primary Indexes** are automatically created on Primary Keys and Unique columns.
- **Composite Indexes** (on multiple columns) are useful for complex queries that filter on multiple fields.
  
**Real-Life Scenario**:  
Consider a **Books Table** where we frequently search by `author` and `publish_date`.

we could create an index like this:

```sql
CREATE INDEX idx_books_author_publish_date ON books(author, publish_date);
```

This index helps speed up queries that filter by both `author` and `publish_date`.

---

### **Putting it All Together in `public` Schema**

Let’s create the necessary tables that reflect these design principles for a **Student-Course System**:

#### **Tables Creation (After Normalization)**

```sql
-- Creating the 'students' table
CREATE TABLE public.students (
    student_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- Creating the 'courses' table
CREATE TABLE public.courses (
    course_id SERIAL PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL
);

-- Creating the 'student_courses' (relationship) table
CREATE TABLE public.student_courses (
    student_id INT REFERENCES public.students(student_id),
    course_id INT REFERENCES public.courses(course_id),
    PRIMARY KEY (student_id, course_id)
);

-- Index for fast lookup in 'student_courses'
CREATE INDEX idx_student_courses ON public.student_courses(student_id, course_id);
```

---

### Summary

- **Normalization** ensures our data is split efficiently and avoids redundancy.
- **Naming conventions** keep our schema clean, consistent, and easy to navigate.
- **Indexes** improve query performance, especially for large tables with frequent lookups.

---



### **Next Steps:** Let’s add some data and run a few queries to demonstrate how our **normalized schema** works in action. This will also show how **indexes** can speed up queries.

---

### **Step 1: Insert Sample Data**

We will add data into the three tables we created:  
1. **students**
2. **courses**
3. **student_courses** (the relationship table)

```sql
-- Inserting data into 'students' table
INSERT INTO public.students (name) 
VALUES
('Alice'),
('Bob'),
('Charlie');

-- Inserting data into 'courses' table
INSERT INTO public.courses (course_name) 
VALUES
('Math'),
('Science'),
('English'),
('History');

-- Inserting data into 'student_courses' table (Relationship)
INSERT INTO public.student_courses (student_id, course_id)
VALUES
(1, 1),  -- Alice enrolled in Math
(1, 2),  -- Alice enrolled in Science
(2, 3),  -- Bob enrolled in English
(2, 1),  -- Bob enrolled in Math
(3, 2);  -- Charlie enrolled in Science
```

- Note add actual id's for `student_id` and `course_id`.

### **Step 2: Sample Queries**

Let’s run some queries based on the **normalized schema** and see how they perform.

#### **Query 1: Get All Students and Their Courses**  
This will join the three tables (`students`, `student_courses`, `courses`) to get the list of all students and the courses they are enrolled in.

```sql
SELECT s.name AS student_name, c.course_name
FROM public.students s
JOIN public.student_courses sc ON s.student_id = sc.student_id
JOIN public.courses c ON sc.course_id = c.course_id;
```

**Expected Result:**

| student_name | course_name |
|--------------|-------------|
| Alice        | Math        |
| Alice        | Science     |
| Bob          | English     |
| Bob          | Math        |
| Charlie      | Science     |

---

#### **Query 2: Get All Courses a Specific Student is Enrolled In (e.g., Alice)**  
We’ll use the `student_id` to fetch all courses for Alice (student with `student_id = 1`).

```sql
SELECT c.course_name
FROM public.courses c
JOIN public.student_courses sc ON c.course_id = sc.course_id
WHERE sc.student_id = 1;
```

**Expected Result:**

| course_name |
|-------------|
| Math        |
| Science     |

---

#### **Query 3: Get All Students Enrolled in a Specific Course (e.g., Math)**  
This query will list all students enrolled in a specific course, like **Math** (course `course_id = 1`).

```sql
SELECT s.name AS student_name
FROM public.students s
JOIN public.student_courses sc ON s.student_id = sc.student_id
WHERE sc.course_id = 1;
```

**Expected Result:**

| student_name |
|--------------|
| Alice        |
| Bob          |

---

#### **Query 4: Check if Index Helps**  
Let’s test the **index** we created on the `student_courses` table.

Run a **simple query** to search for students enrolled in **Math** (`course_id = 1`) and see the execution time with and without an index.

Without Index (just a regular join):
```sql
EXPLAIN ANALYZE
SELECT s.name AS student_name
FROM public.students s
JOIN public.student_courses sc ON s.student_id = sc.student_id
WHERE sc.course_id = 1;
```

With Index:
```sql
EXPLAIN ANALYZE
SELECT s.name AS student_name
FROM public.students s
JOIN public.student_courses sc ON s.student_id = sc.student_id
WHERE sc.course_id = 1;
```

we should notice that **EXPLAIN ANALYZE** shows a faster query execution with the index, especially when there are many rows in the `student_courses` table.

---

### **Step 3: Result Analysis**

- **Normalization**: The data is now split logically into smaller tables (students, courses, and relationships).
- **Indexes**: They help make queries faster, especially when filtering or joining large datasets.
- **Queries**: We can now get data in a clean, optimized manner. The relationships between tables are easily navigable, and the queries are more efficient due to indexes.

---


