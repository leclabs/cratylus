/**
 * E8.S2 · codex — skills home, agent TOML, hooks gate, config keys, MCP shape.
 * Ground truth: harness-landscape-research.RETURN.md §2/Codex, §3/codex d1–d6.
 * Refs [CX1][CX2][CX3][CX4][CX6][CX7].
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import TOML from '@iarna/toml';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { codexAdapter } from '../../../src/adapters/codex/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';
import { fakeHome, makeTmpDir, story } from '../helpers.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['codex'],
});

const readToml = (path: string): Record<string, unknown> =>
  TOML.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;

const SKILL_IR: IR = {
  manifest: manifest(),
  skills: [{ name: 'review', description: 'Review code', body: '# steps' }],
};

describe('E8.S2 · codex', () => {
  let cwd: string;
  let home: { home: string; restore: () => void } | null = null;

  beforeEach(() => {
    cwd = makeTmpDir('af-e8s2-');
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

  // --- Skills home [CX2] ---

  story('E8.S2', 'project skills emit to .agents/skills/ [CX2]', async () => {
    await codexAdapter.write(SKILL_IR, 'project', cwd, {});
    expect(
      existsSync(join(cwd, '.agents', 'skills', 'review', 'SKILL.md')),
    ).toBe(true);
  });

  story('E8.S2', 'nothing is emitted to .codex/skills/ [CX2]', async () => {
    await codexAdapter.write(SKILL_IR, 'project', cwd, {});
    expect(existsSync(join(cwd, '.codex', 'skills'))).toBe(false);
  });

  story('E8.S2', 'user skills emit to ~/.agents/skills/ [CX2]', async () => {
    const h = useHome();
    await codexAdapter.write(
      { ...SKILL_IR, manifest: manifest('user') },
      'user',
      cwd,
      {},
    );
    expect(existsSync(join(h, '.agents', 'skills', 'review', 'SKILL.md'))).toBe(
      true,
    );
  });

  story('E8.S2', 'nothing is emitted to ~/.codex/skills/ [CX2]', async () => {
    const h = useHome();
    await codexAdapter.write(
      { ...SKILL_IR, manifest: manifest('user') },
      'user',
      cwd,
      {},
    );
    expect(existsSync(join(h, '.codex', 'skills'))).toBe(false);
  });

  // --- Agent TOML [CX1] ---

  story(
    'E8.S2',
    'agent TOML uses documented developer_instructions field [CX1]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        agents: [
          {
            name: 'helper',
            body: 'You are helper.',
            description: 'Helps out',
            model: 'gpt-5',
          },
        ],
      };
      await codexAdapter.write(ir, 'project', cwd, {});
      const obj = readToml(join(cwd, '.codex', 'agents', 'helper.toml'));
      expect(obj.developer_instructions).toBe('You are helper.');
      expect(obj.name).toBe('helper');
      expect(obj.description).toBe('Helps out');
    },
  );

  story(
    'E8.S2',
    'agent TOML carries no fabricated system_prompt/tools/color keys [CX1]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        agents: [
          {
            name: 'helper',
            body: 'You are helper.',
            tools: ['Read'],
            color: 'blue',
          },
        ],
      };
      await codexAdapter.write(ir, 'project', cwd, {});
      const obj = readToml(join(cwd, '.codex', 'agents', 'helper.toml'));
      expect('system_prompt' in obj).toBe(false);
      expect('tools' in obj).toBe(false);
      expect('color' in obj).toBe(false);
    },
  );

  // --- Hooks gate + event set [CX4] ---

  story(
    'E8.S2',
    'no fabricated [features] codex_hooks gate is emitted [CX4]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        hooks: [{ id: 'fmt', events: ['tool.use.pre'], command: './check.sh' }],
      };
      await codexAdapter.write(ir, 'project', cwd, {});
      const cfg = readToml(join(cwd, '.codex', 'config.toml'));
      expect(cfg.features).toBeUndefined();
    },
  );

  story(
    'E8.S2',
    'hooks land in [hooks] tables of config.toml with documented event names [CX4]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        hooks: [{ id: 'fmt', events: ['tool.use.pre'], command: './check.sh' }],
      };
      await codexAdapter.write(ir, 'project', cwd, {});
      const cfg = readToml(join(cwd, '.codex', 'config.toml')) as {
        hooks?: Record<string, unknown>;
      };
      expect(cfg.hooks?.PreToolUse).toBeDefined();
    },
  );

  story(
    'E8.S2',
    'event map excludes undocumented PermissionRequest [CX4]',
    () => {
      expect(codexAdapter.eventMap?.['permission.request']).toBeUndefined();
    },
  );

  story(
    'E8.S2',
    'event map covers the documented PreCompact/PostCompact events [CX4]',
    () => {
      expect(codexAdapter.eventMap?.['context.compact.pre']).toBe('PreCompact');
      expect(codexAdapter.eventMap?.['context.compact.post']).toBe(
        'PostCompact',
      );
    },
  );

  // --- Config keys [CX6] ---

  story(
    'E8.S2',
    'no fabricated permissions/env TOML keys are emitted [CX6]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        permissions: { allow: ['Read(*)'] },
        env: { DEBUG: 'true' },
      };
      await codexAdapter.write(ir, 'project', cwd, {});
      const cfgFile = join(cwd, '.codex', 'config.toml');
      const cfg = existsSync(cfgFile) ? readToml(cfgFile) : {};
      expect('permissions' in cfg).toBe(false);
      expect('env' in cfg).toBe(false);
    },
  );

  // --- MCP shape [CX7] ---

  story(
    'E8.S2',
    'remote MCP emits url without the undocumented type key, no SSE [CX7]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        mcp_servers: [
          { name: 'remote', transport: 'http', url: 'https://mcp.example.com' },
        ],
      };
      await codexAdapter.write(ir, 'project', cwd, {});
      const cfg = readToml(join(cwd, '.codex', 'config.toml')) as {
        mcp_servers?: Record<string, Record<string, unknown>>;
      };
      const entry = cfg.mcp_servers?.remote ?? {};
      expect(entry.url).toBe('https://mcp.example.com');
      expect('type' in entry).toBe(false);
    },
  );

  story(
    'E8.S2',
    'rules + stdio MCP round-trip (§2 fixture, E4.S1)',
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
      await codexAdapter.write(ir, 'project', cwd, {});
      const re = await codexAdapter.read('project', cwd);
      expect(re.rules).toEqual(ir.rules);
      expect(re.mcp_servers).toEqual(ir.mcp_servers);
    },
  );

  // --- Read-side lift [CX3] + fabricated import (E1.S3) ---

  story(
    'E8.S2',
    'read lifts AGENTS.override.md over AGENTS.md [CX3]',
    async () => {
      writeFileSync(join(cwd, 'AGENTS.md'), 'BASE rules.\n', 'utf8');
      writeFileSync(
        join(cwd, 'AGENTS.override.md'),
        'OVERRIDE rules.\n',
        'utf8',
      );
      const re = await codexAdapter.read('project', cwd);
      expect(
        (re.rules ?? []).some((r) => r.body.includes('OVERRIDE rules')),
      ).toBe(true);
    },
  );

  story(
    'E8.S2',
    'fabricated-shape import: permissions/env TOML tables lift zero phantom resources (E1.S3) [CX6]',
    async () => {
      const cfgDir = join(cwd, '.codex');
      mkdirSync(cfgDir, { recursive: true });
      writeFileSync(
        join(cfgDir, 'config.toml'),
        '[permissions]\nallow = ["Read(*)"]\n\n[env]\nDEBUG = "1"\n',
        'utf8',
      );
      const re = await codexAdapter.read('project', cwd);
      expect(re.permissions).toBeUndefined();
      expect(re.env).toBeUndefined();
    },
  );
});
