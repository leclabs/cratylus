# spec-workspace-glob-and-config

**State:** pending · **Owner:** Mav · **Deps.** spec-koine-collapse, spec-episodic-extraction (their
final shapes determine the glob + references). The integration task: makes the build coherent + green
after the two structural moves.

**What.** Reconcile the root build/config surface to the new flat `packages/*` layout, and finish the
first-principles hygiene sweep on root config that the structural moves don't themselves cover.

**Changes.**

1. **`pnpm-workspace.yaml` glob.** `packages/koine/*` -> `packages/*`. With koine collapsed to one
   package and episodic pulled to top-level, the `koine/*` grouping glob has no job. `packages/mind`
   stays excluded automatically (no `package.json`). Idiomatic pnpm: one dir == one member.
2. **`tsconfig.json` references.** From `{core, cli, adapters}` to `{koine, episodic}` — two members,
   path mirrors identity.
3. **`.changeset/config.json`.** Drop the now-single-package `fixed` group (a fixed group of one is
   meaningless); decide `access` per the publish-intent outcome of Fork 1 (`restricted` stays correct
   if unpublished). Reconcile episodic's presence (it was absent from `fixed` — now an independent
   member, it gets its own changeset lifecycle).
4. **`pnpm-workspace.yaml` catalog comment.** "Shared dependency versions for koine (carried from
   agentir)." -> drop the agentir provenance tail (a stale palimpsest crumb; the comment can keep its
   functional half). Coordinate with P0's de-palimpsest ledger so the two don't double-edit.
5. **`turbo.json`** — verify the task graph (`build`/`test`/`typecheck` with `^build`) still resolves
   with two members; no change expected, confirm empirically.
6. **Root loose-file + dir hygiene (first-principles sweep).** Confirmed inventory at HEAD: `docs/`
   holds one file (`the-ambient-person.md`); `.scratchpad/` holds one stray (resolved in P0);
   `tsconfig.json` + `tsconfig.base.json` split is correct (idiomatic). Review whether `docs/` (a
   single ambient-person essay) wants a clearer home vs `packages/mind/` — **flag, do not move** without
   Nico (it is corpus-adjacent prose). Everything else (`.changeset`, `.husky`, `.npmrc`, `.nvmrc`,
   `mise.toml`, biome/commitlint/prettier configs) is standard and stays.

**Fleet/deploy implication.** None — config-only; no deploy path changes.

**Rollback.** Pure config diff; revert restores prior globs/references. Caught immediately by `pnpm
build` if a reference is wrong.

**Exit criteria.**

- `pnpm-workspace.yaml` is `packages: ["packages/*"]`; resolves exactly the intended members
  (`pnpm ls -r --depth -1` shows koine + episodic, not mind).
- `tsconfig.json` references + `.changeset/config.json` match the two-member reality.
- No agentir provenance crumb remains in the catalog comment.
- `docs/` home decision recorded (flagged to Nico if a move is proposed; not executed here).
- Green end-to-end: `pnpm build` + `pnpm test` + `pnpm lint` + `pnpm typecheck`.
