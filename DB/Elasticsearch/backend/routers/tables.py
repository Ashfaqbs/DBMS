"""
Database / Schema / Table level endpoints -- RDBMS: "database" -> "schema" ->
"table", simulated over Elasticsearch's single real structural unit, the
index (see core.elastic.index_name_of / parse_index_name).
"""

from collections import defaultdict
from typing import Any

from fastapi import APIRouter, Body, HTTPException

from core.elastic import (
    ALLOWED_FIELD_TYPES,
    es,
    index_name_of,
    parse_index_name,
    require_index,
)

router = APIRouter(tags=["tables"])


@router.get("/api/structure")
def get_structure():
    """Return database -> schema -> table tree with document counts."""
    tree: dict[str, dict[str, list[dict]]] = defaultdict(lambda: defaultdict(list))

    indices = es.indices.get(index="*__*__*", expand_wildcards="open")
    for index_name in sorted(indices.keys()):
        parsed = parse_index_name(index_name)
        if not parsed:
            continue
        database, schema, table = parsed
        count = es.count(index=index_name)["count"]
        tree[database][schema].append(
            {"table": table, "index": index_name, "doc_count": count}
        )

    return {
        database: {schema: tables for schema, tables in schemas.items()}
        for database, schemas in tree.items()
    }


@router.post("/api/tables")
def create_table(payload: dict[str, Any] = Body(...)):
    """
    Create a table (index), simulating: CREATE TABLE db.schema.table (col type, ...)

    Body: {
      "database": "ecommerce", "schema": "inventory", "table": "brands",
      "fields": [{"name": "brand_id", "type": "keyword"}, {"name": "name", "type": "text"}],
      "number_of_shards": 1, "number_of_replicas": 1
    }
    """
    database = payload.get("database")
    schema = payload.get("schema")
    table = payload.get("table")
    fields = payload.get("fields", [])
    if not (database and schema and table):
        raise HTTPException(status_code=400, detail="database, schema, table are required")

    index_name = index_name_of(database, schema, table)
    if es.indices.exists(index=index_name):
        raise HTTPException(status_code=409, detail="Table already exists")

    properties = {}
    for field in fields:
        name = field.get("name")
        ftype = field.get("type")
        if not name or ftype not in ALLOWED_FIELD_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Field '{name}' has invalid type '{ftype}'. Allowed: {ALLOWED_FIELD_TYPES}",
            )
        spec: dict[str, Any] = {"type": ftype}
        if ftype == "text":
            spec["fields"] = {"keyword": {"type": "keyword", "ignore_above": 256}}
        properties[name] = spec

    number_of_shards = payload.get("number_of_shards", 1)
    number_of_replicas = payload.get("number_of_replicas", 1)

    es.indices.create(
        index=index_name,
        mappings={"properties": properties} if properties else None,
        settings={
            "number_of_shards": number_of_shards,
            "number_of_replicas": number_of_replicas,
        },
    )
    return {"index": index_name, "created": True}


@router.delete("/api/tables/{index_name}")
def delete_table(index_name: str):
    """Drop a table (index). RDBMS: DROP TABLE."""
    require_index(index_name)
    es.indices.delete(index=index_name)
    return {"index": index_name, "deleted": True}


@router.get("/api/tables/{index_name}/mapping")
def get_mapping(index_name: str):
    """The table's 'schema' -- field names + types. RDBMS: DESCRIBE TABLE."""
    require_index(index_name)
    mapping = es.indices.get_mapping(index=index_name)[index_name]["mappings"]
    settings = es.indices.get_settings(index=index_name)[index_name]["settings"]["index"]
    columns = []
    for name, spec in mapping.get("properties", {}).items():
        columns.append({"name": name, "type": spec.get("type", "object")})
    return {
        "index": index_name,
        "columns": columns,
        "settings": {
            "number_of_shards": settings.get("number_of_shards"),
            "number_of_replicas": settings.get("number_of_replicas"),
            "creation_date": settings.get("creation_date"),
        },
        "defaults": {
            "dynamic_mapping": "true (unmapped fields sent in a document are auto-added)",
            "_id": "auto-generated UUID if not supplied on insert",
        },
    }
