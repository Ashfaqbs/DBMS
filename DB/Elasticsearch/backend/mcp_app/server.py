"""
A minimal MCP (Model Context Protocol) server exposing tools over the
`observability__logs__error_logs` Elasticsearch index.

This is deliberately small and scoped to one index for teaching purposes --
Elastic does maintain an official, more general MCP server
(github.com/elastic/mcp-server-elasticsearch, Node/Apache-2.0), but writing
our own here keeps the whole request path (MCP client -> MCP server -> ES)
visible in one small Python file instead of hidden behind a generic tool.

Runs over stdio: the MCP client (backend/chat.py) launches this file as a
subprocess and talks to it via stdin/stdout using the MCP protocol -- no
network port, no auth to manage for this local teaching setup.
"""

import os

from elasticsearch import Elasticsearch
from mcp.server.fastmcp import FastMCP

ES_HOST = os.environ.get("ES_HOST", "http://localhost:9200")
INDEX = "observability__logs__error_logs"

es = Elasticsearch(ES_HOST)
mcp = FastMCP("elastic-error-logs")


@mcp.tool()
def search_errors(
    query: str = "", team: str = "", error_name: str = "", size: int = 20
) -> list[dict]:
    """Search the error_logs index. `query` fuzzy full-text matches only
    error_message (a `text` field). `team` and `error_name` are exact
    filters (both `keyword` fields -- use list_error_names() to get valid
    error_name values first, don't guess a partial word for it). Returns up
    to `size` matching error log documents, newest first."""
    must: list[dict] = []
    if query:
        must.append({"match": {"error_message": {"query": query, "fuzziness": "AUTO"}}})
    if team:
        must.append({"term": {"team": team}})
    if error_name:
        must.append({"term": {"error_name": error_name}})

    es_query = {"bool": {"must": must}} if must else {"match_all": {}}
    result = es.search(
        index=INDEX,
        query=es_query,
        sort=[{"timestamp": {"order": "desc"}}],
        size=min(size, 100),
    )
    return [hit["_source"] for hit in result["hits"]["hits"]]


@mcp.tool()
def list_error_names() -> list[str]:
    """List the distinct exact error_name values (e.g. 'TimeoutError',
    'ValidationError'). error_name is a `keyword` field -- not tokenized --
    so search_errors needs the exact value, not a partial word like
    'timeout'. Call this first if a text search for an error type returns
    no results, then retry search_errors with the exact name."""
    result = es.search(
        index=INDEX, size=0, aggs={"names": {"terms": {"field": "error_name", "size": 50}}}
    )
    return [b["key"] for b in result["aggregations"]["names"]["buckets"]]


@mcp.tool()
def get_error_by_id(id: str) -> dict:
    """Fetch one error log document by its exact `id`, e.g. 'ERR-1005'."""
    result = es.search(index=INDEX, query={"term": {"id": id}}, size=1)
    hits = result["hits"]["hits"]
    return hits[0]["_source"] if hits else {"error": f"no document with id {id}"}


@mcp.tool()
def count_errors_by_team() -> dict:
    """Aggregate error log counts grouped by team. Useful for questions like
    'which team has the most errors?'"""
    result = es.search(
        index=INDEX,
        size=0,
        aggs={"by_team": {"terms": {"field": "team", "size": 20}}},
    )
    buckets = result["aggregations"]["by_team"]["buckets"]
    return {b["key"]: b["doc_count"] for b in buckets}


@mcp.tool()
def count_errors_by_name() -> dict:
    """Aggregate error log counts grouped by error_name. Useful for questions
    like 'what is the most common error?'"""
    result = es.search(
        index=INDEX,
        size=0,
        aggs={"by_name": {"terms": {"field": "error_name", "size": 20}}},
    )
    buckets = result["aggregations"]["by_name"]["buckets"]
    return {b["key"]: b["doc_count"] for b in buckets}


if __name__ == "__main__":
    mcp.run(transport="stdio")
