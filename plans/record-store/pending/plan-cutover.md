# plan-cutover

**Wave 4 (terminal).** Realizes `plan` — the clean cutover of the stored plan layout, and of this
plan with it. **Rulings owed: R1, R2, R3** (PLAN.md).

## Intent

The plan-state folders, the plan markers and the plan-set tooling the `plan` capability replaces
are deleted, every caller is migrated, and this plan moves onto the substrate it built.

1. **Delete the layout and its tooling:** `packages/canon/src/plan-states.ts`;
   `packages/canon/tooling/plan-set.ts`, `plan-set-cli.ts`, `plan-set/plan-set.sh`;
   `packages/canon/test/plan-set.test.ts`; the `plan-set` and `plan` scripts of
   `packages/canon/package.json` and the root `plan` script.
2. **Migrate the gates whose subject was the layout.** `command-veracity.test.ts` loses its
   PLAN-PATH and DESIGNATOR legs, its `plan-set` import and its `plans/**` carve-outs, and gains an
   exemption for the records root: records are immutable history, so a gate over their text could
   only be satisfied by never recording (the same reason `plans/*/completed/**` was exempt).
   `signify-marker-class.test.ts`'s sanctioned home for recorded debt moves from `plans/` to the
   notebook's records. `reader-register.ts` and `reader-reach.test.ts` retire the `task-file` and
   `plan-mirror` artifact classes and their fixtures. `gate-convicts.test.ts` unregisters
   `plan-set.test.ts` and drops the orphan comment that describes a deleted carry-on cell test
   beside the `capability-keyspace` row.
3. **Rewrite live claims about the layout:** the `turbo.json` test comment, the `plans/` symlink
   notes in `.husky/pre-commit` and `.prettierignore`, the `gates.yml` `fetch-depth` rationale (the
   designator oracle is gone; the immutability gate's range diff is what needs history now), the
   header of `docs/research/cold-decode-as-a-skill.md`, and the task-file path cited in
   `fixtures/generated/delegation-prompt.md`. Measured-incident comments that record a past defect
   in `plan-set.ts` (`positional-path.test.ts`, `tooling/src/repo-root.ts`,
   `symbol-altitude.test.ts`) are history, not claims, and stay unless one reads as present tense.
4. **R2** — dispose of the runtime `carryOn` capability as ruled.
5. **R3** — dispose of `plans/omp-harness/` as ruled. The two loose plan-mode files at `plans/`'s
   root lose their command-veracity exemption with the carve-out; move them to `docs/research/`
   (the `cold-decode-as-a-skill.md` precedent) and make them pass the gates there.
6. **Cut this plan over.** `plan add` every unit of `plans/record-store/` with its spec from its
   shard (its `realizes` resolves to the migrated concept and pins automatically), advance each
   to the state this mirror shows at that moment, bind it as R1 defines, then delete
   `plans/record-store/` and, once empty, `plans/`.

## Static

- `git show 9cc32431:docs/design/record-store.md` § Boundaries (clean cutover).
- `PLAN.md` § Census for the measured reference set and its command; re-run it at dispatch.
- `.github/workflows/gates.yml`, `turbo.json`, `.husky/pre-commit`, `.prettierignore`.
- `packages/canon/test/{command-veracity,gate-convicts,reader-reach}.test.ts`,
  `packages/canon/test/reader-register.ts`,
  `packages/forge/test/catalog/signify-marker-class.test.ts`.

## Deps

`trio-skill-routing` (the `plan` skill no longer imports `plan-states.ts`), `design-migration`
(pins need the migrated concepts), `scaffold-cutover` (the scaffold no longer imports it),
`domain-interface` (`plan add`)

## Outputs

- Deleted: `packages/canon/src/plan-states.ts`, `packages/canon/tooling/plan-set.ts`,
  `packages/canon/tooling/plan-set-cli.ts`, `packages/canon/tooling/plan-set/**`,
  `packages/canon/test/plan-set.test.ts`,
  `packages/canon/test/fixtures/generated/{plan-mirror,task-file,task-file-dep}.md`,
  `plans/record-store/**`, `plans/omp-harness/**` (per R3)
- Moved: `plans/i-d-like-you-to-wild-flute.md`,
  `plans/i-d-like-you-to-wild-flute-agent-adfb43c51e20c79ba.md` → `docs/research/`
- Edited: `packages/canon/test/command-veracity.test.ts`,
  `packages/canon/test/gate-convicts.test.ts`, `packages/canon/test/reader-register.ts`,
  `packages/canon/test/reader-reach.test.ts`,
  `packages/canon/test/fixtures/generated/delegation-prompt.md`,
  `packages/forge/test/catalog/signify-marker-class.test.ts`, `packages/canon/package.json`,
  `package.json`, `turbo.json`, `.husky/pre-commit`, `.prettierignore`,
  `.github/workflows/gates.yml`, `docs/research/cold-decode-as-a-skill.md`; permitted only if a
  line reads as a live claim: `packages/canon/test/positional-path.test.ts`,
  `packages/tooling/src/repo-root.ts`, `packages/canon/test/symbol-altitude.test.ts`
- Per R2 (a) delete: `packages/runtime/src/capabilities/carry-on/**`,
  `packages/runtime/src/ports/carry-on.ts`, `packages/runtime/test/carry-on.test.ts`,
  `packages/runtime/src/{loader,plugin,main,index,bin-name}.ts`, `packages/runtime/README.md`,
  `packages/canon/src/manifest.ts`, `packages/canon/test/{capability-keyspace,bin-name-single-home,runtime-shim}.test.ts`,
  `packages/canon/src/dimensions/autonomy/human-on-the-loop.ts` (its comment names the gate),
  `packages/cli/README.md`; per R2 (b) rebase: `packages/runtime/src/capabilities/carry-on/**`,
  `packages/runtime/test/carry-on.test.ts`
- New: this plan's plan records, and notes if R3 (a) captures them
- `.changeset/plan-cutover.md`

## Accept

1. `git ls-files plans` prints nothing (at `9cc32431`: 14 files, before this plan's own).
2. `git grep -nE "PLAN_STATES|PLAN_FRONTIER|PLAN_MARKERS|SUPERSEDED_MARKER|from '[^']*(plan-set|plan-states)[^']*'|tooling/plan-set" -- . ':!*CHANGELOG.md' ':!<records root>'`
   prints nothing, and the same command with `-c` run at `9cc32431` printed a non-zero total (print
   both).
3. `git grep -nE "PlanLayout|--plan-root|--states" -- packages` prints nothing, or under R2 (b)
   only the rebased terminus's own reader of the plan domain.
4. `pnpm exec cratylus plan show` (after `pnpm build`) presents this plan per R1 with every unit
   in wave order, each pinned to a live concept, none drifted or suspect, no incoherence, and
   every unit but `plan-cutover` completed.
5. R3: `git ls-files plans/omp-harness` prints nothing, and under R3 (a) `note show` lists its
   open fork and its two pending units.
6. Sole: plan state has one home — the plan domain — checked by criteria 1–3 together.
7. `pnpm verify` passes.
8. `.changeset/plan-cutover.md` names every package this unit's paths changed.
