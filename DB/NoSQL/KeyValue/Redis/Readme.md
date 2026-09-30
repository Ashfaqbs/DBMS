## 🧠 What is Redis?

**Redis** (REmote DIctionary Server) is an **in-memory data structure store**, widely used as a **cache**, **database**, and **message broker**.
It is **extremely fast** because it keeps all data in RAM and uses efficient data structures.

* Written in **C**
* Open-source, BSD licensed
* Can persist data to disk (optional, for durability)
* Single-threaded (but highly optimized I/O)

---

## 📜 Brief History

| Year      | Milestone                                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------- |
| **2009**  | Created by **Salvatore Sanfilippo (antirez)** to improve scalability of his startup                              |
| **2010**  | Redis joins **VMware**                                                                                           |
| **2013**  | Redis moves under **Pivotal**                                                                                    |
| **2015**  | Salvatore starts **Redis Labs** (now Redis Inc.)                                                                 |
| **2020**  | Salvatore steps away from Redis                                                                                  |
| **Today** | Maintained by Redis community & Redis Inc., actively evolving (with modules, clustering, and enterprise support) |

---

## 🧰 Where Can Redis Be Used?

| Use Case                          | Explanation                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Caching**                       | Store frequently accessed data (like user sessions, tokens, DB results) to avoid recomputation or DB hit |
| **Pub/Sub**                       | For lightweight messaging between services                                                               |
| **Rate Limiting**                 | Count requests per user/session/token in real-time using counters                                        |
| **Queueing/Job processing**       | Lists and Streams used as task queues (e.g., with Sidekiq, Celery)                                       |
| **Leaderboard or Scoring system** | Sorted sets help build real-time leaderboards                                                            |
| **Session Store**                 | In web applications, for fast access to session state                                                    |
| **Geospatial Indexing**           | Use GEO commands to query locations and distances                                                        |
| **Real-time analytics**           | Track clicks, visits, or events with near-zero latency                                                   |
| **Feature flags / toggle**        | Key-value pairs to enable/disable app features in real time                                              |

---

## 🧬 Core Redis Data Types

| Type                  | Description                       | Example Use                    |
| --------------------- | --------------------------------- | ------------------------------ |
| **String**            | Basic key-value pair, binary-safe | Caching, counters              |
| **List**              | Ordered collection, like an array | Queues, logs                   |
| **Set**               | Unordered, unique values          | Tags, unique visitors          |
| **Sorted Set (ZSet)** | Set + score for ordering          | Leaderboards, ranked data      |
| **Hash**              | Key-value pairs inside a key      | User objects, configuration    |
| **Bitmaps**           | Efficient bit-level storage       | User activity tracking         |
| **HyperLogLog**       | Approximate cardinality counting  | Unique visits counter          |
| **Streams**           | Append-only log with IDs          | Event sourcing, message queues |
| **Geospatial**        | Store longitude & latitude        | Location-based services        |

---

## 🧪 How to Play Around With Redis Data Types

we can use `redis-cli` or Redis clients (Java, Python, Node.js, etc.).

### 🔹 String

```bash
SET name "ashfaq"
GET name
INCR counter  # auto-initialize and increment
```

### 🔹 List

```bash
LPUSH tasks "task1"
RPUSH tasks "task2"
LRANGE tasks 0 -1
LPOP tasks
```

### 🔹 Set

```bash
SADD tags "java" "spring" "redis"
SMEMBERS tags
SISMEMBER tags "python"
```

### 🔹 Sorted Set

```bash
ZADD leaderboard 100 "ashfaq"
ZADD leaderboard 150 "john"
ZRANGE leaderboard 0 -1 WITHSCORES
```

### 🔹 Hash

```bash
HSET user:100 name "ashfaq" age "30"
HGETALL user:100
HGET user:100 age
```

### 🔹 Stream

```bash
XADD mystream * name "ashfaq" event "login"
XRANGE mystream - +
```

### 🔹 Geo

```bash
GEOADD cities 77.5946 12.9716 "Bangalore"
GEORADIUS cities 77.5 13 100 km
```


---

## ⚡ Why Redis is Fast

Redis achieves high speed due to a combination of the following factors:

### 1. **In-Memory Storage**

* Redis keeps all data in **RAM (Random Access Memory)** — which is *thousands of times faster* than disk-based storage.
* No disk read/write latency during typical operations (GET, SET, etc.), making lookups and inserts almost instantaneous.

### 2. **Single-Threaded Event Loop**

* Redis uses a **single-threaded** model with an **event loop** (like Node.js), meaning no context switching, locking, or synchronization overhead.
* This ensures consistent, predictable performance.

### 3. **Efficient Data Structures**

* Core data structures (like hashes, sets, sorted sets) are implemented using highly optimized C code.
* It avoids bloated object models that slower databases may use.

### 4. **Minimal Protocol Overhead**

* Redis uses a lightweight TCP protocol (RESP) that’s easy to parse, making command execution fast.

---

## 🧠 Where Does Redis Store the Data?

### Primary: **RAM (Memory)**

* All active data is stored in **main memory**.
* That’s what gives Redis its ultra-low latency (\~1ms typical access times).

### Persistence Options (Optional):

Redis can also **persist data to disk** — but this is only for **durability**, not speed.

1. **RDB (Redis Database Backup)**

   * Point-in-time snapshot of memory written to disk at intervals.
   * Good for cold backups.

2. **AOF (Append Only File)**

   * Logs every write operation. Can rebuild the exact state by replaying logs.
   * Safer but can be slower than RDB.

3. **Hybrid (default)**

   * Use both RDB + AOF for a trade-off between speed and durability.

> 🔍 By default, Redis stores all data in RAM and uses disk only for backup/recovery.

---

## 🧑‍💻 Resources to Learn Redis

### 📘 Official Docs & Tutorials

* [https://redis.io/docs](https://redis.io/docs)
* [Redis CLI Playground](https://redis.io/docs/interact/cli/)
* [Try Redis in Browser](https://try.redis.io)


### 🛠️ Java Client 

* Use **Jedis** or **Lettuce**
* With Spring Boot: Spring Data Redis (easy config, repo support)

---

## 🔄 Real-World Spring Boot Redis Example

```java
@Configuration
public class RedisConfig {
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        return template;
    }
}
```

```java
@Service
public class CacheService {
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    public void save(String key, Object value) {
        redisTemplate.opsForValue().set(key, value);
    }

    public Object get(String key) {
        return redisTemplate.opsForValue().get(key);
    }
}
```
