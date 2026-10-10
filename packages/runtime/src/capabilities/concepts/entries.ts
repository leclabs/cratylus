// ─────────────────────────────────────────────────────────────────────────────
// The ENTRIES of the concept journal: what each appending verb records, one
// entry per file, never edited, moved or deleted.
//
// Every entry carries its `id`, a ULID that names its file and orders it, and
// `at`, the moment its id was minted. A context's description (`context`)
// changes like a concept does: a later description with its reason supersedes
// the current ones, the earlier kept in the context's history. A concept
// version (`define`, `supersede`, `retire`) belongs to one bounded context and
// names the versions it supersedes; a decision (`decide`) is named by its own
// id, and its acceptance (`accept`) is an entry of its own, so the decision's
// record never changes.
// ─────────────────────────────────────────────────────────────────────────────

/** What every entry carries: the ULID naming its file, and when it was minted. */
interface Stamped {
  readonly id: string;
  readonly at: string;
}

/** A description of a bounded context: its full subject, and its place in the
 *  context map. A context is its name: the first entry of a name records it,
 *  with no reason; a later one changes it, with the `reason` it was written,
 *  naming the current entries it supersedes (one when settled, all when
 *  competing). Entries written before contexts could change carry no reason,
 *  and those written before descriptions could compete no `supersedes`. */
export interface ContextEntry extends Stamped {
  readonly kind: 'context';
  readonly name: string;
  readonly subject: string;
  readonly relation: string;
  readonly reason?: string;
  readonly supersedes?: readonly string[];
}

/** A version of a concept that states it: its first (`define`) or one that
 *  supersedes every current version (`supersede`). */
export interface WordedEntry extends Stamped {
  readonly kind: 'define' | 'supersede';
  readonly context: string;
  readonly name: string;
  readonly wording: string;
  readonly builtFrom: readonly string[];
  readonly reason: string;
  readonly supersedes: readonly string[];
}

/** The retirement of a concept, superseding every current version. */
export interface RetireEntry extends Stamped {
  readonly kind: 'retire';
  readonly context: string;
  readonly name: string;
  readonly reason: string;
  readonly supersedes: readonly string[];
}

/** A version of a concept: what `history` lists. */
export type VersionEntry = WordedEntry | RetireEntry;

/** A decision, recorded open or accepted, optionally superseding an earlier
 *  one. Its identity is its entry's id; `decisionId` is the name the caller
 *  gave, which two branches may each give. `supersedes` is the superseded
 *  decision's name and `supersedesEntry` its entry (absent on entries written
 *  before names could be shared, which are read by their name alone). */
export interface DecideEntry extends Stamped {
  readonly kind: 'decide';
  readonly decisionId: string;
  readonly context: string;
  readonly title: string;
  readonly situation: string;
  readonly decision: string;
  readonly consequences: string;
  readonly status: 'open' | 'accepted';
  readonly supersedes: string | null;
  readonly supersedesEntry?: string;
}

/** The acceptance of an open decision: its name, and its entry (absent on
 *  entries written before names could be shared). */
export interface AcceptEntry extends Stamped {
  readonly kind: 'accept';
  readonly decisionId: string;
  readonly entry?: string;
  readonly reason?: string;
}

export type Entry = ContextEntry | VersionEntry | DecideEntry | AcceptEntry;

/** Every kind of entry the journal holds. */
export const KINDS: readonly Entry['kind'][] = [
  'context',
  'define',
  'supersede',
  'retire',
  'decide',
  'accept',
];

/** An entry before it is stamped: what a verb asks the journal to append. */
export type Draft<E extends Entry = Entry> = E extends Entry
  ? Omit<E, 'id' | 'at'>
  : never;
