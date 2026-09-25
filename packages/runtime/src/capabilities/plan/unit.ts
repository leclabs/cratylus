// ─────────────────────────────────────────────────────────────────────────────
// THE UNIT — one unit of work in a plan, realizing exactly one concept and
// carrying its full spec and lifecycle state, as records in the `unit` domain.
//
// A unit's payload is its plan (an entity reference), its full spec, its
// lifecycle state and its pin (an opaque value `pin` computes). Add writes its
// first version, revise supersedes it, advance moves it one step along its
// lifecycle and refuses any other move.
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
 *  order (the first is a unit not yet started) and the one state that
 *  satisfies a dependency. */
export interface UnitLifecycle {
  readonly states: readonly string[];
  readonly satisfies: string;
}

/** A unit's full spec. */
export interface Spec {
  readonly name: string;
  /** The concept the unit realizes: an entity reference. */
  readonly realizes: string;
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
  /** The unit's reference to the concept version it realizes, as `pin`
   *  computes it; opaque here. */
  readonly pin: unknown;
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
export function units(store: RecordStore): ReadonlyMap<string, Fold<Unit>> {
  return fold(store.read<Unit>(DOMAIN));
}

/** The settled, live units: those whose one head is a version. */
function live(folds: ReadonlyMap<string, Fold<Unit>>): Map<string, Unit> {
  const out = new Map<string, Unit>();
  for (const f of folds.values())
    if (f.payload !== undefined) out.set(f.entity, f.payload);
  return out;
}

/** The one head of a settled, live unit; refuses a unit that is unknown,
 *  withdrawn or diverged. */
function head(
  store: RecordStore,
  entity: string,
  verb: string,
): { readonly id: string; readonly unit: Unit } {
  const f = units(store).get(entity);
  const refuse = (why: string): never => {
    throw new Error(`unit: ${verb} ${entity} refused — ${why}`);
  };
  if (!f) return refuse('no such unit');
  if (f.heads.length > 1)
    return refuse(`it has diverged into ${f.heads.length} heads`);
  if (f.withdrawn || f.payload === undefined) return refuse('it is withdrawn');
  const [only] = f.heads as [Record<Unit>];
  return { id: only.envelope.id, unit: f.payload };
}

/** Write a unit's first version, in its lifecycle's first state. */
export function add(
  store: RecordStore,
  lifecycle: UnitLifecycle,
  unit: Omit<Unit, 'state'>,
  by: By,
): Record<Unit> {
  const [first] = checked(lifecycle).states as [string];
  return store.create<Unit>(
    DOMAIN,
    { plan: unit.plan, spec: unit.spec, state: first, pin: unit.pin },
    by,
  );
}

/** Supersede a unit with a new spec and pin; its plan and state carry over. */
export function revise(
  store: RecordStore,
  entity: string,
  next: Pick<Unit, 'spec' | 'pin'>,
  by: By,
): Record<Unit> {
  const { id, unit } = head(store, entity, 'revise');
  return store.supersede<Unit>(
    DOMAIN,
    entity,
    [id],
    { plan: unit.plan, spec: next.spec, state: unit.state, pin: next.pin },
    by,
  );
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
  const { id, unit } = head(store, entity, 'advance');
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

/**
 * The ready units, in entity order: live units not yet started whose every
 * dep is a live unit in the state that satisfies a dependency, and which no
 * owed ruling names, neither the unit nor its plan. `owed` is the set of
 * entities the owed rulings name.
 */
export function ready(
  folds: ReadonlyMap<string, Fold<Unit>>,
  lifecycle: UnitLifecycle,
  owed: ReadonlySet<string>,
): string[] {
  const { states, satisfies } = checked(lifecycle);
  const all = live(folds);
  return [...all]
    .filter(
      ([entity, unit]) =>
        unit.state === states[0] &&
        !owed.has(entity) &&
        !owed.has(unit.plan) &&
        unit.spec.deps.every((dep) => all.get(dep)?.state === satisfies),
    )
    .map(([entity]) => entity)
    .sort();
}

/** Where the plan is: the ready units and the in-flight ones (started, not
 *  yet in the state that satisfies a dependency), in entity order. */
export function frontier(
  folds: ReadonlyMap<string, Fold<Unit>>,
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
export function waves(folds: ReadonlyMap<string, Fold<Unit>>): string[][] {
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
 * Every incoherence among the units, over their reference relation: a dep on
 * a withdrawn unit, a dep cycle, and — from the liveness the caller reports —
 * a unit of a withdrawn plan or realizing a withdrawn concept. Every version
 * head is read, so a diverged unit contributes the references of each.
 */
export function incoherence(
  folds: ReadonlyMap<string, Fold<Unit>>,
  withdrawn: Withdrawn,
): Incoherence[] {
  const found = referenceIncoherence(folds, (unit) => unit.spec.deps);
  for (const f of folds.values()) {
    const seen = new Set<string>();
    for (const h of f.heads) {
      if (h.payload === null) continue;
      const { plan, spec } = h.payload;
      for (const reference of [
        withdrawn.plan(plan) ? plan : undefined,
        withdrawn.concept(spec.realizes) ? spec.realizes : undefined,
      ])
        if (reference !== undefined && !seen.has(reference)) {
          seen.add(reference);
          found.push({ kind: 'retracted', entity: f.entity, reference });
        }
    }
  }
  return found;
}
