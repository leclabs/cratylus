# RETURN — standards-surfaces (wave 5)

commit `7413fd9` — standards-surfaces: nested AGENTS.md, standards importer, mirror-drift guard.
16 files, +474/−45.

- **Graduated (owned 4, re-derived from the tree — not the dispatch's nominal 5; see below):**
  E7.S2 ×2 (`dir`-scoped rule → self-sufficient `<dir>/AGENTS.md`, correct under both closest-wins
  replacement [S1] and Codex root-to-cwd concatenation [S9] — truth-table pinned) · E7.S4 ×1 (`agent-forge
doctor` mirror-drift check: `.claude/skills` vs `.agents/skills`, symlink-target or byte-equal) · E7.S9
  ×1 (dedicated `standards` importer in the roster, lifts root+nested AGENTS.md + `.agents/skills` into
  IR [S1][S3][S60]).
- **Nominal-count discrepancy (disclosed):** the dispatch's amendment counted "E7.S4×2 (.claude/skills
  mirror + doctor drift guard)" — but `s04-claude-skills-mirror.test.ts` carries only ONE `story.tracked`
  row today (the drift-guard bullet); its sibling assertion (the neutral-tree mirror itself) already uses
  `story(...)` — it graduated earlier as a side effect of `codex-adapter-truth`, per that file's own module
  comment and `codex-adapter-truth.RETURN.md`'s "Forced non-owned (1)" entry. `TRACKED-FAILING.md` (ground
  truth) confirmed only 4 rows under E7.S2/S4/S9 pre-existing on this base — re-derived from the tree per
  the dispatch's own instruction ("re-read the count from the tree you commit atop, never a pinned
  number"), not blindly targeted at 5. Net: **32/18 → 28/15** (−4), not the nominal −5.
- **Roster/target decision (E7.S9's `standards` id joins BOTH rosters):**
  - `src/cli/index.ts` `adapters[]` (16) and `test/stories/helpers.ts` `ALL_ADAPTERS` (16) — required:
    E7.S9's own test does `ALL_ADAPTERS.find(a => CANDIDATE_IDS.includes(a.id))` against the exact array
    `helpers.ts` exports, so `standards` cannot be added to the CLI roster alone.
  - `E6/S6.project-every-target` `toHaveLength(15)→(16)`, **deliberately, not blindly**: the dispatch
    flagged "an importer may NOT be a projection target — let the gate + spec decide." Read that test's
    body first: it doesn't merely count adapters, it asserts `adapter.capabilities.resources.rules !==
'none'` AND `adapter.write(rulesIR, 'project', dir, {}).written.length > 0` for every member of
    `ALL_ADAPTERS` — i.e. every roster member must be a genuine rules-writing compile target, not just an
    importer. `standards` IS one (`rules: 'full'`, `write()` emits root/nested `AGENTS.md`), so it
    legitimately belongs in the count — the gate decided it, not a blind bump.
  - `skills` capability declared **`partial`**, not `full` (deliberate, mirrors `zed`'s exact precedent):
    the spec-pure `.agents/skills` serializer drops `files`/`license`/`compatibility`/`metadata`/
    `paths`/`user_invocable`/`disable_model_invocation` — `E4.S1` roundtrip-matrix's shared skill fixture
    exercises `files`, which would NOT round-trip under a `full` claim. `rules` stays `full` (its fixture
    is `{id, body}` only — no lossy field in play) and was added to `roundtrip-matrix.test.ts`'s
    `PASSING_PAIRS`.
  - `capabilities.scopes: ['project']` only, with `read`/`write` explicitly refusing (skip+warn, never
    fabricate) at any other scope — dir-scoping and the neutral tree have no documented user/local home;
    the engine's automatic no-local-tier skip covers `local`, and an explicit early-return covers `user`
    (needed: the engine has no automatic user-scope gate the way it does for `local`, so a naive
    homedir-based write would have broken `E2.S4`'s "user-scope compile makes zero writes under the
    project root" — caught by the full-suite run, then fixed by this scope gate).
- **Non-owned test edits, every one disclosed:**
  - `test/stories/E4/capability-honesty.test.ts` — added the `standards:` `GROUND_TRUTH` row (the test
    asserts an exact bijection between `Object.keys(GROUND_TRUTH)` and `ALL_ADAPTERS`; zed's own landing
    added its row the same way).
  - `test/stories/E4/roundtrip-matrix.test.ts` — added `['standards', 'rules']` to `PASSING_PAIRS` (same
    bijection-style completeness assertion, `declared === classified`).
  - `test/stories/E6/S6.project-every-target.test.ts` — `toHaveLength(15)→(16)`, reasoned above.
  - `docs/release-audit-checklist.md` — added a `standards` row (mechanical, zed precedent).
  - `test/stories/MAP.md` — regenerated (`render-map.ts`); no hand edits.
  - No edits were needed to any generic per-adapter loop beyond the above — `E3.S2` fixpoint,
    `E7.S8` unmerged-proposals standing guard, `E2.S3/S4` documented-surface allowlists, and `E5.S1`
    all auto-passed for the new roster member without modification (verified by running the full
    `test/stories` + package suite before committing, not assumed).
- **E7.S2 fixture correction (same file, same edit as the call-site flip, disclosed):** `scopedIR()`'s
  scoped-rule literal used a `scope: 'packages/a'` key predating `ir-schema-expressiveness`'s landing of
  the real field name `dir` — the story-coverage wave (wave 2) authored this fixture before wave 4 decided
  the schema's field name. Left as `scope`, the test could never graduate (the engine reads `rule.dir`,
  which would stay `undefined`). Renamed the one key to `dir` and dropped the now-unnecessary `as unknown
as Rule` cast (a real, declared `Rule` field needs no cast). No other line in either test body changed —
  the assertions are exactly as originally pinned.
- **Gates (4×0, pristine worktree of `7413fd9`, `/tmp/gate-standards`, removed after):** `pnpm build` 2/2
  workspace packages · `pnpm test` 4/4 packages, `agent-forge` 694/694 (112 files), `agent-anatomy` 36/36,
  `agent-memory` 121/121 · `pnpm lint` (biome) 492 files, 0 errors · `pnpm typecheck` 4/4. All four ran
  against the fresh worktree's own `pnpm install --frozen-lockfile`, not the dev checkout's node_modules.
- **Residue routed:**
  - The E7.S3/E10.S6 rows this shard was told NOT to touch (already force-graduated by zed) were left
    untouched and re-verified green — no accidental re-flip.
  - `zed`'s spec-pure `.agents/skills` serializer was NOT imported/exported from `src/adapters/zed/`
    (that dir is a foreign owned path this wave); the same small field-set logic was independently written
    in `src/adapters/standards/index.ts` (`serializeSpecSkill`/`parseSpecSkill`) — genuine duplication of a
    ~10-line pattern, flagged here for `convergence-graduation` (wave 7) to consider hoisting into a shared
    `core/serialize` helper both `zed` and `standards` call, rather than two independent copies.
  - `test/adapters/` + `test/cli/` were grepped for roster-count/adapter-list assumptions before gating
    (the dispatch's "legacy-unit-test lesson") — one false-positive grep hit
    (`test/adapters/ir-bridge/round-trip.test.ts`, matched on unrelated `toHaveLength` calls over
    agent/skill fixture arrays, not the adapter roster) — no edit needed there.
  - `package.json`'s `exports` map needed no new entry — `./adapters/*` is already a wildcard covering
    `standards`.
