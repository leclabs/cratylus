// ─────────────────────────────────────────────────────────────────────────────
// THE DESIGN — the concept lattice C, computed from the design records at the
// moment of the read.
//
// A concept is an entity of the record store's `design` domain. Its payload is its
// anchor, gloss and factors, and it names its factors by ENTITY, so relabelling an
// anchor never breaks a reference. Anchors are resolved to entities and back here,
// at the boundary: every input and every output names a concept by its anchor, and
// no caller ever names a record — each write names the concept's current heads
// itself. A diverged concept is named by any of its heads' anchors.
//
// Where an anchor cannot address one concept, because a merge left it on several,
// the concept's IDENTITY is shown and accepted beside the anchor (`Identified`).
// That is the one place an identity surfaces. It travels as its own field, never
// inside a string, so no anchor a write records can ever be read as an identity.
//
// A concept is live when its heads carry one version, withdrawn when they carry
// only a retraction, and diverged when they carry more than one payload (the
// fold's `diverged`); heads carrying the same payload have converged and read as
// one. Divergence is reported and never resolved by picking a head: amending or
// retracting a diverged concept refuses and names reconciliation, which writes one
// version over every head. Every write names every current head, converged ones
// included. Amending a withdrawn concept reinstates it. A new version is always
// the same concept; a concept that becomes another is a retraction plus a
// definition.
//
// Every write keeps the design's laws on the current branch: one live concept per
// anchor, and a withdrawn concept keeps its anchor until reinstated; factors form a
// set, are acyclic and name no withdrawn concept, so a concept others factor on is
// not retracted; every anchor, gloss and reason is non-empty. A write that would
// break one refuses, so incoherence — a factor on a withdrawn concept, a factor
// cycle, one anchor on two live concepts — arises only from merges, and is reported
// here and resolved by an ordinary write to one of the concepts involved.
//
// `closure` and `blast` are the `design` skill's signs and mean what they mean
// there. Who may write the design is skill routing's rule, not this module's.
// ─────────────────────────────────────────────────────────────────────────────

import { type Fold, fold, incoherence } from '../../record-store/fold.js';
import type { Envelope, Operation, Record } from '../../record-store/record.js';
import type { RecordStore } from '../../record-store/store.js';

/** The record store domain holding the design records. */
export const DOMAIN = 'design';

/** A concept named by its identity beside its anchor, for where the anchor alone
 *  cannot address it. */
export interface Identified {
  readonly anchor: string;
  readonly identity: string;
}

/** How the boundary names a concept: its anchor, or its anchor with its identity
 *  where a merge left that anchor on several concepts. */
export type Name = string | Identified;

/** A concept as the boundary names it: its factors by name. */
export interface Concept {
  readonly anchor: string;
  /** What the concept is, in one line. */
  readonly gloss: string;
  /** The concepts it decomposes into, a set; empty for a primitive. */
  readonly factors: readonly Name[];
}

/** A live concept as the lattice lists it, its identity beside its anchor where
 *  the anchor alone cannot address it. */
export interface Listed extends Concept {
  readonly identity?: string;
}

/** A concept's payload as recorded: its factors by entity. */
interface Payload {
  readonly anchor: string;
  readonly gloss: string;
  readonly factors: readonly string[];
}

/** One concept as folded now. */
export interface Standing {
  /** The anchors it is named by, sorted: its one head's, each of a diverged
   *  concept's heads', and a withdrawn concept's kept anchor. */
  readonly anchors: readonly string[];
  /** Its identity, where an anchor of it cannot address it alone. */
  readonly identity?: string;
  /** Each distinct head, in the fold's order: its concept, or `null` for a
   *  retraction; converged heads read as one. */
  readonly heads: readonly (Concept | null)[];
  readonly diverged: boolean;
  /** Settled on a retraction. */
  readonly withdrawn: boolean;
  /** The one head's concept when settled and live; `undefined` otherwise. */
  readonly concept: Concept | undefined;
}

/** A design law broken across concepts by a merge: a factor on a withdrawn
 *  concept, a factor cycle, or one anchor on several live concepts (their
 *  identities, in definition order). */
export type Incoherence =
  | {
      readonly kind: 'retracted';
      readonly concept: Name;
      readonly factor: Name;
    }
  | { readonly kind: 'cycle'; readonly concepts: readonly Name[] }
  | {
      readonly kind: 'anchor';
      readonly anchor: string;
      readonly identities: readonly string[];
    };

/** The whole design as folded now. */
export interface Lattice {
  /** Every live concept, by anchor. */
  readonly concepts: readonly Listed[];
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

/** A name as a message quotes it. */
function quote(name: Name): string {
  return typeof name === 'string'
    ? JSON.stringify(name)
    : `${JSON.stringify(name.anchor)} (identity ${name.identity})`;
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

/** The design records read once, with the lookups every operation shares. */
class Snapshot {
  readonly records: readonly Record<Payload>[];
  readonly folds: ReadonlyMap<string, Fold<Payload>>;
  /** The diverged entities, as the store's fold reports them. */
  readonly diverged: ReadonlySet<string>;
  /** The factor relation: each concept's factors over every version head. */
  readonly factors = new Map<string, Set<string>>();
  readonly #byId: ReadonlyMap<string, Record<Payload>>;
  /** Every entity carrying each anchor, in the order they were defined. */
  readonly #carriers = new Map<string, string[]>();

  constructor(records: readonly Record<Payload>[]) {
    this.records = records;
    // Records arrive in record-id order, so the folds are in definition order.
    this.folds = fold(records);
    this.diverged = new Set(
      [...this.folds.values()].filter((f) => f.diverged).map((f) => f.entity),
    );
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

  /** The entity an anchor addresses alone: its one carrier, or the one of its
   *  carriers not withdrawn; `undefined` when none or several do. */
  #addressed(anchor: string): string | undefined {
    const carriers = this.carriers(anchor);
    if (carriers.length === 1) return carriers[0];
    const open = carriers.filter((e) => !this.withdrawn(e));
    return open.length === 1 ? open[0] : undefined;
  }

  /** Whether `entity` needs its identity beside its anchor. */
  identified(entity: string): boolean {
    return !this.anchors(entity).some((a) => this.#addressed(a) === entity);
  }

  /** The name of `entity`: the first of its anchors that addresses it alone, or
   *  its first anchor with its identity. */
  name(entity: string): Name {
    const anchors = this.anchors(entity);
    const alone = anchors.find((a) => this.#addressed(a) === entity);
    return alone ?? { anchor: anchors[0] ?? '', identity: entity };
  }

  /** A concept as a refusal lists it: its name, gloss and state. */
  sign(entity: string): string {
    const glosses = [...new Set(this.versions(entity).map((v) => v.gloss))];
    return `${quote(this.name(entity))} — ${glosses.join(' or ')}${this.withdrawn(entity) ? ' (withdrawn)' : ''}`;
  }

  /** The entity `name` denotes, if any. An anchor several live concepts carry
   *  refuses, listing each with its identity; an identity must be a concept
   *  carrying the anchor beside it. */
  denotes(name: Name): string | undefined {
    if (typeof name !== 'string')
      return this.folds.has(name.identity) &&
        this.anchors(name.identity).includes(name.anchor)
        ? name.identity
        : undefined;
    const carriers = this.carriers(name);
    if (carriers.length === 0) return undefined;
    const entity = this.#addressed(name);
    if (entity === undefined)
      throw new Error(
        `design: ${quote(name)} names ${carriers.length} concepts — ${carriers
          .map((e) => this.sign(e))
          .join('; ')}; name one of them by its identity`,
      );
    return entity;
  }

  /** The entity `name` denotes; refuses a name no concept carries. */
  resolve(name: Name): string {
    const entity = this.denotes(name);
    if (entity === undefined)
      throw new Error(`design: no concept is named ${quote(name)}`);
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
      anchors: this.anchors(entity),
      ...(this.identified(entity) ? { identity: entity } : {}),
      heads: [
        ...new Map(
          (f?.heads ?? []).map((h) => {
            const concept = h.payload ? this.concept(h.payload) : null;
            return [JSON.stringify(concept), concept] as const;
          }),
        ).values(),
      ],
      diverged: this.diverged.has(entity),
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
        `design: ${verb} ${quote(entity === undefined ? concept.anchor : read.name(entity))} refused — ${why}`,
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
    const factors = new Set<string>();
    for (const name of concept.factors) {
      if (entity === undefined && name === concept.anchor)
        refuse('a concept never factors itself');
      const factor = read.resolve(name);
      if (factor === entity) refuse('a concept never factors itself');
      if (factors.has(factor))
        refuse(`it names its factor ${quote(name)} twice; factors form a set`);
      if (read.withdrawn(factor))
        refuse(`its factor ${quote(name)} is withdrawn`);
      if (entity !== undefined && reach(factor, read.factors).includes(entity))
        refuse(
          `its factor ${quote(name)} stands on it, so factoring it closes a cycle`,
        );
      factors.add(factor);
    }
    return {
      anchor: concept.anchor,
      gloss: concept.gloss,
      factors: [...factors],
    };
  }

  /** The concept `name` denotes and its current heads, for an ordinary write;
   *  refuses a diverged concept, naming reconciliation, and a write with no
   *  reason. */
  #settled(read: Snapshot, verb: string, name: Name, by: By) {
    const refuse = (why: string): never => {
      throw new Error(`design: ${verb} ${quote(name)} refused — ${why}`);
    };
    if (by.reason.trim() === '') refuse('every write gives its reason');
    const entity = read.resolve(name);
    if (read.diverged.has(entity)) refuse('it has diverged; reconcile it');
    const heads = (read.folds.get(entity)?.heads ?? []).map(
      (h) => h.envelope.id,
    );
    return { entity, heads, refuse };
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
   *  version of the same concept over its current head. Amending a withdrawn
   *  concept reinstates it. */
  amend(name: Name, concept: Concept, by: By): void {
    const read = this.#read();
    const { entity, heads } = this.#settled(read, 'amend', name, by);
    this.#store.supersede(
      DOMAIN,
      entity,
      heads,
      this.#payload(read, 'amend', concept, by, entity),
      by,
    );
  }

  /** Withdraw the concept `name` denotes: a retraction of its current head, which
   *  becomes its head. Refuses while another concept factors on it. */
  retract(name: Name, by: By): void {
    const read = this.#read();
    const { entity, refuse } = this.#settled(read, 'retract', name, by);
    if (read.withdrawn(entity)) refuse('it is withdrawn');
    const dependants = [...read.factors]
      .filter(([other, factors]) => other !== entity && factors.has(entity))
      .map(([other]) => quote(read.name(other)));
    if (dependants.length > 0)
      refuse(
        `${dependants.join(', ')} factor${dependants.length > 1 ? '' : 's'} on it; amend or retract ${dependants.length > 1 ? 'them' : 'it'} first`,
      );
    this.#store.retract(DOMAIN, entity, by);
  }

  /** Reconcile the diverged concept `name` denotes: one version, `concept`, over
   *  every head, a retraction among them included. Refuses a settled concept. */
  reconcile(name: Name, concept: Concept, by: By): void {
    const read = this.#read();
    const entity = read.resolve(name);
    if (!read.diverged.has(entity))
      throw new Error(
        `design: reconcile ${quote(name)} refused — it has not diverged, and only divergence is reconciled; amend it`,
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
    const concepts: Listed[] = [];
    for (const f of read.folds.values())
      if (f.payload)
        concepts.push({
          ...read.concept(f.payload),
          ...(read.identified(f.entity) ? { identity: f.entity } : {}),
        });
    const found: Incoherence[] = incoherence(read.folds, (p) => p.factors).map(
      (i) =>
        i.kind === 'retracted'
          ? {
              kind: i.kind,
              concept: read.name(i.entity),
              factor: read.name(i.reference),
            }
          : { kind: i.kind, concepts: i.entities.map((e) => read.name(e)) },
    );
    for (const anchor of new Set(concepts.map((c) => c.anchor))) {
      const open = read.carriers(anchor).filter((e) => !read.withdrawn(e));
      if (open.length > 1)
        found.push({ kind: 'anchor', anchor, identities: open });
    }
    return {
      concepts: concepts.sort((a, b) => (a.anchor < b.anchor ? -1 : 1)),
      divergence: [...read.diverged].map((e) => read.standing(e)),
      incoherence: found,
    };
  }

  /** The concept `name` denotes, live, withdrawn or diverged. */
  concept(name: Name): Standing {
    const read = this.#read();
    return read.standing(read.resolve(name));
  }

  /** The entity `name` denotes, `undefined` when no concept carries it. */
  denotes(name: Name): string | undefined {
    return this.#read().denotes(name);
  }

  /** closure(c) ≜ { c } ∪ ⋃ { closure(f) | f ∈ factors(c) }, by name, `c` first.
   *  A diverged concept contributes the factors of every version head. */
  closure(name: Name): Name[] {
    const read = this.#read();
    return reach(read.resolve(name), read.factors).map((e) => read.name(e));
  }

  /** blast(c) ≜ { d ∈ C | c ∈ closure(d) }, by name, `c` first. */
  blast(name: Name): Name[] {
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
  history(name: Name): HistoryEntry[] {
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
