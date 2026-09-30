## 🔍 What is a **Materialized View**?

A **Materialized View** (MV) is like a **snapshot of a SQL query's result stored physically in the database** (i.e., it takes up space). Unlike a regular `VIEW`, which is just a stored query that fetches fresh data every time we call it, a **materialized view caches the data** and **doesn’t update automatically** unless we refresh it.

### Think of it like:
- 📄 `VIEW` = Live Google Doc (always shows latest)
- 📸 `Materialized View` = Printed PDF snapshot (we print it once and refresh/print again when needed)

---

## 📘 Key Differences: Materialized View vs Normal View

| Feature                | View (Normal)            | Materialized View         |
|------------------------|--------------------------|---------------------------|
| Storage                | No (just query stored)   | Yes (data stored)         |
| Real-time data         | Yes (always current)     | No (must refresh)         |
| Performance            | Slower (always queries)  | Faster (precomputed)      |
| Update frequency       | Real-time                | Manual/On schedule        |
| Use case               | Real-time dashboards     | Expensive aggregates      |

---

## ✅ When to Use Materialized Views

- Expensive joins or aggregations (e.g., heavy reporting queries)
- we don’t need real-time accuracy (a few mins/hours old is fine)
- we want faster read performance (e.g., dashboards)
- Caching periodic reports

---

## ❌ When *Not* to Use

- Data changes rapidly and must always be current
- Storage is a concern
- we can’t tolerate slightly stale data
- Frequent refreshes might offset the performance benefit

---

## 📦 Let’s Do It – Use our Table (`productol`)

### Step 1: Let's seed some more data
```sql
INSERT INTO productol (name, stock, version)
VALUES 
('Samsung S24', 50, 0),
('Google Pixel 8', 80, 0),
('iPhone 15 Pro Max', 40, 0);
COMMIT;
```

---

### Step 2: Create a Materialized View (example use-case: total stock summary)

Let’s say we want to frequently display total stock of all products.

```sql
CREATE MATERIALIZED VIEW product_stock_summary AS
SELECT 
    COUNT(*) AS total_products,
    SUM(stock) AS total_stock
FROM productol;
```

---

### Step 3: Query the MV

```sql
SELECT * FROM product_stock_summary;
```

We’ll get something like:
```
total_products | total_stock
---------------+------------
4              | 270
```

---

### Step 4: Now Add New Product, Then Re-Query (without refresh)

```sql
INSERT INTO productol (name, stock, version)
VALUES ('OnePlus 12', 60, 0);
COMMIT;

SELECT * FROM product_stock_summary;  -- still old data
```

The MV still shows old snapshot unless we **refresh it manually**.

---

### Step 5: Refresh Materialized View

```sql
REFRESH MATERIALIZED VIEW product_stock_summary;
```

Now, query it again and it shows updated data (`total_stock = 330`, `total_products = 5`).

---

## ⚙️ Pro Tip: we Can Index MVs (for even faster reads)

```sql
CREATE INDEX idx_stock_summary ON product_stock_summary(total_stock);
```

---

## 🤖 Wrap-Up

Materialized Views are best when:
- Data doesn’t change super frequently
- we want speed for repeated reads
- we can live with manual or scheduled refreshes

They’re **not good** when we need **real-time accuracy**, frequent changes, or minimal storage use.
