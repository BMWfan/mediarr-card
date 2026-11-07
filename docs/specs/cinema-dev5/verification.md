# Verification and technical AI review

Date: 2026-11-07. Baseline/tag/PR #20 head:
`fc755ec891366836961c9e8452d36847eb774ee8`.

## Actual results

- `node tests/cinema-library.test.mjs`: 3 passed.
- `node tests/media-library.test.mjs`: 20 passed.
- `node tests/media-metadata.test.mjs`: 3 passed (26 model checks total).
- `node --check mediarr-card.js` and `node --check tests/e2e/cinema.mjs`: passed.
- `bash scripts/build-single-file.sh`: passed; generated bundle has no diff.
- Downloaded published tagged `mediarr-card.js`: SHA-256 identical to build;
  see testing guide. No imports, runtime version and package version match.
- GitHub release API: dev.5 is published with `prerelease: true`, `draft: false`;
  sensor dev.3 is also a published prerelease.
- HACS upstream `repositories/plugin.py::update_filenames` resolves the configured
  root filename, and `repositories/base.py::get_releases` includes prereleases
  when beta versions are enabled. No release asset is needed for this manifest.
- Inspected sensor tag dev.3 `playback.py`, `cinema.py`, `collections.py` and
  manifest. Player fields and absent control command are reflected in the new
  synthetic browser regression and compatibility notes.
- `git diff --check`: passed.

## Browser evidence and limits

Existing PR #20 commit CI passed:
https://github.com/BMWfan/mediarr-card/actions/runs/42398427207
This is prior evidence for the baseline, not a run of the new test.

Attempted `CHROMIUM_PATH=/usr/bin/chromium bash dev/setup.sh`: build and locked
Playwright dependency installation succeeded. Pull/extraction of the pinned HA
image failed with `failed to register layer ... no space left on device`.
The managed Docker daemon is reachable and reports no installed images or
containers after the failure. This local limitation was subsequently covered by
a successful hosted CI run for PR #30 head `d5a5766396406cb794a22f57de6c821a077ae740`:
https://github.com/BMWfan/mediarr-card/actions/runs/42403962488

The run passed HA startup/configuration validation, 26 model tests and 65 browser
checks (18 legacy, 14 library, 4 metadata, 8 catalog, 6 full-library, 3 provider
configuration, 12 Cinema). Logs explicitly confirm the added dev.3 regression.
The upload step warned that no files were found, so screenshots/result artifacts
are unavailable for this run; the job logs are the verification evidence. Artifact
collection remains an inherited CI limitation, outside this documentation/test
preparation. No local browser PASS is claimed. The new regression verifies the dev.3 player shape,
live-state display, unknown pause command upgrade message, unchanged state and
successful play request. It mocks backend responses, not a running dev.3 backend.

HACS installability is verified from published metadata, exact downloadable bytes
and HACS resolution code. No interactive HACS installation or production instance
was accessed. Provider connectivity, TMDB consent, physical Plex playback and
end-to-end operation with the installed sensor dev.3 remain owner test items.

## Review recommendation

**Approve with risks** for documentation/test preparation: hosted browser CI
passed, including the new regression. Keep Draft for owner review and instance
testing. Screenshot artifacts were not uploaded; see the log evidence above. The published artifact is unchanged. Full pause/resume
compatibility with sensor dev.3 is explicitly unsupported, and the guide explains
the existing upgrade prompt. The inherited automatic release workflow remains a
separate known risk tracked by #21/#24; no workflow dispatch or main push was made.
No secrets, runtime credentials, generated artifacts, deployment or Copilot
assignments are included. Owner approval is still required for merge/publication.
