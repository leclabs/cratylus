import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { clineAdapter } from '../../../src/adapters/cline/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';

const manifest = (scope: Manifest['scope'] = 'project'): Manifest => ({
  agentForge: 1,
  scope,
  targets: ['cline'],
});

/** Point $HOME at a fresh tmp dir so a user-scope write/read never touches
 * the real home; mirrors test/stories/helpers.ts `fakeHome` locally (this
 * suite predates the story harness and stays self-contained). */
function fakeHome(): { home: string; restore: () => void } {
  const home = mkdtempSync(join(tmpdir(), 'agent-forge-cline-home-'));
  const prevHome = process.env.HOME;
  process.env.HOME = home;
  return {
    home,
    restore() {
      if (prevHome === undefined) Reflect.deleteProperty(process.env, 'HOME');
      else process.env.HOME = prevHome;
      rmSync(home, { recursive: true, force: true });
    },
  };
}

describe('clineAdapter', () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'agent-forge-cline-'));
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('plain rules concatenate onto root AGENTS.md; glob rules land in .clinerules/', async () => {
    const ir: IR = {
      manifest: manifest(),
      rules: [
        { id: 'main', body: 'Be terse.' },
        { id: 'style', body: 'Two-space indent.', globs: ['src/**'] },
      ],
    };
    await clineAdapter.write(ir, 'project', cwd, {});
    expect(readFileSync(join(cwd, 'AGENTS.md'), 'utf8')).toContain('Be terse.');
    expect(existsSync(join(cwd, '.clinerules', 'style.md'))).toBe(true);
    expect(existsSync(join(cwd, '.clinerules', 'main.md'))).toBe(false);
  });

  it('writes hooks as executable per-event scripts, never .cline/hooks.json', async () => {
    const ir: IR = {
      manifest: manifest(),
      hooks: [
        { id: 'pre-tool', events: ['tool.use.pre'], command: './pre.sh' },
        { id: 'on-start', events: ['session.start'], command: './start.sh' },
      ],
    };
    await clineAdapter.write(ir, 'project', cwd, {});
    const preToolFile = join(cwd, '.clinerules', 'hooks', 'PreToolUse');
    const taskStartFile = join(cwd, '.clinerules', 'hooks', 'TaskStart');
    expect(existsSync(preToolFile)).toBe(true);
    expect(existsSync(taskStartFile)).toBe(true);
    expect(statSync(preToolFile).mode & 0o111).not.toBe(0); // executable
    expect(existsSync(join(cwd, '.cline', 'hooks.json'))).toBe(false);
  });

  it('round-trips rules + hooks at project scope', async () => {
    const ir: IR = {
      manifest: manifest(),
      rules: [{ id: 'main', body: 'Be terse.' }],
      hooks: [
        {
          id: 'fmt',
          events: ['tool.use.post'],
          command: './fmt.sh',
        },
      ],
    };
    await clineAdapter.write(ir, 'project', cwd, {});
    const re = await clineAdapter.read('project', cwd);
    expect(re.rules).toEqual(ir.rules);
    expect(re.hooks?.[0]?.command).toBe('./fmt.sh');
  });

  it('round-trips MCP servers at user scope (the real, CLI-documented target)', async () => {
    const home = fakeHome();
    try {
      const ir: IR = {
        manifest: manifest('user'),
        mcp_servers: [
          {
            name: 'gh',
            transport: 'stdio',
            command: 'npx',
            args: ['-y', 'pkg'],
          },
        ],
      };
      await clineAdapter.write(ir, 'user', cwd, {});
      expect(existsSync(join(home.home, '.cline', 'mcp.json'))).toBe(true);
      const re = await clineAdapter.read('user', cwd);
      expect(re.mcp_servers).toEqual(ir.mcp_servers);
    } finally {
      home.restore();
    }
  });

  it('project-scope MCP is skipped with a named warning, never fabricated', async () => {
    const ir: IR = {
      manifest: manifest(),
      mcp_servers: [
        { name: 'gh', transport: 'stdio', command: 'npx', args: ['-y', 'pkg'] },
      ],
    };
    const report = await clineAdapter.write(ir, 'project', cwd, {});
    expect(existsSync(join(cwd, '.cline', 'mcp.json'))).toBe(false);
    expect(
      report.warnings.some((w) => /globalStorage|extension/i.test(w)),
    ).toBe(true);
  });

  it('emits skills + workflows; warns about agents (no file-config surface)', async () => {
    const ir: IR = {
      manifest: manifest(),
      skills: [{ name: 's', description: 'x', body: 'y' }],
      commands: [{ name: 'c', body: 'b' }],
      agents: [{ name: 'a', body: 'b' }],
    };
    const report = await clineAdapter.write(ir, 'project', cwd, {});
    expect(existsSync(join(cwd, '.cline', 'skills', 's', 'SKILL.md'))).toBe(
      true,
    );
    expect(existsSync(join(cwd, '.clinerules', 'workflows', 'c.md'))).toBe(
      true,
    );
    expect(report.warnings.some((w) => w.includes('agents'))).toBe(true);
  });
});
