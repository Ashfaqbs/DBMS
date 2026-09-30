"""
Shared Elasticsearch client + the RDBMS<->index naming helpers every router
needs. Centralized here so routers don't each build their own client or
redefine what a "table" (index) name is made of.
"""

import os

from elasticsearch import Elasticsearch
from fastapi import HTTPException

ES_HOST = os.environ.get("ES_HOST", "http://localhost:9200")

es = Elasticsearch(ES_HOST)

# Field types a user can pick from the "create table" UI, mapped straight to
# real Elasticsearch field types (the "column type" concept).
ALLOWED_FIELD_TYPES = ["text", "keyword", "integer", "float", "boolean", "date"]


def index_name_of(database: str, schema: str, table: str) -> str:
    return f"{database}__{schema}__{table}"


def parse_index_name(index_name: str) -> tuple[str, str, str] | None:
    parts = index_name.split("__")
    if len(parts) != 3:
        return None
    return parts[0], parts[1], parts[2]


def require_index(index_name: str) -> None:
    if not es.indices.exists(index=index_name):
        raise HTTPException(status_code=404, detail="Table (index) not found")
