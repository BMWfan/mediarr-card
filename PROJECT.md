# Mediarr Card: project index

Navigation, not a substitute for source or task requirements. Checked 2026-11-16 against `fdf5f08`; reconcile with the current checkout before acting.

## Start a task

1. Read applicable AGENTS.md instructions and check `git status -sb` / `git log -1`.
2. Read this index, then the matching issue's `handoff.md` if present. Locate it with `rg --files specs docs/specs -g handoff.md`; do not read unrelated handoffs.
3. Follow [.github/SDD-LIGHT.md](.github/SDD-LIGHT.md). For implementation, read the relevant spec, plan and tasks. Start verification review with its current summary; open historical logs when diagnosing or checking evidence. Explicit user requests to read full documents take precedence.

## Source map

- Card entry/configuration: `mediarr-card.main.js`.
- Unified library and compact overlay: `media-library.js`; metadata: `media-metadata.js`.
- Cinema: `cinema-library.js`, `cinema-styles.js`.
- Legacy providers: `*-section.js`, shared `base-section.js` and `styles.js`.
- `mediarr-card.js` is the generated HACS bundle; develop with `bash dev/setup.sh` to avoid rewriting it.
- The sensor backend is a separate repository; frontend mocks do not establish production connectivity.

## Checks and evidence

[dev/README.md](dev/README.md) documents synthetic Home Assistant/browser setup. Select checks for the actual change; UI changes require meaningful browser evidence. Documentation changes need link/content review, not HA startup.

Project-memory tooling is experimental: [SPEC-039 handoff](specs/039-project-memory/handoff.md). Hosted MCP and independent-task persistence remain unverified.

## End a task

Update only the relevant handoff using [the template](.github/spec-templates/handoff.md), keeping it within 250 words. Replace stale statements; retain detailed evidence in verification.md. Keep this index within 300 words and free of session logs, credentials and changing issue inventories. Never claim measured token savings from file size alone.
