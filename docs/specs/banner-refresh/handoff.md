# Banner-refresh handoff

- Owner report: one film's banner briefly appears then vanishes on home/details; poster remains. Exact live cause unverified.
- Branch `fix/banner-refresh`, main d94fbb6; separate from Drafts #48/#33. [Spec](spec.md), [plan](plan.md), [tasks](tasks.md).
- Shared backdrop loader tries safe landscape candidates, retains last-good same-title art, then falls back to poster. Per-card cache capped at 32 URLs; generation/connection guards protect selection changes and empty-state DOM reuse.
- [Verification](verification.md): main baseline fails the corrected synthetic browser regression; candidate passes 31 model, 6 release and 81 browser checks. Five new browser cases cover failed artwork, metadata-only/sparse refresh, home/details/mobile, late responses and empty library. No backend contract change.
- Limits: no production data/URL access or causal claim for the live film. No token savings measurement. No release/merge. Do not confuse branch availability with an installed fix.
- Next: owner review of [prepared Draft description](pr-description.md); live validation requires a separately approved build containing the change. API access has previously blocked PR creation; confirm actual result before claiming a Draft exists.
