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

Call sites: 0 tracked-failing across 0 stories.

**convergence-graduation (2026-07)**: this is the terminal shard — every cross-adapter equation
closed. Everything this row set once carried (E1.S3 ×2, E2.S3, E4.S3, E4.S7, E9.S3 — 6 rows)
graduated earlier: crush now lifts hooks/permissions from crush.json; cursor's read side stopped
consulting the fabricated `~/.cursor/AGENTS.md`; a new `auditImport` `fabricated` leg names every
documented-legacy path still present on disk; codex/copilot/gemini's remote-MCP `headers` now
round-trip; continue gained `~/.continue/permissions.yaml` read/write; gemini's hook `payload` now
declares `native` (not `claude-json`); the portable-core zero-warnings row was re-scoped from a
literal-zero assertion (written for the pre-wave-5 10-adapter roster) to an exact
documented-warning contract covering the current 16-adapter roster, and the E2.S3 project-surface
allowlist gained the six adapters (amp/kilo/pi/devin+windsurf/zed/standards's GEMINI.md gap) wave
5–6 added that the allowlist had never been updated for.

**residual reclassification (2026-07)**: the two remaining rows were never forced gaps — each is a
genuine by-design boundary, not something the library fails to deliver. Reclassified PASSING and
documented in place rather than left tracked:

- **E1.S2 / cline** — a FOREIGN (non-agent-forge) hook script with no `# agent-forge:<id>` marker
  carries no structured fields to recover; lifting one would be fabrication, not a documented
  contract. The fixture still builds the foreign hook (exercising that surface) but `'hooks'` is
  no longer in cline's expected `classes` — it is correctly reported as an unlifted surface by
  `auditImport`'s `fabricated` leg (E1.S7's contract), not a gap in E1.S2's scope [CL2].
- **E4.S1 / codex-agents + claude-rules** — codex/agents: `tools`/`color` have no documented Codex
  agent-TOML field [CX1], warned-and-dropped on write rather than fabricated; the matrix now strips
  both fields from BOTH sides of the comparison for this one pair (`stripFor`), while claude/agents
  (also 'full') still compares them in full. claude/rules: a default CONCAT rule's body is
  deliberately not recoverable from CLAUDE.md alone (`@AGENTS.md` shim [S7], a cross-adapter
  concern owned by E7.S2); the matrix now gives claude a `concat: false` fixture (`fixtureFor`),
  which round-trips losslessly via `.claude/rules/<id>.md` [CC1] — the real isolated-adapter
  contract this story tests.

No table below: zero `story.tracked` call sites remain.
