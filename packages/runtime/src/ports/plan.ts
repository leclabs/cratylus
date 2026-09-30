// ─────────────────────────────────────────────────────────────────────────────
// The plan capability PORT — plans and their units, met in the plan's own verbs.
//
// PURE INTERFACE — no implementation. `capabilities/plan/` realizes it over the
// plan and unit records. Every input names a plan, a unit or a concept by its
// name, and every output is the plan's view, rendered text. A unit's name is its
// own within its plan, so `plan` names the plan a unit is looked up in wherever
// its name alone could name units of several plans. Where a merge left one name
// held by more than one entity, the view prints each holder's identity beside it
// as `name (identity <id>)`, and that printed form is the one input addressing
// one holder.
//
// The lifecycle's states are the `plan` skill's. They reach the realization as
// configuration the projection emitted, and a caller speaks them only as the
// target of `advance` and the state a reconciliation settles on.
// ─────────────────────────────────────────────────────────────────────────────

import type { Invocation } from './design.js';

/**
 * The fields a plan or unit write gives, each replacing the item's own and each
 * left out carrying over. A plan's are `name` and `realizes`, the set of
 * concepts it realizes. A unit's are `name`, `realizes` (the one concept it
 * realizes, which its pin is taken on), `intent`, `static`, `deps` (units of its
 * plan), `outputs` and `accept`. `state` moves only by `bind`, `close` and
 * `advance`, and is given only to `reconcile`. `repin` retakes a unit's pin
 * on `revise` or `reconcile`, and the write's reason says why; a unit's pin is
 * otherwise kept, so editing its spec never clears a drift.
 */
export interface Fields {
  readonly name?: string;
  readonly realizes?: readonly string[];
  readonly state?: string;
  readonly intent?: string;
  readonly static?: readonly string[];
  readonly deps?: readonly string[];
  readonly outputs?: readonly string[];
  readonly accept?: readonly string[];
  readonly repin?: boolean;
}

/**
 * The plan's verbs. `show` renders the bound plan; given a name, the plan it
 * names, whole, with its units, or else the unit it names in full, looked up in
 * `plan` when given. Every write returns the view of what it wrote, and a
 * refused write writes nothing.
 */
export interface PlanHost {
  show(name?: string, plan?: string): string;
  /** Add the unit `unit` to `plan`. The first add naming a plan that does not
   *  exist proposes it, realizing `proposal`, the set of concepts. */
  add(
    unit: string,
    plan: string,
    fields: Fields,
    proposal: readonly string[] | undefined,
    by: Invocation,
  ): string;
  /** Move a unit one step forward, to `to`. */
  advance(
    unit: string,
    plan: string | undefined,
    to: string,
    by: Invocation,
  ): string;
  retract(unit: string, plan: string | undefined, by: Invocation): string;
  /** Revise the unit or plan `name` names; `plan` says it is a unit of that
   *  plan. A unit's pin is retaken only with `repin`. */
  revise(
    name: string,
    plan: string | undefined,
    fields: Fields,
    by: Invocation,
  ): string;
  bind(plan: string, by: Invocation): string;
  close(plan: string, by: Invocation): string;
  /** One version over every version of a diverged unit or plan. A field its
   *  versions agree on carries over; one they disagree on must be given. */
  reconcile(
    name: string,
    plan: string | undefined,
    fields: Fields,
    by: Invocation,
  ): string;
  /** Record that the work of `unit` landed at `commit`. Admitted only while
   *  the unit's plan is bound and the unit is in flight; the write prints the
   *  unit's line and its ledger, none of its spec. */
  land(
    unit: string,
    plan: string | undefined,
    commit: string,
    by: Invocation,
  ): string;
  /** Record an assay's `verdict` (`achieved` or `not-achieved`) on `commit`;
   *  a verdict not achieved names what was `missing`, one achieved names
   *  nothing. Admitted as `land` is. */
  assay(
    unit: string,
    plan: string | undefined,
    commit: string,
    verdict: string,
    missing: readonly string[],
    by: Invocation,
  ): string;
  /** Record that the line's `commit` holds `unit`. Admitted as `land` is. */
  whole(
    unit: string,
    plan: string | undefined,
    commit: string,
    by: Invocation,
  ): string;
  /** Record that `unit` broke the whole, by the failing `check`. Admitted as
   *  `land` is. */
  broke(
    unit: string,
    plan: string | undefined,
    check: string,
    by: Invocation,
  ): string;
}
