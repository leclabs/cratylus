/**
 * E10.S8 · Pi adapter — natural emissions (config surfaces).
 * Ground truth: pi-harness-research.RETURN.md §2 sheet ([PI#]); new-adapter
 * contract. No pi adapter exists — probes are tracked; contract assertions
 * execute post-graduation.
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import type { IR, Manifest } from '../../../src/core/index.js';
import { adapterById, makeTmpDir, story } from '../helpers.js';
import { importAdapter } from './probe.js';

const manifest = (): Manifest => ({
  agentForge: 1,
  scope: 'project',
  targets: ['pi'],
});

describe('E10.S8 · pi natural emissions', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = makeTmpDir('af-e10s8-');
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  story.tracked(
    'E10.S8',
    'pi is on the adapter roster (new-adapter contract)',
    () => {
      expect(adapterById.has('pi')).toBe(true);
    },
  );

  story.tracked(
    'E10.S8',
    'rules: root AGENTS.md lands unchanged (native walk-up concat); no .pi/AGENTS.md — that surface does not exist [PI2]',
    async () => {
      const pi = await importAdapter('pi');
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'main', body: 'Be terse.' }],
      };
      await pi.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
      expect(existsSync(join(cwd, '.pi', 'AGENTS.md'))).toBe(false);
      // Import side: CLAUDE.md is a co-equal alternative filename, and
      // SYSTEM.md/APPEND_SYSTEM.md are recognized system-prompt surfaces.
      const src = makeTmpDir('af-e10s8-src-');
      const { writeFileSync, mkdirSync } = await import('node:fs');
      writeFileSync(join(src, 'CLAUDE.md'), 'Alt context.', 'utf8');
      mkdirSync(join(src, '.pi'), { recursive: true });
      writeFileSync(join(src, '.pi', 'SYSTEM.md'), 'Replace prompt.', 'utf8');
      const re = await pi.read('project', src);
      expect(
        (re.rules ?? []).some((r) => r.body.includes('Alt context.')),
      ).toBe(true);
    },
  );

  story.tracked(
    'E10.S8',
    'skills: .agents/skills/ tree unchanged (native discovery); frontmatter constraints enforced (name ≤64 [a-z0-9-], description required ≤1024) [PI5]',
    async () => {
      const pi = await importAdapter('pi');
      const ir: IR = {
        manifest: manifest(),
        skills: [
          { name: 'review', description: 'Review code', body: '# steps' },
        ],
      };
      const report = await pi.write(ir, 'project', cwd, {});
      expect(
        existsSync(join(cwd, '.agents', 'skills', 'review', 'SKILL.md')),
      ).toBe(true);
      // No redundant second native home (parsimony).
      expect(existsSync(join(cwd, '.pi', 'skills'))).toBe(false);
      // An undescribed skill is not loaded by pi — emitting one silently = a
      // dead artifact; the adapter must warn or skip.
      const bad: IR = {
        manifest: manifest(),
        skills: [{ name: 'nodesc', description: '', body: 'x' }],
      };
      const badReport = await pi.write(
        bad,
        'project',
        makeTmpDir('af-e10s8b-'),
        {},
      );
      expect(
        badReport.warnings.length + badReport.skipped.length,
      ).toBeGreaterThan(0);
      expect(report.warnings.some((w) => w.includes('trust'))).toBe(true);
    },
  );

  story.tracked(
    'E10.S8',
    'commands → prompt templates .pi/prompts/*.md with description/argument-hint frontmatter and $1/$ARGUMENTS substitution [PI7]',
    async () => {
      const pi = await importAdapter('pi');
      const ir: IR = {
        manifest: manifest(),
        commands: [
          {
            name: 'deploy',
            description: 'Deploy the app',
            body: 'Deploy $1 with $ARGUMENTS',
          },
        ],
      };
      await pi.write(ir, 'project', cwd, {});
      const prompt = join(cwd, '.pi', 'prompts', 'deploy.md');
      expect(existsSync(prompt)).toBe(true);
      const text = readFileSync(prompt, 'utf8');
      expect(text).toContain('Deploy $1 with $ARGUMENTS');
      expect(text).toMatch(/description:\s*Deploy the app/);
    },
  );

  story.tracked(
    'E10.S8',
    'capabilities honest: hooks/agents/permissions absent as CONFIG surfaces (code delivery is E10.S9); mcp none by design [PI2]',
    async () => {
      const pi = await importAdapter('pi');
      expect(pi.capabilities.resources.mcp).toBe('none');
      // Hooks/agents have no pi config-file dialect — a declaration of
      // full/partial would claim a surface [PI2] says does not exist; the
      // contract admits 'none' or a distinct plugin-mode value (E5.S1),
      // never a config-surface claim.
      expect(['full', 'partial']).not.toContain(
        pi.capabilities.resources.hooks,
      );
      expect(['full', 'partial']).not.toContain(
        pi.capabilities.resources.agents,
      );
      expect(['full', 'partial']).not.toContain(
        pi.capabilities.resources.permissions,
      );
    },
  );
});
