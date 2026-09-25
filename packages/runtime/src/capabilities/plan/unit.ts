// ─────────────────────────────────────────────────────────────────────────────
// THE UNIT — one unit of work in a plan, realizing exactly one concept, the one
// its pin names, and carrying its full spec and lifecycle state, as records in
// the `unit` domain.
//
// A unit's payload is its plan (an entity reference), its full spec, its
// lifecycle state and its pin (a value `pin` computes, read here only for the
// concept it names). Add writes its first version, revise supersedes it,
// advance moves it one step along its lifecycle and refuses any other move, and
// reconcile writes one version over every head of a diverged unit.
//
// Every write keeps the unit's laws on the current branch: its dependencies
// are acyclic and name live units of the same plan, and its plan is not
// withdrawn. A write that would break one refuses, so incoherence, like
// divergence, arises only from merges; `incoherence` reports it.
//
// Readiness is computed, never stored: `ready`, `frontier` and `waves` are pure
// functions over the fold, and no record carries what they compute.
//
// What this module needs from elsewhere it RECEIVES, never spells or imports:
// the unit lifecycle vocabulary (the runtime config), plan and concept
// liveness (`plan`, `design`), and the entities owed rulings name (`notebook`).
// Each is a structurally typed parameter; the domain interface composes them.
// ─────────────────────────────────────────────────────────────────────────────

import {
  type Fold,
  type Incoherence,
  fold,
  incoherence as referenceIncoherence,
} from '../../record-store/fold.js';
import type { Envelope, Record } from '../../record-store/record.js';
import type { RecordStore } from '../../record-store/store.js';

/** The domain directory holding unit records. */
const DOMAIN = 'unit';

/** The unit lifecycle, received from the runtime config: its states in
 *  order (the first is a unit not yet started) and the state that satisfies
 *  a dependency, as does every state after it. */
export interface UnitLifecycle {
  readonly states: readonly string[];
  readonly satisfies: string;
}

/** A unit's full spec, but for the concept it realizes, which is its pin's. */
export interface Spec {
  readonly name: string;
  readonly intent: string;
  readonly static: readonly string[];
  /** The units this one depends on: entity references. */
  readonly deps: readonly string[];
  readonly outputs: readonly string[];
  readonly accept: readonly string[];
}

/** A unit's reference to the concept version it realizes, as `pin` computes
 *  it; this module reads only the concept, and keeps the rest as written. */
export interface Pinned {
  /** The concept the unit realizes: an entity reference. */
  readonly concept: string;
}

/** A unit's payload: its whole state as of one record. */
export interface Unit {
  /** The plan the unit belongs to: an entity reference. */
  readonly plan: string;
  readonly spec: Spec;
  readonly state: string;
  readonly pin: Pinned;
}

/** Who writes a record, and why. */
export type By = Pick<Envelope, 'author' | 'reason' | 'cause'>;

/** Plan and concept liveness, as their domains report it. */
export interface Withdrawn {
  /** True when the plan entity's one head is a retraction. */
  readonly plan: (entity: string) => boolean;
  /** True when the concept entity's one head is a retraction. */
  readonly concept: (entity: string) => boolean;
}

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

/** The one head of a settled, live unit; refuses a unit that is unknown or
 *  withdrawn, and points a diverged one to `reconcile`. */
function head(
  folds: Units,
  entity: string,
  verb: string,
): { readonly id: string; readonly unit: Unit } {
  const f = folds.get(entity);
  const refuse = (why: string): never => {
    throw new Error(`unit: ${verb} ${entity} refused — ${why}`);
  };
  if (!f) return refuse('no such unit');
  if (f.heads.length > 1)
    return refuse(
      `it has diverged into ${f.heads.length} heads; reconcile it first`,
    );
  if (f.withdrawn || f.payload === undefined) return refuse('it is withdrawn');
  const [only] = f.heads as [Record<Unit>];
  return { id: only.envelope.id, unit: f.payload };
}

/**
 * Refuse a write of `unit` as a version of `entity` (`undefined` for a unit
 * not yet minted) that would break a unit law on this branch: its plan is
 * withdrawn; a dep reaches back to `entity`, closing a cycle; or a dep is not
 * a live unit of the same plan. Every version head is walked, so a cycle
 * through any head of a diverged unit counts.
 */
function keepLaws(
  folds: Units,
  entity: string | undefined,
  unit: Unit,
  planWithdrawn: Withdrawn['plan'],
  verb: string,
): void {
  const refuse = (why: string): never => {
    throw new Error(
      `unit: ${verb} ${entity ?? unit.spec.name} refused — ${why}`,
    );
  };
  if (planWithdrawn(unit.plan)) refuse(`its plan ${unit.plan} is withdrawn`);
  if (entity !== undefined)
    for (const dep of unit.spec.deps) {
      const seen = new Set<string>();
      const todo = [dep];
      for (let v = todo.pop(); v !== undefined; v = todo.pop()) {
        if (v === entity) refuse(`dep ${dep} closes a dependency cycle`);
        if (seen.has(v)) continue;
        seen.add(v);
        for (const h of folds.get(v)?.heads ?? [])
          if (h.payload !== null) todo.push(...h.payload.spec.deps);
      }
    }
  for (const dep of unit.spec.deps) {
    const f = folds.get(dep);
    if (!f) refuse(`dep ${dep} is no unit`);
    else if (f.heads.length > 1)
      refuse(`dep ${dep} has diverged, so it is no live unit`);
    else if (f.withdrawn || f.payload === undefined)
      refuse(`dep ${dep} is withdrawn`);
    else if (f.payload.plan !== unit.plan)
      refuse(
        `dep ${dep} is a unit of plan ${f.payload.plan}, not ${unit.plan}`,
      );
  }
}

/** Write a unit's first version, in its lifecycle's first state. */
export function add(
  store: RecordStore,
  lifecycle: UnitLifecycle,
  unit: Omit<Unit, 'state'>,
  planWithdrawn: Withdrawn['plan'],
  by: By,
): Record<Unit> {
  const [first] = checked(lifecycle).states as [string];
  const next: Unit = {
    plan: unit.plan,
    spec: unit.spec,
    state: first,
    pin: unit.pin,
  };
  keepLaws(units(store), undefined, next, planWithdrawn, 'add');
  return store.create<Unit>(DOMAIN, next, by);
}

/** Supersede a unit with a new spec and pin; its plan and state carry over. */
export function revise(
  store: RecordStore,
  entity: string,
  change: Pick<Unit, 'spec' | 'pin'>,
  planWithdrawn: Withdrawn['plan'],
  by: By,
): Record<Unit> {
  const folds = units(store);
  const { id, unit } = head(folds, entity, 'revise');
  const next: Unit = {
    plan: unit.plan,
    spec: change.spec,
    state: unit.state,
    pin: change.pin,
  };
  keepLaws(folds, entity, next, planWithdrawn, 'revise');
  return store.supersede<Unit>(DOMAIN, entity, [id], next, by);
}

/** Move a unit one step along its lifecycle, to `to`; refuses any other
 *  move. */
export function advance(
  store: RecordStore,
  lifecycle: UnitLifecycle,
  entity: string,
  to: string,
  by: By,
): Record<Unit> {
  const { states } = checked(lifecycle);
  const { id, unit } = head(units(store), entity, 'advance');
  const at = states.indexOf(unit.state);
  if (at < 0)
    throw new Error(
      `unit: advance ${entity} refused — its state ${JSON.stringify(unit.state)} is not in the lifecycle`,
    );
  const step = states[at + 1];
  if (to !== step)
    throw new Error(
      `unit: advance ${entity} refused — from ${JSON.stringify(unit.state)} the one step is ${step === undefined ? 'none' : JSON.stringify(step)}, not ${JSON.stringify(to)}`,
    );
  return store.supersede<Unit>(
    DOMAIN,
    entity,
    [id],
    { ...unit, state: to },
    by,
  );
}

/** Resolve a diverged unit: one whole-state version superseding every head.
 *  Its plan carries over; refuses a unit that has not diverged, a state
 *  outside the lifecycle, and a version breaking a unit law. */
export function reconcile(
  store: RecordStore,
  lifecycle: UnitLifecycle,
  entity: string,
  change: Pick<Unit, 'spec' | 'state' | 'pin'>,
  planWithdrawn: Withdrawn['plan'],
  by: By,
): Record<Unit> {
  const folds = units(store);
  const refuse = (why: string): never => {
    throw new Error(`unit: reconcile ${entity} refused — ${why}`);
  };
  const f = folds.get(entity);
  if (!f) return refuse('no such unit');
  if (f.heads.length < 2)
    return refuse('it has not diverged; revise or advance it');
  if (!checked(lifecycle).states.includes(change.state))
    refuse(`its state ${JSON.stringify(change.state)} is not in the lifecycle`);
  const plan = f.heads.find((h) => h.payload !== null)?.payload?.plan;
  if (plan === undefined) return refuse('no head of it is a version');
  const next: Unit = {
    plan,
    spec: change.spec,
    state: change.state,
    pin: change.pin,
  };
  keepLaws(folds, entity, next, planWithdrawn, 'reconcile');
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

/**
 * Every incoherence among the units, which only a merge produces: a dep on a
 * withdrawn unit, a dep cycle, and — from the liveness the caller reports — a
 * unit of a withdrawn plan or realizing (by its pin) a withdrawn concept.
 * Every version head is read, so a diverged unit contributes the references
 * of each.
 */
export function incoherence(folds: Units, withdrawn: Withdrawn): Incoherence[] {
  const found = referenceIncoherence(folds, (unit) => unit.spec.deps);
  for (const f of folds.values()) {
    const seen = new Set<string>();
    for (const h of f.heads) {
      if (h.payload === null) continue;
      const { plan, pin } = h.payload;
      for (const reference of [
        withdrawn.plan(plan) ? plan : undefined,
        withdrawn.concept(pin.concept) ? pin.concept : undefined,
      ])
        if (reference !== undefined && !seen.has(reference)) {
          seen.add(reference);
          found.push({ kind: 'retracted', entity: f.entity, reference });
        }
    }
  }
  return found;
}
