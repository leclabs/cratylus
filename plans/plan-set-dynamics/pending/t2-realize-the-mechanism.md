# t2 — realize the plan-set-dynamics mechanism

## Objective

Implement the plan-level lifecycle mechanism exactly as t1's design specifies: plan-level state, plan-set
membership churn, retirement/archival, and on-demand landing-commit derivation — in the `plans/` on-disk
layout + the praxis tooling.

## Inputs

- `[dep-fed] t1` — the completed design spec (the authoritative model + mechanism approach). Read it; do not
  re-derive the model.
- `plans/` — the on-disk plan layout (`PLAN.md` + state folders + `.owner`) to extend with plan-level state.
- `packages/agent-canon/src/toolkit/` — praxis/plan tooling (`project-targets.ts` and any plan-lifecycle
  module); `layPlansScaffold()` / `planner.ts` (repo-wide) as the scaffolding touchpoints.
- The memory session-registry (`~/.claude/skills/memory/episodic.mjs session`) — `owner`/`live`/`occupied`,
  which the plan-level model must not regress.
- `git` — for the derive-landing-commit-on-demand computation (never stored).

## Constraints

- Match t1's design exactly; if the design underspecifies a mechanism detail, route the gap back (do not
  invent divergent semantics).
- **derived-on-demand-never-stored**: the landing commit is computed from VCS when asked; no commit sidecar,
  no stored field.
- Archive, don't delete: retirement must preserve the plan (recoverable), replacing the informal dir-delete.
- Plan-level state = a function of on-disk structure (folder-as-state discipline), consistent with tasks.
- Must not regress existing plan mechanics (`list`, `owner`/`occupied`/`live`, dispatch/resume).
- Reversible; green build/typecheck/test.

## Dependencies

t1 (needs the settled design + mechanism approach).

## Outputs

- The mechanism code + `plans/` layout changes + tests.
- `pnpm --filter @leclabs/agent-canon typecheck && test` green; `graphify update .` run.

## Acceptance (blind, falsifiable)

1. A plan can transition through the plan-level states per t1's model (demonstrated by a test).
2. `list` reflects the in-scope vs retired/archived partition (a retired plan leaves in-scope, is archived).
3. Retirement is triggerable and preserves the plan (archive, not delete) — recoverable.
4. The landing commit is derived on demand from VCS, stored nowhere (grep confirms no commit sidecar/field).
5. Existing plan mechanics (owner/occupied/live, dispatch/resume) still pass their tests.
6. typecheck + test green.
   Falsifier: a stored landing commit; retirement that loses the plan; `list` blind to membership; regressed
   owner/occupied; red build.
