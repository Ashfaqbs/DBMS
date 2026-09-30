"""
MCP client + LLM agent loop for the "MCP Chat" tab.

Flow: user message -> Groq LLM (OpenAI-compatible) decides whether to call a
tool -> if so, this process (the MCP *client*) calls that tool on
mcp_server.py (the MCP *server*, running as a subprocess over stdio) -> tool
result goes back to the LLM -> repeat until the LLM answers in plain text.

This is the "plan -> execute -> observe -> reflect" agent loop, capped at
MAX_TURNS to prevent runaway tool-calling.
"""

import asyncio
import json
import os
import sys
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from openai import OpenAI

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-120b")
MAX_TURNS = 5

MCP_SERVER_SCRIPT = str(Path(__file__).parent / "server.py")

SYSTEM_PROMPT = (
    "You are a support assistant for an ecommerce platform's error logs, "
    "stored in Elasticsearch. Use the available tools to search and "
    "aggregate error_logs documents (fields: id, error_name, error_message, "
    "timestamp, team) before answering. error_name and team are exact "
    "`keyword` values -- if you don't already know the exact error_name, "
    "call list_error_names() first rather than guessing a partial word for "
    "it in search_errors. Always ground answers in tool results -- don't "
    "guess at data. Be concise."
)


def _mcp_tool_to_openai_schema(tool) -> dict:
    return {
        "type": "function",
        "function": {
            "name": tool.name,
            "description": tool.description or "",
            "parameters": tool.inputSchema,
        },
    }


async def _run_chat(user_message: str, history: list[dict]) -> dict:
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Add it to backend/.env (see .env.example)."
        )

    client = OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
    server_params = StdioServerParameters(
        command=sys.executable, args=[MCP_SERVER_SCRIPT], env=os.environ.copy()
    )

    trace: list[dict] = []

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools_result = await session.list_tools()
            openai_tools = [_mcp_tool_to_openai_schema(t) for t in tools_result.tools]

            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            messages.extend(history)
            messages.append({"role": "user", "content": user_message})

            for _ in range(MAX_TURNS):
                response = client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=messages,
                    tools=openai_tools,
                )
                choice = response.choices[0].message

                if not choice.tool_calls:
                    return {"reply": choice.content, "trace": trace}

                messages.append(
                    {
                        "role": "assistant",
                        "content": choice.content,
                        "tool_calls": [tc.model_dump() for tc in choice.tool_calls],
                    }
                )

                for tool_call in choice.tool_calls:
                    args = json.loads(tool_call.function.arguments or "{}")
                    result = await session.call_tool(tool_call.function.name, args)
                    result_text = "".join(
                        part.text for part in result.content if hasattr(part, "text")
                    )
                    trace.append(
                        {"tool": tool_call.function.name, "args": args, "result": result_text}
                    )
                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "content": result_text,
                        }
                    )

            return {
                "reply": "Reached max tool-call turns without a final answer.",
                "trace": trace,
            }


def _run_chat_sync(user_message: str, history: list[dict]) -> dict:
    """Runs _run_chat on a fresh event loop in this thread. Needed because
    uvicorn forces WindowsSelectorEventLoopPolicy on Windows (see
    uvicorn/loops/asyncio.py), and only ProactorEventLoop can spawn the
    mcp_server.py subprocess -- so this can't just run on the request's
    existing event loop."""
    if sys.platform == "win32":
        loop = asyncio.ProactorEventLoop()
        try:
            return loop.run_until_complete(_run_chat(user_message, history))
        finally:
            loop.close()
    return asyncio.run(_run_chat(user_message, history))


async def run_chat(user_message: str, history: list[dict]) -> dict:
    """Public entrypoint called from the FastAPI request handler -- runs the
    actual chat logic in a worker thread with its own event loop."""
    return await asyncio.to_thread(_run_chat_sync, user_message, history)
