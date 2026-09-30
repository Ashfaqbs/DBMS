"""
FastAPI layer over Elasticsearch that presents it through an RDBMS lens:

    RDBMS term      Elasticsearch term      Router
    ----------      ------------------      ------
    DB server       Cluster                 routers/cluster.py
    Database/Schema (no native concept -- simulated via index naming)
    Table           Index                   routers/tables.py
    Column/Schema   Mapping (properties)    routers/tables.py
    Row             Document                routers/documents.py
    Cell            Field value             (inside a document)
    (no equivalent) Shard placement         routers/shards.py
    (no equivalent) Raw ES REST passthrough routers/raw.py
    (no equivalent) MCP chat over error logs routers/chat.py

Elasticsearch only has one real structural unit: the index. "Database" and
"schema" are simulated here by naming indices "{database}__{schema}__{table}"
(see scripts/seed_data.py). Real ES has no nesting above the index.

This file only wires the app together -- actual endpoint logic lives in
routers/, the shared ES client + naming helpers in core/elastic.py.
"""

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import chat, cluster, documents, raw, shards, tables

app = FastAPI(title="Elastic RDBMS-style Explorer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cluster.router)
app.include_router(tables.router)
app.include_router(documents.router)
app.include_router(shards.router)
app.include_router(raw.router)
app.include_router(chat.router)
