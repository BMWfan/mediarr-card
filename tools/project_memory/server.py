"""Dependency-free, repository-scoped MCP memory spike (stdio JSON-RPC)."""
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import sys
from urllib.parse import urlsplit, unquote
from datetime import datetime, timezone

SERVER = "mediarr-project-memory-spike"
ROOT = Path(__file__).resolve().parents[2]
REPO_ID = "BMWfan/mediarr-card"
TOKEN_LIMIT = 1200
SENSITIVE = re.compile(r"(?i)(password|api[_-]?key|secret|token|authorization|bearer)\s*[:=]\s*\S+")


def db_path():
    base = Path(os.environ.get("PROJECT_MEMORY_DIR", Path.home() / ".local/share/mediarr-project-memory")).expanduser().resolve()
    base.mkdir(parents=True, exist_ok=True)
    return base / "memory.sqlite3"


def connect():
    db = sqlite3.connect(db_path())
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("""CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY, repository TEXT NOT NULL, kind TEXT NOT NULL,
        content TEXT NOT NULL, source TEXT NOT NULL, created_at TEXT NOT NULL,
        valid INTEGER NOT NULL DEFAULT 1)""")
    return db


def add(content, source, kind="decision"):
    if not isinstance(content, str) or not content.strip() or len(content) > 4000:
        raise ValueError("content must contain 1..4000 characters")
    if not isinstance(source, str) or not source.startswith(("https://github.com/BMWfan/mediarr-card/", "local-test:")):
        raise ValueError("source must reference this repository")
    if len(source) > 1000 or SENSITIVE.search(source):
        raise ValueError("invalid or sensitive source")
    if source.startswith("https:"):
        url = urlsplit(source)
        parts = unquote(url.path).split("/")
        if url.query or url.fragment or any(p in (".", "..") for p in parts) or "\\" in source:
            raise ValueError("source must be a canonical repository reference")
    if kind not in ("decision", "finding", "failure"):
        raise ValueError("unsupported kind")
    if SENSITIVE.search(content):
        raise ValueError("possible secret detected")
    digest = hashlib.sha256((REPO_ID + "\0" + kind + "\0" + content.strip()).encode()).hexdigest()[:24]
    with connect() as db:
        db.execute("INSERT OR IGNORE INTO memories VALUES (?,?,?,?,?,?,1)",
                   (digest, REPO_ID, kind, content.strip(), source, datetime.now(timezone.utc).isoformat()))
    return {"id": digest, "repository": REPO_ID}


def recall(query, limit=3):
    if not isinstance(query, str) or not query.strip():
        raise ValueError("query required")
    limit = max(1, min(int(limit), 5))
    terms = set(re.findall(r"[a-z0-9_-]{3,}", query.lower()))
    with connect() as db:
        rows = db.execute("SELECT id, kind, content, source FROM memories WHERE repository=? AND valid=1", (REPO_ID,)).fetchall()
    scored = []
    for mid, kind, content, source in rows:
        words = set(re.findall(r"[a-z0-9_-]{3,}", content.lower()))
        score = len(terms & words)
        if score:
            scored.append((score, {"id": mid, "kind": kind, "content": content, "source": source, "trust": "untrusted; verify source before acting"}))
    scored.sort(key=lambda x: (-x[0], x[1]["id"]))
    output, used = [], 0
    for _, item in scored:
        estimate = (len(item["content"]) + len(item["source"])) // 4 + 12
        if used + estimate > TOKEN_LIMIT:
            break
        output.append(item)
        used += estimate
        if len(output) == limit:
            break
    return {"repository": REPO_ID, "memories": output, "estimated_tokens": used, "method": "keyword-overlap (not semantic)"}


def invalidate(mid):
    with connect() as db:
        changed = db.execute("UPDATE memories SET valid=0 WHERE id=? AND repository=?", (mid, REPO_ID)).rowcount
    return {"invalidated": bool(changed)}


TOOLS = [
    {"name": "memory_recall", "description": "Recall repository-scoped memories (keyword-only spike)", "inputSchema": {"type": "object", "properties": {"query": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["query"]}},
    {"name": "memory_record", "description": "Record sourced project decision/finding", "inputSchema": {"type": "object", "properties": {"content": {"type": "string"}, "source": {"type": "string"}, "kind": {"type": "string"}}, "required": ["content", "source"]}},
    {"name": "memory_invalidate", "description": "Invalidate outdated memory", "inputSchema": {"type": "object", "properties": {"id": {"type": "string"}}, "required": ["id"]}},
]


def handle(message):
    method, params = message.get("method"), message.get("params") or {}
    if method == "initialize":
        return {"protocolVersion": "2025-03-26", "capabilities": {"tools": {}}, "serverInfo": {"name": SERVER, "version": "0.1.0"}}
    if method == "ping":
        return {}
    if method == "tools/list":
        return {"tools": TOOLS}
    if method == "tools/call":
        name, args = params.get("name"), params.get("arguments") or {}
        try:
            if name == "memory_recall":
                result = recall(**args)
            elif name == "memory_record":
                result = add(**args)
            elif name == "memory_invalidate":
                result = invalidate(args["id"])
            else:
                raise ValueError("unknown tool")
            return {"content": [{"type": "text", "text": json.dumps(result)}]}
        except (ValueError, KeyError, TypeError) as exc:
            return {"isError": True, "content": [{"type": "text", "text": str(exc)}]}
    raise ValueError("unknown method")


def main():
    for line in sys.stdin:
        request = None
        try:
            request = json.loads(line)
            if not isinstance(request, dict) or request.get("jsonrpc") != "2.0" or not isinstance(request.get("method"), str):
                raise ValueError("invalid JSON-RPC request")
            if "id" not in request:
                continue
            response = {"jsonrpc": "2.0", "id": request["id"], "result": handle(request)}
        except json.JSONDecodeError:
            response = {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "Parse error"}}
        except Exception as exc:
            response = {"jsonrpc": "2.0", "id": request.get("id") if isinstance(request, dict) else None, "error": {"code": -32603, "message": str(exc)}}
        print(json.dumps(response), flush=True)


if __name__ == "__main__":
    main()

