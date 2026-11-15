# Verification

- Regression before fix: same-day sensor rows with date-only `added` and distinct
  Unix `added_at` values put Alpha before the later synthetic Odyssee import.
  Trending correctly recognized the same ID as ready, reproducing the order bug.
- After fix: all **36 model tests PASS**. Source precedence, numeric seconds/
  milliseconds/ISO timestamps, invalid fallback and exclusion of update/release
  fields are covered. Existing explicit unseen/kind/genre/collection filters stay.
- Disposable HA Core 2026.11.1 setup/start PASS; **7 release-policy + 82 browser
  checks PASS**, including 19 Cinema checks. New browser regression verifies the
  latest same-day import is first in both full and compact mode and has the same
  availability checkmark in Trending.
- Bundle rebuilt, `node --check mediarr-card.js` and `git diff --check` PASS.
- Final CI and HACS tagged-byte verification will be recorded on the PR.

## AI review
Raw precision precedes lossy display dates; library source references precede
merged manager/discovery values. Compact change detection uses the resolved
sort timestamp so date changes are not missed. Missing dates remain unknown.
No arrival/release/current timestamp is invented; updates do not supply sort
keys. No provider API, storage, filter or backend contract change.

The exact live movie payload was not read. This corrects a reproduced ordering
defect, not proof that every production absence has the same cause. Owner
acceptance on the actual title remains required. No main merge/production write.
