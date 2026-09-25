# scaffold-cutover

**Wave 0.** Realizes `plan` — the part of the clean cutover that lives in the project scaffold.

## Intent

A plan's readiness is computed from its dependencies and never stored, so nothing may lay down
folders whose placement is state. `scaffoldProject` (`@cratylus/forge/deploy`) still does: it
writes `<target>/plans/founding/{PLAN.md, pending, ready, active, completed}` into every consumer
project from a `ProjectTemplate`'s `planMd` and `planStates`, and canon's template sources those
states from `src/plan-states.ts`.

After this unit the scaffold writes no `plans/` tree. `ProjectTemplate` loses `planMd` and
`planStates`, the scaffold result loses `planDir`, canon's template stops importing
`PLAN_STATES`, and the "Work-tracking" section of both templates' AGENTS.md prose says work is
planned with the `plan` skill, without describing a stored layout. Forge keeps carrying only the
mapping: it gains no plan vocabulary in exchange.

## Static

- `git show 9cc32431:docs/design/record-store.md` § The three domains (`plan`), § Boundaries.
- `packages/forge/src/deploy/{init,project-template}.ts`; `packages/canon/tooling/{project-template,scaffold-cli}.ts`.
- `packages/canon/tooling/project-template.ts` register note (consumer-repo prose may not cite
  cratylus-local paths; `cratylism.test.ts` pins it).

## Deps

None.

## Outputs

- `packages/forge/src/deploy/project-template.ts`
- `packages/forge/src/deploy/init.ts`
- `packages/forge/src/deploy/index.ts`
- `packages/forge/test/deploy/cli.test.ts`
- `packages/forge/test/deploy/init-harness-home.test.ts`
- `packages/canon/tooling/project-template.ts`
- `packages/canon/tooling/scaffold-cli.ts`
- `packages/canon/test/cratylism.test.ts`
- `.changeset/scaffold-cutover.md`

## Accept

1. `git grep -nE "planStates|planMd|planDir|layPlansScaffold|'plans', 'founding'" -- packages/forge packages/canon/tooling packages/canon/test/cratylism.test.ts`
   prints nothing (at `9cc32431` it hits `forge/src/deploy/{init,project-template}.ts`,
   `forge/test/deploy/{cli,init-harness-home}.test.ts`, `canon/tooling/project-template.ts`,
   `canon/test/cratylism.test.ts`).
2. `git grep -n "plan-states" -- packages/canon/tooling` prints nothing.
3. `pnpm --filter @cratylus/forge test -- deploy/cli deploy/init-harness-home` passes, and both
   files assert that the scaffolded target has no `plans` directory.
4. `pnpm --filter @cratylus/canon test -- cratylism` passes.
5. Sole: no path in `packages/*/src` or `packages/canon/tooling` materializes a plan state folder
   — criterion 1 is its check, since the loop over `planStates` was the only such site.
6. `pnpm --filter @cratylus/forge typecheck` and `pnpm --filter @cratylus/canon typecheck` pass.
7. `.changeset/scaffold-cutover.md` names `@cratylus/forge` (the `ProjectTemplate` shape changes)
   and `@cratylus/canon`.
