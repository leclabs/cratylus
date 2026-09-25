// ─────────────────────────────────────────────────────────────────────────────
// THE NOTEBOOK — the set of notes: ideas, questions and decisions not yet
// canonical, the intake that design canonizes.
//
// A note is an entity in the record store's `notebook` domain. Its payload is its
// kind, topic, body and whatever it blocks. A note has no name: its identity is
// the one the store mints, and a reader addresses it by topic, and by kind within
// a topic — that addressing is the interface's, not this module's.
//
// Anyone may capture a note, and capture has no admission bar: it refuses only a
// malformed shape, never a judgement of content. A changed note is a supersession
// of its current head; retracting a note writes a retraction that becomes its
// head. Live notes are those whose one head is a version. A diverged note (two
// versions, or a version and a retraction, left by merged branches) is reported,
// never resolved by picking one.
//
// Kinds are opaque here: which kinds exist, and that only a question may block,
// are the `note` skill's meaning. This module recognises an OWED RULING as a live
// note that blocks a plan or unit, and names, for a caller, the plans and units
// the owed rulings block. Closing an owed ruling is retracting its note. What a
// note blocks are opaque entity references; resolving them from names is the
// interface's.
// ─────────────────────────────────────────────────────────────────────────────

import { fold } from '../../record-store/fold.js';
import type { Envelope } from '../../record-store/record.js';
import type { RecordStore } from '../../record-store/store.js';

/** The notebook's domain directory under the records root. */
export const NOTEBOOK = 'notebook';

/** A note's whole state: its payload. */
export interface Note {
  /** Opaque here; the `note` skill holds the kinds. */
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

/** Change a note: a whole-state version superseding its one current head (a
 *  retraction included, which reinstates it). Refuses a note with no records,
 *  and a diverged note, which is reported and never resolved by picking one. */
export function supersede(
  store: RecordStore,
  entity: string,
  note: Note,
  by: By,
): LiveNote {
  const payload = shape(note);
  const heads = fold(store.read(NOTEBOOK)).get(entity)?.heads ?? [];
  if (heads.length !== 1)
    throw new Error(
      `notebook: supersede refused — note ${entity} has ${heads.length} heads, not one`,
    );
  store.supersede(
    NOTEBOOK,
    entity,
    heads.map((h) => h.envelope.id),
    payload,
    by,
  );
  return { entity, ...payload };
}

/** Retract a note: a retraction naming its heads becomes its head. Retracting
 *  an owed ruling's note closes it. */
export function retract(store: RecordStore, entity: string, by: By): void {
  store.retract(NOTEBOOK, entity, by);
}

/** The owed rulings: every plan or unit a live note blocks, keyed by its entity
 *  reference, with the live notes blocking it in record-id order. A note that
 *  blocks nothing is no owed ruling. */
export function owedRulings(
  book: Notebook,
): ReadonlyMap<string, readonly LiveNote[]> {
  const named = new Map<string, LiveNote[]>();
  for (const note of book.live)
    for (const ref of new Set(note.blocks)) {
      const rulings = named.get(ref);
      if (rulings) rulings.push(note);
      else named.set(ref, [note]);
    }
  return named;
}
