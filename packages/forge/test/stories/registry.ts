/**
 * Canonical story registry for the story library.
 * Source of truth: test/stories/ (COVERAGE.md + E*.md).
 *
 * The IR-intake excision (2026-07): the IR-intake lineage was excised, and
 * with it nine of the ten epics — E1–E5, E7–E10 were all harness-interop
 * stories over `import`/`compile`/the 16-adapter roster, whose entire subject
 * is gone. E6 (exemplify-optimization) is the one epic whose subject survives:
 * `src/core/exemplify/` and the `optimize` verb. Within E6, two stories were
 * retired with the lineage they rode (see EXCLUDED).
 */

export type Exclusion = 'FUTURE' | 'RESEARCH-GATED' | 'RETIRED';

export const EPICS: Record<string, string> = {
  E6: 'exemplify-optimization',
};

const COUNTS: Record<string, number> = {
  E6: 8,
};

export const STORY_IDS: readonly string[] = Object.entries(COUNTS).flatMap(
  ([epic, n]) => Array.from({ length: n }, (_, i) => `${epic}.S${i + 1}`),
);

/** Excluded-by-marker (COVERAGE.md, on the record): no test may reference these. */
export const EXCLUDED: Record<string, Exclusion> = {
  // Both rode the IR compile path: S6 asserted optimized artifacts projecting
  // to every adapter target through `compile`, S8 asserted `optimizeRules`
  // rewriting IR `Rule` bodies. Both subjects were excised in S6 of
  // depalimpsest-ir-intake; the ids stay so the numbering keeps its meaning.
  'E6.S6': 'RETIRED',
  'E6.S8': 'RETIRED',
};

export const TESTABLE_IDS: readonly string[] = STORY_IDS.filter(
  (id) => !(id in EXCLUDED),
);

export function epicOf(id: string): string {
  return id.split('.')[0] ?? '';
}
