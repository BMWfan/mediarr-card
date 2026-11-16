# Specification — SPEC-039 Project Memory (M, exploratory spike)

## Problem
Codex repeats project analysis between sessions; decisions and known failures are lost. Issue #39 tracks a repository-isolated, low-cost memory pilot.

## Scope and non-goals
- Scope: isolated local proof of concept, MCP stdio tools, SQLite persistence, provenance, invalidation, basic recall and tests.
- User-authorized follow-up (2026-11-16): compact repository index, per-issue handoff, selective reading instructions and a total-token benchmark protocol. This documentation approach is independent of hosted MCP support.
- Non-goals: production rollout, cross-repository sharing, automatic Codex cloud hooks, semantic similarity, GitHub workflow changes, new paid API services.
- No modifications to Mediarr card runtime, HACS bundle or paired mediarr_sensor.

## User-visible behavior and acceptance criteria
- [ ] A local MCP client can initialize, list tools, record and retrieve memories.
- [ ] Restart preserves memories; invalidated entries do not recur.
- [ ] Source validation rejects references to other repositories.
- [ ] No secrets or production HA data are used.
- [ ] Test commands are executed and results recorded.
- [ ] Real Cloud Codex integration is either verified or explicitly marked blocked.
- [ ] Token savings are measured end-to-end before claiming benefit.

## Compatibility requirements
Python 3.11+ standard library for the initial spike; no card/frontend/backend behavior change. Existing SDD-Light and owner approval rules apply.

## Compact context acceptance criteria (2026-11-16)
- [x] AGENTS.md routes tasks through a bounded project index and the matching issue handoff.
- [x] Handoffs retain blockers and evidence links without duplicating historical logs.
- [x] Explicit user reading requirements and SDD-Light gates take precedence.
- [x] Record input-size measurements separately from actual token/quality results; no estimated savings claim.
