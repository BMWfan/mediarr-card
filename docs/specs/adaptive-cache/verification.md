# Verification (2026-11-15)

Local disposable Home Assistant Core 2026.11.1, loopback port 8125, synthetic
sensor/provider fixtures, system Chromium and the locked Playwright dependency:

- `CHROMIUM_PATH=/usr/bin/chromium HA_DEV_RUNTIME_DIR=... HA_DEV_PORT=8125 bash dev/setup.sh`: PASS; temporary bundle build and pinned HA image pull.
- `bash dev/start.sh` with the same environment: PASS; authenticated RUNNING HA and fixture readiness.
- `bash dev/test.sh`: model/release and all browser groups exercised. **34 model,
  7 release-policy, 81 browser checks** pass, including the final targeted Cinema
  rerun (18 checks) after allowing HA's responsive layout to settle on resize.
- Cinema covers empty-load reel/reduced motion, silent background refresh,
  unchanged image DOM, retained rows on outage, signed grant renewal without
  artwork reload, selective failed-image recovery and existing trilogy/mobile UI.
- Model regressions cover learned IDs before source merging, movie/TV ID collision,
  availability transitions without losing the film and rejected metadata mismatch.
- `bash scripts/build-single-file.sh`, `node --check mediarr-card.js` and
  `git diff --check`: PASS. HACS consumes the generated root bundle.
- Paired backend: **82 tests PASS** on asserted HA 2026.11.1; real authenticated
  command/config-flow smoke also PASS with current backend source installed in
  the disposable runtime. See backend `specs/adaptive-cache/verification.md`.

Screenshots in the ignored runtime include `cinema-cache-initial.png`,
`cinema-cache-retained.png` and existing collection desktop/mobile/overlay views.
CI uploads its synthetic screenshots/logs through the existing workflow.

Provider replies/storage are simulated. This does not prove production
Plex/Seerr connectivity, physical playback or Safari behavior. Backend restart
persistence is tested by recreating clients against simulated storage.
Exact CI commit/artifacts and tagged-bundle verification are recorded on the PR.
Owner tests the developer pair before approving any main merge/stable release.
