# Cinema dev.5 prerelease verification (SDD-Light M)

Related: #20, #27 (resolved conflict/test evidence), #21 (workflow governance).

Goal: establish an actionable HACS test path for existing card v0.6.0-dev.5
and sensor v0.8.0-dev.3 without publishing or changing existing release contents.

Acceptance: verify immutable tag/build/HACS metadata, document the exact dev.3
contract and unsupported controls, run available automation including a dev.3
regression, document existing-instance installation and rollback, and open a
separate Draft PR. No merge, deployment, Copilot assignment or AI agent credits.

Clarification from inspection: dev.5 was already published before this task;
PR #20 now recommends sensor dev.4. Requested dev.3 supports Cinema/play with
reduced functionality, not the newer pause/resume API. User instructions override
the pending governance documents' suggested Copilot implementation role.

Out of scope: frontend/backend runtime changes, release-workflow hardening
tracked in #21/#24, changes to PR #20, tags/releases and production access.
