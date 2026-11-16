# SPEC-046: scoped context review (S)

## Problem, scope and acceptance

Issue [#46](https://github.com/BMWfan/mediarr-card/issues/46), existing Draft [PR #47](https://github.com/BMWfan/mediarr-card/pull/47). Reduce actual total development tokens without weakening quality, safety, testing or owner gates. This is a scoped documentation follow-up, size S: the issue and PR define the specification. No product code, runtime memory, MCP, embeddings, CI/release changes or deployment. Do not import the #39/#43 architecture.

Acceptance: concrete S/M/L guidance; one short AGENTS pointer; usable compact handoff and comparable actual-token A/B protocol; preserved existing gates; honest unmeasured status.

## Clarify, plan, tasks and analysis

User requested work on PR #47. Read the live public PR/issue pages, branch AGENTS.md, SDD-LIGHT.md and existing templates. Baseline head `a10f4cd453995d30409984fff59c1dc0e90d9d81`, branch `docs/46-token-efficient-sdd-light`, base main `4a71fb220f539acdcaa2a4e278a2cd6aa44f0faa`. Public PR page reports Draft and no reviews; no review comments were visible in the returned page. GitHub API access fails, so no claim of complete hidden/paginated review discovery.

Plan before editing guidance: preserve existing seven principles and AGENTS pointer; add handoff template, rigorous measurement template, explicit instruction precedence and concise task-end maintenance. Validate links/anchors, preserved gates and changed-path scope; record real checks here. Risks: shorter outputs can hide failures; summaries can become stale; A/B arms can differ in task difficulty or caching. Mitigate with complete failure access, revision/evidence links, matched tasks and separate cache/cost accounting. Rollback is removal of documentation additions; no migration.

- [x] Specify/clarify scope from #46 and #47.
- [x] Plan focused documentation changes and validation.
- [x] Analyze context loss and measurement confounders.
- [x] Implement reusable templates and scoped guidance.
- [x] Verify local links, anchors, gate preservation and changed paths.
- [x] AI review against acceptance criteria.
- [ ] Collect real independent-task A/B usage/quality evidence.
- [ ] Owner approval/merge (not authorized by this task).

## Commands and actual observations — 2026-11-16

From `/workspace/mediarr-card`:

- `git status -sb`: clean prior branch `spike/39-project-memory-poc`; preserved its commits, no worktree created.
- `gh pr view 47 --repo BMWfan/mediarr-card --json title,body,headRefName,headRefOid,baseRefName,isDraft,reviews,comments,url`: exit 1, `Post "https://api.github.com/graphql": Forbidden`.
- `git ls-remote origin refs/pull/47/head`: exit 0, `a10f4cd453995d30409984fff59c1dc0e90d9d81`.
- `curl -L --fail --max-time 20 -sS https://github.com/BMWfan/mediarr-card/pull/47 -o /tmp/mediarr-pr47.html`: exit 0; parsed visible HTML text to read title/body, Draft label and branch.
- `git fetch origin refs/pull/47/head`: exit 0. `git ls-remote --heads origin` independently matched `docs/46-token-efficient-sdd-light` to the PR head SHA.
- `git switch -c docs/46-token-efficient-sdd-light FETCH_HEAD`: exit 0.
- `curl -L --fail --max-time 20 -sS https://github.com/BMWfan/mediarr-card/issues/46 -o /tmp/mediarr-issue46.html`: exit 0; parsed issue body states no memory architecture and defines acceptance above.
- Initial `git diff --stat main FETCH_HEAD` could not resolve a local main ref; used the verified base SHA `4a71fb2` instead. Initial search including absent `specs/` reported that missing directory; scoped follow-up to the actual `.github` / `docs` paths. Neither failure is represented as a successful check.

## Coverage limits

No actual A/B model-task usage dataset has been collected; token savings, cost savings and quality impact are UNMEASURED. The measurement template is a protocol, not evidence of a result. No paid/model task launched to populate it. No runtime tests needed for documentation only; no HA startup or release build. Existing hidden/paginated GitHub reviews and current check-run status are not established by public HTML.

## Final documentation validation and AI review

Executed a Python standard-library check in the repository root: parsed relative Markdown links in `.github/SDD-LIGHT.md`, the handoff and token-benchmark templates and this document; asserted each target exists and each present fragment matches a heading. Compared SDD-Light's entire pre-token-efficiency section byte-for-byte with `git show a10f4cd:.github/SDD-LIGHT.md`; asserted no AGENTS diff relative to that head. All checks exited 0:

```text
PASS links: .github/SDD-LIGHT.md
PASS links: .github/spec-templates/handoff.md
PASS links: .github/spec-templates/token-benchmark.md
PASS links: docs/specs/token-efficient-sdd-light/verification.md
PASS: constitution, lifecycle, test/backend gates unchanged; AGENTS pointer unchanged
Handoff template words: 116
```

`git diff --check` exited 0. Inspected all changed/new paths: only scoped guidance, two reusable documentation templates and this S-sized specification/verification record. No changes to application/tests/dependencies, workflows or generated files. Templates are linked for use when needed, not mandatory bulk context at every task start.

AI review disposition: documentation acceptance criteria satisfied. Explicit user reading requirements take precedence, compact handoffs link full evidence and preserve failures, and output truncation requires follow-up. Benchmark protocol controls task/source/model/settings, alternates order, isolates arms, includes continuation/maintenance/retries, preserves failed runs, separates cached/billed usage, and records quality/rework. Existing seven principles and S/M/L guidance retained; the AGENTS pointer is still short and unchanged in this follow-up. No memory-spike files imported. Runtime tests intentionally not run for documentation-only changes. Actual total-token benchmark remains an open gate; no usage or savings values fabricated. Retain Draft PR #47; no merge/release/deployment.
