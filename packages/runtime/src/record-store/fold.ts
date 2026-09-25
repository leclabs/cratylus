// ─────────────────────────────────────────────────────────────────────────────
// THE FOLD — an entity's current state, computed at the moment of the read.
//
// Pure functions over records already read. Nothing computed here is ever
// persisted: a head, a divergence or an incoherence is recomputed on every read
// from the records alone, so there is no derived state that could go stale.
//
// A head is a version nothing supersedes or retracts. One head is settled; no
// head is a retracted entity; more than one head is DIVERGENCE — the state two
// branches leave when each superseded the same version and the branches merged.
// Divergence is state, not error: it is reported, and the fold never resolves it
// by picking a head. Resolving it is a reconciliation, which the store writes.
// ─────────────────────────────────────────────────────────────────────────────

import type { Record, RecordId } from './record.js';

/** One entity folded from its records. */
export interface Fold<P> {
  readonly entity: string;
  /** Versions no record supersedes or retracts, in record-id order. */
  readonly heads: readonly Record<P>[];
  /** The one head's payload when the entity is settled; `undefined` when it is
   *  retracted (no head) or diverged (the fold picks neither). */
  readonly payload: P | undefined;
}

/** Fold records into every entity they version, keyed by entity. */
export function fold<P>(
  records: Iterable<Record<P>>,
): ReadonlyMap<string, Fold<P>> {
  const byEntity = new Map<string, Record<P>[]>();
  for (const record of records) {
    const versions = byEntity.get(record.envelope.entity);
    if (versions) versions.push(record);
    else byEntity.set(record.envelope.entity, [record]);
  }
  const folds = new Map<string, Fold<P>>();
  for (const [entity, own] of byEntity) {
    const named = new Set<RecordId>(own.flatMap((r) => r.envelope.supersedes));
    const heads = own
      .filter(
        (r) => r.envelope.operation !== 'retract' && !named.has(r.envelope.id),
      )
      .sort((a, b) => (a.envelope.id < b.envelope.id ? -1 : 1));
    const [only] = heads;
    folds.set(entity, {
      entity,
      heads,
      payload: heads.length === 1 && only ? (only.payload as P) : undefined,
    });
  }
  return folds;
}

/** Every entity with more than one head. */
export function divergence<P>(folds: ReadonlyMap<string, Fold<P>>): Fold<P>[] {
  return [...folds.values()].filter((f) => f.heads.length > 1);
}

/** A contradiction between entities, reported like divergence and never
 *  resolved here: a live entity's head referencing a retracted entity, or a
 *  cycle in the reference relation (its members, sorted). */
export type Incoherence =
  | {
      readonly kind: 'retracted';
      readonly entity: string;
      readonly reference: string;
    }
  | { readonly kind: 'cycle'; readonly entities: readonly string[] };

/**
 * Every incoherence among `folds` over the reference relation the caller
 * supplies — the store knows no domain's payload, so `references` reads one
 * payload and names the entities it references. Every head is read, so a
 * diverged entity contributes the references of each of its heads. A reference
 * to an entity absent from `folds` is outside this relation and ignored.
 */
export function incoherence<P>(
  folds: ReadonlyMap<string, Fold<P>>,
  references: (payload: P) => Iterable<string>,
): Incoherence[] {
  const edges = new Map<string, Set<string>>();
  const found: Incoherence[] = [];
  for (const f of folds.values()) {
    const out = new Set<string>();
    for (const head of f.heads)
      for (const target of references(head.payload as P))
        if (folds.has(target)) out.add(target);
    edges.set(f.entity, out);
    for (const target of out)
      if (folds.get(target)?.heads.length === 0)
        found.push({ kind: 'retracted', entity: f.entity, reference: target });
  }

  // Tarjan's strongly connected components: every component of more than one
  // entity, or of one entity referencing itself, is a cycle.
  let next = 0;
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const stack: string[] = [];
  const onStack = new Set<string>();
  const connect = (v: string): void => {
    index.set(v, next);
    low.set(v, next);
    next++;
    stack.push(v);
    onStack.add(v);
    for (const w of edges.get(v) ?? []) {
      if (!index.has(w)) {
        connect(w);
        low.set(v, Math.min(low.get(v) as number, low.get(w) as number));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v) as number, index.get(w) as number));
      }
    }
    if (low.get(v) !== index.get(v)) return;
    const component: string[] = [];
    let w: string | undefined;
    do {
      w = stack.pop() as string;
      onStack.delete(w);
      component.push(w);
    } while (w !== v);
    if (component.length > 1 || edges.get(v)?.has(v))
      found.push({ kind: 'cycle', entities: component.sort() });
  };
  for (const v of edges.keys()) if (!index.has(v)) connect(v);
  return found;
}
