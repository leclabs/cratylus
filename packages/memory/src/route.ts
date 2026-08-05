import type { EpisodicRecord } from './record.js';

/**
 * The route target set — the 4-part CoALA taxonomy's persisted stores (Working
 * has no store):
 *
 * ```
 * route : I → { SEMANTIC · PROCEDURAL · EPISODIC · drop }
 * ```
 *
 *  - `SEMANTIC`   — identity facts + durable agent-intrinsic knowledge;
 *                   `<home>/SEMANTIC.md` (the shared home partition).
 *  - `PROCEDURAL` — inductively generalized cross-project wisdom not already
 *                   carried by a projection; `<home>/PROCEDURAL.md`.
 *  - `EPISODIC`   — a forward-looking next-step; stays in the raw log.
 *
 * `drop` is NOT a store — it is the absence of any target, modeled by an empty
 * target set on the decision. The v1 dimension names (`SELF`, `MEMORY`) are
 * RETIRED: the engine rejects them loudly at apply time. `vault` (cross-host,
 * networked) and `AGENTS@node` (project-scoped) are EXTRACTED — neither is
 * private-cognitive: cross-host is an out-of-scope anti-pattern, and
 * project-scoped externalization is a plain agent file-edit, never a route
 * target. Targets address by store name only.
 */
export type StoreName = 'SEMANTIC' | 'PROCEDURAL' | 'EPISODIC';

/** The store names, as a runtime-checkable set (the classifier is untyped at runtime). */
export const V2_STORES: ReadonlySet<string> = new Set([
  'SEMANTIC',
  'PROCEDURAL',
  'EPISODIC',
]);

/**
 * A single home a record's distilled content lands in. All stores live in the
 * agent home — there is no path addressing:
 *
 *  - `SEMANTIC` / `PROCEDURAL` — the distilled content appends to the home file.
 *  - `EPISODIC` — no content; the record stays in the raw log.
 */
export interface RouteTarget {
  store: StoreName;
  /**
   * The distilled content to append to this home. The classifier produces the
   * consolidated, densest-faithful form — the engine never re-derives it.
   * Omitted for an EPISODIC target (the raw record simply stays put).
   */
  content?: string;
}

/**
 * The classifier's verdict for one record: the set of homes it splits to.
 *
 *  - One target  — routed to a single store.
 *  - ≥2 targets  — the record **splits** to several homes; the engine lands it
 *    in every one.
 *  - Empty set   — `drop`: consumed and removed, landing nowhere.
 *
 * A decision that includes an `EPISODIC` target means the record is retained in
 * the log (not consumed); any record whose targets are all non-EPISODIC is
 * consumed (removed by compaction) after its content lands.
 */
export interface RouteDecision {
  targets: RouteTarget[];
}

/**
 * The routing classifier — the **out-of-scope** half of dream (pass 2). The
 * runtime Dreamer plugs in LLM reasoning here, working over the pass-1 fold
 * manifest; tests inject a deterministic stub. The engine treats this as a pure
 * function `(record) => RouteDecision` and owns none of the reasoning: it only
 * mechanically applies the verdict.
 */
export type Classifier = (record: EpisodicRecord) => RouteDecision;

/** A record that lands nowhere — scaffolding. */
export const DROP: RouteDecision = { targets: [] };

/** Convenience: does this decision keep the record in EPISODIC (vs consume it)? */
export function isRetained(decision: RouteDecision): boolean {
  return decision.targets.some((t) => t.store === 'EPISODIC');
}
