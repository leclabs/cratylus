// ─────────────────────────────────────────────────────────────────────────────
// THE UNIT — one unit of work in a plan, realizing exactly one concept, the one
// its pin names, and carrying its full spec and lifecycle state, as records in
// the `unit` domain.
//
// A unit's payload is its plan (an entity reference), its full spec, its
// lifecycle state and its pin (`pin.ts`), whose concept is the one the unit
// realizes. Add writes its first version, revise supersedes it, advance moves
// it one step forward along its lifecycle and refuses any other move, retract
// withdraws it, and reconcile writes one version over every head of a diverged
// unit.
//
// The unit laws: one live unit per name within its plan; dependencies acyclic,
// naming live units of the same plan; a plan that is not withdrawn. A write is
// refused iff it would introduce a violation — one whose entities no standing
// violation of the same law already binds together — so incoherence, like
// divergence, arises only from merges, the owner keeps working while one
// stands, and ordinary writes shrinking it, one at a time, reconcile it.
// `incoherence` reports what a merge left.
//
// Readiness is computed, never stored: `ready`, `frontier` and `waves` are pure
// functions over the fold, and no record carries what they compute.
//
// What this module needs from other domains it RECEIVES, never spells or
// imports: the unit lifecycle vocabulary (the runtime config), plan liveness
// (`plan`), and the entities owed rulings name (`notebook`). Each is a
// structurally typed parameter; the domain interface composes them.
// ─────────────────────────────────────────────────────────────────────────────

import { canonicalOrder } from '../../record-store/canonical-order.js';
import {
  type Fold,
  type Incoherence as ReferenceIncoherence,
  fold,
  incoherence as referenceIncoherence,
} from '../../record-store/fold.js';
import type {
  Envelope,
  Operation,
  Record,
  RecordId,
} from '../../record-store/record.js';
import { introduced } from '../../record-store/repair.js';
import type { RecordStore } from '../../record-store/store.js';
import type { Pin } from './pin.js';

/** The domain directory holding unit records. */
export const DOMAIN = 'unit';

/** Stands in for the record id, and for a unit not yet minted its entity,
 *  while a write is judged against the laws before it is written. */
const UNWRITTEN = '(unwritten)';

/** The unit lifecycle, received from the runtime config: its states in
 *  order (the first is a unit not yet started) and the state that satisfies
 *  a dependency, as does every state after it. */
export interface UnitLifecycle {
  readonly states: readonly string[];
  readonly satisfies: string;
}

/** A unit's full spec, but for the concept it realizes, which is its pin's. */
export interface Spec {
  /** Unique among the live units of its plan. */
  readonly name: string;
  readonly intent: string;
  readonly static: readonly string[];
  /** The units this one depends on: entity references. */
  readonly deps: readonly string[];
  readonly outputs: readonly string[];
  readonly accept: readonly string[];
}

/** A unit's payload: its whole state as of one record. */
export interface Unit {
  /** The plan the unit belongs to: an entity reference. */
  readonly plan: string;
  readonly spec: Spec;
  readonly state: string;
  readonly pin: Pin;
}

/** Who writes a record, and why. */
export type By = Pick<Envelope, 'author' | 'reason' | 'cause'>;

/** Plan liveness, as the plan domain reports it: true when the plan entity's
 *  one head is a retraction. */
export type PlanWithdrawn = (plan: string) => boolean;

/** A unit law broken across units by a merge: a dep on a withdrawn unit, a
 *  unit of a withdrawn plan (`reference` is the plan), a dep cycle, or one
 *  name on more than one live unit of a plan. */
export type Incoherence =
  | ReferenceIncoherence
  | {
      readonly kind: 'name';
      readonly name: string;
      readonly entities: readonly string[];
    };

/** A unit law broken: an incoherence, or a dep that names no unit, a
 *  diverged unit or a unit of another plan, which no merge produces. */
type Violation =
  | Incoherence
  | {
      readonly kind: 'dep';
      readonly entity: string;
      readonly reference: string;
      readonly why: string;
    };

type Units = ReadonlyMap<string, Fold<Unit>>;

function checked(lifecycle: UnitLifecycle): UnitLifecycle {
  const { states, satisfies } = lifecycle;
  if (states.length === 0 || new Set(states).size !== states.length)
    throw new Error(
      'unit: the lifecycle refused — its states must be present and distinct',
    );
  if (!states.includes(satisfies))
    throw new Error(
      `unit: the lifecycle refused — ${JSON.stringify(satisfies)}, the state satisfying a dependency, is none of its states`,
    );
  return lifecycle;
}

/** Every unit folded from its records, keyed by entity. */
export function units(store: RecordStore): Units {
  return fold(store.read<Unit>(DOMAIN));
}

/** The settled, live units: those whose one head is a version. */
function live(folds: Units): Map<string, Unit> {
  const out = new Map<string, Unit>();
  for (const f of folds.values())
    if (f.payload !== undefined) out.set(f.entity, f.payload);
  return out;
}

/** Every unit law `folds` breaks. Every version head is read, so a diverged
 *  unit contributes each head's plan, name and deps. */
function violations(folds: Units, planWithdrawn: PlanWithdrawn): Violation[] {
  const found: Violation[] = referenceIncoherence(
    folds,
    (unit) => unit.spec.deps,
  );
  const carriers = new Map<string, Set<string>>();
  for (const f of folds.values()) {
    const seen = new Set<string>();
    for (const h of f.heads) {
      if (h.payload === null) continue;
      const { plan, spec } = h.payload;
      const key = JSON.stringify([plan, spec.name]);
      carriers.set(key, (carriers.get(key) ?? new Set()).add(f.entity));
      if (planWithdrawn(plan) && !seen.has(plan)) {
        seen.add(plan);
        found.push({ kind: 'retracted', entity: f.entity, reference: plan });
      }
      for (const dep of spec.deps) {
        const d = folds.get(dep);
        const why = !d
          ? 'names no unit'
          : d.diverged
            ? 'names a diverged unit'
            : d.payload !== undefined && d.payload.plan !== plan
              ? `names a unit of plan ${d.payload.plan}`
              : undefined;
        if (why !== undefined && !seen.has(dep)) {
          seen.add(dep);
          found.push({ kind: 'dep', entity: f.entity, reference: dep, why });
        }
      }
    }
  }
  for (const [key, entities] of carriers)
    if (entities.size > 1)
      found.push({
        kind: 'name',
        name: (JSON.parse(key) as [string, string])[1],
        entities: [...entities].sort(),
      });
  return found;
}

/** What a violation says, for a refusal. */
function describe(v: Violation): string {
  switch (v.kind) {
    case 'retracted':
      return `${v.entity} would reference withdrawn ${v.reference}`;
    case 'cycle':
      return `${v.entities.join(', ')} would form a dependency cycle`;
    case 'name':
      return `${v.entities.join(', ')} would share the name ${v.name} in one plan`;
    case 'dep':
      return `${v.entity}'s dep ${v.reference} ${v.why}`;
  }
}

/** The entities a violation binds together. */
function bound(v: Violation): readonly string[] {
  return v.kind === 'cycle' || v.kind === 'name'
    ? v.entities
    : [v.entity, v.reference];
}

/**
 * The repair rule: refuse a record of `entity` (`UNWRITTEN` for a unit not
 * yet minted) that would introduce a violation of a unit law — one whose
 * entities no standing violation of the same law already binds together. A
 * write that leaves a violation standing or shrinks it (fewer namesakes, a
 * shorter cycle, an edge removed) is allowed, so every incoherence can be
 * repaired one write at a time. Deps form a set, which one write alone can
 * break, so a dep named twice is refused outright.
 */
function keepLaws(
  records: readonly Record<Unit>[],
  entity: string,
  operation: Operation,
  supersedes: readonly RecordId[],
  payload: Unit | null,
  planWithdrawn: PlanWithdrawn,
  refuse: (why: string) => never,
): void {
  const deps = payload?.spec.deps ?? [];
  const twice = deps.find((dep, i) => deps.indexOf(dep) !== i);
  if (twice !== undefined)
    refuse(`it names its dep ${twice} twice, and deps form a set`);
  const pending: Record<Unit> = {
    envelope: {
      id: UNWRITTEN,
      entity,
      operation,
      supersedes,
      author: '',
      time: '',
      reason: '',
      cause: '',
    },
    payload,
  };
  const binding = (v: Violation) => ({
    kind: v.kind,
    entities: bound(v),
    violation: v,
  });
  const [found] = introduced(
    violations(fold(records), planWithdrawn).map(binding),
    violations(fold([...records, pending]), planWithdrawn).map(binding),
  );
  if (found)
    refuse(describe(found.violation).replaceAll(UNWRITTEN, 'the new unit'));
}

/** The heads and payload of a settled, live unit — one head, or several
 *  converged on one payload, every one of which a write must name; refuses a
 *  unit that is unknown or withdrawn, and points a diverged one to
 *  `reconcile`. */
function settled(
  folds: Units,
  entity: string,
  refuse: (why: string) => never,
): { readonly heads: readonly RecordId[]; readonly unit: Unit } {
  const f = folds.get(entity);
  if (!f) return refuse('no such unit');
  if (f.diverged)
    return refuse(
      `it has diverged into ${f.heads.length} heads; reconcile it first`,
    );
  if (f.payload === undefined) return refuse('it is withdrawn');
  return { heads: f.heads.map((h) => h.envelope.id), unit: f.payload };
}

function refusal(verb: string, who: string): (why: string) => never {
  return (why) => {
    throw new Error(`unit: ${verb} ${who} refused — ${why}`);
  };
}

/** Write a unit's first version, in its lifecycle's first state. */
export function add(
  store: RecordStore,
  lifecycle: UnitLifecycle,
  unit: Omit<Unit, 'state'>,
  planWithdrawn: PlanWithdrawn,
  by: By,
): Record<Unit> {
  const [first] = checked(lifecycle).states as [string];
  const next: Unit = {
    plan: unit.plan,
    spec: { ...unit.spec, deps: canonicalOrder(unit.spec.deps) },
    state: first,
    pin: unit.pin,
  };
  keepLaws(
    store.read<Unit>(DOMAIN),
    UNWRITTEN,
    'create',
    [],
    next,
    planWithdrawn,
    refusal('add', unit.spec.name),
  );
  return store.create<Unit>(DOMAIN, next, by);
}

/** Supersede a unit with a new spec and pin; its plan and state carry over. */
export function revise(
  store: RecordStore,
  entity: string,
  change: Pick<Unit, 'spec' | 'pin'>,
  planWithdrawn: PlanWithdrawn,
  by: By,
): Record<Unit> {
  const records = store.read<Unit>(DOMAIN);
  const refuse = refusal('revise', entity);
  const { heads, unit } = settled(fold(records), entity, refuse);
  const next: Unit = {
    plan: unit.plan,
    spec: { ...change.spec, deps: canonicalOrder(change.spec.deps) },
    state: unit.state,
    pin: change.pin,
  };
  keepLaws(records, entity, 'amend', heads, next, planWithdrawn, refuse);
  return store.supersede<Unit>(DOMAIN, entity, heads, next, by);
}

/** Move a unit one step forward along its lifecycle, to `to`; refuses any
 *  other move. No law reads a state, so none is judged. */
export function advance(
  store: RecordStore,
  lifecycle: UnitLifecycle,
  entity: string,
  to: string,
  by: By,
): Record<Unit> {
  const { states } = checked(lifecycle);
  const refuse = refusal('advance', entity);
  const { heads, unit } = settled(units(store), entity, refuse);
  const at = states.indexOf(unit.state);
  if (at < 0)
    refuse(`its state ${JSON.stringify(unit.state)} is not in the lifecycle`);
  const step = states[at + 1];
  if (to !== step)
    refuse(
      `from ${JSON.stringify(unit.state)} the one step is ${step === undefined ? 'none' : JSON.stringify(step)}, not ${JSON.stringify(to)}`,
    );
  return store.supersede<Unit>(
    DOMAIN,
    entity,
    heads,
    { ...unit, state: to },
    by,
  );
}

/** Withdraw a unit with no successor version; refuses while a live unit
 *  depends on it. */
export function retract(
  store: RecordStore,
  entity: string,
  planWithdrawn: PlanWithdrawn,
  by: By,
): Record<never> {
  const records = store.read<Unit>(DOMAIN);
  const refuse = refusal('retract', entity);
  const { heads } = settled(fold(records), entity, refuse);
  keepLaws(records, entity, 'retract', heads, null, planWithdrawn, refuse);
  return store.retract(DOMAIN, entity, by);
}

/** Resolve a diverged unit: one whole-state version superseding every head.
 *  Its plan carries over; refuses a unit that has not diverged, a state
 *  outside the lifecycle, and a version introducing a law's violation. */
export function reconcile(
  store: RecordStore,
  lifecycle: UnitLifecycle,
  entity: string,
  change: Pick<Unit, 'spec' | 'state' | 'pin'>,
  planWithdrawn: PlanWithdrawn,
  by: By,
): Record<Unit> {
  const records = store.read<Unit>(DOMAIN);
  const refuse = refusal('reconcile', entity);
  const f = fold(records).get(entity);
  if (!f) return refuse('no such unit');
  if (!f.diverged) return refuse('it has not diverged; revise or advance it');
  if (!checked(lifecycle).states.includes(change.state))
    refuse(`its state ${JSON.stringify(change.state)} is not in the lifecycle`);
  const plan = f.heads.find((h) => h.payload !== null)?.payload?.plan;
  if (plan === undefined) return refuse('no head of it is a version');
  const next: Unit = {
    plan,
    spec: { ...change.spec, deps: canonicalOrder(change.spec.deps) },
    state: change.state,
    pin: change.pin,
  };
  keepLaws(
    records,
    entity,
    'amend',
    f.heads.map((h) => h.envelope.id),
    next,
    planWithdrawn,
    refuse,
  );
  return store.reconcile<Unit>(DOMAIN, entity, next, by);
}

/**
 * The ready units, in entity order: live units not yet started whose every
 * dep is a live unit that has reached the state satisfying a dependency or
 * moved past it, and which no owed ruling names, neither the unit nor its
 * plan. `owed` is the set of entities the owed rulings name.
 */
export function ready(
  folds: Units,
  lifecycle: UnitLifecycle,
  owed: ReadonlySet<string>,
): string[] {
  const { states, satisfies } = checked(lifecycle);
  const done = states.indexOf(satisfies);
  const all = live(folds);
  return [...all]
    .filter(
      ([entity, unit]) =>
        unit.state === states[0] &&
        !owed.has(entity) &&
        !owed.has(unit.plan) &&
        unit.spec.deps.every((dep) => {
          const d = all.get(dep);
          return d !== undefined && states.indexOf(d.state) >= done;
        }),
    )
    .map(([entity]) => entity)
    .sort();
}

/** Where the plan is: the ready units and the in-flight ones (started, not
 *  yet in the state that satisfies a dependency), in entity order. */
export function frontier(
  folds: Units,
  lifecycle: UnitLifecycle,
  owed: ReadonlySet<string>,
): string[] {
  const { states, satisfies } = checked(lifecycle);
  const done = states.indexOf(satisfies);
  const inFlight = [...live(folds)]
    .filter(([, unit]) => {
      const at = states.indexOf(unit.state);
      return at > 0 && at < done;
    })
    .map(([entity]) => entity);
  return [...ready(folds, lifecycle, owed), ...inFlight].sort();
}

/**
 * The waves of the live units, each in entity order: `wave(0)` holds the units
 * with no deps, `wave(n+1)` the units outside the earlier waves whose every
 * dep is inside them. A unit whose deps never all land in a wave — a dep that
 * is not a live unit, or a cycle — is in none.
 */
export function waves(folds: Units): string[][] {
  const pending = live(folds);
  const placed = new Set<string>();
  const out: string[][] = [];
  for (;;) {
    const wave = [...pending]
      .filter(([, unit]) => unit.spec.deps.every((dep) => placed.has(dep)))
      .map(([entity]) => entity)
      .sort();
    if (wave.length === 0) return out;
    for (const entity of wave) {
      pending.delete(entity);
      placed.add(entity);
    }
    out.push(wave);
  }
}

/** Every incoherence a merge left among the units: a dep on a withdrawn unit,
 *  a unit of a withdrawn plan, a dep cycle, one name on two live units of a
 *  plan. A withdrawn concept is none: it drifts the pins naming it. */
export function incoherence(
  folds: Units,
  planWithdrawn: PlanWithdrawn,
): Incoherence[] {
  return violations(folds, planWithdrawn).filter(
    (v): v is Incoherence => v.kind !== 'dep',
  );
}
