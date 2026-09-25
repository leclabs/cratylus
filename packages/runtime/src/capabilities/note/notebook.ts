// ─────────────────────────────────────────────────────────────────────────────
// THE NOTEBOOK — the set of notes: ideas, questions and decisions not yet
// canonical, the intake that design canonizes.
//
// A note is an entity in the record store's `notebook` domain. Its payload is its
// kind, topic, body and whatever it blocks. A note has no name: its identity is
// the one the store mints, and a reader addresses it by topic, and by kind within
// a topic — that addressing is the interface's, not this module's.
//
// Anyone may capture, revise, retract or reconcile a note. Capture has no
// admission bar: it refuses only a malformed shape, never a judgement of content.
// Revising a note supersedes its one head; retracting it writes a retraction that
// becomes its head. Live notes are those whose one head is a version. A diverged
// note (two versions, or a version and a retraction, left by merged branches) is
// reported and never resolved by picking one: revise and retract refuse it and
// point to reconcile, one whole-state version superseding every head.
//
// A note's kind is a label this module never interprets. An OWED RULING is a live
// note that blocks a plan or unit; it blocks what it names until it no longer
// does, by being retracted or revised to block nothing. A diverged note blocks
// whatever any of its heads blocks until it is reconciled. What a note blocks are
// opaque entity references; resolving them from names is the interface's.
// ─────────────────────────────────────────────────────────────────────────────

import { type Fold, fold } from '../../record-store/fold.js';
import type { Envelope } from '../../record-store/record.js';
import type { RecordStore } from '../../record-store/store.js';

/** The notebook's domain directory under the records root. */
export const NOTEBOOK = 'notebook';

/** A note's whole state: its payload. */
export interface Note {
  /** A label, never interpreted here. */
  readonly kind: string;
  readonly topic: string;
  readonly body: string;
  /** Entity references of the plans and units this note blocks. */
  readonly blocks: readonly string[];
}

/** A live note: its minted entity identity and its current state. */
export interface LiveNote extends Note {
  readonly entity: string;
}

/** A note with more than one head, reported with every head it has. */
export interface DivergedNote {
  readonly entity: string;
  /** The payload of every version head, in record-id order. */
  readonly versions: readonly Note[];
  /** One of its heads is a retraction. */
  readonly retracted: boolean;
}

/** The notebook computed at the moment of the read. */
export interface Notebook {
  /** Every note whose one head is a version, in record-id order. */
  readonly live: readonly LiveNote[];
  readonly diverged: readonly DivergedNote[];
}

/** Who writes a record, why, and what caused it. */
type By = Pick<Envelope, 'author' | 'reason' | 'cause'>;

/** Refuse a malformed shape — a field missing or of the wrong type — and
 *  never judge content. Returns exactly the payload's fields. */
function shape(note: Note): Note {
  const malformed = [
    ...(['kind', 'topic', 'body'] as const).filter(
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
  const { kind, topic, body, blocks } = note;
  return { kind, topic, body, blocks: [...blocks] };
}

/** The one head of `entity` an ordinary write names. Refuses a note with no
 *  records, and a diverged note, pointing to `reconcile`. */
function settled(store: RecordStore, entity: string, verb: string): Fold<Note> {
  const f = fold(store.read<Note>(NOTEBOOK)).get(entity);
  if (!f) throw new Error(`notebook: ${verb} refused — no note ${entity}`);
  if (f.heads.length > 1)
    throw new Error(
      `notebook: ${verb} refused — note ${entity} has diverged into ${f.heads.length} heads; reconcile it`,
    );
  return f;
}

/** The notebook in `store`, folded now. */
export function notebook(store: RecordStore): Notebook {
  const live: LiveNote[] = [];
  const diverged: DivergedNote[] = [];
  for (const f of fold<Note>(store.read<Note>(NOTEBOOK)).values()) {
    if (f.payload !== undefined) live.push({ entity: f.entity, ...f.payload });
    else if (f.heads.length > 1)
      diverged.push({
        entity: f.entity,
        versions: f.heads.flatMap((h) =>
          h.payload === null ? [] : [h.payload],
        ),
        retracted: f.heads.some((h) => h.envelope.operation === 'retract'),
      });
  }
  return { live, diverged };
}

/** Capture a note: write its first version, minting its identity. */
export function capture(store: RecordStore, note: Note, by: By): LiveNote {
  const payload = shape(note);
  const record = store.create(NOTEBOOK, payload, by);
  return { entity: record.envelope.entity, ...payload };
}

/** Revise a note: a whole-state version superseding its one head (a
 *  retraction included, which reinstates it). Refuses a diverged note and
 *  points to `reconcile`. */
export function revise(
  store: RecordStore,
  entity: string,
  note: Note,
  by: By,
): LiveNote {
  const payload = shape(note);
  const heads = settled(store, entity, 'revise').heads;
  store.supersede(
    NOTEBOOK,
    entity,
    heads.map((h) => h.envelope.id),
    payload,
    by,
  );
  return { entity, ...payload };
}

/** Retract a note: a retraction naming its one head becomes its head.
 *  Refuses a diverged note and points to `reconcile`. */
export function retract(store: RecordStore, entity: string, by: By): void {
  settled(store, entity, 'retract');
  store.retract(NOTEBOOK, entity, by);
}

/** Reconcile a diverged note: one whole-state version superseding every head,
 *  a retraction among them included. Refuses a note that has not diverged. */
export function reconcile(
  store: RecordStore,
  entity: string,
  note: Note,
  by: By,
): LiveNote {
  const payload = shape(note);
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
