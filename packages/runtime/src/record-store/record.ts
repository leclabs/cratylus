// ─────────────────────────────────────────────────────────────────────────────
// THE RECORD MODEL — what one record is, before anything reads or writes it.
//
// A record is one immutable entry in one entity's history, either a version or a
// retraction: an envelope saying what the record is, and a whole-state payload.
// Never a delta, never edited, moved or deleted once written. Everything an entity
// "is now" is computed from its records by the fold (`fold.ts`); nothing here or
// there is ever persisted but records.
//
// The store knows no domain. A payload is opaque to it, and so is an entity's name:
// a name, where the entity has one, is a label inside its payload and can change,
// while the entity's identity is minted once and is neither that name nor its place
// in history.
//
// NOTE: `Record` here is this module's record, and it shadows TypeScript's global
// `Record<K, V>` utility in every module that imports it.
// ─────────────────────────────────────────────────────────────────────────────

/** A record's identity: a ULID minted without coordination (`../ulid.ts`), so
 *  records written on different branches or machines never collide. It is also
 *  the record's file name. */
export type RecordId = string;

/**
 * What a record does to its entity.
 *
 * - `create` writes the entity's first version and names nothing;
 * - `amend` writes a new whole-state version replacing one or more of the
 *   entity's current heads — every supersession, a reinstatement (naming a
 *   retraction) and a reconciliation (naming several heads) included, is an
 *   amendment;
 * - `retract` withdraws the entity with no successor version, naming the heads
 *   it withdraws; the retraction itself becomes the entity's head.
 */
export type Operation = 'create' | 'amend' | 'retract';

/** What a record says about itself. */
export interface Envelope {
  readonly id: RecordId;
  /** The minted identity of the entity this record belongs to. */
  readonly entity: string;
  readonly operation: Operation;
  /** The heads this record replaces (`amend`) or withdraws (`retract`), each a
   *  head of the entity when the record was written; empty for `create`. */
  readonly supersedes: readonly RecordId[];
  readonly author: string;
  /** ISO-8601 instant the record was written. */
  readonly time: string;
  readonly reason: string;
  /** What caused the record. */
  readonly cause: string;
}

/** One immutable entry in one entity's history. A retraction carries no
 *  payload: the entity has no state after it. */
export interface Record<P = unknown> {
  readonly envelope: Envelope;
  readonly payload: P | null;
}
