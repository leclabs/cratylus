// ─────────────────────────────────────────────────────────────────────────────
// THE PIN — a unit's reference to the concept version it realizes.
//
// Taken when the unit is authored, and only when the concept and its whole
// closure are settled and live: the pin holds a version of the concept, and a
// version of every other concept in the closure, each a head at that moment.
// Heads carrying one payload have converged and read as one settled head, so any
// of them serves. Two disjoint readings run over the pin, computed from the design
// records at the moment of the read and never stored:
//
// - DRIFTED — the pinned version is no longer the concept's only settled head:
//   the concept was amended, withdrawn or has diverged (`drift` says which);
// - otherwise SUSPECT — another concept in the closure has diverged, been
//   withdrawn or gained a newer version since the pin was taken (`suspicion`
//   names each, and how it moved).
//
// Heads and divergence come from the record store's generic fold over the design
// domain; the caller hands that fold in. The closure is design's to compute, so
// the caller supplies it through the `Closure` port below; `domain-interface`
// wires the design domain's closure into it.
//
// A unit stores its pin as a plain JSON value. `unit` takes one thing from this
// module, the `Pin` type its stored pin is declared as, and reads no field of it;
// everything in a pin is read only here.
// ─────────────────────────────────────────────────────────────────────────────

import type { Fold } from '../../record-store/fold.js';
import type { RecordId } from '../../record-store/record.js';

/** The design domain folded by the record store, keyed by concept entity. */
type Design = ReadonlyMap<string, Fold<unknown>>;

/** The port: the closure of `concept` — the concept entity itself and every
 *  concept entity its factors reach, transitively. */
type Closure = (concept: string) => Iterable<string>;

/** A unit's reference to the concept version it realizes. */
export interface Pin {
  /** The concept entity the unit realizes. */
  readonly concept: string;
  /** A head of it when the pin was taken: a version. */
  readonly version: RecordId;
  /** Every other concept entity in its closure when the pin was taken, with
   *  a head of that entity then: a version. */
  readonly closure: { readonly [entity: string]: RecordId };
}

/** Why `entity` is not settled and live in `design`, or `undefined` when its
 *  heads carry one version's payload. */
function unsettled(design: Design, entity: string): string | undefined {
  const folded = design.get(entity);
  if (!folded) return 'is unknown';
  if (folded.diverged) return 'has diverged';
  if (folded.withdrawn) return 'is withdrawn';
  return undefined;
}

/** `version` is still `entity`'s one settled head: the entity is settled and
 *  live, and `version` is among its converged heads. */
function holds(design: Design, entity: string, version: RecordId): boolean {
  return (
    !unsettled(design, entity) &&
    !!design.get(entity)?.heads.some((head) => head.envelope.id === version)
  );
}

/** Take a pin on `concept`. Refuses when the concept, or any other concept in
 *  its closure, is unknown, diverged or withdrawn: there is no single version
 *  of it to pin. */
export function take(design: Design, concept: string, closure: Closure): Pin {
  const held: { [entity: string]: RecordId } = {};
  for (const entity of new Set([concept, ...closure(concept)])) {
    const why = unsettled(design, entity);
    if (why)
      throw new Error(
        `pin: take on ${concept} refused — ${entity === concept ? 'it' : `${entity} in its closure`} ${why}, so no single version exists to pin`,
      );
    held[entity] = design.get(entity)?.heads[0]?.envelope.id as RecordId;
  }
  const { [concept]: version, ...others } = held;
  return { concept, version: version as RecordId, closure: others };
}

/** How a pinned concept moved since the pin was taken: it diverged, was
 *  withdrawn, gained a newer version, or — for a concept beneath it — joined
 *  its closure. */
export type Movement = 'diverged' | 'withdrawn' | 'amended' | 'joined';

/** How `entity` moved away from `version`, `undefined` when `version` is
 *  still its one settled head. */
function movement(
  design: Design,
  entity: string,
  version: RecordId | undefined,
): Movement | undefined {
  const folded = design.get(entity);
  if (version === undefined) return 'joined';
  if (holds(design, entity, version)) return undefined;
  if (folded?.diverged) return 'diverged';
  if (!folded || folded.withdrawn) return 'withdrawn';
  return 'amended';
}

/** DRIFTED: how the pinned concept moved since the pin was taken — its pinned
 *  version is no longer its only settled head — or `undefined` when it has not. */
export function drift(pin: Pin, design: Design): Movement | undefined {
  return movement(design, pin.concept, pin.version);
}

/** SUSPECT: every other concept in the closure that moved since the pin was
 *  taken, with how — empty when none did, and when the pin has drifted, since
 *  a drifted unit is never also suspect. */
export function suspicion(
  pin: Pin,
  design: Design,
  closure: Closure,
): { readonly entity: string; readonly how: Movement }[] {
  if (drift(pin, design) !== undefined) return [];
  const found: { entity: string; how: Movement }[] = [];
  for (const entity of new Set(closure(pin.concept))) {
    if (entity === pin.concept) continue;
    const how = movement(design, entity, pin.closure[entity]);
    if (how !== undefined) found.push({ entity, how });
  }
  return found;
}

/** Why a unit realizing any of `concepts` may not be authored: an owed ruling
 *  (`owed`, each entity an owed ruling names with the notes naming it) names a
 *  concept of their closure — the first note and concept, by identity, to be
 *  spoken by name — or `undefined` when none does. */
export function owedInClosure(
  concepts: Iterable<string>,
  closure: Closure,
  owed: ReadonlyMap<string, readonly string[]>,
): string | undefined {
  for (const concept of concepts)
    for (const entity of closure(concept)) {
      const note = owed.get(entity)?.[0];
      if (note !== undefined)
        return `note ${note} blocks concept ${entity}, in the closure of concept ${concept}`;
    }
  return undefined;
}
