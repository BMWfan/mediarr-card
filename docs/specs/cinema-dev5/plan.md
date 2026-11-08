# Plan and analysis

1. Base a new branch on PR #20's current head. Target its branch in a stacked
   Draft PR so reviewers see only this preparation; retarget after #20 only
   if the owner later approves merging that implementation.
2. Compare the published tag/root bundle with source build and HACS rules.
3. Inspect exact sensor dev.3 source, model its older player payload and missing
   control command in the real-HA Cinema suite, and correct compatibility prose.
4. Run model/browser/build checks and record actual results and coverage limits.
5. Provide owner installation/rollback instructions and Draft PR review evidence.

No runtime change is needed for the published artifact. Missing pause/resume
already reports an upgrade requirement. A new version would be required to alter
that behavior. Do not reuse dev.5 for a changed bundle.
