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
// An amendment says which of anchor, gloss and factors differ between the
// pinned version and the one head, factors compared as sets of entities and
// named as those added and those removed; none may differ. Each is a fact about
// the design, never a response to it.
//
// Heads and divergence come from the record store's generic fold over the design
// domain; the caller hands that fold in. The closure is design's to compute, so
// the caller supplies it through the `Closure` port below; `domain-interface`
// wires the design domain's closure into it. A pinned version's payload is the
// record store's to hold, so the caller supplies it through the `Version` port.
//
// A unit stores its pin as a plain JSON value. `unit` takes one thing from this
// module, the `Pin` type its stored pin is declared as, and reads no field of it;
// everything in a pin is read only here.
// ─────────────────────────────────────────────────────────────────────────────

import type { Fold } from '../../record-store/fold.js';
import type { RecordId } from '../../record-store/record.js';
import type { Payload } from '../design/design.js';

/** The design domain folded by the record store, keyed by concept entity. */
type Design = ReadonlyMap<string, Fold<Payload>>;

/** The port: the closure of `concept` — the concept entity itself and every
 *  concept entity its factors reach, transitively. */
type Closure = (concept: string) => Iterable<string>;

/** The port: the payload of concept version `version`, one a pin holds. */
type Version = (version: RecordId) => Payload;

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
 *  withdrawn, gained a newer version — with which of its fields differ — or,
 *  for a concept beneath it, joined its closure. */
export type Movement =
  | { readonly how: 'diverged' | 'withdrawn' | 'joined' }
  | ({ readonly how: 'amended' } & Amendment);

/** What differs between a pinned version and the one head that amended it:
 *  whether the anchor and the gloss differ, and the factor entities the head
 *  added and removed. Nothing differs when all four are empty or false. */
export interface Amendment {
  readonly anchor: boolean;
  readonly gloss: boolean;
  readonly added: readonly string[];
  readonly removed: readonly string[];
}

/** What differs from `pinned` to `head`, factors compared as sets. */
function amendment(pinned: Payload, head: Payload): Amendment {
  const was = new Set(pinned.factors);
  const is = new Set(head.factors);
  return {
    anchor: pinned.anchor !== head.anchor,
    gloss: pinned.gloss !== head.gloss,
    added: [...is].filter((f) => !was.has(f)),
    removed: [...was].filter((f) => !is.has(f)),
  };
}

/** How `entity` moved away from `version`, `undefined` when `version` is
 *  still its one settled head. */
function movement(
  design: Design,
  entity: string,
  version: RecordId | undefined,
  payload: Version,
): Movement | undefined {
  const folded = design.get(entity);
  if (version === undefined) return { how: 'joined' };
  if (holds(design, entity, version)) return undefined;
  if (folded?.diverged) return { how: 'diverged' };
  if (!folded?.payload) return { how: 'withdrawn' };
  return { how: 'amended', ...amendment(payload(version), folded.payload) };
}

/** DRIFTED: how the pinned concept moved since the pin was taken — its pinned
 *  version is no longer its only settled head — or `undefined` when it has not. */
export function drift(
  pin: Pin,
  design: Design,
  payload: Version,
): Movement | undefined {
  return movement(design, pin.concept, pin.version, payload);
}

/** SUSPECT: every other concept in the closure that moved since the pin was
 *  taken, with how — empty when none did, and when the pin has drifted, since
 *  a drifted unit is never also suspect. */
export function suspicion(
  pin: Pin,
  design: Design,
  closure: Closure,
  payload: Version,
): (Movement & { readonly entity: string })[] {
  if (drift(pin, design, payload) !== undefined) return [];
  const found: (Movement & { entity: string })[] = [];
  for (const entity of new Set(closure(pin.concept))) {
    if (entity === pin.concept) continue;
    const moved = movement(design, entity, pin.closure[entity], payload);
    if (moved !== undefined) found.push({ ...moved, entity });
  }
  return found;
}
