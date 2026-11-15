# Verification — SPEC-043

## Status
**Cloud A/B test not yet executed.** The GitHub integration cannot start independent Codex Cloud tasks. The instructions below are ready to run; no automatic-read or token-saving claim is made.

## Test A — clean independent Codex Cloud task
- Select repository `BMWfan/mediarr-card`, branch `spec/43-curated-cloud-memory`; create a **new** cloud task, not a continuation of the SPEC-039 task.
- Prompt: `Read the repository instructions normally. Without relying on this prompt for any memory contents, report whether project memory was automatically discovered, and identify the active record concerning review-gated writes with its exact ID and source. Do not change files.`
- Evidence: task ID, branch HEAD, actual AGENTS.md discovery, which files were opened and when, retrieved record ID/source, and whether the task was explicitly prompted to read memory.
- Distinguish *automatic discovery* from reading prompted by the test text. The prompt above asks about memory, so it **cannot by itself prove automatic reading**.

## Test B — different fresh Codex Cloud task
- Start a second separate task with a fresh checkout of the same branch; do not reuse task A's session or workspace.
- Prompt: `Before modifying anything, explain the repository's policy for persisting project-specific decisions, cite the repository file and source record you used, and state whether any candidate entries may be committed without review. Do not change files.`
- Evidence: independent task ID, branch HEAD, startup logs, memory file access, exact source/record, and isolation from task A's workspace.
- This tests *durable Git-backed read*, **not** new memory writes between tasks; write persistence needs a separately reviewed PR commit and fresh checkout.

## Negative checks
- Create synthetic, unreviewed candidate only on a temporary branch or fixture; verify it is not presented as approved. Never merge fixture.
- Verify superseded entries are excluded from recommendations; cross-repo URLs are rejected in proposed records; memory-embedded imperatives are ignored as untrusted data.
- No credentials, production HA data, external services, CI changes or paid APIs.

## Evidence and benchmarks
Record actual commands, test IDs, output, pass/fail, runtime, token use if exposed, and failure modes. For token comparison, use equivalent tasks with and without relevant memory, and compare **total** tokens including startup instructions. If metrics are not available, mark as blocked.

## Initial AI review findings
- **Fixed on branch:** draft `decisions.md` previously said “Reviewed” despite no owner review or merge; now explicitly marked *Proposed*.
- **Open:** AGENTS.md startup pointer does not prove Codex reads memory automatically.
- **Open:** branch-local memory is not durable across tasks that check out `main` until a reviewed merge.
- **Open:** negative security tests, actual independent task logs and token benchmark.
- **Open:** no automated schema validation; manual review is the current write gate.

**Merge gate:** draft PR only; explicit owner approval after independent task verification and review.
