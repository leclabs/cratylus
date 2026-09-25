// ─────────────────────────────────────────────────────────────────────────────
// THE PLAN — an entity naming the set of concepts it realizes, and its lifecycle.
//
// A plan's payload is its name, the set of concepts it realizes (concept
// entities, which the interface names by anchor at its boundary) and its
// lifecycle state.
//
// Propose writes a plan's first version; revise, bind and close are supersessions
// naming every head. Revise may change its name or the concepts it realizes, never
// its state; bind and close move it forward along its lifecycle. The final state
// is final: a closed plan is never revised, never moved, and keeps its name.
// Nothing retracts a plan: a closed plan stays in the fold, readable forever —
// closing replaces retiring by deletion.
//
// Two laws bind plans together. One live plan per name: a name is held by every
// plan carrying it, a diverged plan holding every name its heads carry. At most
// one plan bound: binding a plan returns whichever plan was bound to the
// lifecycle's first state. A merge of branches that each kept both laws can
// still break them — an incoherence, reported by `namesakes` and `holders` and
// never resolved by picking one. Every write passes one gate (`admit`): it is
// refused only when it INTRODUCES a violation, one whose plans were not already
// bound together in a standing violation of the same law. A write that shrinks a
// violation or leaves it standing is allowed, so every incoherence can be
// repaired one write at a time — revising a name, binding the plan to keep.
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

/** Stands for a proposed plan in the gate: its entity is minted only when it is
 *  written, and no minted entity is empty. */
const PROPOSAL = '';

/** The plan lifecycle, received from the runtime config — never spelled here. */
export interface PlanLifecycle {
  /** Every state, in lifecycle order; a plan is proposed into the first, and
   *  binding another plan returns a bound one to it. */
  readonly states: readonly string[];
  /** The state at most one plan holds at a time. */
  readonly exclusive: string;
  /** The last state a plan reaches, and final: it stays readable there. */
  readonly final: string;
}

/** A plan's whole state as of one record. */
export interface Plan {
  readonly name: string;
  /** The set of concepts the plan realizes, as concept entities. */
  readonly realizes: readonly string[];
  /** One of the lifecycle's `states`. */
  readonly state: string;
}

type By = Pick<Envelope, 'author' | 'reason' | 'cause'>;

/** Each plan's version-head payloads: one for a settled plan, several for a
 *  diverged one. The gate compares two of these, before and after a write. */
type Standing = ReadonlyMap<string, readonly Plan[]>;

/** A broken law: the plans it binds together, and what it says. */
interface Violation {
  readonly entities: readonly string[];
  readonly says: string;
}

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

function standing(folds: ReadonlyMap<string, Fold<Plan>>): Standing {
  return new Map(
    [...folds.values()].map((f) => [
      f.entity,
      f.heads.flatMap((h) => (h.payload ? [h.payload] : [])),
    ]),
  );
}

/** Each name with the plans holding it, in entity order. */
function held(of: Standing): Map<string, string[]> {
  const holding = new Map<string, Set<string>>();
  for (const [entity, versions] of of)
    for (const { name } of versions)
      holding.set(name, (holding.get(name) ?? new Set()).add(entity));
  return new Map([...holding].map(([name, e]) => [name, [...e].sort()]));
}

/** The plans holding the exclusive state — any head of theirs in it — in
 *  entity order. */
function bound(of: Standing, lifecycle: PlanLifecycle): string[] {
  return [...of]
    .filter(([, versions]) =>
      versions.some((v) => v.state === lifecycle.exclusive),
    )
    .map(([entity]) => entity)
    .sort();
}

/**
 * Every name more than one plan holds, by name, each with those plans in entity
 * order: incoherence, the state a merge of branches that each wrote a plan
 * under one name leaves. Reported here, never resolved by picking one.
 */
export function namesakes(
  folds: ReadonlyMap<string, Fold<Plan>>,
): { readonly name: string; readonly entities: readonly string[] }[] {
  return [...held(standing(folds))]
    .filter(([, entities]) => entities.length > 1)
    .map(([name, entities]) => ({ name, entities }))
    .sort((a, b) => (a.name < b.name ? -1 : 1));
}

/**
 * The plans holding the exclusive state, in entity order. More than one is
 * incoherence, the state a merge of two binds leaves: reported here, never
 * resolved by picking one.
 */
export function holders(
  folds: ReadonlyMap<string, Fold<Plan>>,
  lifecycle: PlanLifecycle,
): string[] {
  return bound(standing(folds), lifecycle);
}

/** Every broken law in `of`, by law. */
function violations(
  of: Standing,
  lifecycle: PlanLifecycle,
): readonly (readonly Violation[])[] {
  const both = bound(of, lifecycle);
  return [
    [...held(of)]
      .filter(([, entities]) => entities.length > 1)
      .map(([name, entities]) => ({
        entities,
        says: `another live plan is named ${name}`,
      })),
    both.length > 1
      ? [{ entities: both, says: `another plan is ${lifecycle.exclusive}` }]
      : [],
  ];
}

/**
 * Why writing `plan` as `entity`'s one version may not happen, or `undefined`
 * when it may. Its concepts must form a set; and the write must introduce no
 * violation — every violation after it must bind plans a violation of the same
 * law already bound together before it.
 */
function admit(
  folds: ReadonlyMap<string, Fold<Plan>>,
  lifecycle: PlanLifecycle,
  entity: string,
  plan: Plan,
): string | undefined {
  const twice = plan.realizes.find((c, i) => plan.realizes.indexOf(c) !== i);
  if (twice !== undefined)
    return `plan ${plan.name} names concept ${twice} twice, and it realizes a set`;
  const before = standing(folds);
  const after = new Map(before).set(entity, [plan]);
  const [was, is] = [
    violations(before, lifecycle),
    violations(after, lifecycle),
  ];
  for (const [law, broken] of is.entries())
    for (const v of broken)
      if (
        !was[law]?.some((w) => v.entities.every((e) => w.entities.includes(e)))
      )
        return v.says;
  return undefined;
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
 *  one payload, and a write names them all): its payload with `changes`,
 *  through the gate. */
function supersede(
  store: RecordStore,
  lifecycle: PlanLifecycle,
  entity: string,
  changes: Partial<Plan>,
  by: By,
  verb: string,
): Record<Plan> {
  const folds = plans(store);
  const f = folds.get(entity) as Fold<Plan>;
  const plan: Plan = { ...(f.payload as Plan), ...changes };
  const refusal = admit(folds, lifecycle, entity, plan);
  if (refusal) throw new Error(`plan: ${verb} refused — ${refusal}`);
  return store.supersede<Plan>(
    DOMAIN,
    entity,
    f.heads.map((h) => h.envelope.id),
    plan,
    by,
  );
}

/** Propose a plan: its first version, in the lifecycle's first state, through
 *  the gate. */
export function propose(
  store: RecordStore,
  lifecycle: PlanLifecycle,
  plan: Omit<Plan, 'state'>,
  by: By,
): Record<Plan> {
  position(lifecycle, lifecycle.exclusive); // refuses a lifecycle bind and close cannot hold under
  const first: Plan = {
    name: plan.name,
    realizes: [...plan.realizes],
    state: lifecycle.states[0] as string,
  };
  const refusal = admit(plans(store), lifecycle, PROPOSAL, first);
  if (refusal) throw new Error(`plan: propose refused — ${refusal}`);
  return store.create<Plan>(DOMAIN, first, by);
}

/**
 * Revise the plan `entity`: a version over its heads carrying `plan`'s name and
 * concepts, its state unchanged — only bind and close move that. Refuses a plan
 * not settled and live, a closed plan, and what the gate refuses.
 */
export function revise(
  store: RecordStore,
  lifecycle: PlanLifecycle,
  entity: string,
  plan: Omit<Plan, 'state'>,
  by: By,
): Record<Plan> {
  const folds = plans(store);
  const refusal = unsettled(folds, entity);
  if (refusal) throw new Error(`plan: revise refused — ${refusal}`);
  const { name, state } = (folds.get(entity) as Fold<Plan>).payload as Plan;
  if (state === lifecycle.final)
    throw new Error(
      `plan: revise refused — plan ${name} is ${state}, which is final, and a plan in it is never revised`,
    );
  const changes = { name: plan.name, realizes: [...plan.realizes] };
  return supersede(store, lifecycle, entity, changes, by, 'revise');
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
  const release = { state: lifecycle.states[0] as string };
  const written = holders(folds, lifecycle)
    .filter((other) => other !== entity)
    .map((other) => supersede(store, lifecycle, other, release, by, 'bind'));
  if (folds.get(entity)?.payload?.state !== lifecycle.exclusive) {
    const hold = { state: lifecycle.exclusive };
    written.push(supersede(store, lifecycle, entity, hold, by, 'bind'));
  }
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
  const { final } = lifecycle;
  if (position(lifecycle, final) <= position(lifecycle, state))
    throw new Error(
      `plan: close refused — plan ${name} is ${state}, and ${final} is no move forward from it`,
    );
  return supersede(store, lifecycle, entity, { state: final }, by, 'close');
}

/**
 * Reconcile the diverged plan `entity`: one whole-state version `plan`
 * superseding every head, through the gate. Refuses a plan that has not
 * diverged; a state outside the lifecycle; any state but the final one when a
 * head is final, which it is for good; and moving into the exclusive state a
 * plan none of whose heads holds it while an owed ruling names it.
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
  const f = folds.get(entity);
  if (!f?.diverged)
    refuse(
      `plan ${named(folds, entity)} has not diverged, and only divergence is reconciled`,
    );
  const heads = standing(folds).get(entity) ?? [];
  const { exclusive, final } = lifecycle;
  if (position(lifecycle, plan.state) < 0)
    refuse(`${plan.state} is no state of the plan lifecycle`);
  if (plan.state !== final && heads.some((h) => h.state === final))
    refuse(
      `a head of plan ${plan.name} is ${final}, which is final, so it reconciles to ${final} only`,
    );
  if (
    plan.state === exclusive &&
    !heads.some((h) => h.state === exclusive) &&
    owed.has(entity)
  )
    refuse(`an owed ruling names plan ${plan.name}`);
  const whole: Plan = {
    name: plan.name,
    realizes: [...plan.realizes],
    state: plan.state,
  };
  const refusal = admit(folds, lifecycle, entity, whole);
  if (refusal) refuse(refusal);
  return store.reconcile<Plan>(DOMAIN, entity, whole, by);
}
