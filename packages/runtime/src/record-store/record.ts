// ─────────────────────────────────────────────────────────────────────────────
// THE RECORD MODEL — what one record is, before anything reads or writes it.
//
// A record is one immutable version of one entity: an envelope saying what the
// record is, and a whole-state payload. Never a delta, never edited, moved or
// deleted once written. Everything an entity "is now" is computed from its records
// by the fold (`fold.ts`); nothing here or there is ever persisted but records.
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
 * - `create` writes the entity's first version and supersedes nothing;
 * - `amend` writes a new whole-state version superseding one or more earlier
 *   versions of the same entity — every supersession, a reconciliation included,
 *   is an amendment;
 * - `retract` withdraws the entity with no successor.
 */
export type Operation = 'create' | 'amend' | 'retract';

/** What a record says about itself. */
export interface Envelope {
  readonly id: RecordId;
  /** The minted identity of the entity this record is a version of. */
  readonly entity: string;
  readonly operation: Operation;
  /** The versions this record replaces (`amend`) or withdraws (`retract`);
   *  empty for `create`. */
  readonly supersedes: readonly RecordId[];
  readonly author: string;
  /** ISO-8601 instant the record was written. */
  readonly time: string;
  readonly reason: string;
  /** What caused the record. */
  readonly cause: string;
}

/** One immutable version of one entity. A retraction carries no payload: the
 *  entity has no state after it. */
export interface Record<P = unknown> {
  readonly envelope: Envelope;
  readonly payload: P | null;
}
