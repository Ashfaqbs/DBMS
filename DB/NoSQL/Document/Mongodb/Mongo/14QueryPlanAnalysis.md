We can perform **Query Plan Analysis** using `explain()` to understand how MongoDB executes a query. This helps optimize performance by seeing whether indexes are used, how many documents are scanned, etc.

Let’s go step by step.

---

### 🔍 Step 1: Basic `find()` with `explain()`

Let’s say we want to search for a user with the username `'junaid'`:

```javascript
db.users.find({ username: 'junaid' }).explain("executionStats")
```

- output:
```
mymongodb> db.users.find({ username: 'junaid' }).explain("executionStats")
{
  explainVersion: '1',
  queryPlanner: {
    namespace: 'mymongodb.users',
    parsedQuery: { username: { '$eq': 'junaid' } },
    indexFilterSet: false,
    queryHash: '1DCAA255',
    planCacheKey: 'AEA547E9',
    optimizationTimeMillis: 0,
    maxIndexedOrSolutionsReached: false,
    maxIndexedAndSolutionsReached: false,
    maxScansToExplodeReached: false,
    prunedSimilarIndexes: false,
    winningPlan: {
      isCached: false,
      stage: 'EXPRESS_IXSCAN',
      keyPattern: '{ username: 1 }',
      indexName: 'username_1'
    },
    rejectedPlans: []
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 1,
    executionTimeMillis: 0,
    totalKeysExamined: 1,
    totalDocsExamined: 1,
    executionStages: {
      isCached: false,
      stage: 'EXPRESS_IXSCAN',
      keyPattern: '{ username: 1 }',
      indexName: 'username_1',
      keysExamined: 1,
      docsExamined: 1,
      nReturned: 1
    }
  },
  command: { find: 'users', filter: { username: 'junaid' }, '$db': 'mymongodb' },
  serverInfo: {
    host: 'a80e4877af4e',
    port: 27017,
    version: '8.0.0',
    gitVersion: 'd7cd03b239ac39a3c7d63f7145e91aca36f93db6'
  },
  serverParameters: {
    internalQueryFacetBufferSizeBytes: 104857600,
    internalQueryFacetMaxOutputDocSizeBytes: 104857600,
    internalLookupStageIntermediateDocumentMaxSizeBytes: 104857600,
    internalDocumentSourceGroupMaxMemoryBytes: 104857600,
    internalQueryMaxBlockingSortMemoryUsageBytes: 104857600,
    internalQueryProhibitBlockingMergeOnMongoS: 0,
    internalQueryMaxAddToSetBytes: 104857600,
    internalDocumentSourceSetWindowFieldsMaxMemoryBytes: 104857600,
    internalQueryFrameworkControl: 'trySbeRestricted',
    internalQueryPlannerIgnoreIndexWithCollationForRegex: 1
  },
  ok: 1
}
mymongodb>
```

- `"executionStats"` mode gives detailed info on query execution like total documents examined, whether an index was used, etc.

---

### ✅ Example Output Explanation (Simplified)

Here’s what we might see (simplified):

```json
{
  "queryPlanner": {
    "plannerVersion": 1,
    "namespace": "mymongodb.users",
    "indexFilterSet": false,
    "parsedQuery": { "username": { "$eq": "junaid" } },
    "winningPlan": {
      "stage": "COLLSCAN",  // means a full collection scan
      ...
    }
  },
  "executionStats": {
    "nReturned": 1,         // number of matching docs returned
    "executionTimeMillis": 2,
    "totalDocsExamined": 4, // how many docs it scanned
    ...
  }
}
```

---

### 📉 If It Shows `"stage": "COLLSCAN"`

That means MongoDB is doing a **Collection Scan** (bad for large collections). To fix this, create an index.

---

### ⚙️ Step 2: Create an Index

Create an index on `username`:

```javascript
db.users.createIndex({ username: 1 })
```

Then run the same `explain()` again:

```javascript
db.users.find({ username: 'junaid' }).explain("executionStats")
```

Now we should see:

```json
"stage": "IXSCAN"   // index scan — much better!
```

---

### 📌 We Can Also Try:

- Explain on a date filter:
  ```javascript
  db.users.find({ createdAt: { $gte: ISODate("2024-01-01") } }).explain("executionStats")
  ```
- Add compound index if querying on multiple fields:
  ```javascript
  db.users.createIndex({ username: 1, isActive: 1 })
  ```