# cline-adapter-truth — RETURN

**Commit:** `2998fda`, atop base `a89199e` (opencode-adapter-truth complete, sole live main HEAD at
dispatch). Gated in a clean worktree (`git worktree add /tmp/gate-cline 2998fda`; removed after
gating). Re-dispatch note: this is a fresh-model re-derivation after a prior Fable-session death on
this exact shard — the working tree at dispatch start showed a stale dirty snapshot (10
dead-executor partials) that had already been stashed as recovery insurance
(`wave5-mud-partials-2026-07-03`) by the time this session's first tool call ran; the live checkout
was clean at `a89199e` with no stray worktree/branch for this task, so this is a from-scratch
derivation, not a resume. The stash was left untouched (not mine, not needed).

## Owned ids graduated (15/15 + 1 forced)

| Story | Test (exact row removed from TRACKED-FAILING.md)                                                                                                                                    |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E8.S7 | `hooks emit as per-event executable scripts in .clinerules/hooks/ [CL2][CL3]`                                                                                                       |
| E8.S7 | `the fabricated .cline/hooks.json is never emitted [CL2]`                                                                                                                           |
| E8.S7 | `event set is the documented 6 — no TaskComplete/PreCompact mappings [CL2]`                                                                                                         |
| E8.S7 | `global rules emit to ~/Documents/Cline/Rules [CL1]`                                                                                                                                |
| E8.S7 | `skills capability on: .cline/skills/ emitted [CL5]`                                                                                                                                |
| E8.S7 | `commands emit as workflows .clinerules/workflows/*.md [CL4]`                                                                                                                       |
| E8.S7 | `project MCP: undocumented .cline/mcp.json is not emitted silently — warn or omit [CL6]`                                                                                            |
| E8.S7 | `fabricated-shape import: .cline/hooks.json lifts zero phantom hooks (E1.S3) [CL2]`                                                                                                 |
| E4.S4 | `cline: fabricated TaskComplete/PreCompact are gone (documented set is 6 events) [CL2]`                                                                                             |
| E4.S5 | `cline: matcher on a hook warns matcher-unsupported instead of silently emitting one [CL2]`                                                                                         |
| E7.S1 | `cline (AGENTS.md-native per matrix [S1]/[S22]) is served by the same root AGENTS.md artifact`                                                                                      |
| E7.S7 | `cline: plain rule lands in root AGENTS.md (native reader [S22]), not as a .clinerules file`                                                                                        |
| E7.S7 | `glob rule emits .clinerules/<id>.md with paths: frontmatter preserving activation [S22]`                                                                                           |
| E5.S3 | `cline: native SKILL.md discovery exists [CL5] but the adapter does not yet emit skills to that path`                                                                               |
| E2.S4 | `cline global rules land under ~/Documents/Cline/Rules — NOT ~/.cline/rules [CL1]`                                                                                                  |
| E4.S3 | `over-claim cells retired: cline permissions+env, crush env, opencode env no longer claim undocumented surfaces [OC1][CL1][CL2][CR1]` (**forced**, not in the owned 15 — see below) |

All 15 owned ids graduated (`story.tracked` → `story`). The 16th (E4.S3 "over-claim cells retired")
was a **forced graduation**: fixing cline's permissions/env honesty (a necessary consequence of the
divergence fix, not an owned id) happened to close the last 2 of that story's 4 over-claim cells
(crush/env and opencode/env were already fixed in prior waves) — the combined multi-adapter test
started passing and had to graduate, mirroring the opencode shard's "12 owned + forced graduations"
precedent.

Net TRACKED-FAILING: **82 → 66** rows (33 → 29 stories). MAP.md regenerated (334 refs, prettier-formatted).

## Design (decision + rationale)

- **Split into paths/events/read/write.ts** (no `anatomy.ts` — that module is the agent-anatomy SOUL
  exemplar projection, only built for claude+codex so far; the opencode shard also skipped it for the
  same reason, confirmed by checking its shipped file layout before assuming the Static section's file
  list was literal).
- **Rules: three-way split, not one dialect** [CL1][S22]:
  - Project, plain (no `globs`/`activation`): concatenates onto the shared root `AGENTS.md` — Cline is
    AGENTS.md-native per the standards matrix, so this reaches the same file codex/cursor/copilot/
    opencode/crush already write.
  - Project, glob-activated (`globs`/`activation:'glob'` set): `.clinerules/<id>.md`, one file each,
    with a **bespoke** `paths:` frontmatter key (Cline's real dialect key — never the IR's `globs`, which
    is what the generic `serializeRule`/`parseRule` would emit). Classification via `isGlobRule()`,
    mirroring the copilot/cursor precedent exactly.
  - User (global) scope: `~/Documents/Cline/Rules`, one file per rule, **every** rule (plain or glob) —
    no AGENTS.md-equivalent is documented at this scope, so the plain/glob split only applies at
    project scope. This reuses the same `paths:`-frontmatter serializer.
- **Hooks as executable scripts, not JSON** [CL2][CL3]: one file per native event name (no extension) in
  `.clinerules/hooks/` (project) / `~/Documents/Cline/Rules/Hooks/` (user), `chmod 0o755`. Multiple IR
  hooks sharing one event are chained in the same script via `# agent-forge:<id>` marker-comment +
  command-line pairs — a bookkeeping format this adapter owns (not part of Cline's documented contract),
  so a reimport recovers each hook's `id` and `command` but drops matcher/timeout, both of which get a
  **named warning** rather than silent loss (no matcher concept, no documented timeout field in the real
  dialect). A hand-authored (non-agent-forge) script has no marker and lifts as zero hooks — parsing
  arbitrary shell content isn't a contract this adapter can honestly claim.
- **Event map pruned to the documented 6**: `TaskStart, TaskResume, TaskCancel, UserPromptSubmit,
PreToolUse, PostToolUse` — dropped the fabricated `TaskComplete`/`PreCompact`. `capabilities.hooks`
  flipped `matchers: 'glob'→'none'`, `payload: 'claude-json'→'native'`.
- **Skills/commands turn on, declared `'partial'` not `'full'`** [CL5][CL4]: skills reuse the generic
  `serializeSkill`/`parseSkill` (full spec fidelity, but no doc confirms Cline honors every spec field
  beyond name/description/body, so 'partial' is the honest, conservative claim); commands (workflows,
  `.clinerules/workflows/*.md`) are **plain body only** — the dialect carries no frontmatter, so
  description/argument_hint/model/allowed_tools are dropped with a named warning, exactly the
  cursor/opencode commands precedent (`'partial'`, matching a fixture that doesn't round-trip those
  fields).
- **MCP: user scope full, project scope skip+warn, never fabricate** [CL6]: `~/.cline/mcp.json` is the
  one real (CLI-documented) surface; wrote it with the correct remote-transport rule (`type:
'streamableHttp'` present ⇒ HTTP, **absent** ⇒ legacy SSE — never invent a `type` for an SSE server).
  Project scope has **no** documented file at all (the extension reads VS Code globalStorage
  `cline_mcp_settings.json`, unreachable generically) — write now skips with a named warning
  (`globalStorage`/`extension` in the message) instead of writing `.cline/mcp.json`, matching the
  "no reachable surface → skip, don't fabricate" convention cursor/copilot already use for their own
  undocumented-scope gaps. **Capability declared `'partial'`, not `'full'`** — this was a genuine
  decision reversal mid-implementation: `'full'` looked right at first (E8.S7's "warn or omit" owned
  test tolerates either), but it broke a completely different, non-owned, non-cline-named test
  (`E3/e3s2-fixpoint.test.ts`, parametrized purely off `capabilities.resources === 'full'`) that
  requires full project-scope round-trip for every `'full'`-declared resource. Rather than making
  project-scope MCP "work" just to satisfy a generic fixture (which would mean writing the very
  fabricated file the divergence fix exists to remove), `'partial'` was the correct call — it also
  required removing cline's row from `E4/roundtrip-matrix.test.ts`'s `TRACKED_PAIRS` (disclosed below).
- **permissions/env: `'partial'→'none'`** [CL2][CL1] — not an owned id, but a direct, necessary honesty
  consequence (mirrors the opencode shard's own env-capability fix): the prior code declared `'partial'`
  for both with **no write-side handling at all** (silently dropped, no warning) — strictly worse than
  the 'none' + named-warning-and-skip it now gets.

## Non-owned test edits (all disclosed)

1. **`test/adapters/cline/round-trip.test.ts`** (legacy pre-story-coverage suite, the exact class the
   dispatch's LEGACY-UNIT-TEST lesson warns about) — rewrote all 5 cases to corrected behavior: plain
   rule → `AGENTS.md`, glob rule → `.clinerules/`; hooks → executable scripts, never `.cline/hooks.json`;
   MCP round-trip moved to user scope (the real target) plus a new case asserting project-scope MCP is
   skipped-with-warning, never fabricated; skills/commands now assert files exist (not "warns
   unsupported"), agents still warns (genuinely unsupported).
2. **`test/stories/E1/E1.S3.test.ts`** — added `.cline/hooks.json` and `~/.cline/rules` to
   `ZERO_LIFT_GRADUATED` (mirrors the opencode shard's identical mechanism for `.opencode/mcp.json`):
   read.ts no longer consults either path at all, so both zero-lift legs hold; the sibling "import report
   warns naming the unrecognized path" leg stays tracked (no such warning mechanism exists).
3. **`test/stories/E1/E1.S2.test.ts`** — cline's fixture (`gap` field) now lifts skills+workflows; only
   the hand-authored `.clinerules/hooks/PreToolUse` script (no `agent-forge:` marker) stays unlifted, so
   the test correctly stays tracked (verified via `it.fails` still passing) — updated the `gap` string
   for accuracy (this text is template-interpolated at runtime, so the change has **zero** effect on the
   TRACKED-FAILING.md registry match — confirmed by reading `scan.ts`, which regexes the literal source,
   not the runtime value).
4. **`test/stories/E2/e2s3-project-compile.test.ts`** — replaced the `.clinerules/main.md` representative
   path (no longer produced — that fixture's rule is plain, now on `AGENTS.md`) with
   `.cline/skills/review/SKILL.md`; corrected the "Deliberately ABSENT" / "5 fabricated paths" inline
   comments to 4 (cline's `.cline/mcp.json` graduated).
5. **`test/stories/E4/roundtrip-matrix.test.ts`** (E4.S1, mandatory per the declaration-is-the-oracle
   discipline) — removed `['cline', 'mcp', ...]` from `TRACKED_PAIRS`: mcp capability flipped
   `'full'→'partial'`, so it's no longer in the declared-`'full'` set this matrix classifies.
6. **`test/stories/E4/portable-core.test.ts`** — reworded the still-tracked "all 10 targets... zero
   warnings" test name: cline no longer drops skills (fixed), now warns on undocumented project-scope
   MCP instead — story stays tracked regardless (aider still fails it).
7. **`test/stories/E4/capability-honesty.test.ts`** (E4.S3) — renamed the still-tracked "stale cells"
   test to drop `opencode agents+commands` and `cline skills+workflows` from its enumeration (both now
   individually honest; the STALE_CELLS array itself is untouched, still checks all 11 original cells —
   the 4 now-honest ones simply stop violating). Also flipped the "over-claim cells retired" test
   `.tracked`→`story` (forced graduation, see above).
8. **`test/stories/E9/hook-capability-truth.test.ts`** (E9.S3) — removed cline's two now-honest entries
   (`cline/payload`, `cline/matchers`) from `FALSE_TODAY`; corrected the still-tracked combined test's
   TRACKED-FAILING.md reason text (copilot's two entries were already stale/dead pre-existing debt, not
   touched — out of territory).
9. **`test/stories/E2/e2s4-user-compile.test.ts`, `E7/s01-agents-md-canonical.test.ts`,
   `E7/s07-vendor-rules-dirs.test.ts`, `E5/S3.skills-native-guard.test.ts`, `E4/event-taxonomy.test.ts`,
   `E4/matcher-semantics.test.ts`, `E8/S7.cline.test.ts`** — the 15 owned `story.tracked`→`story` flips,
   plus one non-owned fixture rewrite inside `E8/S7.cline.test.ts` (the "already-correct" multi-file
   `.clinerules/*.md` round-trip test used two **plain** rules pre-fix, which now correctly land on
   `AGENTS.md` instead — rewrote the fixture to two **glob** rules, the scenario `.clinerules/*.md`
   actually serves post-fix; same underlying mechanism, corrected activation).

## Residue for judge / next shards

- **Hook-script `# agent-forge:<id>` marker discipline**: caught mid-implementation via biome's regex
  interaction with `scan.ts` — a comment placed **between** a `story.tracked()` call's id and name
  arguments silently breaks the coverage scanner's regex (comments aren't `\s*`), producing a
  hard-to-diagnose 66-vs-65 Set-size mismatch with no useful line pointer. Moved the comment above the
  call. Flagging as a sharp edge for any future shard adding inline commentary near a `story`/
  `story.tracked` call site.
- **`capabilities.hooks.matchers`/`payload` for hand-authored (non-agent-forge) scripts**: read-side
  hook recovery is inherently agent-forge-own-format-only (the marker scheme). A real Cline user's
  hand-written hook script will always lift as zero structured hooks under this adapter — documented in
  E1.S2's updated `gap` string, not silently glossed over.
- **`crush/env`'s over-claim persists** (the 4th cell in E4.S3's now-closer-to-graduating "over-claim
  cells retired" story) and **`crush/hooks`+`crush/permissions`** stale cells, plus **cursor/copilot/
  continue/gemini commands** and **continue permissions** stale cells — all pre-existing debt in other
  adapters' territory, untouched, correctly still tracked.
- **No stray worktree or branch found** for this task on the live checkout — consistent with the
  opencode shard's finding, unlike the cursor shard's stale worktree. Numerous unrelated worktrees exist
  under `/private/tmp/` and `/Users/lex/workspaces/.mav-w5-standards` for other in-flight wave-5 shards
  (aider, kilo, devin, amp, pi, mcp-rehoming, standards) — out of territory, not touched.

## Gates (4×0, pristine worktree `/tmp/gate-cline` @ `2998fda`)

- `pnpm build` — 2/2 tasks green.
- `pnpm test --force` (turbo) — agent-forge 677/677, agent-anatomy 36/36; agent-memory run separately
  via `pnpm --filter @leclabs/agent-memory test` (turbo's root `test` pipeline doesn't wire it in — same
  as every prior shard) — 121/121 green.
- `pnpm lint` — biome, 0 errors (476 files).
- `pnpm typecheck` (turbo) — 4/4 packages, 0 errors.
- Zed-adapter interplay verified directly (a `.clinerules/` directory from a live cline write does not
  false-trigger zed's `SHADOWING_FILES` `isFile()` guard — confirmed via a standalone script exercising
  both adapters against the same tmp dir before commit, not just by inspection).
