# Plan

Specify/clarify: use the owner's banner report and observed code failure mode; M for shared asynchronous rendering, lifecycle and regression coverage. Actual live cause stays unverified.

Tasks: add a failing HA browser scenario, implement one shared candidate/backdrop loader in media-library.js, use it from classic details and cinema home, add source-selection tests, then run relevant model/browser suites and bundle consistency checks. Preserve test failures and actual outcomes in verification.md.

Analyze: validate URLs before use, preload candidates before replacing a working background, scope the last-good cache by stable entry key, cap it at 32 entries, guard callbacks by target generation/connection and bound each image wait. Prefer real landscape alternatives and last-good landscape over a portrait fallback. Avoid repeated work when inputs are unchanged. An entirely new title must clear stale art immediately. The cache is in-memory per card, never persisted or logged. No authenticated URL values in logs or fixtures; all regression artwork is local/synthetic.

Rollback: revert frontend source/test/bundle changes together; no migration or backend dependency. Keep a separate branch based on current main; do not alter the existing Seerr PRs.
