// ─────────────────────────────────────────────────────────────────────────────
// THE PLAN — an entity naming the design it realizes, and its lifecycle.
//
// A plan's payload is its name, the design it realizes and its lifecycle state.
// The design is one per repository and a cut piece is no entity, so "the design
// it realizes" is the concepts of the piece: concept entities, which the
// interface names by anchor at its boundary.
//
// Propose writes a plan's first version; bind and close are supersessions moving
// it along its lifecycle, and no move goes backwards. Nothing retracts a plan: a
// closed plan stays in the fold, readable forever — closing replaces retiring by
// deletion.
//
// At most one plan is bound at a time. On one branch `bind` holds that law; a
// merge of two branches that each bound a different plan leaves two holders.
// That is state, like divergence: it is reported (`holders`), never resolved by
// picking one, and while it stands no plan may be bound.
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
  /** Every state, in lifecycle order; a plan is proposed into the first. */
  readonly states: readonly string[];
  /** The state at most one plan holds at a time. */
  readonly exclusive: string;
  /** The last state a plan reaches; it stays readable there. */
  readonly final: string;
}

/** A plan's whole state as of one record. */
export interface Plan {
  readonly name: string;
  /** The concepts of the piece the plan realizes, as concept entities. */
  readonly realizes: readonly string[];
  /** One of the lifecycle's `states`. */
  readonly state: string;
}

type By = Pick<Envelope, 'author' | 'reason' | 'cause'>;

/** The position of `state` in `lifecycle`, refusing a lifecycle this module's
 *  laws cannot hold under: the exclusive state must follow the first, and the
 *  final state follow the exclusive one. */
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
 * The plans holding the exclusive state — any version head of theirs stands in
 * it — in entity order. More than one is the state a merge of two binds leaves:
 * reported here, never resolved by picking one.
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

/** Why `entity` may not move to `to`, or `undefined` when it may: it must be a
 *  settled, live plan, and the move must go forward. */
function moveRefusal(
  folds: ReadonlyMap<string, Fold<Plan>>,
  lifecycle: PlanLifecycle,
  entity: string,
  to: string,
): string | undefined {
  const f = folds.get(entity);
  if (!f) return `${entity} is no plan`;
  if (f.heads.length > 1)
    return `plan ${entity} has diverged (${f.heads.length} heads); reconcile it first`;
  if (!f.payload) return `plan ${entity} is withdrawn`;
  const { name, state } = f.payload;
  if (position(lifecycle, to) <= position(lifecycle, state))
    return `plan ${name} is ${state}, and ${to} is no move forward from it`;
  return undefined;
}

/**
 * Whether the plan `entity` may be bound: the one decision, and the reason it
 * refuses (`undefined` when it may). It refuses while more than one plan holds
 * the exclusive state, a plan that is not settled and live, a move that is not
 * forward, while another plan holds the state, and a plan an owed ruling names.
 * `owed` is the set of plans the owed rulings name.
 */
export function bindRefusal(
  folds: ReadonlyMap<string, Fold<Plan>>,
  lifecycle: PlanLifecycle,
  entity: string,
  owed: ReadonlySet<string>,
): string | undefined {
  const held = holders(folds, lifecycle);
  const named = (e: string): string => folds.get(e)?.payload?.name ?? e;
  if (held.length > 1)
    return `more than one plan is ${lifecycle.exclusive} (${held.map(named).sort().join(', ')}); no plan is ${lifecycle.exclusive} until that is resolved`;
  const refusal = moveRefusal(folds, lifecycle, entity, lifecycle.exclusive);
  if (refusal) return refusal;
  const [holder] = held;
  if (holder !== undefined)
    return `plan ${named(holder)} is ${lifecycle.exclusive}, and at most one plan is`;
  if (owed.has(entity)) return `an owed ruling names plan ${named(entity)}`;
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
  const [first] = lifecycle.states;
  position(lifecycle, lifecycle.exclusive); // refuses a lifecycle bind and close cannot hold under
  return store.create<Plan>(
    DOMAIN,
    {
      name: plan.name,
      realizes: [...plan.realizes],
      state: first as string,
    },
    by,
  );
}

/** Bind the plan `entity`: move it to the exclusive state, refusing with
 *  `bindRefusal`'s reason. */
export function bind(
  store: RecordStore,
  lifecycle: PlanLifecycle,
  entity: string,
  owed: ReadonlySet<string>,
  by: By,
): Record<Plan> {
  const folds = plans(store);
  const refusal = bindRefusal(folds, lifecycle, entity, owed);
  if (refusal) throw new Error(`plan: bind refused — ${refusal}`);
  return move(store, folds, entity, lifecycle.exclusive, by);
}

/** Close the plan `entity`: move it to the final state, where it stays
 *  readable. Refuses a plan not settled and live, and a move backwards. */
export function close(
  store: RecordStore,
  lifecycle: PlanLifecycle,
  entity: string,
  by: By,
): Record<Plan> {
  const folds = plans(store);
  const refusal = moveRefusal(folds, lifecycle, entity, lifecycle.final);
  if (refusal) throw new Error(`plan: close refused — ${refusal}`);
  return move(store, folds, entity, lifecycle.final, by);
}
