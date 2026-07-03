/**
 * E10.S4 · Kilo adapter — new-adapter contract probes.
 * Ground truth: harness-landscape-research.RETURN.md §2/Kilo sheet.
 * Refs [KL1][KL2][KL3][KL5][KL7].
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
import type { IR, Manifest } from '../../../src/core/index.js';
import { adapterById, makeTmpDir, story } from '../helpers.js';
import { importAdapter } from './probe.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['kilo'],
});

/** kilo.jsonc is JSONC; strip line comments before parsing. */
function parseJsonc(text: string): Record<string, unknown> {
  const stripped = text.replace(/^\s*\/\/.*$/gm, '');
  return JSON.parse(stripped) as Record<string, unknown>;
}

function readKiloConfig(cwd: string): Record<string, unknown> | null {
  for (const p of [join(cwd, '.kilo', 'kilo.jsonc'), join(cwd, 'kilo.jsonc')]) {
    if (existsSync(p)) return parseJsonc(readFileSync(p, 'utf8'));
  }
  return null;
}

describe('E10.S4 · kilo', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = makeTmpDir('af-e10s4-');
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  story(
    'E10.S4',
    'kilo is on the adapter roster (new-adapter contract) [KL1]',
    () => {
      expect(adapterById.has('kilo')).toBe(true);
    },
  );

  story(
    'E10.S4',
    'MCP lands in kilo.jsonc typed local|remote with command as ARRAY (E9.S1) [KL5]',
    async () => {
      const kilo = await importAdapter('kilo');
      const ir: IR = {
        manifest: manifest(),
        mcp_servers: [
          {
            name: 'github',
            transport: 'stdio',
            command: 'npx',
            args: ['-y', 'pkg'],
          },
        ],
      };
      await kilo.write(ir, 'project', cwd, {});
      const cfg = readKiloConfig(cwd) as {
        mcp?: Record<string, { type?: string; command?: unknown }>;
      } | null;
      expect(cfg).not.toBeNull();
      const entry = cfg?.mcp?.github;
      expect(entry?.type).toBe('local');
      expect(Array.isArray(entry?.command)).toBe(true);
    },
  );

  story(
    'E10.S4',
    'agents emit to .kilo/agents/*.md with mode: frontmatter [KL1]',
    async () => {
      const kilo = await importAdapter('kilo');
      const ir: IR = {
        manifest: manifest(),
        agents: [
          { name: 'helper', body: 'You help.', description: 'A helper' },
        ],
      };
      await kilo.write(ir, 'project', cwd, {});
      const agentFile = join(cwd, '.kilo', 'agents', 'helper.md');
      expect(existsSync(agentFile)).toBe(true);
      expect(readFileSync(agentFile, 'utf8')).toMatch(
        /mode:\s*(primary|subagent|all)/,
      );
    },
  );

  story(
    'E10.S4',
    'rules → .kilo/rules/, commands → .kilo/commands/, skills → .kilo/skills/ [KL2][KL7][KL3]',
    async () => {
      const kilo = await importAdapter('kilo');
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'style', body: 'Use tabs.' }],
        commands: [{ name: 'deploy', body: 'Deploy the app.' }],
        skills: [
          { name: 'review', description: 'Review code', body: '# steps' },
        ],
      };
      await kilo.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, '.kilo', 'rules', 'style.md'))).toBe(true);
      expect(existsSync(join(cwd, '.kilo', 'commands', 'deploy.md'))).toBe(
        true,
      );
      expect(
        existsSync(join(cwd, '.kilo', 'skills', 'review', 'SKILL.md')),
      ).toBe(true);
    },
  );

  story(
    'E10.S4',
    'legacy .kilocode/* is recognized on import but never written [KL1]',
    async () => {
      const kilo = await importAdapter('kilo');
      mkdirSync(join(cwd, '.kilocode', 'rules'), { recursive: true });
      writeFileSync(
        join(cwd, '.kilocode', 'rules', 'legacy.md'),
        'Legacy rules.\n',
        'utf8',
      );
      const re = await kilo.read('project', cwd);
      expect(
        (re.rules ?? []).some((r) => r.body.includes('Legacy rules')),
      ).toBe(true);
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'style', body: 'Use tabs.' }],
      };
      const report = await kilo.write(ir, 'project', cwd, {});
      expect(report.written.filter((p) => p.includes('.kilocode'))).toEqual([]);
    },
  );
});
