// THE META-GATE — every gate ships a fixture that CONVICTS it.
//
// A corpus-scanning gate is green in two indistinguishable situations: the corpus
// is clean, or the gate is DARK. "No violation was ever reported" is evidence of
// the first only if the gate is known to be capable of reporting one. Every gate
// here therefore owes at least one test that feeds it a synthetic BAD input and
// asserts it rejects — the known-answer control that separates the two cases.
//
// DECLARED, NOT DETECTED. The classification below is an explicit registry rather
// than a heuristic over file contents, because a heuristic meta-gate is the very
// failure it exists to catch: it would pass when its own detector silently stopped
// matching. Every test file must appear here, so a new one cannot slip in
// unclassified, and a GATE without a fixture is visible DEBT rather than silence.

import { readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const testDir = dirname(fileURLToPath(import.meta.url));

/**
 * GATE — enumerates the LIVE corpus and asserts an invariant over it. Vacuously
 * green when the corpus is clean, so it owes a convicting fixture.
 * BEHAVIORAL — drives one unit with inputs it supplies itself. Its negative cases
 * ARE its fixtures; a separate convicting test would be ceremony.
 */
type Kind = 'GATE' | 'BEHAVIORAL';

const REGISTRY: Readonly<Record<string, Kind>> = {
  'cratylism.test.ts': 'GATE',
  'event-tap-cell.test.ts': 'GATE',
  'formal-block-self-sufficiency.test.ts': 'GATE',
  'gate-convicts.test.ts': 'GATE',
  'hook-rule-boundary.test.ts': 'GATE',
  'memory-nudge.test.ts': 'BEHAVIORAL',
  'null-dimension.test.ts': 'GATE',
  'plan-set.test.ts': 'GATE',
  'projection-stability.test.ts': 'GATE',
  'reader-density.test.ts': 'GATE',
  'reader-reach.test.ts': 'GATE',
  'runtime-shim.test.ts': 'BEHAVIORAL',
  'skill-shape.test.ts': 'GATE',
  'structural-parsimony.test.ts': 'GATE',
  'symbol-probe-gate.test.ts': 'GATE',
  'symbols.test.ts': 'GATE',
};

/** The vocabulary a convicting fixture announces itself in, as the corpus already
 *  writes it: `FAILS on …`, `FLAGS a …`, `is non-vacuous — …`, `REFUSES …`,
 *  `rejects …`, `… convicts it`. Widening this set is legitimate only for a form
 *  that genuinely feeds a BAD input and asserts rejection — widening it to silence
 *  a naked gate is the appeasement it exists to prevent. */
const CONVICTS =
  /it\([\s\n]*['"`][^'"`]*(non-vacuous|convicts|FAILS|FLAGS|REFUSES|rejects)/i;

const testFiles = (): string[] =>
  readdirSync(testDir)
    .filter((n) => n.endsWith('.test.ts'))
    .sort();

describe('META-GATE — a gate without a convicting fixture is indistinguishable from a dark one', () => {
  it('every test file is classified — a new one cannot slip in unclassified', () => {
    const unclassified = testFiles().filter((f) => REGISTRY[f] === undefined);
    expect(
      unclassified,
      `classify these in REGISTRY (GATE | BEHAVIORAL): ${unclassified.join(', ')}`,
    ).toEqual([]);
  });

  it('the registry names no file that no longer exists (shrink-only)', () => {
    const present = new Set(testFiles());
    const stale = Object.keys(REGISTRY).filter((f) => !present.has(f));
    expect(stale, `remove from REGISTRY: ${stale.join(', ')}`).toEqual([]);
  });

  it('every GATE ships at least one fixture that CONVICTS it', async () => {
    const naked: string[] = [];
    for (const [file, kind] of Object.entries(REGISTRY)) {
      if (kind !== 'GATE') continue;
      const src = await readFile(join(testDir, file), 'utf8');
      if (!CONVICTS.test(src)) naked.push(file);
    }
    expect(
      naked,
      `GATEs with no convicting fixture — each is green whether the corpus is clean or the gate is dark:\n${naked.join('\n')}`,
    ).toEqual([]);
  });

  // The meta-gate's own convicting fixture. Without it this file would be the one
  // unpoliced gate in the suite — which is precisely the shape it exists to reject.
  it('is non-vacuous — the detector REFUSES a gate body with no convicting test', () => {
    const clean = `it('every cell conforms', () => { expect(bad).toEqual([]); });`;
    expect(CONVICTS.test(clean)).toBe(false);
    for (const form of [
      `it('FAILS on an injected violation', () => {});`,
      `it('FLAGS a \`--\` comment marker', () => {});`,
      `it('is non-vacuous — the predicate convicts it', () => {});`,
      `it('REFUSES a malformed cell', () => {});`,
    ])
      expect(CONVICTS.test(form), form).toBe(true);
  });
});
