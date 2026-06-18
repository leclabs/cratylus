import type { EpisodicRecord } from './record.js';
import type { Scope } from './resolve.js';

/**
 * The cognitive **organ** a memory routes to (ideas/dream.md, §2 Routing;
 * ideas/memory.md, Routing axis 1). The agent's *voice* is the diagnostic that
 * picks the organ:
 *
 *  - `SELF`     — identity ("who I am / how I changed"); 1st-person self.
 *  - `MEMORY`   — durable knowledge ("what I know"); 1st-person assertion.
 *  - `EPISODIC` — a forward-looking next-step; stays in the raw log.
 *  - `AGENTS`   — a directive ("how it's done here, for any agent"); 2nd-person.
 *  - `vault`    — networked reference (3rd-person expository).
 *
 * `drop` is NOT an organ — it is the absence of any target (scaffolding that
 * graduates nowhere), modeled by an empty target set on the decision.
 */
export type Organ = 'SELF' | 'MEMORY' | 'EPISODIC' | 'AGENTS' | 'vault';

/**
 * A single home a record's distilled content lands in: an organ plus the
 * `(scope, path)` that selects which *instance* of that organ (Routing axis 2).
 * Resolved to an absolute file via {@link resolveFile} at apply time.
 *
 * `path` is optional only for the EPISODIC organ (the record stays in its own
 * store, whose path is already known). Every non-EPISODIC organ must name its
 * destination file relative to the scope base — there is no implicit default
 * filename for SELF/MEMORY/AGENTS/vault, so omitting it is rejected loudly.
 */
export interface RouteTarget {
  organ: Organ;
  /** Scope of the destination instance. Defaults to the record's own scope. */
  scope?: Scope;
  /** Scope-relative destination file. Required for every organ except EPISODIC. */
  path?: string;
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
 *  - One target  — routed to a single organ.
 *  - ≥2 targets  — the record **splits** to several homes (ideas/dream.md:
 *    "one i may split to several homes"); the engine lands it in every one.
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
 * The voice/scope classifier — the **out-of-scope** half of dream. The runtime
 * Dreamer plugs in LLM reasoning here; tests inject a deterministic stub. The
 * engine treats this as a pure function `(record) => RouteDecision` and owns
 * none of the reasoning: it only mechanically applies the verdict.
 */
export type Classifier = (record: EpisodicRecord) => RouteDecision;

/** A record that lands nowhere — scaffolding (ideas/dream.md: `scaffold ↦ drop`). */
export const DROP: RouteDecision = { targets: [] };

/** Convenience: does this decision keep the record in EPISODIC (vs consume it)? */
export function isRetained(decision: RouteDecision): boolean {
  return decision.targets.some((t) => t.organ === 'EPISODIC');
}
