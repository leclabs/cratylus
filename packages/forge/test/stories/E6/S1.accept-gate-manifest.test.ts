/**
 * E6.S1 — raw human-register context optimizes to conforming R=LLM artifacts.
 *
 * GRADUATED: the exemplify pipeline ships in `src/core/exemplify/` (probed
 * first, still). The mechanical frame gates an LLM-authored plan; this test
 * plays the operating agent — the plan constants below ARE the LLM passes'
 * output (conceptualize → gloss, signify → anchor, materialize → the
 * realized R=LLM body) — and asserts the frame's laws bite:
 * `REC ≽` (anchors carried by their homes), `minimal`, `conform`
 * (a human-register emission FAILS), the R3 manifest with every concept
 * exactly once, and refusal on a withheld concept.
 */

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import {
  type ConceptRecord,
  ExemplifyRefusal,
  classifyRegister,
  optimize,
} from '../../../src/core/exemplify/index.js';
import { makeTmpDir, story } from '../helpers.js';
import { probeMessage, probePipeline } from './pipeline-probe.js';

/** A real-world-shaped human-register CLAUDE.md: narrative, redundant. */
const HUMAN_CLAUDE_MD = `# Welcome to our project!

Hi there! This file explains how we like to work. Please read all of this
carefully before doing anything, because we really care about these rules.

## About commits

So, when you make a commit, we would really appreciate you following the
Conventional Commits style. That means starting the message with a type like
feat or fix. Also, please keep the first line under one hundred characters,
because long lines are hard to read. Again: Conventional Commits, short first
line. Thanks so much!

## About formatting

We use biome for formatting. Please run biome before committing. Formatting
matters a lot to us. Did we mention we use biome? Please do not use prettier
or eslint, since biome replaces both of them for us.

## About tests

Every change should keep the tests green. Run the whole suite before you
push. If a change breaks the suite, fix the change, not the suite. We repeat:
green before push, always.
`;

/** The LLM passes' output over the fixture (the test plays the agent):
 *  C_R with glosses, anchors, and routing — one concept per meaning joint. */
const CONCEPTS: ConceptRecord[] = [
  {
    gloss:
      'commits follow the Conventional Commits style with the subject line kept under one hundred characters',
    anchor: 'commit-convention',
    home: 'CLAUDE.md',
    rank: 0,
  },
  {
    gloss:
      'biome is the sole formatter and linter, run before every commit; it replaces prettier and eslint',
    anchor: 'biome-only',
    home: 'CLAUDE.md',
    rank: 1,
  },
  {
    gloss:
      'the whole test suite stays green before push; a breaking change is fixed in the change, never in the suite',
    anchor: 'green-before-push',
    home: 'CLAUDE.md',
    rank: 2,
  },
];

/** The realized R=LLM body (materialize's output): dense, signifier-borne. */
const OPTIMIZED_BODY = [
  'commit-convention ≜ conventional-commit type · subject ≤ 100 chars',
  'biome-only ≜ biome = formatter ∧ linter, pre-commit · ¬prettier ¬eslint',
  'green-before-push ≜ suite green gates push · fix the change, never the suite',
  '',
].join('\n');

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
  writeFileSync(join(cwd, 'CLAUDE.md'), HUMAN_CLAUDE_MD, 'utf8');
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story(
  'E6.S1',
  'a verbose human CLAUDE.md passes the exemplify accept gate: REC ≽ · minimal · conform (register = LLM)',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    const source = join(cwd, 'CLAUDE.md');
    // conform bites: re-emitting the human-register source fails accept —
    // byte-identity with the narrative source is itself a failure.
    expect(() =>
      optimize({
        source,
        concepts: CONCEPTS,
        artifacts: [{ path: 'CLAUDE.md', body: HUMAN_CLAUDE_MD }],
        outDir: join(cwd, 'optimized'),
      }),
    ).toThrow(ExemplifyRefusal);
    // The R=LLM realization passes the gate: REC ≽ · minimal · conform.
    const { manifest } = optimize({
      source,
      concepts: CONCEPTS,
      artifacts: [{ path: 'CLAUDE.md', body: OPTIMIZED_BODY }],
      outDir: join(cwd, 'optimized'),
    });
    const optimizedDir = join(cwd, 'optimized');
    expect(existsSync(optimizedDir)).toBe(true);
    const emitted = readFileSync(join(optimizedDir, 'CLAUDE.md'), 'utf8');
    expect(emitted).not.toBe(HUMAN_CLAUDE_MD);
    expect(classifyRegister(HUMAN_CLAUDE_MD)).toBe('human');
    expect(classifyRegister(emitted)).toBe('LLM');
    expect(manifest.routes).toHaveLength(CONCEPTS.length);
  },
);

story(
  'E6.S1',
  'the R3 routing manifest .manifests/<source>.json routes every concept exactly once; a withheld concept makes the gate refuse',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    const source = join(cwd, 'CLAUDE.md');
    optimize({
      source,
      concepts: CONCEPTS,
      artifacts: [{ path: 'CLAUDE.md', body: OPTIMIZED_BODY }],
      outDir: join(cwd, 'optimized'),
    });
    // Manifest contract (exemplify SKILL.md): one entry per concept keyed by
    // fragment_digest, each in routes[] or delta[], exactly one.
    const manifestPath = join(cwd, '.manifests', 'CLAUDE.md.json');
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      source?: string;
      routes?: { fragment_digest?: string }[];
      delta?: { fragment_digest?: string }[];
    };
    expect(manifest.source).toBeDefined();
    const entries = [...(manifest.routes ?? []), ...(manifest.delta ?? [])];
    expect(entries).toHaveLength(CONCEPTS.length);
    for (const entry of entries) {
      expect(entry.fragment_digest).toMatch(/^sha256:/);
    }
    expect(new Set(entries.map((e) => e.fragment_digest)).size).toBe(
      CONCEPTS.length,
    );
    // Mutation fixture: withholding one concept (unrouted, not in delta)
    // makes accept refuse — the refusal (not a silent pass) is the behavior.
    const withheld = CONCEPTS.map((c, i) =>
      i === CONCEPTS.length - 1 ? { gloss: c.gloss, anchor: c.anchor } : c,
    );
    expect(() =>
      optimize({
        source,
        concepts: withheld,
        artifacts: [{ path: 'CLAUDE.md', body: OPTIMIZED_BODY }],
        outDir: join(cwd, 'optimized-withheld'),
      }),
    ).toThrow(/withheld/);
  },
);
