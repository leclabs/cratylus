/**
 * E8.S7 · cline — hooks-as-scripts, Documents rules home, skills+workflows on,
 * MCP paths. Ground truth: harness-landscape-research.RETURN.md §2/Cline,
 * §3/cline d1–d7. Refs [CL1][CL2][CL3][CL4][CL5][CL6].
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { clineAdapter } from '../../../src/adapters/cline/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';
import { fakeHome, makeTmpDir, story } from '../helpers.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['cline'],
});

const HOOK_IR: IR = {
  manifest: manifest(),
  hooks: [{ id: 'guard', events: ['tool.use.pre'], command: './check.sh' }],
};

describe('E8.S7 · cline', () => {
  let cwd: string;
  let home: { home: string; restore: () => void } | null = null;

  beforeEach(() => {
    cwd = makeTmpDir('af-e8s7-');
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

  // --- Hooks as scripts [CL2][CL3] ---

  story(
    'E8.S7',
    'hooks emit as per-event executable scripts in .clinerules/hooks/ [CL2][CL3]',
    async () => {
      await clineAdapter.write(HOOK_IR, 'project', cwd, {});
      expect(existsSync(join(cwd, '.clinerules', 'hooks', 'PreToolUse'))).toBe(
        true,
      );
    },
  );

  story(
    'E8.S7',
    'the fabricated .cline/hooks.json is never emitted [CL2]',
    async () => {
      await clineAdapter.write(HOOK_IR, 'project', cwd, {});
      expect(existsSync(join(cwd, '.cline', 'hooks.json'))).toBe(false);
    },
  );

  story(
    'E8.S7',
    'event set is the documented 6 — no TaskComplete/PreCompact mappings [CL2]',
    () => {
      expect(clineAdapter.eventMap?.['session.end']).toBeUndefined();
      expect(clineAdapter.eventMap?.['context.compact.pre']).toBeUndefined();
    },
  );

  // --- Global rules home [CL1] ---

  story(
    'E8.S7',
    'global rules emit to ~/Documents/Cline/Rules [CL1]',
    async () => {
      const h = useHome();
      const ir: IR = {
        manifest: manifest('user'),
        rules: [{ id: 'main', body: 'Be terse.' }],
      };
      await clineAdapter.write(ir, 'user', cwd, {});
      expect(existsSync(join(h, 'Documents', 'Cline', 'Rules'))).toBe(true);
    },
  );

  // --- Skills + workflows on [CL4][CL5] ---

  story(
    'E8.S7',
    'skills capability on: .cline/skills/ emitted [CL5]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        skills: [
          { name: 'review', description: 'Review code', body: '# steps' },
        ],
      };
      await clineAdapter.write(ir, 'project', cwd, {});
      expect(
        existsSync(join(cwd, '.cline', 'skills', 'review', 'SKILL.md')),
      ).toBe(true);
      expect(clineAdapter.capabilities.resources.skills).not.toBe('none');
    },
  );

  story(
    'E8.S7',
    'commands emit as workflows .clinerules/workflows/*.md [CL4]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        commands: [{ name: 'deploy', body: 'Deploy the app.' }],
      };
      await clineAdapter.write(ir, 'project', cwd, {});
      expect(
        existsSync(join(cwd, '.clinerules', 'workflows', 'deploy.md')),
      ).toBe(true);
    },
  );

  // --- MCP paths [CL6] ---

  story(
    'E8.S7',
    'CLI MCP target ~/.cline/mcp.json is written at user scope [CL6]',
    async () => {
      const h = useHome();
      const ir: IR = {
        manifest: manifest('user'),
        mcp_servers: [
          { name: 'github', transport: 'stdio', command: 'npx', args: ['-y'] },
        ],
      };
      await clineAdapter.write(ir, 'user', cwd, {});
      expect(existsSync(join(h, '.cline', 'mcp.json'))).toBe(true);
    },
  );

  story(
    'E8.S7',
    'project MCP: undocumented .cline/mcp.json is not emitted silently — warn or omit [CL6]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        mcp_servers: [
          { name: 'github', transport: 'stdio', command: 'npx', args: ['-y'] },
        ],
      };
      const report = await clineAdapter.write(ir, 'project', cwd, {});
      const silentProjectFile =
        existsSync(join(cwd, '.cline', 'mcp.json')) &&
        !report.warnings.some((w) =>
          /unreachable|extension|globalStorage|override/i.test(w),
        );
      expect(silentProjectFile).toBe(false);
    },
  );

  // --- Already-correct surfaces ---

  story(
    'E8.S7',
    'project glob rules round-trip as multi-file .clinerules/*.md [CL1][S22]',
    async () => {
      // Post-fix, `.clinerules/*.md` carries GLOB-activated rules only — a
      // PLAIN rule now lands on root AGENTS.md instead (E7.S7 owned test),
      // so this fixture exercises the corrected multi-file surface with
      // globs rather than the two plain rules it used pre-fix.
      const ir: IR = {
        manifest: manifest(),
        rules: [
          { id: 'alpha', body: 'Alpha rule.', globs: ['src/**'] },
          { id: 'beta', body: 'Beta rule.', globs: ['docs/**'] },
        ],
      };
      await clineAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, '.clinerules', 'alpha.md'))).toBe(true);
      const re = await clineAdapter.read('project', cwd);
      expect(re.rules).toEqual(ir.rules);
    },
  );

  // --- Fabricated-shape import (E1.S3) ---

  story(
    'E8.S7',
    'fabricated-shape import: .cline/hooks.json lifts zero phantom hooks (E1.S3) [CL2]',
    async () => {
      mkdirSync(join(cwd, '.cline'), { recursive: true });
      writeFileSync(
        join(cwd, '.cline', 'hooks.json'),
        JSON.stringify({
          hooks: {
            PreToolUse: [
              { hooks: [{ type: 'command', command: './ghost.sh' }] },
            ],
          },
        }),
        'utf8',
      );
      const re = await clineAdapter.read('project', cwd);
      expect(re.hooks ?? []).toEqual([]);
    },
  );
});
