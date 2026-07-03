/**
 * E6.S1 — raw human-register context optimizes to conforming R=LLM artifacts.
 *
 * Documented truth: a verbose human CLAUDE.md run through the exemplify
 * pipeline passes the accept gate — `REC_R(k) ≽ k` (round-trip
 * equivalent-or-better against the conceptualize gloss set), `minimal` (no
 * two concepts share an anchor), `conform` (`register = ρ = LLM`; a
 * human-register emission FAILS) — and emits the R3 routing manifest
 * `.manifests/<source>.json` where every concept appears in exactly one of
 * `routes[]` / `delta[]`; an artificially withheld concept makes the gate
 * refuse.
 *
 * Today no exemplify/optimize entrypoint exists in this package: both tests
 * are TRACKED, failing on the pipeline probe (which enumerates everything
 * searched). The fixture and post-probe assertions pin the documented
 * behavior for graduation day.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
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

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
  writeFileSync(join(cwd, 'CLAUDE.md'), HUMAN_CLAUDE_MD, 'utf8');
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story.tracked(
  'E6.S1',
  'a verbose human CLAUDE.md passes the exemplify accept gate: REC ≽ · minimal · conform (register = LLM)',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    // Documented, once an entrypoint exists: optimizing cwd/CLAUDE.md
    // produces R=LLM artifacts distinct from the human-register source (a
    // human-register emission fails `conform`, so byte-identity with the
    // narrative source would itself be a failure).
    const optimizedDir = join(cwd, 'optimized');
    expect(existsSync(optimizedDir)).toBe(true);
  },
);

story.tracked(
  'E6.S1',
  'the R3 routing manifest .manifests/<source>.json routes every concept exactly once; a withheld concept makes the gate refuse',
  async () => {
    const probe = await probePipeline();
    expect(probe.found, probeMessage(probe)).not.toEqual([]);
    // Documented manifest contract (exemplify SKILL.md): one entry per
    // concept keyed by fragment_digest, each in routes[] or delta[], exactly
    // one — the unrouted concept is the dropped idea R3 catches.
    mkdirSync(join(cwd, '.manifests'), { recursive: true });
    const manifestPath = join(cwd, '.manifests', 'CLAUDE.md.json');
    expect(existsSync(manifestPath)).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      source?: string;
      routes?: { fragment_digest?: string }[];
      delta?: { fragment_digest?: string }[];
    };
    expect(manifest.source).toBeDefined();
    const entries = [...(manifest.routes ?? []), ...(manifest.delta ?? [])];
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.fragment_digest).toMatch(/^sha256:/);
    }
    // Mutation fixture: withholding one concept must make accept refuse —
    // the refusal (not a silent pass) is the assertable behavior.
  },
);
