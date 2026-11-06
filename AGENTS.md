# Mediarr Card development rules

## SDD-Light workflow

Follow **Specify → Clarify → Plan → Tasks → Analyze → Implement → Verify → AI
Review → owner-approved Merge**. ChatGPT coordinates and provides technical AI
review; Copilot Coding Agent implements bounded tasks on separate branches and
opens draft PRs. Only the repository owner authorizes merges. Never auto-merge,
release, or deploy without explicit owner approval.

Size the work before implementation:

- **S** — focused bugfix; issue/PR scope and a regression proof.
- **M** — add a concise spec, plan, task checklist, and verification evidence.
- **L** — additionally document research, API contracts, migration, risks, and
  rollback.

Reusable issue outline (expand only what the selected size requires):

```text
Goal / user-visible behavior:
Acceptance criteria:
Out of scope:
Plan and bounded tasks:
Verification commands and expected results:
Risks, compatibility, and rollback (L):
```

PRs must link the issue/spec, describe the actual scope, list commands and
results, identify untested boundaries, and include relevant contract/security
evidence. Do not claim tests passed unless they were run. Give ChatGPT a concise
technical recommendation: approve, approve with risks, or reject. The PR template
captures this evidence.

Do not modify existing draft PRs BMWfan/mediarr-card#15 or #20, or the paired
BMWfan/mediarr_sensor#18 work, unless explicitly requested. Do not use production
credentials, production Home Assistant, unrelated refactors, or real provider
requests in tests.

## Development and verification

Use the existing checkout; cloud tasks are isolated already. Do not create a Git
worktree unless explicitly requested. See `dev/README.md` for the local Home
Assistant environment, requirements, overrides, and test scope.

- Fast checks: `npm run --prefix dev lint`, `npm run --prefix dev test:unit`,
  and `npm audit --prefix dev --audit-level=moderate`.
- Install/refresh integration environment: `bash dev/setup.sh`.
- Start and check authenticated API/sensor readiness: `bash dev/start.sh`.
- Test real Home Assistant rendering and state transitions: `bash dev/test.sh`.
- On cloud machines with Chromium installed, set `CHROMIUM_PATH=/usr/bin/chromium`
  for setup and tests. Otherwise setup installs Playwright's pinned Chromium.
- Use synthetic data only; never require production credentials for tests.
- Runtime state, local test credentials, screenshots, and dependencies are
  ignored. Never print or commit `dev/.runtime/local-auth.json` or HA storage.
- `scripts/build-single-file.sh` writes the tracked release bundle;
  `dev/setup.sh` builds in a temporary directory for safe development.
- After restoring a cloud snapshot, restart services and require actual test
  PASS; container health alone does not validate the card.
- Request tests mock Mediarr services; they do not validate real Radarr/Sonarr
  connectivity. See `dev/README.md` for additional tested and untested behavior.
- Unified overlay data/rendering lives in `media-library.js`. Update the module
  list in `scripts/build-single-file.sh` when adding bundle modules.

Releases run only through the manually dispatched workflow after explicit owner
authorization. Repository administrators must configure the `release`
environment to require owner approval; changing the version or merging to main
does not authorize a release.
