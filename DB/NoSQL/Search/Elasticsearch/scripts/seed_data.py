"""
Seeds Elasticsearch with data organized to mimic an RDBMS hierarchy:

    database   ->  schema     -> table
    ecommerce  ->  inventory  -> products / categories / warehouses
    ecommerce  ->  sales      -> orders
    crm        ->  public     -> customers

Elasticsearch has no native concept of database/schema, only indices, so the
hierarchy is encoded in the index name itself:

    {database}__{schema}__{table}

e.g. "ecommerce__inventory__products"
"""

import logging
import os
import time

from elasticsearch import Elasticsearch

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("seed")

ES_HOST = os.environ.get("ES_HOST", "http://localhost:9200")

PRODUCT_MAPPING = {
    "properties": {
        "sku": {"type": "keyword"},
        "name": {
            "type": "text",
            "fields": {"keyword": {"type": "keyword", "ignore_above": 256}},
        },
        "description": {"type": "text"},
        "brand": {
            "type": "text",
            "fields": {"keyword": {"type": "keyword"}},
        },
        "category_id": {"type": "keyword"},
        "price": {"type": "float"},
        "stock_qty": {"type": "integer"},
        "warehouse_id": {"type": "keyword"},
        "created_at": {"type": "date"},
    }
}

CATEGORY_MAPPING = {
    "properties": {
        "category_id": {"type": "keyword"},
        "name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
        "parent_category_id": {"type": "keyword"},
    }
}

WAREHOUSE_MAPPING = {
    "properties": {
        "warehouse_id": {"type": "keyword"},
        "name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
        "state": {"type": "keyword"},
    }
}

ORDER_MAPPING = {
    "properties": {
        "order_id": {"type": "keyword"},
        "customer_id": {"type": "keyword"},
        "sku": {"type": "keyword"},
        "qty": {"type": "integer"},
        "total": {"type": "float"},
        "ordered_at": {"type": "date"},
        "status": {"type": "keyword"},
    }
}

CUSTOMER_MAPPING = {
    "properties": {
        "customer_id": {"type": "keyword"},
        "full_name": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
        "email": {"type": "keyword"},
        "loyalty_tier": {"type": "keyword"},
        "state": {"type": "keyword"},
    }
}

ERROR_LOG_MAPPING = {
    "properties": {
        "id": {"type": "keyword"},
        "error_name": {"type": "keyword"},
        "error_message": {
            "type": "text",
            "fields": {"keyword": {"type": "keyword", "ignore_above": 512}},
        },
        "timestamp": {"type": "date"},
        "team": {"type": "keyword"},
    }
}

INDEXES = {
    "ecommerce__inventory__categories": CATEGORY_MAPPING,
    "ecommerce__inventory__warehouses": WAREHOUSE_MAPPING,
    "ecommerce__inventory__products": PRODUCT_MAPPING,
    "ecommerce__sales__orders": ORDER_MAPPING,
    "crm__public__customers": CUSTOMER_MAPPING,
    "observability__logs__error_logs": ERROR_LOG_MAPPING,
}

CATEGORIES = [
    {"category_id": "CAT-AUD", "name": "Audio", "parent_category_id": None},
    {"category_id": "CAT-WEAR", "name": "Wearables", "parent_category_id": None},
    {"category_id": "CAT-HOME", "name": "Smart Home", "parent_category_id": None},
    {"category_id": "CAT-ACC", "name": "Accessories", "parent_category_id": None},
    {"category_id": "CAT-KIT", "name": "Kitchen", "parent_category_id": None},
]

WAREHOUSES = [
    {"warehouse_id": "WH-NC-01", "name": "Raleigh DC", "state": "NC"},
    {"warehouse_id": "WH-TX-01", "name": "Dallas DC", "state": "TX"},
    {"warehouse_id": "WH-CA-01", "name": "Fresno DC", "state": "CA"},
]

PRODUCTS = [
    {
        "sku": "AUD-1001",
        "name": "Wireless Over-Ear Headphones",
        "description": "Active noise-cancelling headphones with 30-hour battery life.",
        "brand": "SoundPeak",
        "category_id": "CAT-AUD",
        "price": 129.99,
        "stock_qty": 150,
        "warehouse_id": "WH-NC-01",
        "created_at": "2025-01-10T00:00:00",
    },
    {
        "sku": "AUD-1002",
        "name": "Portable Bluetooth Speaker",
        "description": "Waterproof speaker with 12-hour playtime and deep bass.",
        "brand": "EchoWave",
        "category_id": "CAT-AUD",
        "price": 59.5,
        "stock_qty": 60,
        "warehouse_id": "WH-TX-01",
        "created_at": "2025-02-02T00:00:00",
    },
    {
        "sku": "WEAR-2001",
        "name": "Fitness Tracker Watch",
        "description": "Heart-rate and sleep tracking with a 7-day battery.",
        "brand": "PulseFit",
        "category_id": "CAT-WEAR",
        "price": 89.99,
        "stock_qty": 40,
        "warehouse_id": "WH-CA-01",
        "created_at": "2025-01-22T00:00:00",
    },
    {
        "sku": "HOME-3001",
        "name": "Smart LED Light Bulb 4-Pack",
        "description": "Wi-Fi enabled color bulbs, works with voice assistants.",
        "brand": "Lumenest",
        "category_id": "CAT-HOME",
        "price": 34.49,
        "stock_qty": 300,
        "warehouse_id": "WH-NC-01",
        "created_at": "2025-03-05T00:00:00",
    },
    {
        "sku": "ACC-4001",
        "name": "USB-C Fast Charging Cable 6ft",
        "description": "Braided nylon cable rated for 100W fast charging.",
        "brand": "VoltLine",
        "category_id": "CAT-ACC",
        "price": 14.99,
        "stock_qty": 85,
        "warehouse_id": "WH-TX-01",
        "created_at": "2025-02-18T00:00:00",
    },
    {
        "sku": "KIT-5001",
        "name": "Stainless Steel Electric Kettle",
        "description": "1.7L rapid-boil kettle with auto shut-off.",
        "brand": "BrewCraft",
        "category_id": "CAT-KIT",
        "price": 38.99,
        "stock_qty": 220,
        "warehouse_id": "WH-CA-01",
        "created_at": "2025-03-11T00:00:00",
    },
]

CUSTOMERS = [
    {
        "customer_id": "CUST-1",
        "full_name": "Maria Gonzalez",
        "email": "maria.g@example.com",
        "loyalty_tier": "gold",
        "state": "NC",
    },
    {
        "customer_id": "CUST-2",
        "full_name": "James Carter",
        "email": "james.carter@example.com",
        "loyalty_tier": "silver",
        "state": "TX",
    },
    {
        "customer_id": "CUST-3",
        "full_name": "Priya Nair",
        "email": "priya.nair@example.com",
        "loyalty_tier": "gold",
        "state": "CA",
    },
]

ORDERS = [
    {
        "order_id": "ORD-9001",
        "customer_id": "CUST-1",
        "sku": "AUD-1001",
        "qty": 1,
        "total": 129.99,
        "ordered_at": "2025-04-01T10:15:00",
        "status": "delivered",
    },
    {
        "order_id": "ORD-9002",
        "customer_id": "CUST-2",
        "sku": "WEAR-2001",
        "qty": 1,
        "total": 89.99,
        "ordered_at": "2025-04-03T14:40:00",
        "status": "shipped",
    },
    {
        "order_id": "ORD-9003",
        "customer_id": "CUST-3",
        "sku": "HOME-3001",
        "qty": 2,
        "total": 68.98,
        "ordered_at": "2025-04-05T09:05:00",
        "status": "processing",
    },
]

TEAMS = ["checkout", "search", "inventory", "payments", "notifications"]

ERROR_TEMPLATES = [
    ("NullPointerException", "Attempted to read property 'sku' of null in cart resolver"),
    ("TimeoutError", "Upstream request to payment gateway exceeded 5000ms"),
    ("ConnectionRefusedError", "Could not connect to Elasticsearch node at 10.0.4.12:9200"),
    ("ValidationError", "Field 'email' failed schema validation: invalid format"),
    ("OutOfMemoryError", "Java heap space exhausted during bulk indexing job"),
    ("KeyError", "Missing required key 'warehouse_id' in inbound inventory event"),
    ("RateLimitExceeded", "Client exceeded 100 requests/min on /api/search endpoint"),
    ("DeadlockDetected", "Transaction deadlock while updating orders and inventory tables"),
    ("SerializationError", "Failed to deserialize message from notifications queue"),
    ("AuthenticationFailed", "JWT signature verification failed for incoming request"),
]

ERROR_LOGS = [
    {
        "id": f"ERR-{1000 + i}",
        "error_name": ERROR_TEMPLATES[i % len(ERROR_TEMPLATES)][0],
        "error_message": ERROR_TEMPLATES[i % len(ERROR_TEMPLATES)][1],
        "timestamp": f"2026-0{1 + (i % 6)}-{1 + (i % 27):02d}T{(8 + i % 12):02d}:{(i * 7) % 60:02d}:00",
        "team": TEAMS[i % len(TEAMS)],
    }
    for i in range(50)
]

DATA_BY_INDEX = {
    "ecommerce__inventory__categories": CATEGORIES,
    "ecommerce__inventory__warehouses": WAREHOUSES,
    "ecommerce__inventory__products": PRODUCTS,
    "ecommerce__sales__orders": ORDERS,
    "crm__public__customers": CUSTOMERS,
    "observability__logs__error_logs": ERROR_LOGS,
}


def wait_for_es(client: Elasticsearch, attempts: int = 30) -> None:
    for i in range(attempts):
        if client.ping():
            logger.info("Elasticsearch is reachable")
            return
        logger.info("Waiting for Elasticsearch... (%d/%d)", i + 1, attempts)
        time.sleep(2)
    raise RuntimeError("Elasticsearch never became reachable")


def create_indices(client: Elasticsearch) -> None:
    for index_name, mapping in INDEXES.items():
        if client.indices.exists(index=index_name):
            logger.info("Index %s already exists, deleting to reseed", index_name)
            client.indices.delete(index=index_name)
        client.indices.create(index=index_name, mappings=mapping)
        logger.info("Created index %s", index_name)


def load_data(client: Elasticsearch) -> None:
    for index_name, docs in DATA_BY_INDEX.items():
        for doc in docs:
            doc_id = next(iter(doc.values()))
            client.index(index=index_name, id=doc_id, document=doc)
        client.indices.refresh(index=index_name)
        logger.info("Loaded %d documents into %s", len(docs), index_name)


def main() -> None:
    client = Elasticsearch(ES_HOST)
    wait_for_es(client)
    create_indices(client)
    load_data(client)
    logger.info("Seeding complete")


if __name__ == "__main__":
    main()
