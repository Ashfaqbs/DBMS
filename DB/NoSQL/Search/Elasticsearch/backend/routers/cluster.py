"""Cluster-level endpoints -- the RDBMS 'database server' concept."""

from fastapi import APIRouter

from core.elastic import es

router = APIRouter(tags=["cluster"])


@router.get("/api/cluster")
def get_cluster():
    """Cluster-level info -- the RDBMS 'server' -- plus its own defaults."""
    health = es.cluster.health()
    info = es.info()
    return {
        "cluster_name": health["cluster_name"],
        "status": health["status"],
        "number_of_nodes": health["number_of_nodes"],
        "elasticsearch_version": info["version"]["number"],
        "defaults": {
            "default_number_of_shards": 1,
            "default_number_of_replicas": 1,
            "note": (
                "Unlike an RDBMS server, a cluster has no built-in notion of "
                "'databases' -- everything below it is a flat list of indices."
            ),
        },
    }


@router.get("/api/health")
def health():
    return {"elasticsearch": es.ping()}
