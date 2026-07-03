# gemini-adapter-truth — RETURN

**Commit:** `d0fe3d6` (atop base `06c1e68`). Gated in clean worktree `git worktree add
/tmp/gate-gemini d0fe3d6` (removed after gating).

## Owned ids graduated (12/12)

| Story | Test (exact row removed from TRACKED-FAILING.md)                                                  |
| ----- | ------------------------------------------------------------------------------------------------- |
| E8.S3 | `project rules emit to GEMINI.md, the stock context filename [GM1]`                               |
| E8.S3 | `a stock install reads the result: bare AGENTS.md requires context.fileName wiring [GM1]`         |
| E8.S3 | `GEMINI.md fixture lifts as rules on read [GM1]`                                                  |
| E8.S3 | `commands capability on: .gemini/commands/*.toml with required prompt key [GM5]`                  |
| E8.S3 | `capabilities no longer declare commands: none [GM5]`                                             |
| E8.S3 | `SSE remote MCP emits url without the fabricated type key [GM1]`                                  |
| E8.S3 | `streamable-HTTP remote MCP emits httpUrl, not url [GM1]`                                         |
| E8.S3 | `no fabricated permissions/env settings.json keys are emitted [GM1]`                              |
| E8.S3 | `event map includes the documented BeforeToolSelection event [GM4]`                               |
| E8.S3 | `hook capability declares regex matchers, not glob [GM4]`                                         |
| E8.S3 | `fabricated-shape import: settings.json permissions/env are not lifted as phantoms (E1.S3) [GM1]` |
| E7.S6 | `gemini: streamable-HTTP server uses httpUrl, url is SSE-only [S11] (§3 gemini d5)`               |

E7.S6's cursor row (same file) is untouched — E7.S6 remains tracked (1 row left) since cursor's
own gap is out of my territory.

Net TRACKED-FAILING: **131 → 119** (38 stories, was 39 — E8.S3 fully empties). MAP.md regenerated

- prettier-formatted; header line updated (`334 total · green 215 · tracked-failing 119`).

## Design (decision + rationale)

- **Rules → GEMINI.md** (paths.ts `rulesFile`, both scopes): the stock context filename per [GM1].
  Read and write share the same path, so E4.S1's already-`full` `gemini/rules` roundtrip pair holds
  unchanged.
- **Commands turn on** (`none`→`partial`): `.gemini/commands/*.toml`, `prompt` (required, from
  `body`) + `description` (optional) only — `argument_hint`/`model`/`allowed_tools` have no
  documented Gemini TOML field, so write.ts warns and drops them per command rather than fabricating
  keys (codex-agent-drop precedent). Deliberately `partial`, not `full` — declaring `full` would pull
  `gemini/commands` into E4.S1's declared-full roundtrip matrix (non-owned regression) since those
  three fields don't survive.
- **MCP remote transport split**: write.ts's `serializeMcp` now branches `http`→`{httpUrl,
headers?}` vs `sse`(else)→`{url, headers?}`, no fabricated `type` key. read.ts's `parseMcp`
  mirrors it (`httpUrl` checked before `url`). The pre-existing tracked gap (remote `headers`
  dropped on read, E4.S1 `TRACKED_PAIRS ['gemini','mcp',...]`, not owned by me) is left exactly as
  documented — I did not add header-lifting, so that row stays tracked for the same reason, not a
  new one.
- **Settings honesty**: write.ts no longer emits `permissions`/`env` into `settings.json` (no
  documented shape [GM1]; real controls are `tools.core`/`excludeTools` + MCP `includeTools`/
  `excludeTools`, and `.env` file loading respectively) — both now warn + report `skipped` instead.
  read.ts symmetrically stops lifting either key (closes E1.S3 phantom-import for gemini).
  **Capability consequence**: `env` demoted `full`→`partial` (permissions was already `partial`) —
  declaring `full` with zero backing mechanism would be a live over-claim once the code changed.
  Verified this doesn't violate E4.S3's honesty legs (gemini/env isn't in `STALE_CELLS` or
  `OVER_CLAIM_CELLS`; the presence bit stays true either way, `partial` threads both legs).
- **BeforeToolSelection**: no canonical event names "gate the model's tool choice" (distinct from
  `tool.use.pre`'s per-call gate, already `BeforeTool`). Bound `permission.request` → it as the
  closest existing pre-execution gate — **an inference, not a confirmed 1:1 semantic**, documented
  inline in `events.ts`. Added to `capabilities.hooks.supported` (not left as a silent extra) because
  E4.S4's `count(supported)+count(skipped)=28` totality gate caught the alternative (an unsupported-
  but-actually-handled event reads as "lost silently" — real behavior must match the declaration, not
  just the letter of the owned test).
- **Matchers**: `glob`→`regex` [GM4].

## Forced non-owned edits (disclosed, each with cause)

1. **`test/stories/E1/E1.S2.test.ts`** — deleted gemini's `gap: 'GEMINI.md context file + commands
TOML unread [GM1][GM5]'` line. The GEMINI.md-read fix plus a new `readCommandsDir` (added to
   read.ts for symmetry with the new write-side commands, and because it was the last missing class
   in this fixture) together satisfy every resource class in E1.S2's gemini fixture, so its
   `story.tracked` row for gemini flips to green automatically (loop-driven `SPECS.filter`). Same
   pattern already accepted for continue and zed in this plan (per prior wave RETURNs) — verified by
   running the file: 10/10 pass, no manual ledger change needed (E1.S2 is one templated call site;
   other clients — cursor/copilot/opencode/cline/crush/aider/continue — remain gapped, so the row
   stays in TRACKED-FAILING.md, untouched).
2. **`test/stories/E4/roundtrip-matrix.test.ts`** — removed `['gemini', 'env']` from
   `PASSING_PAIRS`. Direct, mechanical consequence of demoting `env` off `'full'` (see above); the
   "matrix completeness" story (declared-full ≡ classified) would otherwise break.
3. **`test/adapters/gemini/round-trip.test.ts`** (legacy, pre-story-coverage unit suite) — rewritten:
   AGENTS.md→GEMINI.md assertion; env dropped from the write/round-trip fixtures (no longer
   round-trips, honestly); the "warns about commands ... DSL" test replaced with one that asserts
   commands are actually **written** as TOML (capability is on now) while permissions still warns +
   is absent from settings.json. This file pinned the exact fabrications my fix removes — same
   move as continue-adapter-truth's precedent.

## Residue for judge / next shards

- `EXCLUDED_FIELDS.mcp` (E9.S1 dialect knobs: `includeTools`/`excludeTools`/`trust`/`timeout`) is
  untouched — gemini's dependency on `ir-schema-expressiveness` was schema-availability only; wiring
  those knobs into gemini's MCP read/write was not in this shard's Scope and is left for whichever
  shard picks it up (or a future gemini increment).
- `permission.request`→`BeforeToolSelection` is my best-available inference from the research corpus
  (no finer-grained canonical event exists, and GM8 gives no further semantic detail beyond ordering
  it between BeforeModel/AfterModel in the doc's event list). Flag if a more precise ground-truth
  source turns up.
- E4.S1's `TRACKED_PAIRS ['gemini','mcp', 'remote-mcp headers dropped on read']` is untouched by
  design (not owned) — still valid/tracked for the same documented reason.
- Verified (did not touch, confirmed still tracked post-fix): E4.S5's aggregate `matchers: regex`
  row (claude/gemini/cursor/crush) and E9.S3's aggregate declaration-table row both remain tracked —
  gemini's individual cells are now honest, but claude/cursor/crush (E4.S5) and
  claude/copilot/cursor/cline/crush (E9.S3) are still wrong, so neither aggregate flips. Same for
  E4.S3's stale-cells aggregate (gemini/commands cell now honest; cline/opencode/cursor/copilot/
  continue/crush cells remain stale) — owned by `convergence-graduation`.
- Noted but out of scope: many stale `/tmp/*` git worktrees from prior sessions litter `git worktree
list` (e.g. `mav-gemini-w` at a different, dead-Fable-session sha). Did not remove — not mine to
  judge which are still wanted.

## Gates (4×0, pristine worktree `/tmp/gate-gemini` @ d0fe3d6)

- `pnpm build` — 2/2 tasks green.
- `pnpm test` — agent-forge 675/675, agent-anatomy 36/36, agent-memory 121/121 (4/4 turbo tasks).
- `pnpm lint` — biome, 0 errors (472 files).
- `pnpm typecheck` — turbo, 4/4 packages, 0 errors.
