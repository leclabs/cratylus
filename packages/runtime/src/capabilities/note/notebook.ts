// ─────────────────────────────────────────────────────────────────────────────
// THE NOTEBOOK — the set of notes: ideas, questions and decisions not yet
// canonical, the intake that design canonizes.
//
// A note is an entity in the record store's `notebook` domain. Its payload is its
// title, kind, topic, body and whatever it blocks. Its title is its name — a label
// that can change, never its identity, which the store mints — and the interface
// addresses a note by it. One live note per title. A title is held by the live
// note carrying it, and by a diverged note for every title its heads carry; a
// withdrawn note holds none. One title held by two notes is incoherence, which a
// merge alone produces: it is reported, never resolved by picking one. A write is
// refused only when it introduces a duplicate — one whose notes were not already
// bound together in a standing duplicate — so a write that shrinks or leaves a
// duplicate standing proceeds, and every duplicate repairs one write at a time.
//
// Anyone may capture, revise, retract or reconcile a note. Capture has no
// admission bar: it refuses only a malformed shape or an introduced duplicate,
// never a judgement of content. Revising a note supersedes its heads; retracting it
// writes a retraction that becomes its head. Heads carrying one payload have
// converged and read as one note, so an ordinary write names every one of them. A
// diverged note (heads carrying different payloads, left by merged branches) is
// reported and never resolved by picking one: revise and retract refuse it and
// point to reconcile, one whole-state version superseding every head.
//
// A note's kind is a label this module never interprets. An OWED RULING is a live
// note that blocks a plan, a unit or a concept; it blocks what it names until it no longer
// does, by being retracted or revised to block nothing. A diverged note blocks
// whatever any of its heads blocks until it is reconciled. What a note blocks are
// opaque entity references; resolving them from names is the interface's.
// ─────────────────────────────────────────────────────────────────────────────

import { canonicalOrder } from '../../record-store/canonical-order.js';
import { type Fold, fold } from '../../record-store/fold.js';
import type { Envelope } from '../../record-store/record.js';
import { introduced } from '../../record-store/repair.js';
import type { RecordStore } from '../../record-store/store.js';

/** The notebook's domain directory under the records root. */
export const NOTEBOOK = 'notebook';

/** A note's whole state: its payload. */
export interface Note {
  /** Its name: one live note per title. */
  readonly title: string;
  /** A label, never interpreted here. */
  readonly kind: string;
  readonly topic: string;
  readonly body: string;
  /** Entity references of the plans, units and concepts this note blocks. */
  readonly blocks: readonly string[];
}

/** A live note: its minted entity identity and its current state. */
export interface LiveNote extends Note {
  readonly entity: string;
}

/** A note whose heads carry more than one payload, reported with every head. */
export interface DivergedNote {
  readonly entity: string;
  /** The payload of every version head, in record-id order. */
  readonly versions: readonly Note[];
  /** One of its heads is a retraction. */
  readonly retracted: boolean;
}

/** One title held by more than one note, left by a merge. */
export interface DuplicateTitle {
  readonly title: string;
  /** The notes holding it, in record-id order. */
  readonly entities: readonly string[];
}

/** The notebook computed at the moment of the read. */
export interface Notebook {
  /** Every live note, converged ones included, in record-id order. */
  readonly live: readonly LiveNote[];
  readonly diverged: readonly DivergedNote[];
  readonly incoherence: readonly DuplicateTitle[];
}

/** Who writes a record, why, and what caused it. */
type By = Pick<Envelope, 'author' | 'reason' | 'cause'>;

/** Refuse a malformed shape — a field missing or of the wrong type — and a
 *  reference blocked twice, since what a note blocks is a set; never judge
 *  content. Returns exactly the payload's fields, `blocks` in canonical order. */
function shape(note: Note): Note {
  const malformed = [
    ...(['title', 'kind', 'topic', 'body'] as const).filter(
      (field) => typeof note?.[field] !== 'string',
    ),
    ...(Array.isArray(note?.blocks) &&
    note.blocks.every((ref) => typeof ref === 'string')
      ? []
      : ['blocks']),
  ];
  if (malformed.length > 0)
    throw new Error(
      `notebook: a note is malformed — missing or ill-typed: ${malformed.join(', ')}`,
    );
  const { title, kind, topic, body, blocks } = note;
  const twice = blocks.find((ref, i) => blocks.indexOf(ref) !== i);
  if (twice !== undefined)
    throw new Error(
      `notebook: a note blocks ${twice} twice, and what a note blocks is a set`,
    );
  return { title, kind, topic, body, blocks: canonicalOrder(blocks) };
}

/** The titles each note holds: a live note its title, a diverged note every
 *  title its version heads carry. A withdrawn note holds none. */
function titles(
  folds: ReadonlyMap<string, Fold<Note>>,
): Map<string, ReadonlySet<string>> {
  const held = new Map<string, ReadonlySet<string>>();
  for (const f of folds.values()) {
    const names = f.diverged
      ? f.heads.flatMap((h) => (h.payload === null ? [] : [h.payload.title]))
      : f.payload === undefined
        ? []
        : [f.payload.title];
    if (names.length > 0) held.set(f.entity, new Set(names));
  }
  return held;
}

/** Every title more than one note holds. */
function duplicates(
  held: ReadonlyMap<string, ReadonlySet<string>>,
): DuplicateTitle[] {
  const byTitle = new Map<string, string[]>();
  for (const [entity, names] of held)
    for (const title of names) {
      const entities = byTitle.get(title);
      if (entities) entities.push(entity);
      else byTitle.set(title, [entity]);
    }
  return [...byTitle]
    .filter(([, entities]) => entities.length > 1)
    .map(([title, entities]) => ({ title, entities }));
}

/** Refuse writing `note` as `entity`'s next version when that introduces a
 *  duplicate: one whose notes are not a subset of a duplicate standing before
 *  the write. A capture's entity is not minted yet: `''`, which no ULID is. */
function admit(
  folds: ReadonlyMap<string, Fold<Note>>,
  entity: string,
  note: Note,
  verb: string,
): void {
  const before = titles(folds);
  const after = new Map(before).set(entity, new Set([note.title]));
  const kind = (d: DuplicateTitle) => ({ ...d, kind: 'title' });
  const [found] = introduced(
    duplicates(before).map(kind),
    duplicates(after).map(kind),
  );
  if (found)
    throw new Error(
      `notebook: ${verb} refused — the title ${JSON.stringify(found.title)} is already held by note ${found.entities.filter((e) => e !== entity).join(', ')}, and one live note carries a title`,
    );
}

/** `entity`'s fold for an ordinary write. Refuses a note with no records, and
 *  a diverged note, pointing to `reconcile`. */
function settled(
  folds: ReadonlyMap<string, Fold<Note>>,
  entity: string,
  verb: string,
): Fold<Note> {
  const f = folds.get(entity);
  if (!f) throw new Error(`notebook: ${verb} refused — no note ${entity}`);
  if (f.diverged)
    throw new Error(
      `notebook: ${verb} refused — note ${entity} has diverged; reconcile it`,
    );
  return f;
}

/** The notebook in `store`, folded now. */
export function notebook(store: RecordStore): Notebook {
  const folds = fold(store.read<Note>(NOTEBOOK));
  const live: LiveNote[] = [];
  const diverged: DivergedNote[] = [];
  for (const f of folds.values()) {
    if (f.diverged)
      diverged.push({
        entity: f.entity,
        versions: f.heads.flatMap((h) =>
          h.payload === null ? [] : [h.payload],
        ),
        retracted: f.heads.some((h) => h.envelope.operation === 'retract'),
      });
    else if (f.payload !== undefined)
      live.push({ entity: f.entity, ...f.payload });
  }
  return { live, diverged, incoherence: duplicates(titles(folds)) };
}

/** Capture a note: write its first version, minting its identity. Refuses a
 *  title another note holds. */
export function capture(store: RecordStore, note: Note, by: By): LiveNote {
  const payload = shape(note);
  admit(fold(store.read<Note>(NOTEBOOK)), '', payload, 'capture');
  const record = store.create(NOTEBOOK, payload, by);
  return { entity: record.envelope.entity, ...payload };
}

/** Revise a note: a whole-state version superseding every head of it (a
 *  withdrawn note included, which it reinstates). Refuses a diverged note and
 *  points to `reconcile`, and refuses to introduce a duplicate title. */
export function revise(
  store: RecordStore,
  entity: string,
  note: Note,
  by: By,
): LiveNote {
  const payload = shape(note);
  const folds = fold(store.read<Note>(NOTEBOOK));
  const { heads } = settled(folds, entity, 'revise');
  admit(folds, entity, payload, 'revise');
  store.supersede(
    NOTEBOOK,
    entity,
    heads.map((h) => h.envelope.id),
    payload,
    by,
  );
  return { entity, ...payload };
}

/** Retract a note: a retraction naming every head becomes its head. Refuses a
 *  diverged note and points to `reconcile`. */
export function retract(store: RecordStore, entity: string, by: By): void {
  settled(fold(store.read<Note>(NOTEBOOK)), entity, 'retract');
  store.retract(NOTEBOOK, entity, by);
}

/** Reconcile a diverged note: one whole-state version superseding every head,
 *  a retraction among them included. Refuses a note that has not diverged, and
 *  refuses to introduce a duplicate title. */
export function reconcile(
  store: RecordStore,
  entity: string,
  note: Note,
  by: By,
): LiveNote {
  const payload = shape(note);
  const folds = fold(store.read<Note>(NOTEBOOK));
  const f = folds.get(entity);
  if (!f) throw new Error(`notebook: reconcile refused — no note ${entity}`);
  if (!f.diverged)
    throw new Error(
      `notebook: reconcile refused — note ${entity} has not diverged; only competing versions are reconciled, and a settled note is revised`,
    );
  admit(folds, entity, payload, 'reconcile');
  store.reconcile(NOTEBOOK, entity, payload, by);
  return { entity, ...payload };
}

/** The owed rulings: every plan or unit reference a live note blocks, or any
 *  head of a diverged note blocks, mapped to the entities of the notes
 *  blocking it. A note that blocks nothing is no owed ruling. */
export function owedRulings(
  book: Notebook,
): ReadonlyMap<string, readonly string[]> {
  const named = new Map<string, string[]>();
  const owe = (entity: string, blocks: Iterable<string>): void => {
    for (const ref of new Set(blocks)) {
      const notes = named.get(ref);
      if (notes) notes.push(entity);
      else named.set(ref, [entity]);
    }
  };
  for (const note of book.live) owe(note.entity, note.blocks);
  for (const note of book.diverged)
    owe(
      note.entity,
      note.versions.flatMap((v) => v.blocks),
    );
  return named;
}
