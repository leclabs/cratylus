import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cursorAdapter } from '../../../src/adapters/cursor/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';

const manifest = (): Manifest => ({
  agentForge: 1,
  scope: 'project',
  targets: ['cursor'],
});

describe('cursorAdapter', () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'agent-forge-cursor-'));
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('writes AGENTS.md, skills, hooks, MCP', async () => {
    const ir: IR = {
      manifest: manifest(),
      rules: [{ id: 'main', body: 'Be terse.' }],
      skills: [{ name: 'review', description: 'Review code', body: '# steps' }],
      hooks: [
        {
          id: 'pre-tool',
          events: ['tool.use.pre'],
          matcher: 'Edit',
          command: './pre.sh',
        },
        {
          id: 'shell-pre',
          events: ['shell.exec.pre'],
          command: './shell-pre.sh',
        },
      ],
      mcp_servers: [
        { name: 'gh', transport: 'stdio', command: 'npx', args: ['-y', 'pkg'] },
      ],
    };
    const report = await cursorAdapter.write(ir, 'project', cwd, {});
    expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
    expect(
      existsSync(join(cwd, '.cursor', 'skills', 'review', 'SKILL.md')),
    ).toBe(true);
    expect(existsSync(join(cwd, '.cursor', 'hooks.json'))).toBe(true);
    expect(existsSync(join(cwd, '.cursor', 'mcp.json'))).toBe(true);

    const hooks = JSON.parse(
      readFileSync(join(cwd, '.cursor', 'hooks.json'), 'utf8'),
    );
    expect(hooks.hooks.preToolUse).toBeDefined(); // tool.use.pre → preToolUse
    expect(hooks.hooks.beforeShellExecution).toBeDefined(); // shell.exec.pre → beforeShellExecution
    expect(report.warnings).toEqual([]);
  });

  it('round-trips rules + skills + mcp + hooks', async () => {
    const ir: IR = {
      manifest: manifest(),
      rules: [{ id: 'main', body: 'Be terse.' }],
      skills: [{ name: 'review', description: 'Review code', body: '# steps' }],
      mcp_servers: [
        { name: 'gh', transport: 'stdio', command: 'npx', args: ['-y', 'pkg'] },
      ],
      hooks: [
        {
          id: 'fmt',
          events: ['tool.use.post'],
          matcher: 'Edit',
          command: './fmt.sh',
          timeout: 30,
        },
      ],
    };
    await cursorAdapter.write(ir, 'project', cwd, {});
    const re = await cursorAdapter.read('project', cwd);
    expect(re.rules).toEqual(ir.rules);
    expect(re.skills).toEqual(ir.skills);
    expect(re.mcp_servers).toEqual(ir.mcp_servers);
    expect(re.hooks?.[0]?.events).toEqual(['tool.use.post']);
    expect(re.hooks?.[0]?.command).toBe('./fmt.sh');
  });

  it('writes commands (capability now partial, not none [CU6]) and still warns about env', async () => {
    const ir: IR = {
      manifest: manifest(),
      commands: [{ name: 'c', body: 'b' }],
      env: { X: 'y' },
    };
    const report = await cursorAdapter.write(ir, 'project', cwd, {});
    // .cursor/commands/*.md is a real, documented surface [CU6] — the
    // adapter-truth fix (E8.S5) writes it instead of warning it away.
    expect(existsSync(join(cwd, '.cursor', 'commands', 'c.md'))).toBe(true);
    expect(report.warnings.some((w) => w.includes('commands'))).toBe(false);
    // env still has no documented Cursor surface.
    expect(report.warnings.some((w) => w.includes('env'))).toBe(true);
  });
});
