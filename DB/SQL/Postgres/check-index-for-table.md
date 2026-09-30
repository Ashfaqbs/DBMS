  
  CREATE TABLE tempschema.indexed_table (
    id SERIAL PRIMARY KEY,             -- Primary Key (automatically creates an index)
    emp_name VARCHAR(100) NOT NULL,
    department_id INT,
    email VARCHAR(100) UNIQUE,         -- Unique Constraint (automatically creates an index)
    phone_number VARCHAR(15)
    );

-- in PostgreSQL, for both Primary Key and Unique Constraints, the database automatically creates an index to enforce these constraints
-- Additional Index on `department_id`
CREATE INDEX idx_department_id ON tempschema.indexed_table (department_id);

    
CREATE TABLE tempschema.non_indexed_table (
    id SERIAL,
    emp_name VARCHAR(100) NOT NULL,
    department_id INT,
    email VARCHAR(100),
    phone_number VARCHAR(15)
);






SELECT
    t.relname AS table_name,
    i.relname AS index_name,
    a.attname AS column_name
FROM
    pg_class t
JOIN
    pg_index ix ON t.oid = ix.indrelid
JOIN
    pg_class i ON ix.indexrelid = i.oid
JOIN
    pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE
    t.relkind = 'r'  -- Only tables
    AND t.relnamespace = 'tempschema'::regnamespace  -- Schema filter
    AND t.relname = 'non_indexed_table';  -- Table filter




No output for non_indexed_table as no indexs are present 

For indexed_table Output :

table_name   |index_name             |column_name  |
-------------+-----------------------+-------------+
indexed_table|indexed_table_pkey     |id           |
indexed_table|indexed_table_email_key|email        |
indexed_table|idx_department_id      |department_id|
