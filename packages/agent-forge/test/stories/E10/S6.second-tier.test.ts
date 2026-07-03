/**
 * E10.S6 · second tier reached through standards, not bespoke adapters.
 * Ground truth: RETURN-1 §1 second-tier rows + [FS1]–[FS9] read paths.
 * The reach matrix is PINNED here: each second-tier harness must be reachable
 * by a file the standards output set contains at a path that harness
 * documents reading — with zero adapter code (parsimony guard).
 */

import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import type { IR, Manifest } from '../../../src/core/index.js';
import { ALL_ADAPTERS, adapterById, makeTmpDir, story } from '../helpers.js';

const manifest = (): Manifest => ({
  agentForge: 1,
  scope: 'project',
  targets: ALL_ADAPTERS.map((a) => a.id),
});

/** Pinned reach matrix — documented read paths per second-tier harness. */
const AGENTS_MD_ROWS = [
  { harness: 'Factory Droid', path: 'AGENTS.md', ref: 'FS2' },
  { harness: 'Goose', path: 'AGENTS.md', ref: 'FS3' },
  { harness: 'Warp', path: 'AGENTS.md', ref: 'FS4' },
  { harness: 'Trae', path: 'AGENTS.md', ref: 'FS5' },
  { harness: 'Augment', path: 'AGENTS.md', ref: 'FS6' },
  { harness: 'Junie', path: 'AGENTS.md', ref: 'FS8' },
  { harness: 'Antigravity', path: 'AGENTS.md', ref: 'FS9' },
] as const;

/** Config-gated harnesses: reachable only with the named knob [FS1]. */
const CFG_ROWS = [
  { harness: 'Qwen Code', mode: 'cfg', knob: 'contextFileName', ref: 'FS1' },
] as const;

/** No bespoke adapter may exist for any second-tier id (parsimony guard). */
const SECOND_TIER_IDS = [
  'factory',
  'factory-droid',
  'goose',
  'warp',
  'trae',
  'augment',
  'junie',
  'qwen',
] as const;

/** Compile the standards outputs (rules + skills) across every shipped adapter. */
async function buildStandardsTree(cwd: string): Promise<void> {
  const ir: IR = {
    manifest: manifest(),
    rules: [{ id: 'main', body: 'Be terse.' }],
    skills: [{ name: 'review', description: 'Review code', body: '# steps' }],
  };
  for (const adapter of ALL_ADAPTERS) {
    await adapter.write(ir, 'project', cwd, {});
  }
}

describe('E10.S6 · second-tier reach matrix', () => {
  for (const row of AGENTS_MD_ROWS) {
    story(
      'E10.S6',
      `standards output reaches ${row.harness} at ${row.path} [${row.ref}]`,
      async () => {
        const cwd = makeTmpDir('af-e10s6-');
        try {
          await buildStandardsTree(cwd);
          expect(existsSync(join(cwd, row.path))).toBe(true);
        } finally {
          rmSync(cwd, { recursive: true, force: true });
        }
      },
    );
  }

  story(
    'E10.S6',
    'standards output reaches Antigravity via .agents/skills/ [FS9]',
    async () => {
      const cwd = makeTmpDir('af-e10s6-');
      try {
        await buildStandardsTree(cwd);
        expect(
          existsSync(join(cwd, '.agents', 'skills', 'review', 'SKILL.md')),
        ).toBe(true);
      } finally {
        rmSync(cwd, { recursive: true, force: true });
      }
    },
  );

  story(
    'E10.S6',
    'standards output reaches Goose via .agents/skills/ [S54]',
    async () => {
      const cwd = makeTmpDir('af-e10s6-');
      try {
        await buildStandardsTree(cwd);
        expect(
          existsSync(join(cwd, '.agents', 'skills', 'review', 'SKILL.md')),
        ).toBe(true);
      } finally {
        rmSync(cwd, { recursive: true, force: true });
      }
    },
  );

  story(
    'E10.S6',
    'config-gated rows name their knob and get no bespoke file (Qwen contextFileName) [FS1]',
    async () => {
      const cwd = makeTmpDir('af-e10s6-');
      try {
        await buildStandardsTree(cwd);
        // Reach is via the knob on the standards artifact, never a QWEN.md.
        expect(CFG_ROWS[0].knob).toBe('contextFileName');
        expect(existsSync(join(cwd, 'QWEN.md'))).toBe(false);
      } finally {
        rmSync(cwd, { recursive: true, force: true });
      }
    },
  );

  story(
    'E10.S6',
    'parsimony guard: no bespoke adapter exists for any second-tier id',
    () => {
      for (const id of SECOND_TIER_IDS) {
        expect(adapterById.has(id)).toBe(false);
      }
    },
  );
});
