# Actual-token A/B protocol

Status: UNRUN. This template does not demonstrate savings.

## Matched tasks

Use at least three matched baseline/optimized pairs of independent tasks, with
the same task prompt, source revision, model/config, permissions, tools and
acceptance criteria. Record the exact instruction revisions in each arm. Alternate
execution order. Start each arm without the other arm's answers or conversation;
Resume, subprocesses and child-agent contexts are not independent-task evidence.

Baseline uses the previous normal workflow; never force irrelevant bulk reads to
inflate it. Optimized uses the scoped-context rules. Preserve all applicable
instructions and required tests in both arms. Select bounded synthetic tasks
(e.g. locate a rendering path, diagnose a fixture failure, make a small correction)
and define expected answers/checks before either arm starts.

To assess handoffs, include a continuation task in each arm. Count creating,
reading and maintaining artifacts, all retries, failures and rework in that arm's
total. Keep normal evidence costs in the baseline. Never transfer optimized
answers to baseline. Record deviations rather than quietly dropping failed runs.
Do not launch new paid API/model runs solely to fill this template without
explicit authorization; observations from normal authorized work can be collected.

## Usage and quality evidence

| Pair / arm | Task IDs / source + instruction commits | Model/config | Input tokens | Output tokens | Cached input (subset) | Tool calls | Duration | Checks / review defects / rework | Sanitized usage evidence |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| Pending / baseline | — | — | — | — | — | — | — | — | — |
| Pending / optimized | — | — | — | — | — | — | — | — | — |

Use platform counters/exports covering the complete task and continuation,
including tool-result context and final handoff updates. Record counter semantics,
reasoning-token inclusion, duration boundaries and tool-call counting convention.
If totals already include tool/maintenance tokens, do not add them twice. If cached
input is part of input tokens, report it as a subset, not an additional quantity.
Keep billed cost/cache effects separate from raw input+output consumption.

If full usage counters are unavailable, report UNMEASURED (or partial telemetry
with its missing scope). Byte/word counts and heuristic token estimates cannot
replace actual usage. Do not store credentials or private transcripts as evidence.

## Comparison

Report each pair's total input+output tokens, quality checks, observed defects,
rework, tool calls and duration. Report paired reduction and median across pairs;
disclose small sample size, cache conditions and other confounders. Do not pool
unequal task scopes or claim savings when checks/required gates are omitted.
Retain unsuccessful runs. If total usage or quality evidence is incomplete, leave
the result inconclusive. Adopt the optimization only when measured gains preserve
quality; revise it if artifact maintenance outweighs avoided investigation.
