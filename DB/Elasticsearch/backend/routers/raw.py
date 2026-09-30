"""Raw passthrough -- lets the UI fire real Elasticsearch REST API calls
(method + path + body) straight at ES, so you can see the actual API
Elasticsearch itself exposes, not just this backend's RDBMS-shaped wrapper."""

from typing import Any

import requests
from fastapi import APIRouter, Body, HTTPException

from core.elastic import ES_HOST

router = APIRouter(tags=["raw"])


@router.post("/api/raw")
def raw_es_call(payload: dict[str, Any] = Body(...)):
    """Body: {"method": "GET|POST|PUT|DELETE", "path": "/myindex/_doc/1", "body": {...} | null}"""
    method = str(payload.get("method", "GET")).upper()
    path = payload.get("path") or "/"
    if not path.startswith("/"):
        path = "/" + path
    body = payload.get("body")

    if method not in {"GET", "POST", "PUT", "DELETE", "HEAD"}:
        raise HTTPException(status_code=400, detail=f"Unsupported method: {method}")

    try:
        resp = requests.request(
            method,
            f"{ES_HOST}{path}",
            json=body if body not in (None, "") else None,
            timeout=10,
        )
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Could not reach Elasticsearch: {e}")

    try:
        parsed_body = resp.json()
    except ValueError:
        parsed_body = resp.text

    return {"status_code": resp.status_code, "body": parsed_body}
