/**
 * E8.S5 · cursor — hooks envelope, rules .mdc, agents, commands.
 * Ground truth: harness-landscape-research.RETURN.md §2/Cursor, §3/cursor d1–d7.
 * Refs [CU1][CU2][CU3][CU5][CU6].
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { cursorAdapter } from '../../../src/adapters/cursor/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';
import { fakeHome, makeTmpDir, story } from '../helpers.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['cursor'],
});

const readJson = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;

const HOOK_IR: IR = {
  manifest: manifest(),
  hooks: [
    {
      id: 'guard',
      events: ['tool.use.pre'],
      matcher: 'Bash',
      command: './check.sh',
      timeout: 30,
    },
  ],
};

describe('E8.S5 · cursor', () => {
  let cwd: string;
  let home: { home: string; restore: () => void } | null = null;

  beforeEach(() => {
    cwd = makeTmpDir('af-e8s5-');
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

  // --- Hooks envelope [CU2] ---

  story(
    'E8.S5',
    'hooks.json carries the required "version": 1 [CU2]',
    async () => {
      await cursorAdapter.write(HOOK_IR, 'project', cwd, {});
      const parsed = readJson(join(cwd, '.cursor', 'hooks.json')) as {
        version?: number;
      };
      expect(parsed.version).toBe(1);
    },
  );

  story(
    'E8.S5',
    'hook events use the verified camelCase names (preToolUse) [CU2]',
    async () => {
      await cursorAdapter.write(HOOK_IR, 'project', cwd, {});
      const parsed = readJson(join(cwd, '.cursor', 'hooks.json')) as {
        hooks?: Record<string, Array<{ command?: string }>>;
      };
      const entries = parsed.hooks?.preToolUse ?? [];
      expect(entries.length).toBe(1);
      expect(entries[0]?.command).toBe('./check.sh');
    },
  );

  // --- Rules .mdc [CU1] ---

  story(
    'E8.S5',
    'rules are written to .cursor/rules/*.mdc, never .md in that dir [CU1]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'style', body: 'Use tabs.', concat: false }],
      };
      await cursorAdapter.write(ir, 'project', cwd, {});
      const rulesDir = join(cwd, '.cursor', 'rules');
      expect(existsSync(join(rulesDir, 'style.mdc'))).toBe(true);
      const mdFiles = existsSync(rulesDir)
        ? readdirSync(rulesDir).filter((f) => f.endsWith('.md'))
        : [];
      expect(mdFiles).toEqual([]);
    },
  );

  story(
    'E8.S5',
    '.cursor/rules/*.mdc fixtures are read (description/globs/alwaysApply) [CU1]',
    async () => {
      mkdirSync(join(cwd, '.cursor', 'rules'), { recursive: true });
      writeFileSync(
        join(cwd, '.cursor', 'rules', 'style.mdc'),
        '---\ndescription: Style rules\nglobs: "src/**"\nalwaysApply: false\n---\n\nUse tabs in src.\n',
        'utf8',
      );
      const re = await cursorAdapter.read('project', cwd);
      expect(
        (re.rules ?? []).some((r) => r.body.includes('Use tabs in src')),
      ).toBe(true);
    },
  );

  // --- Agents [CU3] + commands [CU6] ---

  story(
    'E8.S5',
    'agents emit to .cursor/agents/*.md with documented frontmatter [CU3]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        agents: [
          { name: 'helper', body: 'You help.', description: 'A helper' },
        ],
      };
      await cursorAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, '.cursor', 'agents', 'helper.md'))).toBe(
        true,
      );
    },
  );

  story(
    'E8.S5',
    'commands capability on: .cursor/commands/*.md emitted [CU6]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        commands: [{ name: 'deploy', body: 'Deploy the app.' }],
      };
      await cursorAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, '.cursor', 'commands', 'deploy.md'))).toBe(
        true,
      );
      expect(cursorAdapter.capabilities.resources.commands).not.toBe('none');
    },
  );

  // --- MCP [CU5] ---

  story(
    'E8.S5',
    'remote MCP drops the undocumented type key [CU5]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        mcp_servers: [
          { name: 'remote', transport: 'http', url: 'https://mcp.example.com' },
        ],
      };
      await cursorAdapter.write(ir, 'project', cwd, {});
      const parsed = readJson(join(cwd, '.cursor', 'mcp.json')) as {
        mcpServers?: Record<string, Record<string, unknown>>;
      };
      const entry = parsed.mcpServers?.remote ?? {};
      expect(entry.url).toBe('https://mcp.example.com');
      expect('type' in entry).toBe(false);
    },
  );

  story(
    'E8.S5',
    'root AGENTS.md rules + stdio MCP round-trip (§2 fixture) [CU1][CU5]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'main', body: 'Be terse.' }],
        mcp_servers: [
          {
            name: 'github',
            transport: 'stdio',
            command: 'npx',
            args: ['-y', 'pkg'],
          },
        ],
      };
      await cursorAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
      const re = await cursorAdapter.read('project', cwd);
      expect(re.rules).toEqual(ir.rules);
      expect(re.mcp_servers).toEqual(ir.mcp_servers);
    },
  );

  // --- User-scope rules file [CU1] ---

  story(
    'E8.S5',
    'the UNVERIFIED-as-consumed ~/.cursor/AGENTS.md is no longer written [CU1]',
    async () => {
      const h = useHome();
      const ir: IR = {
        manifest: manifest('user'),
        rules: [{ id: 'main', body: 'Be terse.' }],
      };
      await cursorAdapter.write(ir, 'user', cwd, {});
      expect(existsSync(join(h, '.cursor', 'AGENTS.md'))).toBe(false);
    },
  );
});
