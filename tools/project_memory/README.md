# Project Memory – isolated SPIKE for Issue #39

**Experimental only.** No production or Cloud Codex integration is claimed. This is a minimal MCP JSON-RPC stdio proof of concept with **no paid API** and no third-party Python dependencies. It deliberately does **not** implement NetClaw's semantic embeddings, automatic session observer, or token measurement.

## Run

Python 3.11+:

```bash
python -m unittest discover -s tools/project_memory -p 'test_*.py' -v
PROJECT_MEMORY_DIR=/tmp/mediarr-memory python tools/project_memory/server.py
```

Send newline-delimited JSON-RPC messages to stdin:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}
```

The server supports `tools/list`, `memory_record`, `memory_recall`, `memory_invalidate`, and `ping`. This implementation has **keyword overlap**, not semantic search; its estimated token count is a rough character heuristic, not measured model usage.

Data is stored outside the repository at `~/.local/share/mediarr-project-memory/memory.sqlite3` by default; override via `PROJECT_MEMORY_DIR`. The repository ID is hardcoded to `BMWfan/mediarr-card`; sources are restricted to this repo or synthetic `local-test:` fixtures. Do not commit databases, credentials, or user data. The secret filter is only a best-effort safeguard, not comprehensive secret scanning.

## Open gates before rollout

1. Verify MCP handshake against the actual local Codex client.
2. Verify whether GitHub Cloud Codex exposes this server or supports a pre-task memory step. No assumption that local hooks work in cloud tasks.
3. Evaluate NetClaw's FastMCP/SQLite/ChromaDB implementation and resolve package MIT vs repository Apache-2.0 licensing metadata before reusing code.
4. Add real semantic search, provenance checks, prompt-injection defenses, persistent backups, conflict handling, automatic curation and benchmark of **total** tokens.
5. Maintain SDD-Light, CI and HACS prerelease policies; no merge without owner approval.

See https://github.com/BMWfan/mediarr-card/issues/39.
