# copilot-adapter-truth — RETURN

**Commits:** `0125ea8` (adapter fix + owned graduations), `9489236` (legacy adapter-test
follow-up, discovered only at repo-wide gate time), atop base `a2960df`. Gated in clean worktree
`git worktree add /tmp/gate-copilot 9489236` (removed after gating). Re-dispatch note: the prior
Fable-session attempt at this shard left a stale worktree `/private/tmp/mav-copilot-wt` pinned at
`055cfde`; removed before starting, per spec ("any prior Fable partial is unreliable") — this
RETURN is a from-scratch derivation, not a resume.

## Owned ids graduated (14/14)

| Story | Test (exact row removed from TRACKED-FAILING.md)                                                       |
| ----- | ------------------------------------------------------------------------------------------------------ |
| E8.S4 | `hooks emit to .github/hooks/*.json in the documented {"version":1} camelCase envelope [CP4]`          |
| E8.S4 | `the ".claude/settings.json is parsed by Copilot" premise is deleted [CP4]`                            |
| E8.S4 | `event map is re-keyed to the camelCase dialect [CP4]`                                                 |
| E8.S4 | `event map covers documented permissionRequest and errorOccurred [CP4]`                                |
| E8.S4 | `user scope lives under ~/.copilot/ (mcp-config.json) [CP8]`                                           |
| E8.S4 | `nothing is emitted under the fabricated ~/.config/github-copilot/ [CP8]`                              |
| E8.S4 | `repo skills emit to .github/skills/ [CP2]`                                                            |
| E8.S4 | `nothing is emitted to the fabricated .copilot/skills/ [CP2]`                                          |
| E8.S4 | `agents emit to .github/agents/*.agent.md [CP1]`                                                       |
| E8.S4 | `commands emit as prompt files .github/prompts/*.prompt.md [CP5]`                                      |
| E8.S4 | `fabricated-shape import: ~/.config/github-copilot fixture lifts zero phantom resources (E1.S3) [CP8]` |
| E2.S4 | `copilot user surface is ~/.copilot/ — NOT ~/.config/github-copilot/ [CP8]`                            |
| E4.S4 | `copilot: native names use the documented camelCase dialect, not PascalCase [CP4]`                     |
| E7.S7 | `glob rule emits .github/instructions/<id>.instructions.md with applyTo frontmatter [S57]`             |

E8.S4 fully empties (all 11 of its rows were mine — no other shard had a row in that story).
E2.S4/E4.S4/E7.S7 keep their other-adapter rows (aider/cline; cline/opencode; cline×2+cursor)
and remain tracked stories.

Net TRACKED-FAILING: **119 → 105** (38 → 37 stories). MAP.md regenerated
(`pnpm exec tsx test/stories/tools/render-map.ts`, 334 refs), prettier-formatted, header updated.

## Design (decision + rationale)

- **paths.ts full rewrite**: `CopilotPaths` grows `instructionsFile`/`instructionsDir?`/
  `agentsDir`/`promptsDir?`/`hooksDir` (dir, not file) alongside `rulesFile`/`skillsDir`/`mcpFile`.
  User scope = `~/.copilot/` (`COPILOT_HOME`, [CP8]) end to end; project scope = `.github/*`
  sub-dirs + root `AGENTS.md` + `.vscode/mcp.json` (unchanged — already correct per [CP3][CP6]).
  `instructionsDir`/`promptsDir` are **optional** (`?`) and only populated at project scope — no
  personal-scope surface is documented for glob-instructions or prompt files, so write.ts warns +
  skips rather than fabricating a `~/.copilot/instructions/` or `~/.copilot/prompts/` dir.
- **Hooks**: new envelope `{version:1, hooks:{<camelCaseEvent>:[{type:'command', bash, timeoutSec}]}}`
  written to one managed file `.github/hooks/agent-forge.json` (own dedicated dir — no longer
  collides with claude's `.claude/settings.json`, so the old merge-with-claude logic is gone
  entirely, replaced by plain coexistence with any other hand-authored `*.json` in the same dir).
  Event map re-keyed camelCase, 8→12 events (`capabilities.hooks.supported` extended to match, or
  E4.S4's `toCanonical(toNative(e))=e` round-trip check across `supported` would break for the
  4 new keys). `turn.fail`→`errorOccurred` is an **inference, not a confirmed 1:1 semantic**: the
  28-event canonical taxonomy has no dedicated top-level "error" event, and `errorOccurred` is
  Copilot's generic failure notification, so a failed turn is the closest existing canonical
  concept (tool-scoped failures already have their own home, `tool.use.fail`→`postToolUseFailure`).
  Flag if a more precise ground-truth source turns up.
- **Skills/agents/commands** move to `.github/{skills,agents,prompts}/` (project) or
  `~/.copilot/{skills,agents}/` (user, per [CP8] — no personal prompts surface documented).
  Agents/commands read+write now go through the existing generic `serializeAgent`/`parseAgent` and
  `serializeCommand`/`parseCommand` (same functions claude/codex/gemini already use) — no bespoke
  serializer, filename convention only (`<name>.agent.md`, `<name>.prompt.md`).
- **Capability declarations**: `commands` `none`→`full` (round-trip verified against
  `FIXTURES.commands` — all 6 schema fields survive via the generic serializer, same mechanism
  already proven for claude/codex). `agents` stays `partial` (several canonical Agent fields —
  color/permission_mode/max_turns/temperature/mode/memory/effort — have no documented Copilot
  equivalent). `hooks.matchers` `glob`→`regex`, `hooks.payload` `claude-json`→`native` — both
  directly serve [CP4] truth and cost nothing functionally (declarative metadata only, not
  wire-level behavior); verified this does not flip E9.S3's aggregate declaration-table test
  (7 other false cells remain: claude/cursor/gemini/crush matchers, cline matchers, gemini/cline
  payload) nor E4.S5 (copilot isn't in that story's adapter list at all).
- **Glob rules**: `Rule.activation==='glob' || globs?.length` splits plain (→ AGENTS.md, unchanged)
  from glob-activated (→ `.github/instructions/<id>.instructions.md`, `applyTo` = `globs.join(',')`
  frontmatter, per [S57]). Consumed the wave-4 `ir-schema-expressiveness` Rule fields directly — no
  schema touch needed. Read-side mirror added (`applyTo`→`globs.split(',')`) though untested by any
  owned id — bonus completeness, verified inert against `FIXTURES.rules` (no globs there) so it
  can't regress E4.S1.
- **`env`/`permissions`**: left untouched structurally (not in Scope's five bullets); only touched
  the `env` warning's wording to name the real surface (`copilot-setup-steps.yml` [CP13]) instead
  of the stale "VS Code settings" claim — text-only, no capability-value change (already `partial`/
  `none`, both correct per E4.S3's `GROUND_TRUTH.copilot` row, verified pre-existing not stale).

## Forced non-owned edits (disclosed, each with cause)

1. **`test/stories/E1/E1.S2.test.ts`** — deleted copilot's `gap: 'github-native
skills/hooks/agents/prompts unread [...]'` field. The now-complete read side (agents/hooks/
   skills/prompts) satisfies every resource class in E1.S2's copilot fixture; ran the file
   standalone first to confirm exactly copilot's spec flipped (9/10→10/10), nothing else. Same
   established mechanism prior shards used (continue, zed, gemini per their RETURNs).
2. **`test/stories/E1/E1.S3.test.ts`** — added `'~/.config/github-copilot/*'` and
   `'.copilot/skills/'` to `ZERO_LIFT_GRADUATED` (the set a prior shard, crush-adapter-truth,
   introduced for exactly this per-client graduation — mirrored verbatim, did not touch the
   loop/assertion structure). The _warning-naming_ leg (separate test, same file) is untouched and
   still correctly tracked for both copilot paths — no warning-emission mechanism exists anywhere
   in the codebase yet, so that leg was never at risk of a false flip.
3. **`test/stories/E4/roundtrip-matrix.test.ts`** — added `['copilot', 'commands']` to
   `PASSING_PAIRS`. Mandatory, mechanical consequence of `commands: 'none'→'full'` — the "matrix
   completeness" story asserts every declared-`full` cell is classified; verified the round-trip
   actually holds (ran the file in isolation, 34/34 green) before adding, not just to silence the
   completeness check.
4. **`test/adapters/copilot/round-trip.test.ts`** (legacy, pre-story-coverage unit suite, only
   discovered at repo-wide `pnpm test` gate time — not under `test/stories/`, so invisible to the
   story-coverage-only run I'd been validating against) — rewritten: paths updated
   (`.github/skills`, `.github/hooks/*.json` envelope); the old "merges into `.claude/settings.json`
   without clobbering Claude fields" test replaced with its new-model equivalent (coexistence with
   a hand-authored `*.json` in `.github/hooks/`, since hooks no longer share a file with claude at
   all); the "notification has no equivalent" drop-case swapped for `file.edit.post` (notification
   now has a documented mapping); added round-trip coverage for agents/commands (new real
   surfaces); the unsupported-types test narrowed to permissions/env only (commands/agents no
   longer warn). Same move as continue/gemini-adapter-truth's precedent for this exact class of
   pre-existing legacy test.
5. **`test/cli/portability-phase2.test.ts`** — same discovery path as #4. Dropped the "warns about
   commands" expectation, added assertions that agents/prompts are actually written, for the
   shared cross-adapter portability fixture's copilot case.

## Residue for judge / next shards

- **Territory note**: while deriving the green baseline I found `continue-adapter-truth`'s code
  already shipped and merged (`4d81308`, confirmed ancestor of `a2960df`) but its task file is
  still in `active/` with no `.RETURN.md` — the executing agent apparently died after the code
  commit but before the plan-housekeeping commit (the same failure class this dispatch itself
  re-derived from). `opencode-adapter-truth` is genuinely mid-flight (task file `active/`, no
  landing commit on any ref). Neither touched (out of territory) — flagged for aggregate
  reconciliation.
- E9.S3's `FALSE_TODAY` set (test source) still lists `copilot/payload`/`copilot/matchers` even
  though both are now honest — left untouched (not my file to restructure; the aggregate test
  still correctly stays red on the other 7 cells either way). Updated only the human-readable
  TRACKED-FAILING.md reason text for `copilot` (documentation, not test source) to stop naming
  copilot as still-false. Same for E4.S3's `STALE_CELLS` (`['copilot','commands']` still listed
  there in the test source, harmless — the aggregate `violations()` check no longer flags that
  cell, other adapters' cells keep the story red); left in place by precedent (gemini/crush
  precedent shows shipped shards did **not** necessarily clean their own cell out of that array
  either) — `convergence-graduation`'s to reconcile if it wants a fully-current array.
- `EXCLUDED_FIELDS.rules` (`globs`/`activation`/`alwaysApply`/`dir`) in `test/stories/E4/support.ts`
  is untouched by design — moving those into `FIXTURES.rules` would exercise glob-rule round-trip
  for **every** adapter's `E4.S1` pair simultaneously (most don't implement it yet), a cross-adapter
  regression far outside this shard; left for `convergence-graduation` per the plan's own hand-off
  note.
- The `RULE_B as unknown as Rule` cast in `test/stories/E7/s07-vendor-rules-dirs.test.ts` is
  unchanged — copilot's glob-rule row was one of the "4 adapter-owned tracked tests" gating its
  removal (per the plan AGENTS.md hand-off note); cursor's and cline's own glob-rule rows are still
  tracked (their shards haven't landed), so the cast stays until they do.

## Gates (4×0, pristine worktree `/tmp/gate-copilot` @ `9489236`)

- `pnpm build` — 2/2 tasks green.
- `pnpm test` — agent-forge 677/677, agent-anatomy 36/36, agent-memory 121/121 (4/4 turbo tasks,
  forced re-run with `--force`, not cache-masked).
- `pnpm lint` — biome, 0 errors (472 files).
- `pnpm typecheck` — turbo, 4/4 packages, 0 errors.
