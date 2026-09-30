"""MCP chat endpoint -- LLM (Groq) talks to an MCP server exposing tools
over the observability__logs__error_logs index. See mcp_app/client.py and
mcp_app/server.py."""

from typing import Any

from fastapi import APIRouter, Body, HTTPException

from mcp_app.client import run_chat

router = APIRouter(tags=["chat"])


@router.post("/api/chat")
async def chat(payload: dict[str, Any] = Body(...)):
    message = payload.get("message")
    history = payload.get("history", [])
    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    try:
        return await run_chat(message, history)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
