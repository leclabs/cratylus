/**
 * E8.S1 · claude — MCP homes + hook model + rules surfaces.
 * Ground truth: harness-landscape-research.RETURN.md §2/Claude-Code, §3/claude.
 * Refs [CC1][CC6][CC7][CC8].
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
import { claudeAdapter } from '../../../src/adapters/claude/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';
import { fakeHome, makeTmpDir, story } from '../helpers.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['claude'],
});

const readJson = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;

const MCP_IR: IR = {
  manifest: manifest(),
  mcp_servers: [
    { name: 'github', transport: 'stdio', command: 'npx', args: ['-y', 'pkg'] },
  ],
};

describe('E8.S1 · claude', () => {
  let cwd: string;
  let home: { home: string; restore: () => void } | null = null;

  beforeEach(() => {
    cwd = makeTmpDir('af-e8s1-');
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

  // --- MCP homes [CC7][CC8] ---

  story.tracked(
    'E8.S1',
    'project-scope MCP servers emit to .mcp.json at repo root [CC7]',
    async () => {
      await claudeAdapter.write(MCP_IR, 'project', cwd, {});
      const mcpFile = join(cwd, '.mcp.json');
      expect(existsSync(mcpFile)).toBe(true);
      const parsed = readJson(mcpFile) as {
        mcpServers?: Record<string, unknown>;
      };
      expect(parsed.mcpServers?.github).toBeDefined();
    },
  );

  story.tracked(
    'E8.S1',
    'mcpServers never appears in settings.json — policy keys only [CC8]',
    async () => {
      const ir: IR = { ...MCP_IR, permissions: { allow: ['Read(*)'] } };
      await claudeAdapter.write(ir, 'project', cwd, {});
      const settingsFile = join(cwd, '.claude', 'settings.json');
      const settings = existsSync(settingsFile) ? readJson(settingsFile) : {};
      expect('mcpServers' in settings).toBe(false);
    },
  );

  story.tracked(
    'E8.S1',
    'user-scope MCP servers emit to ~/.claude.json [CC7]',
    async () => {
      const h = useHome();
      await claudeAdapter.write(
        { ...MCP_IR, manifest: manifest('user') },
        'user',
        cwd,
        {},
      );
      expect(existsSync(join(h, '.claude.json'))).toBe(true);
    },
  );

  story.tracked(
    'E8.S1',
    'user-scope settings.json carries no mcpServers key [CC8]',
    async () => {
      const h = useHome();
      await claudeAdapter.write(
        { ...MCP_IR, manifest: manifest('user') },
        'user',
        cwd,
        {},
      );
      const settingsFile = join(h, '.claude', 'settings.json');
      const settings = existsSync(settingsFile) ? readJson(settingsFile) : {};
      expect('mcpServers' in settings).toBe(false);
    },
  );

  story(
    'E8.S1',
    'settings.json carries the documented policy keys permissions + env [CC8]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        permissions: { allow: ['Read(*)'], deny: ['Bash(rm *)'] },
        env: { DEBUG: 'true' },
      };
      await claudeAdapter.write(ir, 'project', cwd, {});
      const settings = readJson(join(cwd, '.claude', 'settings.json')) as {
        permissions?: { allow?: string[] };
        env?: Record<string, string>;
      };
      expect(settings.permissions?.allow).toEqual(['Read(*)']);
      expect(settings.env).toEqual({ DEBUG: 'true' });
    },
  );

  // --- Hook model [CC6] ---

  story.tracked(
    'E8.S1',
    'hook capability declares regex matchers, not glob [CC6]',
    () => {
      expect(claudeAdapter.capabilities.hooks.matchers).not.toBe('glob');
    },
  );

  story.tracked(
    'E8.S1',
    'non-command hook types (prompt) are lifted, not silently dropped [CC6]',
    async () => {
      mkdirSync(join(cwd, '.claude'), { recursive: true });
      writeFileSync(
        join(cwd, '.claude', 'settings.json'),
        JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                matcher: 'Bash',
                hooks: [{ type: 'prompt', prompt: 'Verify safety first' }],
              },
            ],
          },
        }),
        'utf8',
      );
      const re = await claudeAdapter.read('project', cwd);
      expect((re.hooks ?? []).length).toBeGreaterThan(0);
    },
  );

  story.tracked(
    'E8.S1',
    'hook fields if/env round-trip through read → write [CC6]',
    async () => {
      mkdirSync(join(cwd, '.claude'), { recursive: true });
      writeFileSync(
        join(cwd, '.claude', 'settings.json'),
        JSON.stringify({
          hooks: {
            PreToolUse: [
              {
                matcher: 'Bash',
                if: 'Bash(git *)',
                hooks: [
                  {
                    type: 'command',
                    command: './check.sh',
                    env: { STRICT: '1' },
                  },
                ],
              },
            ],
          },
        }),
        'utf8',
      );
      const re = await claudeAdapter.read('project', cwd);
      // Precondition (holds today): the command hook itself lifts.
      expect((re.hooks ?? []).length).toBeGreaterThan(0);
      const cwd2 = makeTmpDir('af-e8s1-rt-');
      try {
        await claudeAdapter.write(
          { manifest: manifest(), hooks: re.hooks },
          'project',
          cwd2,
          {},
        );
        const out = readFileSync(
          join(cwd2, '.claude', 'settings.json'),
          'utf8',
        );
        expect(out).toContain('"if"');
        expect(out).toContain('"STRICT"');
      } finally {
        rmSync(cwd2, { recursive: true, force: true });
      }
    },
  );

  // --- Rules surfaces [CC1] ---

  story.tracked(
    'E8.S1',
    '.claude/rules/*.md with paths: frontmatter is read [CC1]',
    async () => {
      mkdirSync(join(cwd, '.claude', 'rules'), { recursive: true });
      writeFileSync(
        join(cwd, '.claude', 'rules', 'style.md'),
        '---\npaths:\n  - "src/**"\n---\n\nUse tabs in src.\n',
        'utf8',
      );
      const re = await claudeAdapter.read('project', cwd);
      expect(
        (re.rules ?? []).some((r) => r.body.includes('Use tabs in src')),
      ).toBe(true);
    },
  );

  story.tracked(
    'E8.S1',
    'non-concat rules are written to .claude/rules/*.md [CC1]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'style', body: 'Use tabs.', concat: false }],
      };
      await claudeAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, '.claude', 'rules', 'style.md'))).toBe(true);
    },
  );

  story.tracked(
    'E8.S1',
    'local-scope rules emit to CLAUDE.local.md [CC1]',
    async () => {
      const ir: IR = {
        manifest: manifest('local'),
        rules: [{ id: 'main', body: 'Local only.' }],
      };
      await claudeAdapter.write(ir, 'local', cwd, {});
      expect(existsSync(join(cwd, 'CLAUDE.local.md'))).toBe(true);
    },
  );

  story.tracked(
    'E8.S1',
    '.claude/CLAUDE.md alt location is read [CC1]',
    async () => {
      mkdirSync(join(cwd, '.claude'), { recursive: true });
      writeFileSync(
        join(cwd, '.claude', 'CLAUDE.md'),
        'Alt-location rules.\n',
        'utf8',
      );
      const re = await claudeAdapter.read('project', cwd);
      expect(
        (re.rules ?? []).some((r) => r.body.includes('Alt-location rules')),
      ).toBe(true);
    },
  );

  story.tracked(
    'E8.S1',
    'CLAUDE.md writes are non-destructive to hand-maintained content (E3.S5) [CC1]',
    async () => {
      writeFileSync(
        join(cwd, 'CLAUDE.md'),
        '# Hand notes\n\nkeep me around\n',
        'utf8',
      );
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'main', body: 'Generated rules.' }],
      };
      await claudeAdapter.write(ir, 'project', cwd, {});
      const text = readFileSync(join(cwd, 'CLAUDE.md'), 'utf8');
      expect(text).toContain('keep me around');
      expect(text).toContain('Generated rules.');
    },
  );

  story(
    'E8.S1',
    'project rules file is CLAUDE.md, never AGENTS.md [CC1]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'main', body: 'Be terse.' }],
      };
      await claudeAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, 'CLAUDE.md'))).toBe(true);
      expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(false);
    },
  );

  story(
    'E8.S1',
    'local scope settings target settings.local.json [CC8]',
    async () => {
      const ir: IR = {
        manifest: manifest('local'),
        permissions: { allow: ['Read(*)'] },
      };
      await claudeAdapter.write(ir, 'local', cwd, {});
      expect(existsSync(join(cwd, '.claude', 'settings.local.json'))).toBe(
        true,
      );
    },
  );

  story.tracked(
    'E8.S1',
    'fabricated-shape import: settings.json-only mcpServers lifts zero phantom servers (E1.S3) [CC8]',
    async () => {
      mkdirSync(join(cwd, '.claude'), { recursive: true });
      writeFileSync(
        join(cwd, '.claude', 'settings.json'),
        JSON.stringify({
          mcpServers: { ghost: { command: 'npx', args: ['-y', 'ghost'] } },
        }),
        'utf8',
      );
      const re = await claudeAdapter.read('project', cwd);
      expect(re.mcp_servers ?? []).toEqual([]);
    },
  );
});
