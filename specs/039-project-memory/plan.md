# Plan — SPEC-039

## Design and affected areas
- Isolated `tools/project_memory/` stdio MCP server, SQLite database outside the checkout, source-bound records, keyword recall, invalidation.
- Future work only after review: evaluate NetClaw FastMCP/Chroma/embeddings, session observation, curation and true semantic retrieval.
- Do not alter `AGENTS.md`, CI, release workflows or generated bundles in this spike.

## Dependencies and compatibility
- Initial prototype has no third-party runtime dependencies or external LLM calls.
- NetClaw upstream is a reference, not copied into this spike. Before code reuse resolve upstream package MIT vs root Apache-2.0 metadata.
- GitHub-hosted Codex MCP access and persistence remain unverified; never infer cloud support from local MCP support.

## Verification approach
- Execute `python -m unittest discover -s tools/project_memory -p 'test_*.py' -v`.
- Manually exercise JSON-RPC MCP handshake and persistence across process restarts.
- Review security: source boundary, injection, secrets, path access and unauthorized writes.
- Compare equivalent tasks with/without memory using total actual tokens; do not report estimates as measured savings.

## Follow-up phase (out of scope for this spike)

- New SDD-Light SPEC: [#43](https://github.com/BMWfan/mediarr-card/issues/43) covers automatic Codex Cloud provisioning and memory durability across independent tasks.
- Keep #40 as an isolated draft PoC. Do not claim same-machine process restart tests prove cross-task persistence.
- Architecture selection, remote hosting, credentials, deployment and costs require explicit owner approval. No CI/release modifications in #40.
