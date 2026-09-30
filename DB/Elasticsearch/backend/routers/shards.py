"""Distributed / shard placement -- how one index spreads across cluster
nodes. RDBMS has no equivalent: a table lives on one server; an index is
split into shards spread across nodes."""

from fastapi import APIRouter

from core.elastic import es, require_index

router = APIRouter(tags=["distributed"])


@router.get("/api/tables/{index_name}/shards")
def get_shards(index_name: str):
    """Real physical shard placement for this index -- which node holds
    which primary/replica shard right now."""
    require_index(index_name)
    shards = es.cat.shards(index=index_name, format="json")
    nodes = es.cat.nodes(format="json")
    settings = es.indices.get_settings(index=index_name)[index_name]["settings"]["index"]
    return {
        "index": index_name,
        "number_of_shards": int(settings.get("number_of_shards", 1)),
        "number_of_replicas": int(settings.get("number_of_replicas", 1)),
        "number_of_nodes": len(nodes),
        "shards": [
            {
                "shard": s["shard"],
                "prirep": "primary" if s["prirep"] == "p" else "replica",
                "state": s["state"],
                "docs": s.get("docs"),
                "store": s.get("store"),
                "node": s.get("node"),
            }
            for s in shards
        ],
    }
