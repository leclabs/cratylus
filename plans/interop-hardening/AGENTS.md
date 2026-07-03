# interop-hardening — plan-scope memory (open threads)

_The plan node's semantic sink (dream-written, net-current). `PLAN.md` is the state mirror; this
file carries the working thread._

## Open threads

- **Wave 5 in flight (15 shards, all Mav-lane, dispatched 2026-07-03 post-reset):** judge each
  RETURN by the judge law below, then joint gates → wave close → release wave 6 (`claude-surfaces`
  ⊳claude-mcp; `roster-metadata` ⊳devin) → wave 7 (`convergence-graduation`). Dead-executor
  recovery is proven: graft `agent-<id>.{jsonl,meta.json}` from the spawning session's
  `subagents/` into the current session's, then SendMessage the id (resume-by-id is
  session-dir-scoped).
- **Judge law for graduations:** net removed rows (pair removed with re-added — reflow edits
  over-count raw diffs) ≡ owned set; zero non-owned flips; direct count of the committed
  `TRACKED-FAILING.md` is the arithmetic check; suite count in `pnpm test` corroborates.
- **Hand-off notes into wave 5 (standing):** `test/stories/E7/s07` RULE_B `as unknown as Rule`
  cast — drop when its 4 adapter-owned tracked tests graduate (codex-class shards). IR `mcp.auth`
  loose (`{type: string, …}` [CU5]) — tighten if the cursor shard finds richer structure.
  `test/stories/E4/support.ts` `EXCLUDED_FIELDS` dated exclusions — when an adapter shard lands
  emit/lift for a field, move it into `FIXTURES`.
- **Watch (engine-report residue):** claude/gemini native hook objects now carry `id` — fleet
  settings.json gains it on next anatomy deploy; flag if Claude Code doctor complains. Drift
  default = warn. E4.S1 matrix close: convergence-graduation classifies zed's partial cells.
- **Plan-bookkeeping residue (observed 2026-07-03, pre-copilot-dispatch):** `continue-adapter-truth`
  code SHIPPED (4d81308, ancestor of HEAD, 9 owned ids graduated) but its task file is still
  `active/` with no `.RETURN.md` — the executing agent died after the code commit, before the
  plan-housekeeping commit. `opencode-adapter-truth` genuinely mid-flight (task file `active/`,
  no landing commit found on any ref). Neither touched by the copilot dispatch (out of territory);
  flagged for Nico's aggregate reconciliation.
- **`copilot-adapter-truth` SHIPPED** (`0125ea8`+`9489236`, wave 5): 14/14 owned ids graduated
  (E8.S4 fully empties), 3 forced non-owned flips (E1.S2/E1.S3 copilot specs, same
  ZERO_LIFT_GRADUATED/gap-removal mechanism crush/continue/gemini/zed already used), 1 mandatory
  E4.S1 matrix addition (`copilot/commands` now `full`, verified round-trips). TRACKED-FAILING
  119/38 → 105/37. Gates 4×0 in pristine worktree @ `9489236` (forge 677, anatomy 36, memory 121).
  Two **legacy non-story** unit-test files (`test/adapters/copilot/round-trip.test.ts`,
  `test/cli/portability-phase2.test.ts`) still asserted the old fabrications and only surfaced at
  the repo-wide gate (invisible to a `test/stories`-only run) — rewritten to pin the corrected
  behavior; see completed/copilot-adapter-truth.RETURN.md for full disclosure. **General lesson
  for remaining wave-5 adapter shards**: always grep `test/adapters/<id>/` and cross-adapter
  fixture consumers (e.g. `test/cli/portability-phase2.test.ts`) for the adapter id, not just
  `test/stories/` — the story-coverage suite does not shadow the legacy unit suite.
