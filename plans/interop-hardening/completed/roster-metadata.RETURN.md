# RETURN — roster-metadata (wave 6) · judged PASS

commit `401ad73` — fresh executor (sonnet), serial atop green base `1788c59` (⊳devin `dc418f0` landed).

- **Graduated (owned 4):** E10.S5×4 — canonical id `antigravity` (⊳gemini, alias `gemini`);
  canonical id `devin` (alias `windsurf`); per-adapter `status` metadata on all 16 roster adapters;
  non-roster `roo` stub carries `{kind:'sunset', successor:'cline'}`.
- **Mechanism:** `Adapter.status: {kind:'current'|'renamed'|'sunset', canonicalId?, aliases?,
successor?}` (required field, `src/core/adapter/types.ts`). `gemini`/`devin` keep their existing
  `.id` (source/test compat — ~15 pre-existing test files key on the literal id string; renaming
  it would have been a 15-file blast radius unjustified by the story, which only asserts map
  resolution + identity, not `.id` equality); `antigravity`/`windsurf` resolve to the identical
  object via `status.aliases`/`canonicalId` in `adapterById` (story helpers) and the new
  `findAdapter()` helper (`src/core/adapter/resolve.ts`, exported from core). `assertAdaptersValid`
  now also lints the id/alias space for collisions. `roo` (`src/adapters/roo/index.ts`) is
  deliberately NOT added to `cli/index.ts`'s `adapters[]` or the story suite's `ALL_ADAPTERS` —
  roster stays 16; reachable only by direct/dynamic import, `write` refuses naming `cline`.
- **Tracked:** 8/7 (from 12/8; E10.S5 story fully emptied). Roster unchanged at 16.
- **Non-owned edits disclosed:**
  - `src/cli/commands/{import,compile,diff,doctor,lint,events}.ts` — swapped inline
    `adapters.find(a => a.id === id)` for `findAdapter(adapters, id)`. Cause: the accept criteria
    requires `import`/`compile`/`events --client` to keep resolving legacy ids (`gemini`,
    `windsurf`) post-rename; this is the resolution seam the rename requires, not a story-test edit.
  - `test/core/engine/compile.test.ts` — added `status: { kind: 'current' }` to its hand-typed
    `Adapter` fixture factory. Cause: `status` is now a required `Adapter` field; this legacy unit
    test (outside `test/stories/`) constructs a bespoke fixture and needed the field to typecheck.
    No assertions changed.
  - `src/cli/index.ts`'s `adapters` listing command — added a STATUS column + canonical-id display
    (`status.canonicalId ?? a.id`). Presentational only; no test asserts this command's console
    output (grepped `test/cli/` — none does).
- **Gates:** 4×0 in clean worktree of `401ad73` (`pnpm install --frozen-lockfile && pnpm build &&
pnpm test --force`): forge 694/694 (112 files), anatomy 36/36 (6 files); `coverage.test.ts` green
  (prints TRACKED-FAILING 8/7). `tsc --noEmit` clean in agent-forge. `biome check .` clean repo-wide
  (root `pnpm lint`; two mechanical reflows — `roo/index.ts` import wrap,
  `TRACKED-FAILING.md`/`MAP.md` table-width reflow from Prettier post row-deletion — both tool-forced,
  not hand-edited).
- **Residue for judge:**
  - Root `turbo run test` (both plain and `--force`) silently omits `packages/agent-memory`'s test
    task from its own run — pre-existing turbo/scope quirk, unrelated to this diff (I made zero
    edits under `packages/agent-memory/`). Verified independently: `pnpm test` run directly inside
    `packages/agent-memory` → 121/121 green. Flagging since the plan's standing gate law implicitly
    assumes the root `pnpm test --force` covers all three packages; today it silently doesn't.
  - A number of stray `git worktree`s pre-exist under `/tmp/` and
    `/Users/lex/workspaces/.mav-w5-standards` (not created by this shard, left untouched —
    out of territory to prune unilaterally).
  - `docs/release-audit-checklist.md`'s `gemini` row already anticipated this landing ("Antigravity
    transition status — surfaces carried over, ids/aliases correct") — left untouched, still
    accurate; no `roo` row added there (roo isn't a shipped adapter — E10.S7's checklist scope is
    the roster, not the stub).
