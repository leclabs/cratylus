// ─────────────────────────────────────────────────────────────────────────────
// The ENTRIES of the concept journal: what each verb records, one entry per
// file, never edited or moved, and removed only when the journal's books close.
//
// Every entry carries its `id`, a ULID that names its file and orders it, `at`,
// the moment its id was minted, and, when known, `by`, who appended it: the
// acting agent, else git's user. The project's purpose (`purpose`), what the
// project is for, and a context's description (`context`) change like a
// concept does: a later one with its reason supersedes the current ones, the
// earlier kept in the journal until its books close. A `rename-context` is a
// description that gives its context a new name, carrying the name it renames
// (`was`), the context staying one through its names, its identity kept. A
// context's retirement (`retire-context`) supersedes its current descriptions,
// and a later description with its reason brings it back. A concept
// version (`define`, `supersede`, `rename`, `retire`) belongs to one bounded
// context and names the versions it supersedes; a `rename` is a supersession
// that gives its concept a new name, carrying the name it renames (`was`), the
// concept staying one through its names; a decision (`decide`) is named by its
// own id and records realization, and its acceptance (`accept`) and its
// deprecation (`deprecate`) are entries of their own, so the decision's record
// never changes. No verb writes the kinds `classify` or `efficiency` any more:
// a classification of a decision's kind and a cut's effort figures are read as
// recorded, the latest classification governing a decision's kind and the
// latest figures for a cut being its figures, and shown only as history.
//
// Closing the books opens a new period: one OPENING entry per current version
// of each standing item, of the item's own kind, superseding nothing and
// carrying `broughtForward`, the full sha of the commit at HEAD holding the
// closed period, and, for a context, its `identity`; every other entry file
// then leaves the journal, kept by version control. An opening is otherwise an
// ordinary entry, so a runtime that does not know the field reads it as one.
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
 *  context map. The first entry of a name records a context, with no reason;
 *  a later one changes it, with the `reason` it was written,
 *  naming the current entries it supersedes (one when settled, all when
 *  competing). Entries written before contexts could change carry no reason,
 *  and those written before descriptions could compete no `supersedes`. An
 *  opening carries `identity`, the context's identity, which it keeps across
 *  periods. */
export interface ContextEntry extends Stamped {
  readonly kind: 'context';
  readonly name: string;
  readonly subject: string;
  readonly relation: string;
  readonly reason?: string;
  readonly supersedes?: readonly string[];
  readonly identity?: string;
  readonly broughtForward?: string;
}

/** The project's purpose: what the project is for, in plain words. The first
 *  records it, with no reason; a later one changes it, with the `reason` it was
 *  written, naming the current entries it supersedes (one when settled, all
 *  when competing). */
export interface PurposeEntry extends Stamped {
  readonly kind: 'purpose';
  readonly statement: string;
  readonly reason?: string;
  readonly supersedes: readonly string[];
  readonly broughtForward?: string;
}

/** A version of a concept that states it: its first (`define`), one that
 *  supersedes every current version (`supersede`), or a `rename`. */
export type WordedEntry = StatingEntry | RenameEntry;

/** A first version of a concept, or one superseding every current version. */
interface StatingEntry extends Stamped {
  readonly kind: 'define' | 'supersede';
  readonly context: string;
  readonly name: string;
  readonly wording: string;
  readonly builtFrom: readonly string[];
  readonly reason: string;
  readonly supersedes: readonly string[];
  readonly broughtForward?: string;
}

/** A version superseding every current one that gives the concept a new name
 *  from then on, `name`; `was` is the name it renames. */
export interface RenameEntry extends Omit<StatingEntry, 'kind'> {
  readonly kind: 'rename';
  readonly was: string;
}

/** The retirement of a concept, superseding every current version; an opening
 *  only where it competes with another current version. */
export interface RetireEntry extends Stamped {
  readonly kind: 'retire';
  readonly context: string;
  readonly name: string;
  readonly reason: string;
  readonly supersedes: readonly string[];
  readonly broughtForward?: string;
}

/** The retirement of a bounded context, with the `reason` it leaves the
 *  design, superseding its current descriptions and retirements; an opening
 *  only where it competes with a current description. */
export interface RetireContextEntry extends Stamped {
  readonly kind: 'retire-context';
  readonly context: string;
  readonly reason: string;
  readonly supersedes: readonly string[];
  readonly broughtForward?: string;
}

/** A description superseding the current ones that gives the bounded context
 *  a new name from then on, `name`; `was` is the name it renames. The context
 *  stays one through its names, its concepts, decisions and identity kept. */
export interface RenameContextEntry extends Stamped {
  readonly kind: 'rename-context';
  readonly name: string;
  readonly was: string;
  readonly subject: string;
  readonly relation: string;
  readonly reason: string;
  readonly supersedes: readonly string[];
}

/** A description of a bounded context: a `context`, or a `rename-context`. */
export type DescriptionEntry = ContextEntry | RenameContextEntry;

/** A version of a concept: what `history` lists. */
export type VersionEntry = WordedEntry | RetireEntry;

/** What a decision is about: stating what the design means, or constraining
 *  how it is realized. Every decision recorded now is of realization; meaning
 *  is read only on entries recorded before. */
export const DECISION_KINDS = ['meaning', 'realization'] as const;
export type DecisionKind = (typeof DECISION_KINDS)[number];

/** A decision, recorded open or accepted, optionally superseding an earlier
 *  one. Its identity is its entry's id; `decisionId` is the name the caller
 *  gave, which two branches may each give. `supersedes` is the superseded
 *  decision's name and `supersedesEntry` its entry (absent on entries written
 *  before names could be shared, which are read by their name alone).
 *  `decisionKind` is `realization` on every decision recorded now, and absent
 *  or as recorded on earlier entries. `keeps`, the example files a decision
 *  kept, and `cut`, the cut it was recorded about, are no longer written;
 *  where an entry carries them they are read as recorded, and the decision's
 *  status is its own alone. */
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
  readonly cut?: string;
  readonly keeps?: readonly string[];
  readonly broughtForward?: string;
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

/** The deprecation of a standing decision: its name, its entry, and why it no
 *  longer applies. It has no replacement, and is kept as history. */
export interface DeprecateEntry extends Stamped {
  readonly kind: 'deprecate';
  readonly decisionId: string;
  readonly entry: string;
  readonly reason: string;
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
  | PurposeEntry
  | ContextEntry
  | RenameContextEntry
  | RetireContextEntry
  | VersionEntry
  | DecideEntry
  | AcceptEntry
  | ClassifyEntry
  | DeprecateEntry
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
  broughtForward: optional(text),
} as const;

/** Every kind of entry the journal holds, and the fields an entry of it must
 *  carry to be read. */
export const SHAPES: { readonly [K in Entry['kind']]: Shape<K> } = {
  purpose: {
    at: text,
    statement: text,
    reason: optional(text),
    supersedes: texts,
    broughtForward: optional(text),
  },
  context: {
    at: text,
    name: text,
    subject: text,
    relation: text,
    reason: optional(text),
    supersedes: optional(texts),
    identity: optional(text),
    broughtForward: optional(text),
  },
  define: worded,
  supersede: worded,
  rename: { ...worded, was: text },
  retire: {
    at: text,
    context: text,
    name: text,
    reason: text,
    supersedes: texts,
    broughtForward: optional(text),
  },
  'rename-context': {
    at: text,
    name: text,
    was: text,
    subject: text,
    relation: text,
    reason: text,
    supersedes: texts,
  },
  'retire-context': {
    at: text,
    context: text,
    reason: text,
    supersedes: texts,
    broughtForward: optional(text),
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
    cut: optional(text),
    keeps: optional(texts),
    broughtForward: optional(text),
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
  deprecate: {
    at: text,
    decisionId: text,
    entry: text,
    reason: text,
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
