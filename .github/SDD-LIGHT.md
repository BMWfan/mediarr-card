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
