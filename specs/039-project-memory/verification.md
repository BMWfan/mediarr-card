# Verification — SPEC-039

## Commands and results
- Proposed: `python -m unittest discover -s tools/project_memory -p 'test_*.py' -v`.
- **Not yet executed in target GitHub/Codex environment.** No test pass is claimed.

## Manual checks
- MCP stdio initialize, tools/list, tools/call: pending.
- Persistence across process restart: pending.
- Cloud Codex agent MCP access: pending; documentation alone is insufficient.

## Coverage gaps and limitations
- Prototype uses keyword overlap, not semantic embeddings; token estimate is not measured usage.
- No session observer, auto-curation, remote persistence, authentication or full prompt-injection/secret protection.
- No HA UI/backend changes; existing HA/browser suite not run for this isolated tooling spike.
- Do not merge until security and functional findings are addressed, tests run and owner explicitly approves.
