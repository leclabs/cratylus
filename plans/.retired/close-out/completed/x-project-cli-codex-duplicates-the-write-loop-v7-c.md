# project-cli-codex duplicates the write loop V7 centralized for the claude path - it never uses writeRenderTree

> FILED, not specified. A stub: symptom + locus + provenance, no census, no
> acceptance. It exists so the defect was not chased when it was found. Whoever
> promotes it to `ready` owes it a real spec (`/praxis upsert`).

**Symptom.** project-cli-codex duplicates the write loop V7 centralized for the claude path - it never uses writeRenderTree

**Locus.** _(unfilled — the filer may not have known)_

**Provenance.** Filed 2026-07-26 from `a4b7257`, while executing `V7 integration audit`.

## Scoped 2026-07-26 (mav) — attempted, and stopped at a real constraint

**The duplication is worse than "a write loop".** `project-cli-codex.ts` (185 lines) reimplements
the whole pipeline: `moduleNames`/`skillNames` scanning, `agentOf`/`skillOf` module loading, the
`ResolvedSkill` assembly, shim emission, and three separate `writeFileSync` sites. `project-cli.ts`
(129 lines) does none of it — it calls `projectPluginSet` and `writeRenderTree`. This fork is
precisely why the codex path shipped **sessionless shims** until V1: a second implementation drifts.

**The naive collapse does not work, and this is the constraint to design against.**
`projectPluginSet` handles `preamble` per-plugin (`index.ts:345,356,369`) and `canonPlugin` already
carries `preamble: foundingDoctrine` (`src/index.ts:36`), so that part is free. But **`grep -n
surface packages/agent-forge/src/project/index.ts` returns NOTHING** — the projector has no notion of
`adapter.surface`, and the codex path's final act is emitting `AGENTS.md` from it
(`project-cli-codex.ts:174-181`). Collapsing onto `projectPluginSet` as it stands would silently
drop `AGENTS.md`, which is codex's always-loaded discovery shell.

**Therefore the shard is: teach `projectPluginSet` to emit the instruction surface** (guarded on
`adapter.surface` being defined — the claude adapter may not have one), _then_ collapse the codex CLI
onto it. Not the reverse.

**Falsifier available and cheap:** the codex projection is 31 files. Capture them before, refactor,
diff after — byte-identical or the delta is explained file by file. V1's cross-path shim-identity
test in `packages/agent-canon/test/runtime-shim.test.ts` already guards the shim half.

## Closed 2026-07-26 (developer) — collapsed, and the fork had drifted a SECOND time

**The surface.** `projectPluginSet` now emits the harness instruction surface into the returned
artifact tree, guarded on `adapter.surface` being defined (`project/index.ts`, after the hooks
block). It is emitted LAST because it indexes the projected agent names, and it rides `files` like
every other artifact — the projector still opens no file descriptor. Claude declares no `surface`,
so the claude tree is byte-unchanged; that is pinned by a new negative gate in
`agent-forge/test/project/tree.test.ts`, beside the positive codex case.

**The collapse.** `project-cli-codex.ts` 185 → 88 lines. Gone: `moduleNames`/`skillNames`,
`agentOf`/`skillOf`, the `ResolvedSkill` assembly, the shim call, all three `writeFileSync` sites,
and the dead `--profile` flag (parsed, never read; no caller passed it). What remains is
`projectPluginSet` + `writeRenderTree`, mirroring `project-cli.ts`, plus the `rmSync` pre-clean the
claude path already had.

**A constraint the scoping missed.** `canonPlugin` declares `hooks`, four of its cells are
`harness`-substrate, and `codexHarnessAdapter` has no `hooks` op — so `projectPluginSet` refuses the
set loudly (`index.ts:453`). The refusal is right and stays; the codex CLI takes canon WITHOUT its
hooks dir (`const { hooks: _codexHasNoHooks, ...codexPlugin } = canonPlugin`), so the omission is
stated at the one site that knows codex has no hook substrate rather than softened into a silent
drop inside the projector for every consumer.

**Falsifier result: 31 files before, 31 after, same paths, FOUR deltas — all one kind, all the
fork's second drift.** `skills/{dream,event-tap,handoff,wake}/SKILL.md` each GAIN the line
`Runtime capability \`X\` → \`scripts/X.mjs\`, resolved against this skill's base directory.` The
forked CLI's `ResolvedSkill` literal omitted `runtime: cell.runtime`, so codex emitted the shim FILE
but never told the agent it existed. The four files are now byte-identical to the claude projection
except the frontmatter `trigger:` line, which is the documented codex/claude difference. V1 caught
the sessionless shim; this is the same fork's other rot, and it could only ever have been found by
deleting the fork.
