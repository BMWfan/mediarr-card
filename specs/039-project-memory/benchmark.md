# Total-token and quality benchmark

Status: protocol prepared; no end-to-end measurements yet. File bytes/words measure input size only. They are not tokenizer counts, billing or proven savings.

## Controlled comparison

Use at least three matched pairs of independent tasks, each on the same source commit and tool/model settings. Choose synthetic, bounded tasks with predetermined acceptance checks: locate a rendering path, diagnose a fixture failure, or make an isolated correction. Use separate clean checkouts/tasks, not Resume; do not pass one run's answer to another. Alternate baseline/compact execution order.

- Baseline: existing instructions at `fdf5f08`, without the new index/handoff route. Let normal investigation proceed; do not force full historical-log reads to inflate the baseline.
- Compact: same application/tooling source plus only this documentation follow-up. Start through AGENTS.md, PROJECT.md and the relevant handoff. Read further source/evidence as needed.
- Both: identical task prompt and acceptance checks; never skip required context or tests. Any user-mandated full reading applies equally.

In the compact arm, the first task creates/updates a handoff; include its authoring cost. In the baseline arm, retain the normal evidence/summary workflow without forcing a new handoff. A second independent continuation task uses the artifacts available in its own arm. Include both tasks in the pair's total. Keep sessions isolated from prior conversation answers. Do not launch paid model runs merely to fill this table.

## Record actual platform evidence

| Pair / arm | Task IDs / commits | Model/settings | Input tokens | Output tokens | Cached input (subset) | Handoff maintenance included | Acceptance / rework | Usage evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Not run | — | — | — | — | — | — | — | — |

Use platform usage counters/exports covering all turns, tools, retries and handoff creation/update. Keep cached input as a subset if the platform counts it in input; do not add it twice. Document counter semantics and reasoning-token inclusion. If full usage is unavailable, label the result UNMEASURED; do not replace it with character estimates. Store sanitized evidence links, never credentials or private transcripts.

Report each pair's total actual input + output tokens and quality outcome, then median paired reduction. Report caching/billed cost separately when available. Accept savings only when required checks pass with no lost blockers, unsupported claims or increased rework. Include failed runs and disclose small sample size. Revise the compact route if maintenance cost outweighs avoided investigation.
