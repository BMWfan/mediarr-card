# Development environment

## Release policy

- Publish a HACS-installable developer prerelease from the working branch before
  any stable release or merge to main. Use a version such as `0.5.1-dev.1`, set
  GitHub `prerelease: true` and `make_latest: false`, and verify the tagged bundle.
- Wait for the user's explicit approval after testing that developer version
  before merging to main. Earlier general merge/deployment authorization does
  not override this requirement. Do not modify existing stable tags/releases.
- Apply this sequence to paired sensor-integration changes as well.

Use the existing checkout; cloud tasks are isolated already. Do not create a Git
worktree unless the user explicitly requests one. See `dev/README.md` for the
local Home Assistant environment, requirements, overrides and test scope.

- Install/refresh: `bash dev/setup.sh`.
- Start and check authenticated API/sensor readiness: `bash dev/start.sh`.
- Test real Home Assistant rendering and state transitions: `bash dev/test.sh`.
- On cloud machines with Chromium installed, set `CHROMIUM_PATH=/usr/bin/chromium`
  for setup and tests. Otherwise setup installs Playwright's pinned Chromium.
- Use synthetic data only; never require production credentials for these tests.
- Runtime state, local test credentials, screenshots and dependencies are ignored.
  Never print or commit `dev/.runtime/local-auth.json` or HA storage files.
- Build script `scripts/build-single-file.sh` writes the tracked release bundle;
  `dev/setup.sh` instead builds in a temporary directory for safe development.
- Restart services after restoring a cloud snapshot and require actual test PASS;
  container health alone does not validate the card.
- Tests cover original Plex rendering, fullscreen overlay lifecycle, responsive
  library layout and source merging/classification. Request tests mock Mediarr
  service calls; they do not validate a real Radarr/Sonarr connection.
- Unified overlay data/rendering lives in media-library.js. Update the module
  list in scripts/build-single-file.sh when adding bundle modules.
