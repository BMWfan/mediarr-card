# SPEC-043 — Curated cloud project memory (M)

Goal: read concise reviewed Git-tracked project memory at Codex task startup and preserve it across independent hosted tasks without paid APIs. Owner-approved write review is mandatory. No secrets, production HA data, cross-repository access or automatic commits to main.

Acceptance: (1) new cloud task independently discovers relevant reviewed entry; (2) second clean cloud task finds the same Git-tracked entry; (3) unreviewed candidate is not treated as approved; (4) malicious instructions inside data ignored; (5) source and status checked; (6) actual logs and token measurements recorded or limitations stated. Existing frontend/backend and CI/release unchanged. See #43.
