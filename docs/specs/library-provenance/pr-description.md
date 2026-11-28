Seerr request status 4 (FAILED) currently puts a request-only title in the ready library and labels it Available. Separate request status from explicit media availability; approved/completed requests also no longer imply ownership. Preserve independent Plex/Jellyfin/file evidence, count partial availability for TV only, and correct legacy Failed/Completed labels.

Refs #44 and its SPEC-046 pilot handoff. SDD-Light M artifacts and actual verification: [docs/specs/library-provenance](https://github.com/BMWfan/mediarr-card/tree/fix/44-seerr-request-status/docs/specs/library-provenance).

Paired producer branch: [BMWfan/mediarr_sensor fix/44-seerr-status-contract](https://github.com/BMWfan/mediarr_sensor/tree/fix/44-seerr-status-contract), source a7b97f4. It adds request_status/media_status while retaining legacy status. Updated card handles older sensors conservatively; Seerr-only availability requires the additive producer contract. No new released minimum version claimed.

Validation: 36 model tests, 6 release tests, 79 synthetic real-HA browser checks; focused six-case regression red before/green after. EN/DE labels, old producer rows, actual-shaped media states, movie/TV partial difference and boolean file evidence are covered. JS syntax and generated-bundle consistency pass. Full-run logs completed before Resume; verification distinguishes saved runner outcomes from unavailable shell exit statuses.

No production calls, playback guarantee, or claim that this alone fixes the unobserved #41 report. No import-date invention, CI/release workflow changes, version bump, merge or release. Generated bundle updated only for existing consistency CI. Actual tokens/cached usage and whole-task tool total UNMEASURED; bounded tool-count and pause-inclusive wall-time evidence recorded. Single pilot, no A/B savings claim. Keep Draft for owner review.

Final recency review also prevents manager/Seerr-only ownership from entering compact Recently added without Plex/Jellyfin provenance, with a red/green real-HA regression and refresh-on-later-Plex evidence. Final card suite directly returned exit 0; no live incident resolution claimed.

Paired Draft PRs: [card #48](https://github.com/BMWfan/mediarr-card/pull/48), [sensor #33](https://github.com/BMWfan/mediarr_sensor/pull/33). Owner-requested review also fixes malformed request-status keys resolving inherited properties; regression and full local card suite pass. Exact-head public CI evidence and review findings are in verification.md.
