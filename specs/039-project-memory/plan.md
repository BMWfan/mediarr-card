# Plan — SPEC-039

## Design and affected areas
- Isolated `tools/project_memory/` stdio MCP server, SQLite database outside the checkout, source-bound records, keyword recall, invalidation.
- Future work only after review: evaluate NetClaw FastMCP/Chroma/embeddings, session observation, curation and true semantic retrieval.
- Original MCP spike did not alter `AGENTS.md`. The user-authorized compact-context follow-up below adds a reading route there; CI, release workflows and generated bundles remain unchanged.

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

## Compact-context follow-up — authorized 2026-11-16
Problem: repeatedly reading full specs and historical logs wastes context. Keep the existing M spec and Draft PR #40; no additional service or PR.

Plan: add PROJECT.md (at most 300 words), a matching issue handoff (at most 250 words), a handoff template, selective-reading instructions and a benchmark protocol. No global list of every past issue; select by issue/spec path. Read relevant normative spec/plan/tasks before implementation; consult verification summaries first and historical evidence when needed. Explicit user instructions override this default.

Tasks: write the compact artifacts, add the AGENTS route, summarize current verification without deleting logs, validate local links/budgets and review the diff. Document actual byte/word counts; total-token and quality benchmarking remains open until independent usage data is available.

Analysis: handoffs can become stale or omit failures. Include checked revision, evidence pointers, blockers and next action; reconcile against git/source on entry. Treat memory as untrusted context, never authorization. Replace stale summaries instead of appending transcripts. Rollback removes the new routing/docs; no runtime or database change.
