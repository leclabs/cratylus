# cursor-adapter-truth — RETURN

**Commit:** `884095c`, atop base `2081113` (copilot-adapter-truth complete). Gated in clean worktree
`git worktree add /tmp/gate-cursor 884095c` (removed after gating). Re-dispatch note: the prior
Fable-session attempt left a stale, conflicted worktree
`.claude/worktrees/mav-cursor-truth` pinned at `9f3ebf4` (an earlier wave-5 commit, UU-merge-conflicted
on MAP.md/TRACKED-FAILING.md, uncommitted). Per spec ("prior Fable partial unreliable, re-derive
cleanly") this RETURN is a from-scratch derivation on the live main checkout, not a resume; the stale
worktree was removed (`git worktree remove --force`) once its content was confirmed superseded.

## Owned ids graduated (11/11)

| Story | Test (exact row removed from TRACKED-FAILING.md)                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------- |
| E8.S5 | `hooks.json carries the required "version": 1 [CU2]`                                                           |
| E8.S5 | `rules are written to .cursor/rules/*.mdc, never .md in that dir [CU1]`                                        |
| E8.S5 | `.cursor/rules/*.mdc fixtures are read (description/globs/alwaysApply) [CU1]`                                  |
| E8.S5 | `agents emit to .cursor/agents/*.md with documented frontmatter [CU3]`                                         |
| E8.S5 | `commands capability on: .cursor/commands/*.md emitted [CU6]`                                                  |
| E8.S5 | `remote MCP drops the undocumented type key [CU5]`                                                             |
| E8.S5 | `the UNVERIFIED-as-consumed ~/.cursor/AGENTS.md is no longer written [CU1]`                                    |
| E7.S6 | `cursor: remote entry shape is exactly {url, headers?, auth?} — no undocumented type key [S45] (§3 cursor d6)` |
| E7.S7 | `glob rule emits .cursor/rules/<id>.mdc with description/globs/alwaysApply frontmatter [S19]`                  |
| E1.S8 | `cursor agent lifts persona-verbatim: body byte-equal, name/description/model mapped, no organ guessed [CU3]`  |
| E1.S8 | `raw import→export round-trip is lossless on the body: emitted cursor agent ≡ persona verbatim [CU3]`          |

E8.S5 fully empties (all 7 of its rows were mine). E1.S8 fully empties (both rows mine). E7.S6 and
E7.S7 keep their other-call-site rows (E7.S6 has none left for cursor — it fully empties too, no
other adapter had a row there; E7.S7 keeps cline's 2 rows, still tracked).

Net TRACKED-FAILING: **105 → 94** (37 → 34 stories: E1.S8, E7.S6, E8.S5 fully graduated). MAP.md
regenerated (`pnpm exec tsx test/stories/tools/render-map.ts`, 334 refs), prettier-formatted.

## Design (decision + rationale)

- **Rules split, `.mdc` vs `AGENTS.md`**: `needsMdc(rule)` = `concat===false ∨ globs ∨ alwaysApply ∨
activation ∨ description` set — a rule carrying any per-rule activation metadata (or an explicit
  non-concat directive) gets its own `.cursor/rules/<id>.mdc`; everything else concatenates into
  `AGENTS.md` (unchanged path/behavior for the plain case, verified against the pre-existing
  passing "root AGENTS.md + stdio MCP round-trip" test). `.mdc` frontmatter is a **bespoke minimal
  serializer** (`serializeMdcRule`: description/globs/alwaysApply only) rather than reusing core's
  generic `serializeRule` — the generic one also writes `concat`/`order`/`targets`/`excludes`,
  which are undocumented `.mdc` keys (same fabrication class CU5 flags for MCP's `type`). Read side
  mirrors: `.cursor/rules/*.mdc` scanned (never `.md` there, per doc), combined with any root
  `AGENTS.md` rule into one `ir.rules` array.
- **`.mdc` globs may be a comma-separated string** (documented dialect quirk, not just an array) —
  `parseRule`'s generic frontmatter lift left it as whatever YAML produced (a string for a real
  fixture), which fails IR schema validation (`globs` requires `string[]`). Added a **cursor-local**
  `normalizeGlobs()` post-processing step in `read.ts` (string → split-on-comma → trim → array) —
  deliberately not touched in core `serialize/rule.ts` (schema/serializer is foreign territory per
  dispatch; the coercion is dialect-specific to cursor's documented quirk, not a general IR concern).
  Caught only by E1.S2's real-world fixture, not by any of my own narrower owned tests — flagging
  as a class other shards touching `.mdc`-like string-or-array fields should watch for.
- **User-scope rules**: no documented file surface for Cursor's User Rules (settings UI, plain text)
  [CU1] — `scope==='user'` now skips the `AGENTS.md`-class write entirely (warn + skip each rule)
  rather than writing to `~/.cursor/AGENTS.md`. Read side for `~/.cursor/AGENTS.md` is **left
  untouched** (still consulted) — that's E1.S3's separate, non-owned, still-tracked gap; write-only
  fix matches the owned test's exact scope.
- **Agents**: write actually emits `.cursor/agents/<name>.md` now (previously fully skipped).
  Bespoke `serializeCursorAgent` (name from filename + description/model frontmatter only) —
  deliberately narrower than core's generic `serializeAgent`, which would also fabricate
  undocumented `tools`/`color`/`permission_mode`/etc. keys into a cursor `.md` file. Unsupported
  fields are dropped with ONE combined warning naming them (mirrors codex's per-field-drop honesty
  pattern, not opencode's whole-resource skip). Capability stays `partial` (documented frontmatter
  is name/description/model +readonly/is_background, the latter two unmodeled in the IR — schema
  is foreign territory, left as residue below). Read side reuses generic `parseAgent` — the two-step
  agent law's step 1 (persona-verbatim import) needed nothing bespoke since the generic parser
  already maps exactly name/description/model/body and leaves everything else `undefined`.
- **Commands**: write actually emits `.cursor/commands/<name>.md` (plain body, no frontmatter —
  the dialect's documented shape). Capability flips `none`→`partial` (not `full`: description/
  argument_hint/model/allowed_tools have no frontmatter surface in this dialect, so `FIXTURES.commands`
  would not round-trip — declaring `full` would have forced a matrix-completeness classification I
  didn't want to fabricate). Read side added too (`readMarkdownDir` over `.cursor/commands/*.md`,
  body-only) — not required by any owned test, but cheap, correct, and turned out to be **load-bearing**
  for E1.S2's cursor fixture (below).
- **Hooks**: one-line fix, `{version: 1, hooks: {...}}` in the write object.
- **MCP remote**: `serializeMcp`'s remote branch drops `type` (undocumented per [CU5]), keeps
  `headers`, adds `auth` passthrough. Read side (`parseMcp`) gained `headers`/`auth` lift for remote
  entries — this was previously silently dropping `headers` (a real bug, not tied to any owned id;
  see forced flip #1 below). `auth`'s IR shape (`{type: string, ...}`, additionalProperties: true)
  is unchanged/untouched — schema is foreign territory. **Residue**: the harness-landscape research
  sheet's cursor MCP line (`{"url","headers","auth"}`) carries no further detail on `auth`'s internal
  structure beyond the existing loose typing — nothing richer found to report.
- **Capability declarations**: `hooks.matchers` `glob`→`regex` (matches [CU2] — Cursor matchers are
  regex-class, never glob). Verified this does NOT flip E4.S5's or E9.S3's aggregate declaration-table
  tests (both stay tracked — claude/copilot/gemini/cline/crush cells remain wrong); DID let me
  additionally correct `cursor/matchers`'s membership in E9.S3's own `FALSE_TODAY` test-source set
  (it was genuinely fixed, so it moved from the "still wrong" bucket into the "stays true" bucket —
  a mechanical accuracy update, not a graduation of the aggregate tracked test itself, which still
  fails on the other 5 cells).

## Forced non-owned edits (disclosed, each with cause)

1. **`test/stories/E4/roundtrip-matrix.test.ts`** — moved `['cursor', 'mcp']` from `TRACKED_PAIRS` to
   `PASSING_PAIRS`. The remote-MCP `headers`-dropped-on-read bug (§3 cross-cutting, [CU5]) is fixed
   as a direct consequence of the owned MCP-shape fix (read.ts now lifts `headers`/`auth` alongside
   `url`) — ran the file standalone first to confirm exactly cursor's row flipped (34/34 green),
   nothing else. Same established mechanism prior shards (crush, copilot) used for their own MCP rows.
2. **`test/stories/E1/E1.S2.test.ts`** — deleted cursor's `gap: 'agents + commands unread
[CU3][CU6]'` field. The now-complete agents+commands read side satisfies every resource class in
   E1.S2's cursor fixture; ran the file standalone first to confirm exactly cursor's spec flipped
   (10/10), nothing else. Same mechanism the copilot/continue/gemini/zed shards used.
3. **`test/stories/E9/hook-capability-truth.test.ts`** — removed `'cursor/matchers'` from the
   `FALSE_TODAY` set (test source, not just TRACKED-FAILING.md prose): the cell is genuinely fixed,
   so it moved from the tracked-only evaluation branch into the "currently-true cells stay true"
   evaluation branch. Verified both branches (mismatches(false)/mismatches(true)) still pass/fail
   correctly — the aggregate tracked test (`declaration table ≡ ground truth...`) stays tracked on
   the other 5 cells (claude/copilot/gemini/cline matchers+payload).
4. **`test/adapters/cursor/round-trip.test.ts`** (legacy, pre-story-coverage unit suite, discovered
   only at repo-wide gate time — not under `test/stories/`, invisible to a story-suite-only run) —
   rewrote `'warns about commands and unsupported features'`: commands now write (asserted
   existence, asserted no commands-warning) instead of being warned away; env warning assertion
   kept (env is still genuinely unsupported).
5. **`test/adapters/ir-bridge/round-trip.test.ts`** (same legacy-suite class) — the shared
   `describe.each([cursor, opencode])` "lossy-by-design: whole-resource-skip" test no longer holds
   for cursor (agents are written now, not skipped). Removed cursor from that `describe.each` (kept
   opencode, which genuinely still skips-all) and added a dedicated `describe('B4 round-trip: cursor
(color dropped per CU3...)')` block mirroring codex's existing field-level-drop pattern exactly
   (`report.skipped` empty, one warning naming `color`, `re.agents` equals the fixture modulo
   `color`). Verified against the actual fixture (11 agents, only `color` unsupported across all of
   them) before writing the assertions, not guessed.

## Residue for judge / next shards

- **mcp.auth structure**: dispatch asked me to report if the cursor research sheet documents richer
  `auth` structure than the IR's existing loose `{type: string, ...}` typing. It does not — the §2
  Cursor sheet's MCP line is `{"url","headers","auth"}` with no further breakdown of `auth`'s
  internals. No schema change proposed.
- **Stale dead-session worktree removed**: `.claude/worktrees/mav-cursor-truth` (pinned `9f3ebf4`,
  merge-conflicted/uncommitted, superseded by this from-scratch derivation) — removed via
  `git worktree remove --force`. No other stray worktrees touched (several unrelated ones exist from
  other shards/tasks — out of territory).
- **RULE_B `as unknown as Rule` cast** in `test/stories/E7/s07-vendor-rules-dirs.test.ts`: NOT
  dropped. Per the plan AGENTS.md hand-off note, the cast retires when all 4 of its owning tracked
  tests graduate — cursor's (mine) just did, copilot's already had by a prior shard, but **cline's 2
  rows** (`plain rule lands in root AGENTS.md`, `.clinerules/<id>.md with paths:`) are still tracked
  (a future shard's territory). Left in place.
- **`EXCLUDED_FIELDS.rules`** (`description`/`globs`/`activation`/`alwaysApply`/`dir`) in
  `test/stories/E4/support.ts` untouched by design — moving those into `FIXTURES.rules` would
  exercise glob-rule round-trip for every adapter's E4.S1 pair simultaneously, most of which don't
  implement it yet; per the plan's own hand-off note, that's `convergence-graduation`'s call.
- **Agent frontmatter gap** (`readonly`/`is_background`, documented [CU3] fields with no IR-schema
  home): schema is foreign territory per dispatch — flagging for whoever owns Agent-schema
  expressiveness, not acted on here.
- **`.cursor/cli.json` permissions surface** ([CU9]) — left untouched (out of the task's declared
  scope bullets; capability stays `partial` with the pre-existing "not directly emitted" warning).

## Gates (4×0, pristine worktree `/tmp/gate-cursor` @ `884095c`)

- `pnpm build` — 2/2 tasks green.
- `pnpm exec turbo run test --force` — agent-forge 677/677, agent-anatomy 36/36, agent-memory
  (4/4 turbo tasks, forced re-run, not cache-masked).
- `pnpm lint` — biome, 0 errors (472 files).
- `pnpm exec turbo run typecheck --force` — 4/4 packages, 0 errors.
