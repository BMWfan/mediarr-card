# Verification — SPEC-039

## Commands and results
- Proposed: `python -m unittest discover -s tools/project_memory -p 'test_*.py' -v`.
- **Not executed successfully.** Attempted to clone the feature branch into the isolated test container, but DNS resolution of github.com failed (`Could not resolve host: github.com`). Consequently no unittest or runtime MCP handshake passed; no test pass is claimed.

## Manual checks
- MCP stdio initialize, tools/list, tools/call: pending.
- Persistence across process restart: pending.
- Cloud Codex agent MCP access: pending; documentation alone is insufficient.

## Coverage gaps and limitations
- Prototype uses keyword overlap, not semantic embeddings; token estimate is not measured usage.
- No session observer, auto-curation, remote persistence, authentication or full prompt-injection/secret protection.
- No HA UI/backend changes; existing HA/browser suite not run for this isolated tooling spike.
- Do not merge until security and functional findings are addressed, tests run and owner explicitly approves.

## AI review — initial findings

- **Fixed:** secret-detection regex contained escaped backslashes, making expected credential matches fail. Corrected in commit `102bda9`.
- **Open, high:** source URL validation is not sufficient authentication/provenance; MCP clients can submit arbitrary purported facts. Restrict write permissions and mark content as untrusted before rollout.
- **Open, high:** no full secret scanning; do not ingest production data or external issue text automatically.
- **Open, medium:** MCP JSON-RPC interoperability needs actual client tests, including protocol framing/version and error handling.
- **Open, medium:** persistence, duplicate behavior and token estimates need runtime verification.
- **Open, design:** semantic retrieval and cloud Codex integration are not implemented; keyword overlap is explicitly only a spike.

**Review disposition:** do not merge. Continue with reproducible tests and a real Codex cloud compatibility gate.

## 2026-11-15 — isolated local verification

The exact Python source text fetched through the GitHub connector was reproduced in an isolated local container (direct `git clone` unavailable due to DNS failure). Tests therefore verify the fetched source copy, **not** a GitHub Actions runner or a live Codex cloud environment.

Command: `python -m unittest discover -s tools/project_memory -p 'test_*.py' -v`

Result: **3 tests passed, 0 failed** (0.013 s):
- `test_mcp_handshake` — OK
- `test_persistence_recall_dedup_and_invalidation` — OK
- `test_repository_source_boundary_and_secrets` — OK

Additional subprocess integration test: launched `server.py` with newline-delimited JSON-RPC initialize, tools/list, memory_record, memory_recall; received four responses, listed three tools, and recalled the stored synthetic decision. Restarted the Python process using the same temporary data directory and recalled one persisted memory. **Passed**.

### Remaining gates
- Real MCP client compatibility (Codex local/cloud): **not executed**.
- Authentication, robust secret scanning, prompt-injection handling, concurrent writes and repo-isolation under hostile input: **not established**.
- Semantic search, automatic memory creation, total-token savings: **not implemented/measured**.
- Do not merge or release without explicit owner approval.
