// ─────────────────────────────────────────────────────────────────────────────
// THE PIN — a unit's reference to the concept version it realizes.
//
// Taken automatically when the unit is authored: the concept's one head at that
// moment, which must be a version. Two readings run over it, each computed from
// the design records at the moment of the read and never stored:
//
// - DRIFTED — the pinned version is no longer a head: a later version or a
//   retraction of the concept now names it;
// - SUSPECT — a concept the pinned one stands on (itself or any factor,
//   transitively) has diverged, or has a version newer than the one current
//   when the pin was taken.
//
// Heads and divergence come from the record store's generic fold over the design
// domain; the caller hands that fold in. Which concepts a concept stands on is
// design's to say, so the caller supplies it too, through the `factors` port
// below; `domain-interface` wires the design domain's reading into it.
//
// A unit stores its pin as an opaque value: plain JSON, read only here.
// ─────────────────────────────────────────────────────────────────────────────

import type { Fold } from '../../record-store/fold.js';
import type { RecordId } from '../../record-store/record.js';

/** The design domain folded by the record store, keyed by concept entity. */
type Design = ReadonlyMap<string, Fold<unknown>>;

/** The port: every concept entity `concept` stands on — its factors,
 *  transitively. Naming `concept` itself as well is harmless. */
type Factors = (concept: string) => Iterable<string>;

/** A unit's reference to the concept version it realizes. */
export interface Pin {
  /** The concept entity the unit realizes. */
  readonly concept: string;
  /** Its one head when the pin was taken: a version. */
  readonly version: RecordId;
  /** Each concept entity it stood on when the pin was taken, with that
   *  entity's one head then; a factor diverged at that moment has none. */
  readonly factors: { readonly [entity: string]: RecordId };
}

/** Take a pin on `concept`. Refuses a concept with no records, a diverged one
 *  and a withdrawn one: none has a single version to pin. */
export function take(design: Design, concept: string, factors: Factors): Pin {
  const refused = (why: string): Error =>
    new Error(`pin: take on ${concept} refused — ${why}`);
  const heads = design.get(concept)?.heads ?? [];
  const head = heads[0];
  if (!head) throw refused('no concept has that identity');
  if (heads.length > 1)
    throw refused(
      `it has diverged into ${heads.length} heads, and no single version exists to pin`,
    );
  if (head.envelope.operation === 'retract')
    throw refused('it is withdrawn, and a retraction is no version to pin');
  const stood: { [entity: string]: RecordId } = {};
  for (const entity of factors(concept)) {
    const then = design.get(entity)?.heads;
    if (entity !== concept && then?.length === 1 && then[0])
      stood[entity] = then[0].envelope.id;
  }
  return { concept, version: head.envelope.id, factors: stood };
}

/** The pinned version is no longer a head of its concept. */
export function drifted(pin: Pin, design: Design): boolean {
  return !design
    .get(pin.concept)
    ?.heads.some((head) => head.envelope.id === pin.version);
}

/** A concept the pinned one stands on, itself included, has diverged or has a
 *  version newer than the one current when the pin was taken. */
export function suspect(pin: Pin, design: Design, factors: Factors): boolean {
  for (const entity of new Set([pin.concept, ...factors(pin.concept)])) {
    const heads = design.get(entity)?.heads ?? [];
    if (heads.length > 1) return true;
    const head = heads[0];
    const then = entity === pin.concept ? pin.version : pin.factors[entity];
    if (
      head &&
      head.envelope.operation !== 'retract' &&
      head.envelope.id !== then
    )
      return true;
  }
  return false;
}
