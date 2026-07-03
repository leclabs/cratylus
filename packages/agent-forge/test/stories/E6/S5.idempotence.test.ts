/**
 * E6.S5 — optimization is idempotent: re-optimizing optimized output is a
 * no-op.
 *
 * GRADUATED: the pipeline ships in `src/core/exemplify/`. Run 1 optimizes
 * the E6.S1 fixture; run 2 takes run 1's ACCEPTED output as its source with
 * run 1's manifest as `prior`. Idempotence is a digest fixpoint: the second
 * accept passes with `routes[]` all `reuse`, `delta[] = ∅`, and — rendering
 * being deterministic — byte-identical artifacts.
 */

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import {
  type ArtifactSpec,
  type ConceptRecord,
  optimize,
} from '../../../src/core/index.js';
import { makeTmpDir, story } from '../helpers.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

/** The E6.S1 fixture (human-register source of run 1). */
const HUMAN_CLAUDE_MD = `# Welcome to our project!

Hi there! Please follow Conventional Commits, keep the first line short, run
biome before committing, and keep the whole suite green before you push.
Thanks so much! Again: commits, biome, green — we really care about these.
`;

/** The LLM passes' output (as in E6.S1): concepts + the R=LLM realization. */
const CONCEPTS: ConceptRecord[] = [
  {
    gloss: 'commits follow Conventional Commits with a short subject line',
    anchor: 'commit-convention',
    home: 'CLAUDE.md',
    rank: 0,
  },
  {
    gloss: 'biome runs before every commit',
    anchor: 'biome-pre-commit',
    home: 'CLAUDE.md',
    rank: 1,
  },
  {
    gloss: 'the whole test suite stays green before push',
    anchor: 'green-before-push',
    home: 'CLAUDE.md',
    rank: 2,
  },
];

const ARTIFACTS: ArtifactSpec[] = [
  {
    path: 'CLAUDE.md',
    body: [
      'commit-convention ≜ conventional-commit type · subject short',
      'biome-pre-commit ≜ biome gates every commit',
      'green-before-push ≜ suite green gates push',
      '',
    ].join('\n'),
  },
];

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story(
  'E6.S5',
  'second run over accepted output: routes all reuse, delta empty, artifacts byte-identical',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    writeFileSync(join(cwd, 'CLAUDE.md'), HUMAN_CLAUDE_MD, 'utf8');
    // Run 1 over the E6.S1 fixture.
    const run1 = optimize({
      source: join(cwd, 'CLAUDE.md'),
      concepts: CONCEPTS,
      artifacts: ARTIFACTS,
      outDir: join(cwd, 'out-run1'),
      manifestPath: join(cwd, '.manifests', 'run1.json'),
    });
    // Run 2 over run 1's ACCEPTED output, prior = run 1's manifest.
    optimize({
      source: join(cwd, 'out-run1', 'CLAUDE.md'),
      concepts: CONCEPTS,
      artifacts: ARTIFACTS,
      outDir: join(cwd, 'out-run2'),
      manifestPath: join(cwd, '.manifests', 'run2.json'),
      prior: run1.manifest,
    });
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
