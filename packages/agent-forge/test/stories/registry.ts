/**
 * Canonical story registry for the interop-hardening story library.
 * Source of truth: plans/interop-hardening/stories/ (COVERAGE.md + E*.md).
 * 81 stories, 10 epics; 3 excluded-by-marker from this coverage-test wave.
 * (Pi graduated 2026-07: E5.S8 live, E10.S8–S10 added, E10.S10 FUTURE.)
 */

export type Exclusion = 'FUTURE' | 'RESEARCH-GATED';

export const EPICS: Record<string, string> = {
  E1: 'harness-import',
  E2: 'ir-emission',
  E3: 'reimport',
  E4: 'roundtrip',
  E5: 'plugin-adapters',
  E6: 'exemplify-optimization',
  E7: 'standards-reach',
  E8: 'divergence-fixes',
  E9: 'ir-expressiveness',
  E10: 'adapter-roster',
};

const COUNTS: Record<string, number> = {
  E1: 8,
  E2: 7,
  E3: 6,
  E4: 8,
  E5: 8,
  E6: 8,
  E7: 10,
  E8: 10,
  E9: 6,
  E10: 10,
};

export const STORY_IDS: readonly string[] = Object.entries(COUNTS).flatMap(
  ([epic, n]) => Array.from({ length: n }, (_, i) => `${epic}.S${i + 1}`),
);

/** Excluded-by-marker (COVERAGE.md, on the record): no test may reference these. */
export const EXCLUDED: Record<string, Exclusion> = {
  'E5.S6': 'FUTURE',
  'E9.S5': 'FUTURE',
  'E10.S10': 'FUTURE',
};

export const TESTABLE_IDS: readonly string[] = STORY_IDS.filter(
  (id) => !(id in EXCLUDED),
);

export function epicOf(id: string): string {
  return id.split('.')[0] ?? '';
}
