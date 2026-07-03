/**
 * E8.S4 · copilot — hooks dialect, user home, skills dir, agents, prompts.
 * Ground truth: harness-landscape-research.RETURN.md §2/Copilot, §3/copilot d1–d8.
 * Refs [CP1][CP2][CP3][CP4][CP5][CP6][CP8].
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
import { copilotAdapter } from '../../../src/adapters/copilot/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';
import { fakeHome, makeTmpDir, story } from '../helpers.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['copilot'],
});

const readJson = (path: string): Record<string, unknown> =>
  JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;

const HOOK_IR: IR = {
  manifest: manifest(),
  hooks: [{ id: 'guard', events: ['tool.use.pre'], command: './check.sh' }],
};

describe('E8.S4 · copilot', () => {
  let cwd: string;
  let home: { home: string; restore: () => void } | null = null;

  beforeEach(() => {
    cwd = makeTmpDir('af-e8s4-');
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

  // --- Hooks dialect [CP4] ---

  story.tracked(
    'E8.S4',
    'hooks emit to .github/hooks/*.json in the documented {"version":1} camelCase envelope [CP4]',
    async () => {
      await copilotAdapter.write(HOOK_IR, 'project', cwd, {});
      const hooksDir = join(cwd, '.github', 'hooks');
      expect(existsSync(hooksDir)).toBe(true);
      const files = readdirSync(hooksDir).filter((f) => f.endsWith('.json'));
      expect(files.length).toBeGreaterThan(0);
      const first = files[0] as string;
      const parsed = readJson(join(hooksDir, first)) as {
        version?: number;
        hooks?: Record<string, unknown>;
      };
      expect(parsed.version).toBe(1);
      expect(parsed.hooks?.preToolUse).toBeDefined();
    },
  );

  story.tracked(
    'E8.S4',
    'the ".claude/settings.json is parsed by Copilot" premise is deleted [CP4]',
    async () => {
      await copilotAdapter.write(HOOK_IR, 'project', cwd, {});
      expect(existsSync(join(cwd, '.claude', 'settings.json'))).toBe(false);
    },
  );

  story.tracked(
    'E8.S4',
    'event map is re-keyed to the camelCase dialect [CP4]',
    () => {
      expect(copilotAdapter.eventMap?.['tool.use.pre']).toBe('preToolUse');
      expect(copilotAdapter.eventMap?.['session.start']).toBe('sessionStart');
    },
  );

  story.tracked(
    'E8.S4',
    'event map covers documented permissionRequest and errorOccurred [CP4]',
    () => {
      const natives = Object.values(copilotAdapter.eventMap ?? {});
      expect(natives).toContain('permissionRequest');
      expect(natives).toContain('errorOccurred');
    },
  );

  // --- User home [CP8] ---

  story.tracked(
    'E8.S4',
    'user scope lives under ~/.copilot/ (mcp-config.json) [CP8]',
    async () => {
      const h = useHome();
      const ir: IR = {
        manifest: manifest('user'),
        mcp_servers: [
          { name: 'github', transport: 'stdio', command: 'npx', args: ['-y'] },
        ],
      };
      await copilotAdapter.write(ir, 'user', cwd, {});
      expect(existsSync(join(h, '.copilot', 'mcp-config.json'))).toBe(true);
    },
  );

  story.tracked(
    'E8.S4',
    'nothing is emitted under the fabricated ~/.config/github-copilot/ [CP8]',
    async () => {
      const h = useHome();
      const ir: IR = {
        manifest: manifest('user'),
        rules: [{ id: 'main', body: 'Be terse.' }],
        mcp_servers: [
          { name: 'github', transport: 'stdio', command: 'npx', args: ['-y'] },
        ],
      };
      await copilotAdapter.write(ir, 'user', cwd, {});
      expect(existsSync(join(h, '.config', 'github-copilot'))).toBe(false);
    },
  );

  // --- Skills dir [CP2] ---

  story.tracked(
    'E8.S4',
    'repo skills emit to .github/skills/ [CP2]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        skills: [
          { name: 'review', description: 'Review code', body: '# steps' },
        ],
      };
      await copilotAdapter.write(ir, 'project', cwd, {});
      expect(
        existsSync(join(cwd, '.github', 'skills', 'review', 'SKILL.md')),
      ).toBe(true);
    },
  );

  story.tracked(
    'E8.S4',
    'nothing is emitted to the fabricated .copilot/skills/ [CP2]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        skills: [
          { name: 'review', description: 'Review code', body: '# steps' },
        ],
      };
      await copilotAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, '.copilot', 'skills'))).toBe(false);
    },
  );

  // --- Agents [CP1] + prompts [CP5] ---

  story.tracked(
    'E8.S4',
    'agents emit to .github/agents/*.agent.md [CP1]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        agents: [
          { name: 'helper', body: 'You help.', description: 'A helper' },
        ],
      };
      await copilotAdapter.write(ir, 'project', cwd, {});
      expect(
        existsSync(join(cwd, '.github', 'agents', 'helper.agent.md')),
      ).toBe(true);
    },
  );

  story.tracked(
    'E8.S4',
    'commands emit as prompt files .github/prompts/*.prompt.md [CP5]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        commands: [{ name: 'deploy', body: 'Deploy the app.' }],
      };
      await copilotAdapter.write(ir, 'project', cwd, {});
      expect(
        existsSync(join(cwd, '.github', 'prompts', 'deploy.prompt.md')),
      ).toBe(true);
      expect(copilotAdapter.capabilities.resources.commands).not.toBe('none');
    },
  );

  // --- Already-correct surfaces ---

  story(
    'E8.S4',
    'root AGENTS.md is a documented rules surface and is emitted [CP3]',
    async () => {
      const ir: IR = {
        manifest: manifest(),
        rules: [{ id: 'main', body: 'Be terse.' }],
      };
      await copilotAdapter.write(ir, 'project', cwd, {});
      expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
    },
  );

  story(
    'E8.S4',
    'VS Code MCP emits .vscode/mcp.json under servers and round-trips [CP6]',
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
      await copilotAdapter.write(ir, 'project', cwd, {});
      const parsed = readJson(join(cwd, '.vscode', 'mcp.json')) as {
        servers?: Record<string, unknown>;
      };
      expect(parsed.servers?.github).toBeDefined();
      const re = await copilotAdapter.read('project', cwd);
      expect(re.rules).toEqual(ir.rules);
      expect(re.mcp_servers).toEqual(ir.mcp_servers);
    },
  );

  // --- Fabricated-shape import (E1.S3) ---

  story.tracked(
    'E8.S4',
    'fabricated-shape import: ~/.config/github-copilot fixture lifts zero phantom resources (E1.S3) [CP8]',
    async () => {
      const h = useHome();
      const root = join(h, '.config', 'github-copilot');
      mkdirSync(root, { recursive: true });
      writeFileSync(join(root, 'AGENTS.md'), 'Phantom rules.\n', 'utf8');
      writeFileSync(
        join(root, 'mcp.json'),
        JSON.stringify({ servers: { ghost: { command: 'npx' } } }),
        'utf8',
      );
      const re = await copilotAdapter.read('user', cwd);
      expect(re.rules ?? []).toEqual([]);
      expect(re.mcp_servers ?? []).toEqual([]);
    },
  );
});
