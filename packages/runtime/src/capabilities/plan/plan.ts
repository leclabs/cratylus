// ─────────────────────────────────────────────────────────────────────────────
// THE PLAN — an entity naming the concepts it realizes, and its lifecycle.
//
// A plan's payload is its name, the concepts it realizes (concept entities, which
// the interface names by anchor at its boundary) and its lifecycle state.
//
// Propose writes a plan's first version; revise, bind and close are supersessions
// naming every head. Revise may change its name or the concepts it realizes, never
// its state; bind and close move it forward along its lifecycle. Nothing retracts
// a plan: a closed plan stays in the fold, readable forever — closing replaces
// retiring by deletion.
//
// At most one plan is bound: binding a plan returns whichever plan was bound to
// the lifecycle's first state. A merge of two branches that each bound a
// different plan still leaves two — an incoherence, reported by `holders` and
// never resolved by picking one — and binding the one to keep resolves it.
//
// One live plan per name: propose, revise and reconcile refuse a name another
// live plan carries, unless the plan already carries it — a write is refused only
// when it introduces a violation the fold did not already hold. A merge of two
// branches that each wrote a plan under one name still leaves two — an
// incoherence, reported by `namesakes`, and revising one plan's name resolves it.
//
// A diverged plan (heads carrying more than one payload) takes no ordinary write:
// revise, bind and close refuse it and point to `reconcile`, one version
// superseding every head. Heads carrying one payload have converged: the plan is
// settled, and its next write names every one of them.
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

/**
 * Every name more than one live plan carries, by name, each with those plans in
 * entity order: incoherence, the state a merge of two branches that each wrote
 * a plan under one name leaves. A diverged plan carries the name of each of its
 * version heads. Reported here, never resolved by picking one.
 */
export function namesakes(
  folds: ReadonlyMap<string, Fold<Plan>>,
): { readonly name: string; readonly entities: readonly string[] }[] {
  const carriers = new Map<string, Set<string>>();
  for (const f of folds.values())
    for (const head of f.heads)
      if (head.payload) {
        const own = carriers.get(head.payload.name) ?? new Set<string>();
        own.add(f.entity);
        carriers.set(head.payload.name, own);
      }
  return [...carriers]
    .filter(([, entities]) => entities.size > 1)
    .map(([name, entities]) => ({ name, entities: [...entities].sort() }))
    .sort((a, b) => (a.name < b.name ? -1 : 1));
}

/** Why a version of `entity` (none yet, for a proposal) may not carry `name`,
 *  or `undefined` when it may: one live plan per name, refused only when the
 *  version introduces the violation — a plan already carrying `name` keeps it. */
function nameRefusal(
  folds: ReadonlyMap<string, Fold<Plan>>,
  name: string,
  entity?: string,
): string | undefined {
  const carries = (f: Fold<Plan>): boolean =>
    f.heads.some((h) => h.payload?.name === name);
  const own = entity === undefined ? undefined : folds.get(entity);
  if (own && carries(own)) return undefined;
  const taken = [...folds.values()].some(
    (f) => f.entity !== entity && carries(f),
  );
  return taken ? `another live plan is named ${name}` : undefined;
}

/** Why `entity` may take no ordinary write, or `undefined` when it may: it must
 *  be a settled, live plan. */
function unsettled(
  folds: ReadonlyMap<string, Fold<Plan>>,
  entity: string,
): string | undefined {
  const f = folds.get(entity);
  if (!f) return `${entity} is no plan`;
  if (f.diverged)
    return `plan ${named(folds, entity)} has diverged; reconcile it first`;
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
    if ((folds.get(other) as Fold<Plan>).diverged)
      return `binding ${name} returns plan ${named(folds, other)} to ${lifecycle.states[0]}, and it has diverged; reconcile it first`;
  return undefined;
}

/** Write a version of settled `entity` over every head (converged heads carry
 *  one payload, and a write names them all): its payload with `changes`. */
function supersede(
  store: RecordStore,
  folds: ReadonlyMap<string, Fold<Plan>>,
  entity: string,
  changes: Partial<Plan>,
  by: By,
): Record<Plan> {
  const f = folds.get(entity) as Fold<Plan>;
  return store.supersede<Plan>(
    DOMAIN,
    entity,
    f.heads.map((h) => h.envelope.id),
    { ...(f.payload as Plan), ...changes },
    by,
  );
}

/** Propose a plan: its first version, in the lifecycle's first state. Refuses
 *  a name another live plan carries. */
export function propose(
  store: RecordStore,
  lifecycle: PlanLifecycle,
  plan: Omit<Plan, 'state'>,
  by: By,
): Record<Plan> {
  position(lifecycle, lifecycle.exclusive); // refuses a lifecycle bind and close cannot hold under
  const refusal = nameRefusal(plans(store), plan.name);
  if (refusal) throw new Error(`plan: propose refused — ${refusal}`);
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
 * Revise the plan `entity`: a version over its heads carrying `plan`'s name
 * and concepts, its state unchanged — only bind and close move that. Refuses a
 * plan not settled and live, and a name another live plan carries that the plan
 * does not already carry.
 */
export function revise(
  store: RecordStore,
  entity: string,
  plan: Omit<Plan, 'state'>,
  by: By,
): Record<Plan> {
  const folds = plans(store);
  const refusal =
    unsettled(folds, entity) ?? nameRefusal(folds, plan.name, entity);
  if (refusal) throw new Error(`plan: revise refused — ${refusal}`);
  return supersede(
    store,
    folds,
    entity,
    { name: plan.name, realizes: [...plan.realizes] },
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
      supersede(store, folds, other, { state: lifecycle.states[0] }, by),
    );
  if (folds.get(entity)?.payload?.state !== lifecycle.exclusive)
    written.push(
      supersede(store, folds, entity, { state: lifecycle.exclusive }, by),
    );
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
  return supersede(store, folds, entity, { state: lifecycle.final }, by);
}

/**
 * Reconcile the diverged plan `entity`: one whole-state version `plan`
 * superseding every head; a plan that has not diverged refuses, and so does a
 * name another live plan carries that no head of this one does. A `plan` in
 * the exclusive state keeps the binding law: it refuses while another plan
 * holds that state (bind resolves that) or an owed ruling names the plan.
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
  if (!folds.get(entity)?.diverged)
    refuse(
      `plan ${named(folds, entity)} has not diverged, and only divergence is reconciled`,
    );
  if (position(lifecycle, plan.state) < 0)
    refuse(`${plan.state} is no state of the plan lifecycle`);
  const refusal = nameRefusal(folds, plan.name, entity);
  if (refusal) refuse(refusal);
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
