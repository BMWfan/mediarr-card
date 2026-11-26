# Proposed curated project memory — mediarr-card

This file is a **draft proposal** for SPEC #43, not approved memory until owner review and merge. Entries below describe repository workflow only and must be checked against their linked sources before use.

## MEM-0001
- id: MEM-0001
- kind: decision
- status: candidate
- date: 2026-11-15
- source: https://github.com/BMWfan/mediarr-card/issues/43
- statement: The initial cross-task memory MVP uses repository-tracked curated records, automatically read when supported, while additions and invalidations require human review before Git persistence. This does not establish automatic startup loading or cross-session test success.

## MEM-0002
- id: MEM-0002
- kind: finding
- status: candidate
- date: 2026-11-15
- source: https://github.com/BMWfan/mediarr-card/issues/39
- statement: The initial memory MCP proof of concept is scoped to this repository; local client and same-workspace restart checks do not demonstrate persistence across independent hosted Codex tasks.
