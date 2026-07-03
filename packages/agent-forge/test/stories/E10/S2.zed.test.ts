/**
 * E10.S2 · Zed adapter — new-adapter contract probes.
 * Ground truth: harness-landscape-research.RETURN.md §2/Zed sheet.
 * Refs [ZD1][ZD2][ZD3][ZD4][ZD5][ZD6][ZD8].
 */

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import type { IR, Manifest } from '../../../src/core/index.js';
import { adapterById, makeTmpDir, story } from '../helpers.js';
import { importAdapter } from './probe.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['zed'],
});

describe('E10.S2 · zed', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = makeTmpDir('af-e10s2-');
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  story('E10.S2', 'zed is on the adapter roster (new-adapter contract)', () => {
    expect(adapterById.has('zed')).toBe(true);
  });

  story(
    'E10.S2',
    'skills emit to exactly <worktree>/.agents/skills/ — Zed reads no other project path [ZD2]',
    async () => {
      const zed = await importAdapter('zed');
      const ir: IR = {
        manifest: manifest(),
        skills: [
          { name: 'review', description: 'Review code', body: '# steps' },
        ],
      };
      await zed.write(ir, 'project', cwd, {});
      expect(
        existsSync(join(cwd, '.agents', 'skills', 'review', 'SKILL.md')),
      ).toBe(true);
      expect(existsSync(join(cwd, '.zed', 'skills'))).toBe(false);
    },
  );

  story(
    'E10.S2',
    'skill frontmatter constraints enforced: name ≤64 [a-z0-9-], description <1024B [ZD2]',
    async () => {
      const zed = await importAdapter('zed');
      const ir: IR = {
        manifest: manifest(),
        skills: [
          {
            name: `x${'a'.repeat(70)}`,
            description: 'Too-long name skill',
            body: '# steps',
          },
        ],
      };
      const report = await zed.write(ir, 'project', cwd, {});
      expect(report.warnings.length + report.skipped.length).toBeGreaterThan(0);
    },
  );

  story(
    'E10.S2',
    'rules: AGENTS.md written with a shadow warning when a higher-precedence file exists [ZD1]',
    async () => {
      const zed = await importAdapter('zed');
      writeFileSync(join(cwd, '.rules'), 'legacy rules\n', 'utf8');
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'main', body: 'Be terse.' }],
      };
      const report = await zed.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
      expect(
        report.warnings.some((w) => /\.rules|shadow|precedence/i.test(w)),
      ).toBe(true);
    },
  );

  story(
    'E10.S2',
    'MCP emits as context_servers in .zed/settings.json [ZD3]',
    async () => {
      const zed = await importAdapter('zed');
      const ir: IR = {
        manifest: manifest(),
        mcp_servers: [
          { name: 'github', transport: 'stdio', command: 'npx', args: ['-y'] },
        ],
      };
      await zed.write(ir, 'project', cwd, {});
      const settingsFile = join(cwd, '.zed', 'settings.json');
      expect(existsSync(settingsFile)).toBe(true);
      const settings = JSON.parse(readFileSync(settingsFile, 'utf8')) as {
        context_servers?: Record<string, unknown>;
      };
      expect(settings.context_servers?.github).toBeDefined();
    },
  );

  story(
    'E10.S2',
    'capabilities honest: hooks/commands/agents declared none [ZD5][ZD8][ZD4][ZD6]',
    async () => {
      const zed = await importAdapter('zed');
      expect(zed.capabilities.resources.hooks).toBe('none');
      expect(zed.capabilities.resources.commands).toBe('none');
      expect(zed.capabilities.resources.agents).toBe('none');
    },
  );
});
