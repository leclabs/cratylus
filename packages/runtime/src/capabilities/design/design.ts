// ─────────────────────────────────────────────────────────────────────────────
// THE DESIGN — the concept lattice C, computed from the design records at the
// moment of the read.
//
// A concept is an entity of the record store's `design` domain. Its payload is its
// anchor, gloss and factors, and it names its factors by ENTITY, so relabelling an
// anchor never breaks a reference. Anchors are resolved to entities and back here,
// at the boundary: every input and every output names a concept by anchor, and no
// caller ever names a record — each write names the concept's current head itself.
//
// A concept is live when its one head is a version, withdrawn when its one head is
// a retraction, and diverged when it has more than one head. Divergence is reported
// and never resolved by picking a head: amending or retracting a diverged concept
// refuses and names reconciliation, which writes one version over every head.
// Amending a withdrawn concept reinstates it. A new version is always the same
// concept; a concept that becomes another is a retraction plus a definition.
//
// The domain hands the store its reference relation (a concept's factors), so a
// factor pointing at a withdrawn concept and a factor cycle surface as incoherence.
// `closure` and `blast` are the `design` skill's signs and mean what they mean there.
// Who may write the design is skill routing's rule, not this module's.
// ─────────────────────────────────────────────────────────────────────────────

import {
  type Fold,
  divergence,
  fold,
  incoherence,
} from '../../record-store/fold.js';
import type { Envelope, Operation, Record } from '../../record-store/record.js';
import type { RecordStore } from '../../record-store/store.js';

/** The record store domain holding the design records. */
export const DOMAIN = 'design';

/** A concept as the boundary names it: its factors by anchor. */
export interface Concept {
  readonly anchor: string;
  /** What the concept is, in one line. */
  readonly gloss: string;
  /** The concepts it decomposes into, by anchor; empty for a primitive. */
  readonly factors: readonly string[];
}

/** A concept's payload as recorded: its factors by entity. */
interface Payload {
  readonly anchor: string;
  readonly gloss: string;
  readonly factors: readonly string[];
}

/** One concept as folded now. */
export interface Standing {
  /** The anchor it is named by; a diverged concept whose heads carry different
   *  anchors is named by all of them, sorted, joined by ` | `. */
  readonly anchor: string;
  /** Each head, in the fold's order: its concept, or `null` for a retraction.
   *  More than one head is divergence. */
  readonly heads: readonly (Concept | null)[];
  /** Settled on a retraction. */
  readonly withdrawn: boolean;
  /** The one head's concept when settled and live; `undefined` otherwise. */
  readonly concept: Concept | undefined;
}

/** A contradiction between concepts: a factor pointing at a withdrawn concept, or
 *  a factor cycle (its members, sorted). */
export type Incoherence =
  | {
      readonly kind: 'retracted';
      readonly anchor: string;
      readonly factor: string;
    }
  | { readonly kind: 'cycle'; readonly anchors: readonly string[] };

/** The whole design as folded now. */
export interface Lattice {
  /** Every live concept, by anchor. */
  readonly concepts: readonly Concept[];
  /** Every diverged concept. */
  readonly divergence: readonly Standing[];
  readonly incoherence: readonly Incoherence[];
}

/** One entry of a concept's history, oldest first: a version with its concept,
 *  or a retraction (`concept` is `null`), and why it was written. */
export interface HistoryEntry {
  readonly operation: Operation;
  readonly concept: Concept | null;
  readonly author: string;
  readonly time: string;
  readonly reason: string;
  readonly cause: string;
}

type By = Pick<Envelope, 'author' | 'reason' | 'cause'>;

/** The design records read once, with the lookups every operation shares. */
class Snapshot {
  readonly records: readonly Record<Payload>[];
  readonly folds: ReadonlyMap<string, Fold<Payload>>;
  readonly #byId: ReadonlyMap<string, Record<Payload>>;
  readonly #entities = new Map<string, string[]>();

  constructor(records: readonly Record<Payload>[]) {
    this.records = records;
    this.folds = fold(records);
    this.#byId = new Map(records.map((r) => [r.envelope.id, r] as const));
    for (const entity of this.folds.keys())
      for (const anchor of this.anchors(entity)) {
        const named = this.#entities.get(anchor);
        if (named) named.push(entity);
        else this.#entities.set(anchor, [entity]);
      }
  }

  /** The anchors an entity carries now: each version head's, and for a
   *  retraction head the anchors of the versions it withdrew. */
  anchors(entity: string): string[] {
    const found = new Set<string>();
    const visit = (record: Record<Payload>): void => {
      if (record.payload) found.add(record.payload.anchor);
      else
        for (const id of record.envelope.supersedes) {
          const named = this.#byId.get(id);
          if (named) visit(named);
        }
    };
    for (const head of this.folds.get(entity)?.heads ?? []) visit(head);
    return [...found].sort();
  }

  name(entity: string): string {
    return this.anchors(entity).join(' | ');
  }

  /** The entity an anchor denotes, if any; refuses an anchor two concepts carry. */
  denotes(anchor: string): string | undefined {
    const entities = this.#entities.get(anchor) ?? [];
    if (entities.length > 1)
      throw new Error(
        `design: anchor ${JSON.stringify(anchor)} names ${entities.length} concepts, and one anchor names one concept`,
      );
    return entities[0];
  }

  /** The entity an anchor denotes; refuses an unknown anchor. */
  resolve(anchor: string): string {
    const entity = this.denotes(anchor);
    if (entity === undefined)
      throw new Error(
        `design: no concept is anchored ${JSON.stringify(anchor)}`,
      );
    return entity;
  }

  concept(payload: Payload): Concept {
    return {
      anchor: payload.anchor,
      gloss: payload.gloss,
      factors: payload.factors.map((f) => this.name(f)),
    };
  }

  standing(entity: string): Standing {
    const f = this.folds.get(entity);
    return {
      anchor: this.name(entity),
      heads: (f?.heads ?? []).map((h) =>
        h.payload ? this.concept(h.payload) : null,
      ),
      withdrawn: f?.withdrawn ?? false,
      concept: f?.payload ? this.concept(f.payload) : undefined,
    };
  }

  /** The factor relation: each concept's factors over every version head. */
  factors(): Map<string, Set<string>> {
    const edges = new Map<string, Set<string>>();
    for (const f of this.folds.values()) {
      const out = new Set<string>();
      for (const head of f.heads)
        for (const factor of head.payload?.factors ?? [])
          if (this.folds.has(factor)) out.add(factor);
      edges.set(f.entity, out);
    }
    return edges;
  }
}

/** The entities reachable from `start` over `edges`, `start` first. */
function reach(
  start: string,
  edges: ReadonlyMap<string, ReadonlySet<string>>,
): string[] {
  const seen = new Set<string>([start]);
  for (const entity of seen)
    for (const next of edges.get(entity) ?? []) seen.add(next);
  return [...seen];
}

/** The design over one repository's records. Every read folds the records anew. */
export class Design {
  readonly #store: RecordStore;

  constructor(store: RecordStore) {
    this.#store = store;
  }

  #read(): Snapshot {
    return new Snapshot(this.#store.read<Payload>(DOMAIN));
  }

  /** A recordable payload for `concept`, its factors resolved to entities; refuses
   *  an anchor another concept than `entity` already carries. */
  #payload(read: Snapshot, concept: Concept, entity?: string): Payload {
    const holder = read.denotes(concept.anchor);
    if (holder !== undefined && holder !== entity)
      throw new Error(
        `design: anchor ${JSON.stringify(concept.anchor)} already names a concept; amend that concept instead`,
      );
    return {
      anchor: concept.anchor,
      gloss: concept.gloss,
      factors: concept.factors.map((f) => read.resolve(f)),
    };
  }

  /** The one current head of the concept `anchor` denotes; refuses a diverged
   *  concept, naming reconciliation. */
  #head(read: Snapshot, anchor: string, verb: string) {
    const entity = read.resolve(anchor);
    const heads = read.folds.get(entity)?.heads ?? [];
    const [head] = heads;
    if (heads.length !== 1 || head === undefined)
      throw new Error(
        `design: ${verb} ${JSON.stringify(anchor)} refused — it has diverged into ${heads.length} heads; reconcile it`,
      );
    return { entity, head };
  }

  /** Define a new concept: its first version. */
  define(concept: Concept, by: By): void {
    this.#store.create(DOMAIN, this.#payload(this.#read(), concept), by);
  }

  /** Amend the concept `anchor` denotes to `concept` (which may relabel it): a new
   *  version of the same concept over its one current head. Amending a withdrawn
   *  concept reinstates it. */
  amend(anchor: string, concept: Concept, by: By): void {
    const read = this.#read();
    const { entity, head } = this.#head(read, anchor, 'amend');
    this.#store.supersede(
      DOMAIN,
      entity,
      [head.envelope.id],
      this.#payload(read, concept, entity),
      by,
    );
  }

  /** Withdraw the concept `anchor` denotes: a retraction of its one current head,
   *  which becomes its head. */
  retract(anchor: string, by: By): void {
    const read = this.#read();
    const { entity, head } = this.#head(read, anchor, 'retract');
    if (head.envelope.operation === 'retract')
      throw new Error(
        `design: retract ${JSON.stringify(anchor)} refused — it is withdrawn`,
      );
    this.#store.retract(DOMAIN, entity, by);
  }

  /** Reconcile the diverged concept `anchor` denotes: one version, `concept`, over
   *  every head, a retraction among them included. Refuses a settled concept. */
  reconcile(anchor: string, concept: Concept, by: By): void {
    const read = this.#read();
    const entity = read.resolve(anchor);
    const heads = read.folds.get(entity)?.heads.length ?? 0;
    if (heads < 2)
      throw new Error(
        `design: reconcile ${JSON.stringify(anchor)} refused — it is settled, and only divergence is reconciled; amend it`,
      );
    this.#store.reconcile(
      DOMAIN,
      entity,
      this.#payload(read, concept, entity),
      by,
    );
  }

  /** The whole design: every live concept, every divergence, every incoherence. */
  lattice(): Lattice {
    const read = this.#read();
    const concepts: Concept[] = [];
    for (const f of read.folds.values())
      if (f.payload) concepts.push(read.concept(f.payload));
    return {
      concepts: concepts.sort((a, b) => (a.anchor < b.anchor ? -1 : 1)),
      divergence: divergence(read.folds).map((f) => read.standing(f.entity)),
      incoherence: incoherence(read.folds, (p) => p.factors).map((i) =>
        i.kind === 'retracted'
          ? {
              kind: i.kind,
              anchor: read.name(i.entity),
              factor: read.name(i.reference),
            }
          : {
              kind: i.kind,
              anchors: i.entities.map((e) => read.name(e)).sort(),
            },
      ),
    };
  }

  /** The concept `anchor` denotes, live, withdrawn or diverged. */
  concept(anchor: string): Standing {
    const read = this.#read();
    return read.standing(read.resolve(anchor));
  }

  /** The entity `anchor` denotes, `undefined` when no concept carries it. */
  denotes(anchor: string): string | undefined {
    return this.#read().denotes(anchor);
  }

  /** closure(c) ≜ { c } ∪ ⋃ { closure(f) | f ∈ factors(c) }, by anchor, `c` first.
   *  A diverged concept contributes the factors of every version head. */
  closure(anchor: string): string[] {
    const read = this.#read();
    return reach(read.resolve(anchor), read.factors()).map((e) => read.name(e));
  }

  /** blast(c) ≜ { d ∈ C | c ∈ closure(d) }, by anchor, `c` first. */
  blast(anchor: string): string[] {
    const read = this.#read();
    const factoredBy = new Map<string, Set<string>>();
    for (const [entity, factors] of read.factors())
      for (const factor of factors) {
        const by = factoredBy.get(factor);
        if (by) by.add(entity);
        else factoredBy.set(factor, new Set([entity]));
      }
    return reach(read.resolve(anchor), factoredBy).map((e) => read.name(e));
  }

  /** Every version and retraction of the concept `anchor` denotes, oldest first,
   *  with its reason; factors named by their current anchors. */
  history(anchor: string): HistoryEntry[] {
    const read = this.#read();
    const entity = read.resolve(anchor);
    return read.records
      .filter((r) => r.envelope.entity === entity)
      .map(({ envelope: e, payload }) => ({
        operation: e.operation,
        concept: payload ? read.concept(payload) : null,
        author: e.author,
        time: e.time,
        reason: e.reason,
        cause: e.cause,
      }));
  }
}
