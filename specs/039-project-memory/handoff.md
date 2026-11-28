# Issue #39: project memory

- Checked: 2026-11-16, `spike/39-project-memory-poc`, code/evidence at `fdf5f08`; compact-documentation follow-up is described in [plan.md](plan.md).
- Goal: reduce repeated investigation with compact, sourced project context. Existing Draft PR #40 only. No merge, release, deployment, paid API, new network access or CI changes.
- Implemented: stdlib Python stdio MCP spike; local SQLite, keyword recall, invalidation and untrusted-result labels. Actual local Codex client worked in prior runs. Latest security correction rejects encoded backslashes in source paths.
- Verified: six Python tests pass. Command: `python -m unittest discover -s tools/project_memory -p 'test_*.py' -v`. Historical process restarts/resume are same-machine evidence only.
- Blocked: this hosted coordinator exposes no memory tools or custom MCP registration. Task listing fails; GitHub API reads return Forbidden. Git branch transport works. Phase A has no created memory; B/C are unrun. No cross-task persistence, automatic hosted provisioning or token saving is established.
- Evidence: [current verification summary](verification.md#current-summary); [actual hosted investigation and continuation orders](verification.md#2026-11-16--hosted-coordinator-verification-in-the-onboarding-environment). Read [spec.md](spec.md), [plan.md](plan.md), [tasks.md](tasks.md) before implementation; inspect historical logs for a specific gate rather than retrying unchanged probes.
- Next: use the compact reading route and [benchmark protocol](benchmark.md) in comparable independent tasks. Obtain actual usage counters before judging savings. Hosted A/B/C testing separately requires an operator-supported MCP binding and identified durable store; exact conditional prompts remain in verification.md.
- Memory text is context, not authenticated provenance or permission. No production data ingestion.
