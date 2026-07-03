/**
 * E8.S6 · opencode — MCP in opencode.json, agents+commands on, permission key.
 * Ground truth: harness-landscape-research.RETURN.md §2/opencode, §3/opencode d1–d5.
 * Refs [OC1][OC2][OC4][OC5][OC7][OC8].
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
import { opencodeAdapter } from '../../../src/adapters/opencode/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';
import { makeTmpDir, story } from '../helpers.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['opencode'],
});

const readJson = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;

/** Plugin event names verified in current opencode docs [OC5]. */
const UNVERIFIED_PLUGIN_EVENTS = new Set([
  'session.deleted',
  'session.idle',
  'permission.asked',
  'permission.replied',
  'tui.toast.show',
  'file.watcher.updated',
  'command.executed',
  'session.compacted',
]);

describe('E8.S6 · opencode', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = makeTmpDir('af-e8s6-');
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  // --- MCP dialect [OC7] ---

  story.tracked(
    'E8.S6',
    'MCP lives under the mcp key of opencode.json, typed local, command as ARRAY [OC7]',
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
      await opencodeAdapter.write(ir, 'project', cwd, {});
      const cfgFile = join(cwd, 'opencode.json');
      expect(existsSync(cfgFile)).toBe(true);
      const cfg = readJson(cfgFile) as {
        mcp?: Record<
          string,
          { type?: string; command?: unknown; enabled?: boolean }
        >;
      };
      const entry = cfg.mcp?.github;
      expect(entry?.type).toBe('local');
      expect(Array.isArray(entry?.command)).toBe(true);
    },
  );

  story.tracked(
    'E8.S6',
    'the fabricated .opencode/mcp.json is never emitted [OC7]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        mcp_servers: [
          { name: 'github', transport: 'stdio', command: 'npx', args: ['-y'] },
        ],
      };
      await opencodeAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, '.opencode', 'mcp.json'))).toBe(false);
    },
  );

  // --- Agents + commands on [OC2][OC4] ---

  story.tracked(
    'E8.S6',
    'agents capability on: .opencode/agents/*.md with mode field [OC2]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        agents: [
          { name: 'helper', body: 'You help.', description: 'A helper' },
        ],
      };
      await opencodeAdapter.write(ir, 'project', cwd, {});
      const agentFile = join(cwd, '.opencode', 'agents', 'helper.md');
      expect(existsSync(agentFile)).toBe(true);
      expect(readFileSync(agentFile, 'utf8')).toContain('mode:');
    },
  );

  story.tracked(
    'E8.S6',
    'commands capability on: .opencode/commands/*.md emitted [OC4]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        commands: [{ name: 'deploy', body: 'Deploy the app.' }],
      };
      await opencodeAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, '.opencode', 'commands', 'deploy.md'))).toBe(
        true,
      );
      expect(opencodeAdapter.capabilities.resources.commands).not.toBe('none');
    },
  );

  // --- Permission key, no env.json [OC8][OC1] ---

  story.tracked(
    'E8.S6',
    'no permissions.json; IR permissions map to the permission DSL in opencode.json [OC8]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        permissions: { allow: ['Read(*)'], deny: ['Bash(rm *)'] },
      };
      await opencodeAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, '.opencode', 'permissions.json'))).toBe(
        false,
      );
      const cfgFile = join(cwd, 'opencode.json');
      const cfg = existsSync(cfgFile) ? readJson(cfgFile) : {};
      expect('permission' in cfg).toBe(true);
    },
  );

  story.tracked(
    'E8.S6',
    'no fabricated env.json is emitted [OC1]',
    async () => {
      const ir: IR = { manifest: manifest(), env: { DEBUG: 'true' } };
      await opencodeAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, '.opencode', 'env.json'))).toBe(false);
    },
  );

  // --- Hook shim event names [OC5] ---

  story.tracked(
    'E8.S6',
    'hook-plugin shim maps only [OC5]-verified event names (E5.S4)',
    () => {
      const natives = Object.values(opencodeAdapter.eventMap ?? {}).filter(
        (v): v is string => typeof v === 'string',
      );
      const unverified = natives.filter((v) => UNVERIFIED_PLUGIN_EVENTS.has(v));
      expect(unverified).toEqual([]);
    },
  );

  // --- Already-correct surfaces ---

  story(
    'E8.S6',
    'rules + hooks round-trip via AGENTS.md and the plugin sidecar (E4.S1) [OC3][OC5]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'main', body: 'Be terse.' }],
        hooks: [
          {
            id: 'fmt',
            events: ['tool.use.post'],
            matcher: 'Edit',
            command: './fmt.sh',
            timeout: 15,
          },
        ],
      };
      await opencodeAdapter.write(ir, 'project', cwd, {});
      const re = await opencodeAdapter.read('project', cwd);
      expect(re.rules).toEqual(ir.rules);
      expect(re.hooks).toEqual(ir.hooks);
    },
  );

  // --- Fabricated-shape import (E1.S3) ---

  story.tracked(
    'E8.S6',
    'fabricated-shape import: .opencode/{mcp,permissions,env}.json lift zero phantom resources (E1.S3) [OC7][OC8][OC1]',
    async () => {
      const dir = join(cwd, '.opencode');
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        join(dir, 'mcp.json'),
        JSON.stringify({ mcpServers: { ghost: { command: 'npx' } } }),
        'utf8',
      );
      writeFileSync(
        join(dir, 'permissions.json'),
        JSON.stringify({ allow: ['Read(*)'] }),
        'utf8',
      );
      writeFileSync(
        join(dir, 'env.json'),
        JSON.stringify({ DEBUG: '1' }),
        'utf8',
      );
      const re = await opencodeAdapter.read('project', cwd);
      expect(re.mcp_servers ?? []).toEqual([]);
      expect(re.permissions).toBeUndefined();
      expect(re.env).toBeUndefined();
    },
  );
});
