// ─────────────────────────────────────────────────────────────────────────────
// THE DESIGN — the concept lattice C, computed from the design records at the
// moment of the read.
//
// A concept is an entity of the record store's `design` domain. Its payload is its
// anchor, gloss and factors, and it names its factors by ENTITY, so relabelling an
// anchor never breaks a reference. Anchors are resolved to entities and back here,
// at the boundary: every input and every output names a concept by its anchor, and
// no caller ever names a record — each write names the concept's current heads
// itself.
//
// An anchor is HELD by the live concept carrying it, by a withdrawn concept that
// keeps it, and by a diverged concept for every anchor its heads carry. Where a
// merge leaves an anchor held by more than one concept, each holder's IDENTITY is
// shown and accepted beside the anchor (`Identified`), and only there: that is the
// one place an identity surfaces. It travels as its own field, never inside a
// string, so no anchor a write records can ever be read as an identity.
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
// The design's relational laws: one holder per anchor; factors acyclic and naming
// no withdrawn concept (so a concept others factor on is not retracted). Breaking
// one across concepts is INCOHERENCE, which only a merge produces, because a write
// is refused when it introduces a violation — one whose concepts were not already
// bound together in a standing violation of the same law. A write that shrinks a
// violation or leaves it standing is allowed, so every incoherence can be repaired
// one write at a time. Every anchor, gloss and reason is non-empty and factors form
// a set; those hold within one write and are refused outright.
//
// `closure` and `blast` are the `design` skill's signs and mean what they mean
// there. Who may write the design is skill routing's rule, not this module's.
// ─────────────────────────────────────────────────────────────────────────────

import { type Fold, fold, incoherence } from '../../record-store/fold.js';
import type {
  Envelope,
  Operation,
  Record,
  RecordId,
} from '../../record-store/record.js';
import type { RecordStore } from '../../record-store/store.js';

/** The record store domain holding the design records. */
export const DOMAIN = 'design';

/** A concept named by its identity beside its anchor, accepted only where the
 *  anchor is held by more than one concept. */
export interface Identified {
  readonly anchor: string;
  readonly identity: string;
}

/** How the boundary names a concept: its anchor, or its anchor with its identity
 *  where that anchor is held by more than one concept. */
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
 *  that anchor is held by more than one concept. */
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
  /** The anchors it holds, sorted. */
  readonly anchors: readonly string[];
  /** Its identity, where an anchor it holds is held by another concept too. */
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
 *  concept, a factor cycle, or one anchor held by several concepts (their
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

/** A violation of a relational law among entities, as the write rule compares
 *  them. */
type Violation =
  | {
      readonly kind: 'retracted';
      readonly entity: string;
      readonly reference: string;
    }
  | { readonly kind: 'cycle'; readonly entities: readonly string[] }
  | {
      readonly kind: 'anchor';
      readonly anchor: string;
      readonly entities: readonly string[];
    };

/** The entities a violation binds together. */
function members(v: Violation): readonly string[] {
  return v.kind === 'retracted' ? [v.entity, v.reference] : v.entities;
}

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
  /** The factor relation: each concept's factors over every version head. */
  readonly factors = new Map<string, Set<string>>();
  readonly #byId: ReadonlyMap<string, Record<Payload>>;
  /** Every entity holding each anchor, in the order they were defined. */
  readonly holders = new Map<string, string[]>();

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
        const holders = this.holders.get(anchor);
        if (holders) holders.push(f.entity);
        else this.holders.set(anchor, [f.entity]);
      }
    }
  }

  diverged(entity: string): boolean {
    return this.folds.get(entity)?.diverged ?? false;
  }

  withdrawn(entity: string): boolean {
    return this.folds.get(entity)?.withdrawn ?? false;
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

  /** The anchors an entity holds, sorted: its heads' anchors, and a withdrawn
   *  concept's kept anchor. */
  anchors(entity: string): string[] {
    return [...new Set(this.versions(entity).map((v) => v.anchor))].sort();
  }

  #shared(anchor: string): boolean {
    return (this.holders.get(anchor)?.length ?? 0) > 1;
  }

  /** Whether an anchor `entity` holds is held by another concept too. */
  identified(entity: string): boolean {
    return this.anchors(entity).some((a) => this.#shared(a));
  }

  /** The name of `entity`: the first anchor it alone holds, or its first anchor
   *  with its identity. */
  name(entity: string): Name {
    const anchors = this.anchors(entity);
    const alone = anchors.find((a) => !this.#shared(a));
    return alone ?? { anchor: anchors[0] ?? '', identity: entity };
  }

  /** A concept as a refusal lists it: its name, gloss and state. */
  sign(entity: string): string {
    const glosses = [...new Set(this.versions(entity).map((v) => v.gloss))];
    const state = this.diverged(entity)
      ? ' (diverged)'
      : this.withdrawn(entity)
        ? ' (withdrawn)'
        : '';
    return `${quote(this.name(entity))} — ${glosses.join(' or ')}${state}`;
  }

  /** The entity `name` denotes, if any. An anchor held by several concepts
   *  refuses, listing each holder with its identity; an identity is accepted
   *  only beside such an anchor, and only for one of its holders. */
  denotes(name: Name): string | undefined {
    const anchor = typeof name === 'string' ? name : name.anchor;
    const holders = this.holders.get(anchor) ?? [];
    if (typeof name !== 'string') {
      if (holders.length === 1 && holders[0] === name.identity)
        throw new Error(
          `design: ${quote(name)} refused — the anchor ${JSON.stringify(anchor)} alone names it; drop the identity`,
        );
      return holders.length > 1 && holders.includes(name.identity)
        ? name.identity
        : undefined;
    }
    if (holders.length > 1)
      throw new Error(
        `design: ${quote(name)} is held by ${holders.length} concepts — ${holders
          .map((e) => this.sign(e))
          .join('; ')}; name one of them by its identity`,
      );
    return holders[0];
  }

  /** The entity `name` denotes; refuses a name no concept holds. */
  resolve(name: Name): string {
    const entity = this.denotes(name);
    if (entity === undefined)
      throw new Error(`design: no concept is named ${quote(name)}`);
    return entity;
  }

  /** Every standing violation of the design's relational laws. */
  violations(): Violation[] {
    const found: Violation[] = incoherence(this.folds, (p) => p.factors);
    for (const [anchor, entities] of this.holders)
      if (entities.length > 1) found.push({ kind: 'anchor', anchor, entities });
    return found;
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
      diverged: this.diverged(entity),
      withdrawn: f?.withdrawn ?? false,
      concept: f?.payload ? this.concept(f.payload) : undefined,
    };
  }
}

/** The entity a definition is checked under before the store mints its own. */
const DEFINED = 'defined';

/** The design over one repository's records. Every read folds the records anew. */
export class Design {
  readonly #store: RecordStore;

  constructor(store: RecordStore) {
    this.#store = store;
  }

  #read(): Snapshot {
    return new Snapshot(this.#store.read<Payload>(DOMAIN));
  }

  /** Refuses a write of `payload` (null: a retraction) to `entity` over `heads`
   *  that introduces a violation: one whose concepts no standing violation of
   *  the same law already binds together. The refusal names concepts as they
   *  stand now, never as the refused write would leave them. */
  #keep(
    read: Snapshot,
    refuse: (why: string) => never,
    entity: string,
    heads: readonly RecordId[],
    payload: Payload | null,
    by: By,
  ): void {
    const after = new Snapshot([
      ...read.records,
      {
        envelope: {
          // Sorts after every minted record id.
          id: '~',
          entity,
          operation:
            payload === null ? 'retract' : heads.length ? 'amend' : 'create',
          supersedes: heads,
          ...by,
          time: '',
        },
        payload,
      },
    ]);
    const standing = read.violations();
    const introduced = after
      .violations()
      .filter(
        (v) =>
          !standing.some(
            (u) =>
              u.kind === v.kind &&
              members(v).every((e) => members(u).includes(e)),
          ),
      );
    if (introduced.length === 0) return;
    refuse(
      introduced
        .map((v) => {
          if (v.kind === 'anchor')
            return `the anchor ${JSON.stringify(v.anchor)} is held by ${v.entities
              .filter((e) => e !== entity)
              .map((e) => read.sign(e))
              .join('; ')}`;
          if (v.kind === 'retracted')
            return v.entity === entity
              ? `its factor ${quote(read.name(v.reference))} is withdrawn`
              : `${quote(read.name(v.entity))} factors on it; amend or retract it first`;
          return v.entities.length === 1
            ? 'a concept never factors itself'
            : `it would close a factor cycle through ${v.entities
                .map((e) => quote(read.name(e)))
                .join(', ')}`;
        })
        .join('; '),
    );
  }

  /** A recordable payload for `concept`, written as `verb` to `entity` (none for a
   *  definition) over `heads`; refuses what one write alone can break, a factor
   *  newly naming a diverged concept (which is not live), and any violation the
   *  write would introduce. A factor the concept already has is kept even when
   *  its concept has since diverged: divergence reports that state. */
  #payload(
    read: Snapshot,
    verb: string,
    concept: Concept,
    by: By,
    entity: string | undefined,
    heads: readonly RecordId[],
  ): Payload {
    const refuse = (why: string): never => {
      throw new Error(
        `design: ${verb} ${quote(entity === undefined ? concept.anchor : read.name(entity))} refused — ${why}`,
      );
    };
    if (by.reason.trim() === '') refuse('every write gives its reason');
    if (concept.anchor.trim() === '') refuse('a concept has an anchor');
    if (concept.gloss.trim() === '') refuse('a concept has a gloss');
    const factors = new Set<string>();
    const current = entity === undefined ? undefined : read.factors.get(entity);
    for (const name of concept.factors) {
      if (entity === undefined && name === concept.anchor)
        refuse('a concept never factors itself');
      const factor = read.resolve(name);
      if (factors.has(factor))
        refuse(`it names its factor ${quote(name)} twice; factors form a set`);
      if (read.diverged(factor) && !current?.has(factor))
        refuse(
          `its factor ${quote(read.name(factor))} has diverged, so is not live; reconcile ${quote(read.name(factor))} first`,
        );
      factors.add(factor);
    }
    const payload = {
      anchor: concept.anchor,
      gloss: concept.gloss,
      factors: [...factors],
    };
    this.#keep(read, refuse, entity ?? DEFINED, heads, payload, by);
    return payload;
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
    if (read.diverged(entity)) refuse('it has diverged; reconcile it');
    const heads = (read.folds.get(entity)?.heads ?? []).map(
      (h) => h.envelope.id,
    );
    return { entity, heads, refuse };
  }

  /** Define a new concept: its first version. */
  define(concept: Concept, by: By): void {
    const read = this.#read();
    this.#store.create(
      DOMAIN,
      this.#payload(read, 'define', concept, by, undefined, []),
      by,
    );
  }

  /** Amend the concept `name` denotes to `concept` (which may relabel it): a new
   *  version of the same concept over its current heads. Amending a withdrawn
   *  concept reinstates it. */
  amend(name: Name, concept: Concept, by: By): void {
    const read = this.#read();
    const { entity, heads } = this.#settled(read, 'amend', name, by);
    this.#store.supersede(
      DOMAIN,
      entity,
      heads,
      this.#payload(read, 'amend', concept, by, entity, heads),
      by,
    );
  }

  /** Withdraw the concept `name` denotes: a retraction of its current heads,
   *  which becomes its head. Refuses while another concept factors on it. */
  retract(name: Name, by: By): void {
    const read = this.#read();
    const { entity, heads, refuse } = this.#settled(read, 'retract', name, by);
    if (read.withdrawn(entity)) refuse('it is withdrawn');
    this.#keep(read, refuse, entity, heads, null, by);
    this.#store.retract(DOMAIN, entity, by);
  }

  /** Reconcile the diverged concept `name` denotes: one version, `concept`, over
   *  every head, a retraction among them included. Refuses a settled concept. */
  reconcile(name: Name, concept: Concept, by: By): void {
    const read = this.#read();
    const entity = read.resolve(name);
    if (!read.diverged(entity))
      throw new Error(
        `design: reconcile ${quote(name)} refused — it has not diverged, and only divergence is reconciled; amend it`,
      );
    const heads = (read.folds.get(entity)?.heads ?? []).map(
      (h) => h.envelope.id,
    );
    this.#store.reconcile(
      DOMAIN,
      entity,
      this.#payload(read, 'reconcile', concept, by, entity, heads),
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
    return {
      concepts: concepts.sort((a, b) => (a.anchor < b.anchor ? -1 : 1)),
      divergence: [...read.folds.values()]
        .filter((f) => f.diverged)
        .map((f) => read.standing(f.entity)),
      incoherence: read.violations().map((v) =>
        v.kind === 'retracted'
          ? {
              kind: v.kind,
              concept: read.name(v.entity),
              factor: read.name(v.reference),
            }
          : v.kind === 'cycle'
            ? { kind: v.kind, concepts: v.entities.map((e) => read.name(e)) }
            : { kind: v.kind, anchor: v.anchor, identities: v.entities },
      ),
    };
  }

  /** The concept `name` denotes, live, withdrawn or diverged. */
  concept(name: Name): Standing {
    const read = this.#read();
    return read.standing(read.resolve(name));
  }

  /** The entity `name` denotes, `undefined` when no concept holds it. */
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
