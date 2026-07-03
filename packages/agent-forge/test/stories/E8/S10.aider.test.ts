/**
 * E8.S10 · aider — functional conventions wiring.
 * Ground truth: harness-landscape-research.RETURN.md §2/aider, §3/aider d1, d3.
 * Operator ruling: aider stays on the roster with this fix. Refs [AI1][AI2].
 */

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { load } from 'js-yaml';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { aiderAdapter } from '../../../src/adapters/aider/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';
import { fakeHome, makeTmpDir, story } from '../helpers.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['aider'],
});

const RULES_IR: IR = {
  manifest: manifest(),
  rules: [{ id: 'main', body: 'Be terse.' }],
};

describe('E8.S10 · aider', () => {
  let cwd: string;
  let home: { home: string; restore: () => void } | null = null;

  beforeEach(() => {
    cwd = makeTmpDir('af-e8s10-');
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
    home?.restore();
    home = null;
  });
  const useHome = (): string => {
    home = fakeHome();
    return home.home;
  };

  story(
    'E8.S10',
    'a conventions file is emitted at project scope [AI2]',
    async () => {
      await aiderAdapter.write(RULES_IR, 'project', cwd, {});
      expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
    },
  );

  story.tracked(
    'E8.S10',
    'compile also emits .aider.conf.yml wiring the conventions file via read: [AI1][AI2]',
    async () => {
      const report = await aiderAdapter.write(RULES_IR, 'project', cwd, {});
      const confFile = join(cwd, '.aider.conf.yml');
      expect(existsSync(confFile)).toBe(true);
      const conf = (load(readFileSync(confFile, 'utf8')) ?? {}) as {
        read?: string[];
      };
      const conventions = report.written
        .filter((p) => p.endsWith('.md'))
        .map((p) => basename(p));
      expect(
        (conf.read ?? []).some((r) => conventions.includes(basename(r))),
      ).toBe(true);
    },
  );

  story.tracked(
    'E8.S10',
    '.aider.conf.yml wiring is merge-safe with an existing conf (E3.S5) [AI1]',
    async () => {
      writeFileSync(join(cwd, '.aider.conf.yml'), 'model: gpt-4o\n', 'utf8');
      await aiderAdapter.write(RULES_IR, 'project', cwd, {});
      const conf = (load(readFileSync(join(cwd, '.aider.conf.yml'), 'utf8')) ??
        {}) as { model?: unknown; read?: unknown };
      expect(conf.model).toBe('gpt-4o');
      expect(Array.isArray(conf.read)).toBe(true);
    },
  );

  story.tracked(
    'E8.S10',
    'the fabricated ~/AGENTS.md user-scope write is gone [AI1]',
    async () => {
      const h = useHome();
      await aiderAdapter.write(
        { ...RULES_IR, manifest: manifest('user') },
        'user',
        cwd,
        {},
      );
      expect(existsSync(join(h, 'AGENTS.md'))).toBe(false);
    },
  );

  story.tracked(
    'E8.S10',
    'read models the conf chain: read:-wired conventions files lift [AI1]',
    async () => {
      writeFileSync(
        join(cwd, '.aider.conf.yml'),
        'read:\n  - CONVENTIONS.md\n',
        'utf8',
      );
      writeFileSync(join(cwd, 'CONVENTIONS.md'), 'Wired rules.\n', 'utf8');
      const re = await aiderAdapter.read('project', cwd);
      expect((re.rules ?? []).some((r) => r.body.includes('Wired rules'))).toBe(
        true,
      );
    },
  );
});
