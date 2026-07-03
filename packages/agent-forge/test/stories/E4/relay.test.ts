/**
 * E4.S6 — cross-harness relay conserves semantics minus enumerated losses.
 *
 * claude fixture → import claude → compile opencode → import opencode →
 * compile claude, compared against a direct compile of the original IR.
 * Machine check: the fields differing between relay output and direct output
 * are a subset of the fields named in the accumulated warnings/skips.
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';

import type { IR } from '../../../src/core/index.js';
import { adapterById, makeTmpDir, story } from '../helpers.js';
import { comparable, manifest } from './support.js';

function buildClaudeFixture(cwd: string): void {
  mkdirSync(join(cwd, '.claude', 'commands'), { recursive: true });
  mkdirSync(join(cwd, '.claude', 'agents'), { recursive: true });
  mkdirSync(join(cwd, '.claude', 'skills', 'review'), { recursive: true });
  writeFileSync(join(cwd, 'CLAUDE.md'), '# Project rules\n\nBe terse.\n');
  writeFileSync(
    join(cwd, '.claude', 'settings.json'),
    JSON.stringify(
      {
        hooks: {
          PreToolUse: [
            {
              matcher: 'Edit|Write',
              hooks: [
                {
                  type: 'command',
                  command: './scripts/format.sh',
                  timeout: 30,
                },
              ],
            },
          ],
          Stop: [{ hooks: [{ type: 'command', command: 'notify-send done' }] }],
        },
        permissions: { allow: ['Read(*)'], deny: ['Bash(rm -rf:*)'] },
        env: { DEBUG: 'true' },
        mcpServers: {
          github: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: { GITHUB_TOKEN: 'xxx' },
          },
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(cwd, '.claude', 'commands', 'plan.md'),
    '---\ndescription: Trigger planning\n---\nMake a plan.',
  );
  writeFileSync(
    join(cwd, '.claude', 'agents', 'planner.md'),
    '---\ndescription: Plans tasks\n---\nYou are the planner.',
  );
  writeFileSync(
    join(cwd, '.claude', 'skills', 'review', 'SKILL.md'),
    '---\nname: review\ndescription: Review code\nallowed_tools:\n  - Read\n---\n# How\n\n1. read',
  );
}

const RESOURCE_KEYS = [
  'rules',
  'skills',
  'commands',
  'agents',
  'hooks',
  'mcp_servers',
  'permissions',
  'env',
] as const;

/** Loss-report token per IR key (what a warning/skip entry would name). */
const REPORT_TOKEN: Record<(typeof RESOURCE_KEYS)[number], string> = {
  rules: 'rules',
  skills: 'skill',
  commands: 'commands',
  agents: 'agents',
  hooks: 'hook',
  mcp_servers: 'mcp',
  permissions: 'permissions',
  env: 'env',
};

interface RelayResult {
  relay: Partial<IR>;
  direct: Partial<IR>;
  reported: string;
  diffKeys: string[];
}

async function runRelay(): Promise<RelayResult> {
  const claude = adapterById.get('claude');
  const opencode = adapterById.get('opencode');
  if (!claude || !opencode) throw new Error('adapters missing');

  const dirs = [0, 1, 2, 3].map(() => makeTmpDir('af-e4s6-'));
  cleanups.push(...dirs);
  const [a, b, c, d] = dirs as [string, string, string, string];

  buildClaudeFixture(a);
  const ir1 = await claude.read('project', a);
  const r1 = await opencode.write(
    { manifest: manifest('opencode'), ...ir1 },
    'project',
    b,
    {},
  );
  const ir2 = await opencode.read('project', b);
  const r2 = await claude.write(
    { manifest: manifest('claude'), ...ir2 },
    'project',
    c,
    {},
  );
  await claude.write(
    { manifest: manifest('claude'), ...ir1 },
    'project',
    d,
    {},
  );

  const relay = await claude.read('project', c);
  const direct = await claude.read('project', d);
  const reported = [
    ...r1.warnings,
    ...r2.warnings,
    ...r1.skipped.map((s) => `${s.path} ${s.reason}`),
    ...r2.skipped.map((s) => `${s.path} ${s.reason}`),
  ].join('\n');

  const diffKeys = RESOURCE_KEYS.filter(
    (k) =>
      JSON.stringify(comparable(relay[k], 'hooks')) !==
      JSON.stringify(comparable(direct[k], 'hooks')),
  );
  return { relay, direct, reported, diffKeys };
}

const cleanups: string[] = [];
afterEach(() => {
  for (const dir of cleanups.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('E4.S6 · claude → opencode → claude relay', () => {
  story(
    'E4.S6',
    'symmetric diff of relay vs direct compile ⊆ reported-loss fields',
    async () => {
      const { reported, diffKeys } = await runRelay();
      const unexplained = diffKeys.filter(
        (k) =>
          !reported.includes(REPORT_TOKEN[k as (typeof RESOURCE_KEYS)[number]]),
      );
      expect(unexplained).toEqual([]);
    },
  );

  story(
    'E4.S6',
    'resources inside both dialects survive the relay exactly (rules, skills, hooks, mcp, permissions, env)',
    async () => {
      const { relay, direct, diffKeys } = await runRelay();
      for (const k of [
        'rules',
        'skills',
        'hooks',
        'mcp_servers',
        'permissions',
        'env',
      ] as const) {
        expect(diffKeys).not.toContain(k);
        expect(comparable(relay[k], 'hooks')).toEqual(
          comparable(direct[k], 'hooks'),
        );
      }
    },
  );
});
