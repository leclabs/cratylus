/**
 * E8.S8 · crush — MCP + hooks inside crush.json, global context paths.
 * Ground truth: harness-landscape-research.RETURN.md §2/Crush, §3/crush d1–d6.
 * Refs [CR1][CR2][CR3].
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
import { crushAdapter } from '../../../src/adapters/crush/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';
import { fakeHome, makeTmpDir, story } from '../helpers.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['crush'],
});

const readJson = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;

/** crush.json may live at either documented project filename [CR1]. */
function readProjectCrushConfig(cwd: string): Record<string, unknown> | null {
  for (const name of ['crush.json', '.crush.json']) {
    const p = join(cwd, name);
    if (existsSync(p)) return readJson(p);
  }
  return null;
}

describe('E8.S8 · crush', () => {
  let cwd: string;
  let home: { home: string; restore: () => void } | null = null;

  beforeEach(() => {
    cwd = makeTmpDir('af-e8s8-');
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

  // --- MCP inside crush.json [CR1] ---

  story.tracked(
    'E8.S8',
    'MCP lives under the mcp key of crush.json with required-style type [CR1]',
    async () => {
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
      await crushAdapter.write(ir, 'project', cwd, {});
      const cfg = readProjectCrushConfig(cwd) as {
        mcp?: Record<string, { type?: string }>;
      } | null;
      expect(cfg).not.toBeNull();
      expect(cfg?.mcp?.github?.type).toBe('stdio');
    },
  );

  story.tracked(
    'E8.S8',
    'the fabricated .crush/mcp.json is never emitted [CR1]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        mcp_servers: [
          { name: 'github', transport: 'stdio', command: 'npx', args: ['-y'] },
        ],
      };
      await crushAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, '.crush', 'mcp.json'))).toBe(false);
    },
  );

  // --- Hooks on [CR3] + permissions [CR1] ---

  story.tracked(
    'E8.S8',
    'hooks capability on: hooks.PreToolUse lands in crush.json [CR3]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        hooks: [
          {
            id: 'guard',
            events: ['tool.use.pre'],
            matcher: '^bash$',
            command: './check.sh',
          },
        ],
      };
      await crushAdapter.write(ir, 'project', cwd, {});
      const cfg = readProjectCrushConfig(cwd) as {
        hooks?: { PreToolUse?: Array<{ command?: string }> };
      } | null;
      expect(cfg?.hooks?.PreToolUse?.[0]?.command).toBe('./check.sh');
    },
  );

  story.tracked(
    'E8.S8',
    'permissions capability reflects permissions.allowed_tools [CR1]',
    () => {
      expect(crushAdapter.capabilities.resources.permissions).not.toBe('none');
    },
  );

  // --- Global context paths [CR1][CR2] ---

  story.tracked(
    'E8.S8',
    'user rules emit to ~/.config/crush/CRUSH.md (or ~/.config/AGENTS.md) [CR1][CR2]',
    async () => {
      const h = useHome();
      const ir: IR = {
        manifest: manifest('user'),
        rules: [{ id: 'main', body: 'Be terse.' }],
      };
      await crushAdapter.write(ir, 'user', cwd, {});
      const documented =
        existsSync(join(h, '.config', 'crush', 'CRUSH.md')) ||
        existsSync(join(h, '.config', 'AGENTS.md'));
      expect(documented).toBe(true);
    },
  );

  story.tracked(
    'E8.S8',
    'the fabricated ~/.config/crush/AGENTS.md is not written [CR1]',
    async () => {
      const h = useHome();
      const ir: IR = {
        manifest: manifest('user'),
        rules: [{ id: 'main', body: 'Be terse.' }],
      };
      await crushAdapter.write(ir, 'user', cwd, {});
      expect(existsSync(join(h, '.config', 'crush', 'AGENTS.md'))).toBe(false);
    },
  );

  // --- Already-correct surfaces ---

  story(
    'E8.S8',
    'project rules (root AGENTS.md, a default context_path) + skills round-trip [CR2][CR1]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'main', body: 'Be terse.' }],
        skills: [
          { name: 'review', description: 'Review code', body: '# steps' },
        ],
      };
      await crushAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
      expect(
        existsSync(join(cwd, '.crush', 'skills', 'review', 'SKILL.md')),
      ).toBe(true);
      const re = await crushAdapter.read('project', cwd);
      expect(re.rules).toEqual(ir.rules);
      expect(re.skills).toEqual(ir.skills);
    },
  );

  // --- Fabricated-shape import (E1.S3) ---

  story.tracked(
    'E8.S8',
    'fabricated-shape import: .crush/mcp.json lifts zero phantom servers (E1.S3) [CR1]',
    async () => {
      mkdirSync(join(cwd, '.crush'), { recursive: true });
      writeFileSync(
        join(cwd, '.crush', 'mcp.json'),
        JSON.stringify({ mcpServers: { ghost: { command: 'npx' } } }),
        'utf8',
      );
      const re = await crushAdapter.read('project', cwd);
      expect(re.mcp_servers ?? []).toEqual([]);
    },
  );
});
