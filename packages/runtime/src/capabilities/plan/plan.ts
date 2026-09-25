// ─────────────────────────────────────────────────────────────────────────────
// THE PLAN — an entity naming the concepts it realizes, and its lifecycle.
//
// A plan's payload is its name, the concepts it realizes (concept entities, which
// the interface names by anchor at its boundary) and its lifecycle state.
//
// Propose writes a plan's first version; bind and close are supersessions moving
// it forward along its lifecycle. Nothing retracts a plan: a closed plan stays in
// the fold, readable forever — closing replaces retiring by deletion.
//
// At most one plan is bound: binding a plan returns whichever plan was bound to
// the lifecycle's first state. A merge of two branches that each bound a
// different plan still leaves two — an incoherence, reported by `holders` and
// never resolved by picking one — and binding the one to keep resolves it.
//
// A diverged plan (more than one head) takes no ordinary write: bind and close
// refuse it and point to `reconcile`, one version superseding every head.
//
// The lifecycle's states are meaning, and their one home is the `plan` skill.
// This module spells none of them: it receives the vocabulary as a parameter
// (`PlanLifecycle`) and acts only on the roles it conveys. An owed ruling is the
// notebook's; this module receives the plans the owed rulings name.
// ─────────────────────────────────────────────────────────────────────────────

import { type Fold, fold } from '../../record-store/fold.js';
import type { Envelope, Record } from '../../record-store/record.js';
import type { RecordStore } from '../../record-store/store.js';

/** The records domain holding plans. */
const DOMAIN = 'plan';

/** The plan lifecycle, received from the runtime config — never spelled here. */
export interface PlanLifecycle {
  /** Every state, in lifecycle order; a plan is proposed into the first, and
   *  binding another plan returns a bound one to it. */
  readonly states: readonly string[];
  /** The state at most one plan holds at a time. */
  readonly exclusive: string;
  /** The last state a plan reaches; it stays readable there. */
  readonly final: string;
}

/** A plan's whole state as of one record. */
export interface Plan {
  readonly name: string;
  /** The concepts the plan realizes, as concept entities. */
  readonly realizes: readonly string[];
  /** One of the lifecycle's `states`. */
  readonly state: string;
}

type By = Pick<Envelope, 'author' | 'reason' | 'cause'>;

/** The position of `state` in `lifecycle` (-1 when it is none of its states),
 *  refusing a lifecycle this module's laws cannot hold under: the exclusive
 *  state must follow the first, and the final state follow the exclusive one. */
function position(lifecycle: PlanLifecycle, state: string): number {
  const { states, exclusive, final } = lifecycle;
  const at = states.indexOf(exclusive);
  if (at < 1 || states.indexOf(final) <= at)
    throw new Error(
      `plan: lifecycle ${JSON.stringify(lifecycle)} refused — its exclusive state must follow its first, and its final state follow its exclusive one`,
    );
  return states.indexOf(state);
}

/** Every plan, folded from its records at the moment of the read. */
export function plans(store: RecordStore): ReadonlyMap<string, Fold<Plan>> {
  return fold(store.read<Plan>(DOMAIN));
}

/**
 * The plans holding the exclusive state — any head of theirs stands in it — in
 * entity order. More than one is incoherence, the state a merge of two binds
 * leaves: reported here, never resolved by picking one.
 */
export function holders(
  folds: ReadonlyMap<string, Fold<Plan>>,
  lifecycle: PlanLifecycle,
): string[] {
  return [...folds.values()]
    .filter((f) =>
      f.heads.some((h) => h.payload?.state === lifecycle.exclusive),
    )
    .map((f) => f.entity)
    .sort();
}

/** The plan's name, read off its first head carrying one (a diverged plan's
 *  heads may disagree), else its entity. */
function named(folds: ReadonlyMap<string, Fold<Plan>>, entity: string): string {
  return (
    folds.get(entity)?.heads.find((h) => h.payload)?.payload?.name ?? entity
  );
}

/** Why `entity` may take no ordinary write, or `undefined` when it may: it must
 *  be a settled, live plan. */
function unsettled(
  folds: ReadonlyMap<string, Fold<Plan>>,
  entity: string,
): string | undefined {
  const f = folds.get(entity);
  if (!f) return `${entity} is no plan`;
  if (f.heads.length > 1)
    return `plan ${named(folds, entity)} has diverged (${f.heads.length} heads); reconcile it first`;
  if (!f.payload) return `plan ${entity} is withdrawn`;
  return undefined;
}

/**
 * Whether the plan `entity` may be bound: the one decision, and the reason it
 * refuses (`undefined` when it may). It refuses a plan that is not settled and
 * live, a plan past the exclusive state, a plan already its one holder, a plan
 * an owed ruling names (`owed`, the plans the owed rulings name), and a bind
 * that would return a diverged plan to the first state.
 */
export function bindRefusal(
  folds: ReadonlyMap<string, Fold<Plan>>,
  lifecycle: PlanLifecycle,
  entity: string,
  owed: ReadonlySet<string>,
): string | undefined {
  const refusal = unsettled(folds, entity);
  if (refusal) return refusal;
  const { name, state } = (folds.get(entity) as Fold<Plan>).payload as Plan;
  const { exclusive } = lifecycle;
  if (position(lifecycle, state) > position(lifecycle, exclusive))
    return `plan ${name} is ${state}, and ${exclusive} is a move backwards from it`;
  const others = holders(folds, lifecycle).filter((e) => e !== entity);
  if (state === exclusive && others.length === 0)
    return `plan ${name} is already ${exclusive}`;
  if (owed.has(entity)) return `an owed ruling names plan ${name}`;
  for (const other of others)
    if ((folds.get(other) as Fold<Plan>).heads.length > 1)
      return `binding ${name} returns plan ${named(folds, other)} to ${lifecycle.states[0]}, and it has diverged; reconcile it first`;
  return undefined;
}

/** Write a supersession of the one head of `entity`, moving it to `to`. */
function move(
  store: RecordStore,
  folds: ReadonlyMap<string, Fold<Plan>>,
  entity: string,
  to: string,
  by: By,
): Record<Plan> {
  const f = folds.get(entity) as Fold<Plan>;
  const [head] = f.heads as [Record<Plan>];
  return store.supersede<Plan>(
    DOMAIN,
    entity,
    [head.envelope.id],
    { ...(f.payload as Plan), state: to },
    by,
  );
}

/** Propose a plan: its first version, in the lifecycle's first state. */
export function propose(
  store: RecordStore,
  lifecycle: PlanLifecycle,
  plan: Omit<Plan, 'state'>,
  by: By,
): Record<Plan> {
  position(lifecycle, lifecycle.exclusive); // refuses a lifecycle bind and close cannot hold under
  return store.create<Plan>(
    DOMAIN,
    {
      name: plan.name,
      realizes: [...plan.realizes],
      state: lifecycle.states[0] as string,
    },
    by,
  );
}

/**
 * Bind the plan `entity`, refusing with `bindRefusal`'s reason: return every
 * other plan holding the exclusive state to the first state, then move `entity`
 * to it unless it already holds it. The records written, in order.
 */
export function bind(
  store: RecordStore,
  lifecycle: PlanLifecycle,
  entity: string,
  owed: ReadonlySet<string>,
  by: By,
): Record<Plan>[] {
  const folds = plans(store);
  const refusal = bindRefusal(folds, lifecycle, entity, owed);
  if (refusal) throw new Error(`plan: bind refused — ${refusal}`);
  const written = holders(folds, lifecycle)
    .filter((other) => other !== entity)
    .map((other) =>
      move(store, folds, other, lifecycle.states[0] as string, by),
    );
  if (folds.get(entity)?.payload?.state !== lifecycle.exclusive)
    written.push(move(store, folds, entity, lifecycle.exclusive, by));
  return written;
}

/** Close the plan `entity`: move it to the final state, where it stays
 *  readable. Refuses a plan not settled and live, and one already there. */
export function close(
  store: RecordStore,
  lifecycle: PlanLifecycle,
  entity: string,
  by: By,
): Record<Plan> {
  const folds = plans(store);
  const refusal = unsettled(folds, entity);
  if (refusal) throw new Error(`plan: close refused — ${refusal}`);
  const { name, state } = (folds.get(entity) as Fold<Plan>).payload as Plan;
  if (position(lifecycle, lifecycle.final) <= position(lifecycle, state))
    throw new Error(
      `plan: close refused — plan ${name} is ${state}, and ${lifecycle.final} is no move forward from it`,
    );
  return move(store, folds, entity, lifecycle.final, by);
}

/**
 * Reconcile the diverged plan `entity`: one whole-state version `plan`
 * superseding every head; a plan that has not diverged refuses. A
 * `plan` in the exclusive state keeps the binding law: it refuses while another
 * plan holds that state (bind resolves that) or an owed ruling names the plan.
 */
export function reconcile(
  store: RecordStore,
  lifecycle: PlanLifecycle,
  entity: string,
  plan: Plan,
  owed: ReadonlySet<string>,
  by: By,
): Record<Plan> {
  const folds = plans(store);
  const refuse = (why: string): never => {
    throw new Error(`plan: reconcile refused — ${why}`);
  };
  if ((folds.get(entity)?.heads.length ?? 0) < 2)
    refuse(
      `plan ${named(folds, entity)} has not diverged, and only divergence is reconciled`,
    );
  if (position(lifecycle, plan.state) < 0)
    refuse(`${plan.state} is no state of the plan lifecycle`);
  if (plan.state === lifecycle.exclusive) {
    const [other] = holders(folds, lifecycle).filter((e) => e !== entity);
    if (other !== undefined)
      refuse(
        `plan ${named(folds, other)} is ${lifecycle.exclusive}; reconcile ${plan.name} to another state, then bind it`,
      );
    if (owed.has(entity)) refuse(`an owed ruling names plan ${plan.name}`);
  }
  return store.reconcile<Plan>(
    DOMAIN,
    entity,
    { name: plan.name, realizes: [...plan.realizes], state: plan.state },
    by,
  );
}
