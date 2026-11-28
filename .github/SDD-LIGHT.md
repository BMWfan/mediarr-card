# Mediarr Card SDD-Light

## Constitution

- Keep changes scoped to the issue and preserve existing behavior unless a
  specification explicitly changes it.
- Treat the browser card and the paired Home Assistant sensor integration as
  separate components. State minimum frontend/backend versions and required
  backend services or commands; do not imply that card tests prove backend or
  production connectivity.
- Use synthetic data for local and CI tests. Never require, expose, or commit
  production credentials, local HA auth/storage, or personal account data.
- Keep generated release bundles and release automation intentional: develop
  with `bash dev/setup.sh` (temporary bundle); run
  `./scripts/build-single-file.sh` only when a distributable bundle is required.
- Keep changes to CI and release workflows out of SDD-Light work unless
  explicitly in scope.

## Roles and workflow

Use the stages in order, recording decisions in the issue or specification:

1. **Specify** — open or refine the GitHub issue; select S, M, or L and define
   problem, scope, non-goals, and acceptance criteria.
2. **Clarify** — resolve ambiguity, compatibility expectations, and testable
   outcomes with the issue owner before implementation.
3. **Plan** — describe the intended design, affected areas, dependencies, and
   verification.
4. **Tasks** — make the plan actionable as small, ordered tasks.
5. **Analyze** — check scope, edge cases, security/privacy, frontend/backend
   compatibility, test gaps, and rollback needs appropriate to the size.
6. **Implement** — ChatGPT coordinates and reviews; Copilot implements on an
   isolated branch and opens a draft PR. Keep changes focused and link the
   issue, plan, and evidence.
7. **Verify** — run relevant existing tests and record actual commands, results,
   and limitations. Use the synthetic Home Assistant/browser workflow described
   in `dev/README.md` for UI and state-transition changes. Generate the
   distributable with `./scripts/build-single-file.sh` only when needed and
   verify that the generated bundle is expected.
8. **AI Review** — have ChatGPT review the diff against the issue, plan,
   compatibility, tests, and security/safety constraints; resolve findings or
   record why a suggestion does not apply.
9. **Owner-approved Merge** — the user explicitly approves merge and any
   release. Agents do not merge, release, or deploy.

### Iterating on a UI design

When the owner is still deciding how a UI should look or feel, keep the design
round in one isolated draft PR. Use a short running note in the issue or PR:
what are we trying, and what should the owner see or be able to do? Revise
that note as the design changes. The SDD-Light stages apply to the design as
a whole; individual visual adjustments do not each need a new specification,
plan, or independent review.

Check each experiment according to its effect. For a change to banner fade
duration, inspect the transition in the UI. For a change to hover, focus, or
tap behavior, test the affected input methods. If an experiment changes cache
retention, resource use, or an action such as submitting a media request,
check that behavior and its risks during the experiment.

When the owner confirms the design, record the accepted behavior and criteria
in the issue or PR. Apply the appropriate specification size to the cumulative
diff and complete one final review of the whole change: regression and
accessibility checks, HACS build verification, and independent AI review.
Design acceptance settles what to ship. Publishing a prerelease, deploying,
and merging still require their respective explicit owner approvals.

### Specification size

- **S (Small):** issue and PR description, acceptance criteria, and regression
  proof. Use when the change is localized and its risks are low.
- **M (Medium):** add `spec.md`, `plan.md`, `tasks.md`, and `verification.md`
  using [the M templates](spec-templates/M/). Use for changes spanning multiple
  components or requiring coordinated behavior and tests.
- **L (Large):** include all M artifacts and add `research.md`, `contracts.md`,
  `compatibility.md`, `risks.md`, `migration.md`, and `rollback.md` using
  [the L templates](spec-templates/L/). Use for broad, cross-system, migration,
  or high-risk work.

Choose the smallest size that covers the uncertainty and risk; increase it if
clarification or analysis reveals broader impact. The PR template is
[`pull_request_template.md`](pull_request_template.md).

## Verification and coverage

`bash dev/setup.sh`, `bash dev/start.sh`, and `bash dev/test.sh` provide a
disposable Home Assistant/browser environment with synthetic fixtures; see
`dev/README.md` for prerequisites, test scope, and overrides. The suite covers
selected frontend rendering and state transitions, not every provider,
backend call, or production connection. In particular, request tests mock
Mediarr services and do not validate a real Radarr/Sonarr connection. Describe
uncovered areas honestly in verification notes.

The card frontend consumes data and services from the separate Mediarr sensor
integration. Confirm the minimum backend version and command/service support
for any feature that crosses that boundary; frontend mocks alone do not verify
backend implementation. Coordinate paired changes with that integration's
owner/repository rather than claiming this card repository verifies them.

## Token-efficient execution (SPEC #46)

Optimize **total task tokens**, not merely prompt length. Do not compromise correctness, tests, security, or owner approval to save tokens. Explicit user reading requirements and applicable instructions take precedence over this guidance; summaries never replace normative requirements.

1. **Start narrow:** identify issue scope, expected behavior and relevant file paths using filenames/search first. Read only matching source regions, nearby tests, and applicable instructions; expand only when evidence requires it. Avoid repository-wide dumps, full logs and unrelated history.
2. **Progressive context:** use short searches and bounded outputs (file paths, changed lines, failing stack traces). Request full files or large tool results only when needed to reason correctly. If a result is truncated, narrow the query or inspect the retained output before drawing conclusions. Never truncate away security-relevant errors or test failures.
3. **Small tasks:** one focused objective and acceptance criteria per task; reuse existing issue/spec decisions instead of repeating exploration. S tasks can live in issue/PR; M/L retain the full SDD-Light documents and risk analysis.
4. **Compact handoff:** when switching agents/sessions, pass issue/PR links, branch, exact changed files, verified decisions, test results, remaining blockers and next action. Use the [handoff template](spec-templates/handoff.md), aiming for at most 200 words unless correctness requires more. Replace stale summaries at task end; link complete evidence and preserve failed/unrun checks and coverage limits. Avoid copying full conversations or speculative summaries.
5. **Tool discipline:** avoid repeated identical calls; group independent lookups when safe, and inspect diffs before reading whole files. Do not add tools, embeddings, memory services or new paid API calls just to optimize context.
6. **Quality gate:** always run the smallest relevant tests first and expand when changes cross component boundaries; record failures and limitations. Do not skip required security, compatibility or release checks.
7. **Measure:** for comparable tasks, capture actual total input/output tokens (and cached tokens if exposed), tool calls, wall-clock time, test outcomes, review defects and rework. Compare with a baseline; if usage telemetry is unavailable, state **not measurable** instead of estimating savings.

### Context budget by size (guidance, not hard token caps)

- **S:** issue, relevant instructions, affected code and nearest tests; avoid unrelated specs.
- **M:** add scoped spec/plan/tasks, interfaces, affected dependencies and regression tests; retrieve supporting details incrementally.
- **L:** include architecture, contracts, compatibility, risks and rollback; broaden context deliberately, never by dumping the entire repository.

### A/B measurement template

Use the [matched-task protocol and detailed worksheet](spec-templates/token-benchmark.md) for independent baseline/optimized runs. Include handoff creation/maintenance, retries and rework in the total. Keep cached input as a subset when already included in input tokens; do not double-count it. Byte/word counts are not measured token savings.

| Task | Baseline/optimized | Model/config | Total input tokens | Total output tokens | Cached tokens (if available) | Tool calls | Duration | Tests/quality | Rework |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| Link to issue/commit | Baseline | Record | n/a | n/a | n/a | n/a | n/a | Record | Record |
| Same acceptance criteria | Optimized | Record | n/a | n/a | n/a | n/a | n/a | Record | Record |

Only claim token savings when measurements are comparable and actually observed. No automatic memory ingestion or MCP integration is implied by this section.
