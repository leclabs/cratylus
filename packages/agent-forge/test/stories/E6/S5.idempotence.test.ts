/**
 * E6.S5 — optimization is idempotent: re-optimizing optimized output is a
 * no-op.
 *
 * Documented truth: with E6.S1's ACCEPTED output as input, the second run's
 * accept passes with `routes[]` all `reuse`, `delta[] = ∅`, and
 * byte-identical artifacts (or a semantically-empty diff per the pinned
 * equivalence checker).
 *
 * TRACKED: the run itself is impossible today — no exemplify/optimize
 * entrypoint ships in this package; the body fails on the probe, which
 * enumerates everything searched.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import { makeTmpDir, story } from '../helpers.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story.tracked(
  'E6.S5',
  'second run over accepted output: routes all reuse, delta empty, artifacts byte-identical',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    // Documented, once the pipeline lands — run 1 over the E6.S1 fixture,
    // run 2 over run 1's accepted output, then:
    const manifest2Path = join(cwd, '.manifests', 'run2.json');
    expect(existsSync(manifest2Path)).toBe(true);
    const manifest2 = JSON.parse(readFileSync(manifest2Path, 'utf8')) as {
      routes?: { disposition?: string }[];
      delta?: unknown[];
    };
    expect(manifest2.delta).toEqual([]);
    expect(manifest2.routes?.length ?? 0).toBeGreaterThan(0);
    for (const route of manifest2.routes ?? []) {
      expect(route.disposition).toBe('reuse');
    }
    // Byte-identity of the two artifact sets.
    expect(readFileSync(join(cwd, 'out-run2', 'CLAUDE.md'), 'utf8')).toBe(
      readFileSync(join(cwd, 'out-run1', 'CLAUDE.md'), 'utf8'),
    );
  },
);
