# Verification

Current status: synthetic failure reproduced and corrected; full relevant local suite passes. Live source URL/data not accessed. No causal claim for the owner's installation.

Branch fix/banner-refresh is based on main d94fbb62d3d359fac73790285188385f5b66436b, separate from Drafts #48/#33. Original main AGENTS.md and SPEC-046 rules apply. Read only artwork selection/render paths and closest tests. Tokens/cache usage remain UNMEASURED; no savings claim. One initial execution attempt during environment resume had no usable executor; readiness was then restored before repository work. Scoped reads that truncated were narrowed.


## Actual red/green evidence

Original banner selection takes the first syntactically accepted URL and immediately assigns CSS backgroundImage. A non-decodable preferred source prevents valid alternatives being used. No live customer URL was read; HTTP expiry, lost artwork after ISO replacement or another cause in the owner's installation is not asserted.

The final HA browser test intercepts only local synthetic `banner-*.svg` paths. Missing artwork returns 404 with a non-image body; good candidates return the local SVG fixture. Initial harness attempts timed out before the tested assertion because `page.waitForFunction(document.querySelector(...))` cannot cross HA shadow roots; corrected to evaluate the Playwright-located backdrop. Also reset retained detail selection when moving from the earlier classic-view checks to the synthetic cinema setup. These are test-harness failures, not red proof. An intermediate 404 fixture mistakenly returned a valid SVG body, which the browser decoded; corrected the fixture to non-image content before claiming a failed-image reproduction.

For valid red proof, built the exact origin/main source in a temporary directory using `git archive origin/main -- '*.js' scripts/build-single-file.sh` and its build script. Temporarily served that baseline bundle to the local HA instance, ran the corrected `CHROMIUM_PATH=/usr/bin/chromium node tests/e2e/metadata.mjs`, and restored the tested candidate bundle with a shell EXIT trap. Actual baseline test exit 1 (`/tmp/banner-valid-baseline-red.exit`):
```text
locator.evaluate: Error: Expected synthetic backdrop banner-alternative;
actual=url("/local/banner-missing.svg"); connected=true; class=cinema-hero-backdrop
```
The baseline reproduction wrapper verified this specific failure, exited 0, and restored the candidate; byte comparison to `/tmp/banner-tested-candidate.js` passed before subsequent tests.

Candidate: the same corrected metadata browser suite exits 0, nine checks PASS. Five new checks cover invalid preferred banner fallback; metadata-only alternative updates despite unchanged preferred URL; last-good same-title artwork across home/details, sparse refresh and mobile; delayed old-title response after a title change; empty library clearing stale artwork. Existing four metadata/race/authentication checks remain passing. Synthetic test artifacts and image URLs contain no customer data or credentials.

## Final commands/results

From /workspace/mediarr-card:
- `node --test tests/*.test.mjs`: exit 0; 31 tests passed, no failures/cancelled/skipped. Two new model tests exercise landscape ordering/deduplication and unsafe URL/poster exclusion.
- `CHROMIUM_PATH=/usr/bin/chromium bash dev/setup.sh` and `bash dev/start.sh`: exit 0; real local HA reports authenticated API, RUNNING state and synthetic fixture PASS. No production connectivity.
- `CHROMIUM_PATH=/usr/bin/chromium bash dev/test.sh`: direct exit 0, persisted in `/tmp/banner-full-suite.exit`; complete log `/tmp/banner-full-suite.log`: 6 release tests OK, 31 model tests passed (0 failed/cancelled/skipped), 81 browser checks PASS: legacy18/library14/metadata9/catalog8/full-library6/provider3/cinema13/security10.
- `bash scripts/build-single-file.sh`, `node --check mediarr-card.js`, `cmp mediarr-card.js dev/.runtime/config/www/mediarr-card.js`, `git diff --check`: exit 0. Committed bundle is the tested candidate, generated intentionally for existing consistency CI; no release/version bump.

Counts differ from Issue #44 because this separate branch is based on main, without that unmerged Seerr change. Neither existing Draft PR was changed by this banner fix.

## AI review / limits

Shared loader validates each candidate via existing mediaImage and actual Image load, retains the previous successful same-title landscape while probing, scopes cache to stable entry keys, caps cache at 32 URLs and waits at most five seconds per candidate. Cancellation/generation and connection checks prevent late events writing a disconnected/currently repurposed target; empty cinema hero is explicitly cleared before DOM reuse. Cinema signature includes alternate URLs, identity and poster so a metadata-only update cannot be skipped. Cache is session-only, not persisted, logged or used for ownership/authentication. No backend interface, key, network policy, CI/release workflow or dependency change. Existing image-source URLs may still fail; if every source fails no new artwork can be invented. The live incident still needs owner validation using a build containing this correction.

Actual token input/output/cache counters and whole-task tool/time total are UNMEASURED; no estimates or savings claim. Failed harness attempts and full reruns are retained above as actual rework. No paid API/model task, production access, merge or release. Draft preparation/actual creation result to be recorded after push.
