/**
 * E6.S7 — optimization is lossless-by-the-ledger.
 *
 * Documented truth: the R3 manifest's `routes ∪ delta` covers every concept
 * conceptualize extracted, checked mechanically (`checkCoverage`) — nothing is
 * semantically dropped between the source and the optimized artifacts.
 *
 * Scope note — the IR-intake excision (2026-07): this story once opened on an
 * `import` → optimize → `compile` flow and closed on "the raw, un-optimized
 * compile remains available unchanged". Both of those legs asserted the IR
 * intake pipeline, which has been excised — `import`, `compile`, and the IR
 * `Rule` that `optimizeRules` rewrote no longer exist. The ledger leg below is
 * the half whose subject survives, and it is kept with its assertions intact:
 * the coverage equation `routes ∪ delta = C_R`, digest-exact, including a
 * consciously delta'd concept the equation must still account for.
 */

import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import {
  type ConceptRecord,
  checkCoverage,
  optimize,
} from '../../../src/core/exemplify/index.js';
import { makeTmpDir, story } from '../helpers.js';
import { FIXTURE_REGISTER } from './fixture-register.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

const RAW_SOURCE_BODY = `# Raw conventions

Please always run the formatter before committing, and keep commit subjects
short. We prefer small pull requests.`;

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story(
  'E6.S7',
  'the R3 manifest ledger covers every conceptualized concept: routes ∪ delta = C_R, checked mechanically',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    const source = join(cwd, 'CLAUDE.md');
    writeFileSync(source, RAW_SOURCE_BODY, 'utf8');
    // The concepts conceptualize extracted from the raw source; one is
    // consciously delta'd — the equation must still cover it.
    const concepts: ConceptRecord[] = [
      {
        gloss: 'the formatter runs before every commit',
        anchor: 'format-pre-commit',
        home: 'CLAUDE.md',
        rank: 0,
      },
      {
        gloss: 'commit subjects stay short',
        anchor: 'short-subjects',
        home: 'CLAUDE.md',
        rank: 1,
      },
      {
        gloss: 'pull requests are kept small',
        delta: true,
      },
    ];
    const optimizedBody = [
      'format-pre-commit ≜ formatter gates every commit',
      'short-subjects ≜ commit subject minimal',
      '',
    ].join('\n');
    const { manifest } = optimize({
      register: FIXTURE_REGISTER,
      source,
      concepts,
      artifacts: [{ path: 'CLAUDE.md', body: optimizedBody }],
      outDir: join(cwd, 'optimized'),
    });
    // The mechanical coverage equation: routes ∪ delta = C_R, digest-exact.
    const cov = checkCoverage(manifest, concepts);
    expect(cov.missing).toEqual([]);
    expect(cov.extra).toEqual([]);
    expect(manifest.routes.length + manifest.delta.length).toBe(
      concepts.length,
    );
    // The delta'd concept is on the ledger as delta, not silently dropped.
    expect(manifest.delta.map((d) => d.idea_gloss)).toEqual([
      'pull requests are kept small',
    ]);
  },
);
