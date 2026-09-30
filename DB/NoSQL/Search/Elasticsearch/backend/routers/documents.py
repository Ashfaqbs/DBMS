"""Row-level endpoints -- RDBMS: "row" <-> Elasticsearch "document"."""

from typing import Any

from elasticsearch import NotFoundError
from fastapi import APIRouter, Body, HTTPException, Query

from core.elastic import es, require_index

router = APIRouter(tags=["documents"])


@router.get("/api/tables/{index_name}/sample")
def get_sample(index_name: str, size: int = Query(10, le=100)):
    require_index(index_name)
    result = es.search(index=index_name, query={"match_all": {}}, size=size)
    return {
        "total": result["hits"]["total"]["value"],
        "docs": [
            {"_id": hit["_id"], **hit["_source"]} for hit in result["hits"]["hits"]
        ],
    }


@router.get("/api/tables/{index_name}/search")
def search_table(index_name: str, q: str = Query(...), size: int = Query(20, le=100)):
    require_index(index_name)
    mapping = es.indices.get_mapping(index=index_name)[index_name]["mappings"]
    text_fields = [
        field
        for field, spec in mapping.get("properties", {}).items()
        if spec.get("type") == "text"
    ]
    if not text_fields:
        text_fields = list(mapping.get("properties", {}).keys())

    result = es.search(
        index=index_name,
        query={
            "multi_match": {
                "query": q,
                "fields": text_fields,
                "fuzziness": "AUTO",
            }
        },
        size=size,
    )
    return {
        "total": result["hits"]["total"]["value"],
        "docs": [
            {"_id": hit["_id"], "_score": hit["_score"], **hit["_source"]}
            for hit in result["hits"]["hits"]
        ],
    }


@router.post("/api/tables/{index_name}/documents")
def create_document(index_name: str, payload: dict[str, Any] = Body(...)):
    """RDBMS: INSERT INTO table VALUES (...). If _id is omitted, ES auto-generates one."""
    require_index(index_name)
    doc_id = payload.pop("_id", None)
    if doc_id:
        result = es.index(index=index_name, id=doc_id, document=payload)
    else:
        result = es.index(index=index_name, document=payload)
    es.indices.refresh(index=index_name)
    return {"_id": result["_id"], "result": result["result"]}


@router.put("/api/tables/{index_name}/documents/{doc_id}")
def update_document(index_name: str, doc_id: str, payload: dict[str, Any] = Body(...)):
    """RDBMS: UPDATE table SET ... WHERE id = doc_id."""
    require_index(index_name)
    payload.pop("_id", None)
    try:
        result = es.index(index=index_name, id=doc_id, document=payload)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Document not found")
    es.indices.refresh(index=index_name)
    return {"_id": result["_id"], "result": result["result"]}


@router.delete("/api/tables/{index_name}/documents/{doc_id}")
def delete_document(index_name: str, doc_id: str):
    """RDBMS: DELETE FROM table WHERE id = doc_id."""
    require_index(index_name)
    try:
        es.delete(index=index_name, id=doc_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Document not found")
    es.indices.refresh(index=index_name)
    return {"_id": doc_id, "deleted": True}
