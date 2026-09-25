// ─────────────────────────────────────────────────────────────────────────────
// THE FOLD — an entity's current state, computed at the moment of the read.
//
// Pure functions over records already read. Nothing computed here is ever
// persisted: a head, a divergence or an incoherence is recomputed on every read
// from the records alone, so there is no derived state that could go stale.
//
// A head is a record of an entity, version or retraction, that no later record
// names. Heads that carry the same payload have CONVERGED and read as one: two
// branches that wrote the same whole state. An entity whose heads all read as one
// is settled: live when they are versions, withdrawn when they are retractions (a
// retraction's null payload never equals a version's). Heads whose payloads differ
// are DIVERGENCE — the state two branches leave when each wrote to the same head
// differently (two versions, or a version and a retraction) and the branches
// merged. Divergence is state, not error: it is reported, and the fold never
// resolves it by picking a head. Resolving it is a reconciliation, which the store
// writes. Converged or not, every head stays in `heads`, because the next write
// names every one of them.
// ─────────────────────────────────────────────────────────────────────────────

import type { Record, RecordId } from './record.js';

/** One entity folded from its records. */
export interface Fold<P> {
  readonly entity: string;
  /** Records, versions or retractions, that no record names, in record-id
   *  order — every one of them, converged heads included. */
  readonly heads: readonly Record<P>[];
  /** The heads carry more than one payload. */
  readonly diverged: boolean;
  /** Settled on retractions: every head withdraws the entity. */
  readonly withdrawn: boolean;
  /** The heads' one payload when the entity is settled and live; `undefined`
   *  when it is withdrawn or diverged (the fold picks no head). */
  readonly payload: P | undefined;
}

/** A payload's bytes with object keys sorted, so two heads carrying the same
 *  whole state compare equal whatever order their writers emitted keys in. */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
        )
      : v,
  );
}

/** Fold records into every entity they belong to, keyed by entity. */
export function fold<P>(
  records: Iterable<Record<P>>,
): ReadonlyMap<string, Fold<P>> {
  const byEntity = new Map<string, Record<P>[]>();
  for (const record of records) {
    const own = byEntity.get(record.envelope.entity);
    if (own) own.push(record);
    else byEntity.set(record.envelope.entity, [record]);
  }
  const folds = new Map<string, Fold<P>>();
  for (const [entity, own] of byEntity) {
    const named = new Set<RecordId>(own.flatMap((r) => r.envelope.supersedes));
    const heads = own
      .filter((r) => !named.has(r.envelope.id))
      .sort((a, b) => (a.envelope.id < b.envelope.id ? -1 : 1));
    const diverged = new Set(heads.map((h) => canonical(h.payload))).size > 1;
    const withdrawn =
      !diverged && heads.every((h) => h.envelope.operation === 'retract');
    folds.set(entity, {
      entity,
      heads,
      diverged,
      withdrawn,
      payload: diverged || withdrawn ? undefined : (heads[0]?.payload as P),
    });
  }
  return folds;
}

/** Every entity whose heads carry more than one payload. */
export function divergence<P>(folds: ReadonlyMap<string, Fold<P>>): Fold<P>[] {
  return [...folds.values()].filter((f) => f.diverged);
}

/** A contradiction between entities, reported like divergence and never
 *  resolved here: an entity's version head referencing a withdrawn entity, or a
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
 * payload and names the entities it references. Every version head is read, so
 * a diverged entity contributes the references of each of them; a retraction
 * has no payload and references nothing. A reference to an entity absent from
 * `folds` is outside this relation and ignored.
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
      if (head.envelope.operation !== 'retract')
        for (const target of references(head.payload as P))
          if (folds.has(target)) out.add(target);
    edges.set(f.entity, out);
    for (const target of out)
      if (folds.get(target)?.withdrawn)
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
