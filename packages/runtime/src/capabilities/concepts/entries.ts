// ─────────────────────────────────────────────────────────────────────────────
// The ENTRIES of the concept journal: what each appending verb records, one
// entry per file, never edited, moved or deleted.
//
// Every entry carries its `id`, a ULID that names its file and orders it, `at`,
// the moment its id was minted, and, when known, `by`, who appended it: the
// acting agent, else git's user. A context's description (`context`)
// changes like a concept does: a later description with its reason supersedes
// the current ones, the earlier kept in the context's history. A concept
// version (`define`, `supersede`, `retire`) belongs to one bounded context and
// names the versions it supersedes; a decision (`decide`) is named by its own
// id, and its acceptance (`accept`) and each classification of its kind
// (`classify`) are entries of their own, so the decision's record never
// changes. A cut's efficiency figures (`efficiency`) are recorded by the work
// package capability; the latest for a cut are its figures.
//
// An entry of a kind named here is read only when it carries every field its
// kind's shape requires; an entry of a kind not named here, or of a known kind
// holding a value of an open field this runtime does not know, was written by a
// newer runtime and is read past, never refused, interpreted or rewritten.
// ─────────────────────────────────────────────────────────────────────────────

/** What every entry carries: the ULID naming its file, when it was minted,
 *  and, when known, who appended it. */
interface Stamped {
  readonly id: string;
  readonly at: string;
  readonly by?: string;
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

/** What a decision is about: stating what the design means, or constraining
 *  how it is realized. */
export const DECISION_KINDS = ['meaning', 'realization'] as const;
export type DecisionKind = (typeof DECISION_KINDS)[number];

/** A decision, recorded open or accepted, optionally superseding an earlier
 *  one. Its identity is its entry's id; `decisionId` is the name the caller
 *  gave, which two branches may each give. `supersedes` is the superseded
 *  decision's name and `supersedesEntry` its entry (absent on entries written
 *  before names could be shared, which are read by their name alone).
 *  `decisionKind` is present only where the decision was recorded with its
 *  kind. */
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
  readonly decisionKind?: DecisionKind;
}

/** The acceptance of an open decision: its name, and its entry (absent on
 *  entries written before names could be shared). */
export interface AcceptEntry extends Stamped {
  readonly kind: 'accept';
  readonly decisionId: string;
  readonly entry?: string;
  readonly reason?: string;
}

/** The kind of a recorded decision, recorded after it: its name, its entry,
 *  the kind, and the reason where one was given. */
export interface ClassifyEntry extends Stamped {
  readonly kind: 'classify';
  readonly decisionId: string;
  readonly entry: string;
  readonly decisionKind: DecisionKind;
  readonly reason?: string;
}

/** A cut's efficiency figures as recorded at one moment: the agent runs it took,
 *  in total and by role, its rounds, its whole-check runs, and the tokens its
 *  runs carried (`null` when none carried any). A later entry for the same cut
 *  of the same context holds its figures from then on. */
export interface EfficiencyEntry extends Stamped {
  readonly kind: 'efficiency';
  readonly context: string;
  readonly cut: string;
  readonly agentRuns: {
    readonly total: number;
    readonly byRole: Readonly<Record<string, number>>;
  };
  readonly rounds: number;
  readonly wholeCheckRuns: number;
  readonly tokens: number | null;
}

export type Entry =
  | ContextEntry
  | VersionEntry
  | DecideEntry
  | AcceptEntry
  | ClassifyEntry
  | EfficiencyEntry;

/** Whether a field's value fits its place in an entry. */
type Fits = (value: unknown) => boolean;

const text: Fits = (value) => typeof value === 'string';
const texts: Fits = (value) => Array.isArray(value) && value.every(text);
const count: Fits = (value) => typeof value === 'number';
const optional =
  (fits: Fits): Fits =>
  (value) =>
    value === undefined || fits(value);

/** Every field of entries of kind `K` but its id, kind and maker (written by
 *  the journal itself, never required), each with what fits it. */
type Shape<K extends Entry['kind']> = {
  readonly [F in Exclude<
    keyof (Entry & { kind: K }),
    'id' | 'kind' | 'by'
  >]-?: Fits;
};

const worded = {
  at: text,
  context: text,
  name: text,
  wording: text,
  builtFrom: texts,
  reason: text,
  supersedes: texts,
} as const;

/** Every kind of entry the journal holds, and the fields an entry of it must
 *  carry to be read. */
export const SHAPES: { readonly [K in Entry['kind']]: Shape<K> } = {
  context: {
    at: text,
    name: text,
    subject: text,
    relation: text,
    reason: optional(text),
    supersedes: optional(texts),
  },
  define: worded,
  supersede: worded,
  retire: {
    at: text,
    context: text,
    name: text,
    reason: text,
    supersedes: texts,
  },
  decide: {
    at: text,
    decisionId: text,
    context: text,
    title: text,
    situation: text,
    decision: text,
    consequences: text,
    status: text,
    supersedes: (value) => value === null || text(value),
    supersedesEntry: optional(text),
    decisionKind: optional(text),
  },
  accept: {
    at: text,
    decisionId: text,
    entry: optional(text),
    reason: optional(text),
  },
  classify: {
    at: text,
    decisionId: text,
    entry: text,
    decisionKind: text,
    reason: optional(text),
  },
  efficiency: {
    at: text,
    context: text,
    cut: text,
    agentRuns: (value) =>
      typeof value === 'object' &&
      value !== null &&
      'total' in value &&
      count(value.total) &&
      'byRole' in value &&
      typeof value.byRole === 'object' &&
      value.byRole !== null &&
      Object.values(value.byRole).every(count),
    rounds: count,
    wholeCheckRuns: count,
    tokens: (value) => value === null || count(value),
  },
};

/** Whether `kind` is one the journal holds. */
export const isKind = (kind: unknown): kind is Entry['kind'] =>
  typeof kind === 'string' && Object.hasOwn(SHAPES, kind);

/** The fields of `entry`, of kind `kind`, that do not fit its kind: none when
 *  it can be read. */
export const unfit = (
  entry: Readonly<Record<string, unknown>>,
  kind: Entry['kind'],
): string[] =>
  Object.entries(SHAPES[kind] as Readonly<Record<string, Fits>>)
    .filter(([field, fits]) => !fits(entry[field]))
    .map(([field]) => field);

/** The open fields of each kind: those a newer runtime may give values this
 *  one does not know, each with the values it knows. A field's shape still
 *  says what fits it; a fitting value outside these is newer, not malformed. */
const KNOWN_VALUES: {
  readonly [K in Entry['kind']]?: Readonly<Record<string, readonly string[]>>;
} = {
  decide: { status: ['open', 'accepted'], decisionKind: DECISION_KINDS },
  classify: { decisionKind: DECISION_KINDS },
};

/** Each open field of `entry`, of kind `kind`, holding a value this runtime
 *  does not know, with that value: none when it can be interpreted. */
export const newerValues = (
  entry: Readonly<Record<string, unknown>>,
  kind: Entry['kind'],
): [field: string, value: string][] =>
  Object.entries(KNOWN_VALUES[kind] ?? {}).flatMap(([field, known]) => {
    const value = entry[field];
    return typeof value === 'string' && !known.includes(value)
      ? [[field, value] as [string, string]]
      : [];
  });

/** An entry before it is stamped: what a verb asks the journal to append. */
export type Draft<E extends Entry = Entry> = E extends Entry
  ? Omit<E, 'id' | 'at' | 'by'>
  : never;
