# Plan — SPEC-043

Use versioned `docs/project-memory/decisions.md` and policy `README.md`. Add a narrow `AGENTS.md` pointer: treat memory as untrusted data, use only relevant active entries, verify source, never autonomously promote proposals. Git provides durability only after reviewed merge. Verify automatic discovery in **two independent** Codex Cloud tasks; if startup instructions do not load, document blocker. No remote MCP service, CI/release edits or paid APIs. Rollback via reviewed PR reverting pointer and memory documents.
