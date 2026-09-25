// ─────────────────────────────────────────────────────────────────────────────
// THE DESIGN — the concept lattice C, computed from the design records at the
// moment of the read.
//
// A concept is an entity of the record store's `design` domain. Its payload is its
// anchor, gloss and factors, and it names its factors by ENTITY, so relabelling an
// anchor never breaks a reference. Names are resolved to entities and back here,
// at the boundary: every input and every output names a concept, and no caller
// ever names a record — each write names the concept's current head itself.
//
// A concept's name is its anchor. When a merge leaves one anchor on several
// concepts, each of them is named `<anchor> #<n>`, numbered in the order the
// concepts were defined, so every concept stays addressable and the architect can
// relabel or retract one of them.
//
// A concept is live when its one head is a version, withdrawn when its one head is
// a retraction, and diverged when it has more than one head. Divergence is reported
// and never resolved by picking a head: amending or retracting a diverged concept
// refuses and names reconciliation, which writes one version over every head.
// Amending a withdrawn concept reinstates it. A new version is always the same
// concept; a concept that becomes another is a retraction plus a definition.
//
// Every write keeps the design's laws on the current branch: one live concept per
// anchor, and a withdrawn concept keeps its anchor until reinstated; factors are
// acyclic and name no withdrawn concept, so a concept others factor on is not
// retracted; every anchor, gloss and reason is non-empty. A write that would break
// one refuses, so incoherence — a factor on a withdrawn concept, a factor cycle, one
// anchor on two live concepts — arises only from merges, and is reported here and
// resolved by an ordinary write to one of the concepts involved.
//
// `closure` and `blast` are the `design` skill's signs and mean what they mean
// there. Who may write the design is skill routing's rule, not this module's.
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

/** A concept as the boundary names it: its factors by name. */
export interface Concept {
  readonly anchor: string;
  /** What the concept is, in one line. */
  readonly gloss: string;
  /** The concepts it decomposes into, by name; empty for a primitive. */
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
  /** The name it is addressed by: its anchor, `<anchor> #<n>` when several
   *  concepts carry that anchor; a diverged concept whose heads carry different
   *  anchors is named by each of them, joined by ` | `. */
  readonly name: string;
  /** Each head, in the fold's order: its concept, or `null` for a retraction.
   *  More than one head is divergence. */
  readonly heads: readonly (Concept | null)[];
  /** Settled on a retraction. */
  readonly withdrawn: boolean;
  /** The one head's concept when settled and live; `undefined` otherwise. */
  readonly concept: Concept | undefined;
}

/** A design law broken across concepts by a merge: a factor on a withdrawn
 *  concept, a factor cycle (its members, sorted), or one anchor on several live
 *  concepts (their names). */
export type Incoherence =
  | {
      readonly kind: 'retracted';
      readonly name: string;
      readonly factor: string;
    }
  | { readonly kind: 'cycle'; readonly names: readonly string[] }
  | {
      readonly kind: 'anchor';
      readonly anchor: string;
      readonly names: readonly string[];
    };

/** The whole design as folded now. */
export interface Lattice {
  /** Every live concept, by name. */
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

/** The design records read once, with the lookups every operation shares. */
class Snapshot {
  readonly records: readonly Record<Payload>[];
  readonly folds: ReadonlyMap<string, Fold<Payload>>;
  /** The factor relation: each concept's factors over every version head. */
  readonly factors = new Map<string, Set<string>>();
  readonly #byId: ReadonlyMap<string, Record<Payload>>;
  /** Every entity carrying each anchor, in the order they were defined. */
  readonly #carriers = new Map<string, string[]>();

  constructor(records: readonly Record<Payload>[]) {
    this.records = records;
    // Records arrive in record-id order, so the folds are in definition order.
    this.folds = fold(records);
    this.#byId = new Map(records.map((r) => [r.envelope.id, r] as const));
    for (const f of this.folds.values()) {
      const out = new Set<string>();
      for (const head of f.heads)
        for (const factor of head.payload?.factors ?? [])
          if (this.folds.has(factor)) out.add(factor);
      this.factors.set(f.entity, out);
      for (const anchor of this.anchors(f.entity)) {
        const carriers = this.#carriers.get(anchor);
        if (carriers) carriers.push(f.entity);
        else this.#carriers.set(anchor, [f.entity]);
      }
    }
  }

  /** The versions an entity stands on now: each version head, and for a
   *  retraction head the versions it withdrew. */
  versions(entity: string): Payload[] {
    const found: Payload[] = [];
    const visit = (record: Record<Payload>): void => {
      if (record.payload) found.push(record.payload);
      else
        for (const id of record.envelope.supersedes) {
          const named = this.#byId.get(id);
          if (named) visit(named);
        }
    };
    for (const head of this.folds.get(entity)?.heads ?? []) visit(head);
    return found;
  }

  /** The anchors an entity carries now, sorted; a withdrawn concept keeps the
   *  anchor of the version it withdrew. */
  anchors(entity: string): string[] {
    return [...new Set(this.versions(entity).map((v) => v.anchor))].sort();
  }

  carriers(anchor: string): readonly string[] {
    return this.#carriers.get(anchor) ?? [];
  }

  withdrawn(entity: string): boolean {
    return this.folds.get(entity)?.withdrawn ?? false;
  }

  name(entity: string): string {
    return this.anchors(entity)
      .map((anchor) => {
        const carriers = this.carriers(anchor);
        return carriers.length > 1
          ? `${anchor} #${carriers.indexOf(entity) + 1}`
          : anchor;
      })
      .join(' | ');
  }

  /** A concept as a refusal lists it: its name, gloss and state. */
  sign(entity: string): string {
    const glosses = [...new Set(this.versions(entity).map((v) => v.gloss))];
    return `${this.name(entity)} — ${glosses.join(' | ')}${this.withdrawn(entity) ? ' (withdrawn)' : ''}`;
  }

  /** The entity `name` denotes, if any: every name this module emits resolves
   *  back. An anchor several concepts carry denotes the one of them not
   *  withdrawn, if there is exactly one, and otherwise refuses, listing each
   *  concept under the name that addresses it. */
  denotes(name: string): string | undefined {
    const carriers = this.carriers(name);
    if (carriers.length === 1) return carriers[0];
    if (carriers.length > 1) {
      const open = carriers.filter((e) => !this.withdrawn(e));
      if (open.length === 1) return open[0];
      throw new Error(
        `design: ${JSON.stringify(name)} names ${carriers.length} concepts — ${carriers
          .map((e) => this.sign(e))
          .join('; ')}; name one of them`,
      );
    }
    const parts = name.split(' | ');
    if (parts.length > 1) {
      const [first, ...rest] = parts.map((part) => this.denotes(part));
      return first !== undefined && rest.every((e) => e === first)
        ? first
        : undefined;
    }
    const numbered = /^(.+) #([1-9][0-9]*)$/.exec(name);
    if (!numbered) return undefined;
    const among = this.carriers(numbered[1] as string);
    return among.length > 1 ? among[Number(numbered[2]) - 1] : undefined;
  }

  /** The entity `name` denotes; refuses a name no concept carries. */
  resolve(name: string): string {
    const entity = this.denotes(name);
    if (entity === undefined)
      throw new Error(`design: no concept is named ${JSON.stringify(name)}`);
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
      name: this.name(entity),
      heads: (f?.heads ?? []).map((h) =>
        h.payload ? this.concept(h.payload) : null,
      ),
      withdrawn: f?.withdrawn ?? false,
      concept: f?.payload ? this.concept(f.payload) : undefined,
    };
  }
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

  /** A recordable payload for `concept`, written as `verb` to `entity` (none for a
   *  definition), its factors resolved to entities; refuses a write that would
   *  break a design law. */
  #payload(
    read: Snapshot,
    verb: string,
    concept: Concept,
    by: By,
    entity?: string,
  ): Payload {
    const refuse = (why: string): never => {
      throw new Error(
        `design: ${verb} ${JSON.stringify(entity === undefined ? concept.anchor : read.name(entity))} refused — ${why}`,
      );
    };
    if (by.reason.trim() === '') refuse('every write gives its reason');
    if (concept.anchor.trim() === '') refuse('a concept has an anchor');
    if (concept.gloss.trim() === '') refuse('a concept has a gloss');
    // One live concept per anchor; a withdrawn concept keeps its anchor.
    const kept =
      entity !== undefined && read.anchors(entity).includes(concept.anchor);
    const holders = read
      .carriers(concept.anchor)
      .filter((e) => e !== entity && !(kept && read.withdrawn(e)));
    if (holders.length > 0)
      refuse(
        `the anchor already names ${holders.map((e) => read.sign(e)).join('; ')}`,
      );
    if (concept.factors.includes(concept.anchor))
      refuse('a concept never factors itself');
    const factors = concept.factors.map((name) => {
      const factor = read.resolve(name);
      if (read.withdrawn(factor))
        refuse(`its factor ${JSON.stringify(name)} is withdrawn`);
      if (entity !== undefined && reach(factor, read.factors).includes(entity))
        refuse(
          `its factor ${JSON.stringify(name)} stands on it, so factoring it closes a cycle`,
        );
      return factor;
    });
    return { anchor: concept.anchor, gloss: concept.gloss, factors };
  }

  /** The one current head of the concept `name` denotes; refuses a diverged
   *  concept, naming reconciliation, and a write with no reason. */
  #head(read: Snapshot, verb: string, name: string, by: By) {
    const refuse = (why: string): never => {
      throw new Error(
        `design: ${verb} ${JSON.stringify(name)} refused — ${why}`,
      );
    };
    if (by.reason.trim() === '') refuse('every write gives its reason');
    const entity = read.resolve(name);
    const heads = read.folds.get(entity)?.heads ?? [];
    const [head] = heads;
    if (heads.length !== 1 || head === undefined)
      return refuse(`it has diverged into ${heads.length} heads; reconcile it`);
    return { entity, head, refuse };
  }

  /** Define a new concept: its first version. */
  define(concept: Concept, by: By): void {
    this.#store.create(
      DOMAIN,
      this.#payload(this.#read(), 'define', concept, by),
      by,
    );
  }

  /** Amend the concept `name` denotes to `concept` (which may relabel it): a new
   *  version of the same concept over its one current head. Amending a withdrawn
   *  concept reinstates it. */
  amend(name: string, concept: Concept, by: By): void {
    const read = this.#read();
    const { entity, head } = this.#head(read, 'amend', name, by);
    this.#store.supersede(
      DOMAIN,
      entity,
      [head.envelope.id],
      this.#payload(read, 'amend', concept, by, entity),
      by,
    );
  }

  /** Withdraw the concept `name` denotes: a retraction of its one current head,
   *  which becomes its head. Refuses while another concept factors on it. */
  retract(name: string, by: By): void {
    const read = this.#read();
    const { entity, head, refuse } = this.#head(read, 'retract', name, by);
    if (head.envelope.operation === 'retract') refuse('it is withdrawn');
    const dependants = [...read.factors]
      .filter(([other, factors]) => other !== entity && factors.has(entity))
      .map(([other]) => JSON.stringify(read.name(other)));
    if (dependants.length > 0)
      refuse(
        `${dependants.join(', ')} factor${dependants.length > 1 ? '' : 's'} on it; amend or retract ${dependants.length > 1 ? 'them' : 'it'} first`,
      );
    this.#store.retract(DOMAIN, entity, by);
  }

  /** Reconcile the diverged concept `name` denotes: one version, `concept`, over
   *  every head, a retraction among them included. Refuses a settled concept. */
  reconcile(name: string, concept: Concept, by: By): void {
    const read = this.#read();
    const entity = read.resolve(name);
    const heads = read.folds.get(entity)?.heads.length ?? 0;
    if (heads < 2)
      throw new Error(
        `design: reconcile ${JSON.stringify(name)} refused — it is settled, and only divergence is reconciled; amend it`,
      );
    this.#store.reconcile(
      DOMAIN,
      entity,
      this.#payload(read, 'reconcile', concept, by, entity),
      by,
    );
  }

  /** The whole design: every live concept, every divergence, every incoherence. */
  lattice(): Lattice {
    const read = this.#read();
    const concepts: Concept[] = [];
    for (const f of read.folds.values())
      if (f.payload) concepts.push(read.concept(f.payload));
    const found: Incoherence[] = incoherence(read.folds, (p) => p.factors).map(
      (i) =>
        i.kind === 'retracted'
          ? {
              kind: i.kind,
              name: read.name(i.entity),
              factor: read.name(i.reference),
            }
          : {
              kind: i.kind,
              names: i.entities.map((e) => read.name(e)).sort(),
            },
    );
    for (const anchor of new Set(concepts.map((c) => c.anchor))) {
      const open = read.carriers(anchor).filter((e) => !read.withdrawn(e));
      if (open.length > 1)
        found.push({
          kind: 'anchor',
          anchor,
          names: open.map((e) => read.name(e)),
        });
    }
    return {
      concepts: concepts.sort((a, b) => (a.anchor < b.anchor ? -1 : 1)),
      divergence: divergence(read.folds).map((f) => read.standing(f.entity)),
      incoherence: found,
    };
  }

  /** The concept `name` denotes, live, withdrawn or diverged. */
  concept(name: string): Standing {
    const read = this.#read();
    return read.standing(read.resolve(name));
  }

  /** The entity `name` denotes, `undefined` when no concept carries it. */
  denotes(name: string): string | undefined {
    return this.#read().denotes(name);
  }

  /** closure(c) ≜ { c } ∪ ⋃ { closure(f) | f ∈ factors(c) }, by name, `c` first.
   *  A diverged concept contributes the factors of every version head. */
  closure(name: string): string[] {
    const read = this.#read();
    return reach(read.resolve(name), read.factors).map((e) => read.name(e));
  }

  /** blast(c) ≜ { d ∈ C | c ∈ closure(d) }, by name, `c` first. */
  blast(name: string): string[] {
    const read = this.#read();
    const factoredBy = new Map<string, Set<string>>();
    for (const [entity, factors] of read.factors)
      for (const factor of factors) {
        const by = factoredBy.get(factor);
        if (by) by.add(entity);
        else factoredBy.set(factor, new Set([entity]));
      }
    return reach(read.resolve(name), factoredBy).map((e) => read.name(e));
  }

  /** Every version and retraction of the concept `name` denotes, oldest first,
   *  with its reason; factors by their current names. */
  history(name: string): HistoryEntry[] {
    const read = this.#read();
    const entity = read.resolve(name);
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
