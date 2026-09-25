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
//   the concept was amended, withdrawn or has diverged;
// - otherwise SUSPECT — another concept in the closure has diverged, been
//   withdrawn or gained a newer version since the pin was taken.
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

/** The pinned version is no longer the concept's only settled head. */
export function drifted(pin: Pin, design: Design): boolean {
  return !holds(design, pin.concept, pin.version);
}

/** Not drifted, and another concept in the closure has diverged, been
 *  withdrawn or gained a newer version since the pin was taken. */
export function suspect(pin: Pin, design: Design, closure: Closure): boolean {
  if (drifted(pin, design)) return false;
  for (const entity of closure(pin.concept)) {
    if (entity === pin.concept) continue;
    const then = pin.closure[entity];
    if (!then || !holds(design, entity, then)) return true;
  }
  return false;
}
