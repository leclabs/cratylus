# TRACKED-FAILING — the enumerated gap set

The red half of the story-coverage wave (`plans/interop-hardening/active/story-coverage-tests.md`):
every test here asserts DOCUMENTED harness/standards reality (the research RETURN sheets) that the
library does not yet deliver. Mechanism: `story.tracked()` = vitest `it.fails` — the assertions
RUN on every `pnpm test`; their failure is asserted, so the suite stays green while the gap exists
and the set below is exactly countable (coverage.test.ts prints the enumeration and fails if this
file drifts from the `story.tracked` call sites).

**Graduation protocol** (wave 3+): when an implementation lands, the tracked test FAILS (it now
passes inside `it.fails`) — flip `story.tracked` → `story`, delete the row here, regenerate MAP.md
(`pnpm exec tsx test/stories/tools/render-map.ts`). No skip/todo markers exist in the story suites
(meta-gated).

Reasons are story-scoped (the test name carries the per-assertion specifics); refs `[XX#]`/`[Sn]`
resolve in `plans/interop-hardening/completed/*.RETURN.md`.

Call sites: 2 tracked-failing across 2 stories.

**convergence-graduation (2026-07)**: this is the terminal shard — every cross-adapter equation
closed except the two genuine, permanent-by-design residuals below (both disclosed, not forced).
Everything else this row set once carried (E1.S3 ×2, E2.S3, E4.S3, E4.S7, E9.S3 — 6 rows) graduated:
crush now lifts hooks/permissions from crush.json; cursor's read side stopped consulting the
fabricated `~/.cursor/AGENTS.md`; a new `auditImport` `fabricated` leg names every documented-legacy
path still present on disk; codex/copilot/gemini's remote-MCP `headers` now round-trip; continue
gained `~/.continue/permissions.yaml` read/write; gemini's hook `payload` now declares `native`
(not `claude-json`); the portable-core zero-warnings row was re-scoped from a literal-zero
assertion (written for the pre-wave-5 10-adapter roster) to an exact documented-warning contract
covering the current 16-adapter roster, and the E2.S3 project-surface allowlist gained the six
adapters (amp/kilo/pi/devin+windsurf/zed/standards's GEMINI.md gap) wave 5–6 added that the
allowlist had never been updated for.

| Story | Test                                                                                                      | Reason                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1.S2 | `import ${spec.client}: every documented resource class lifts from a §2-truth fixture (gap: ${spec.gap})` | cline only (crush graduated: readImpl now lifts crush.json hooks/permissions): a hand-authored `.clinerules/hooks/<Event>` script with no embedded `# agent-forge:<id>` marker carries no structured fields to recover — Cline's hook contract is "one executable per event," not a documented shape parseable into matcher/command/timeout; synthesizing a Hook from arbitrary foreign shell content isn't a real lift, it's a fabrication. Genuine, permanent limitation — not forced [CL2].                                                                                                                                         |
| E4.S1 | `${adapterId}/${type}: import(compile(r)) ≡ r (${reason})`                                                | two permanent-by-design pairs, both already isolated from the (now-graduated) remote-mcp-headers class: codex/agents — `tools`/`color` have no documented Codex agent-TOML field, so the shared agents fixture's exercise of both is warned-and-dropped on write, never fabricated [CX1]; claude/rules — a default CONCAT rule's CLAUDE.md imports `@AGENTS.md` per Anthropic's own documented shim [S7] instead of duplicating the body (this adapter never writes AGENTS.md, E7.S10) — a non-concat rule DOES round-trip losslessly via `.claude/rules/<id>.md` [CC1]; the shared fixture only exercises the concat path for claude. |
