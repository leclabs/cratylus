import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { continueAdapter } from '../../../src/adapters/continue/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';

const manifest = (): Manifest => ({
  agentForge: 1,
  scope: 'project',
  targets: ['continue'],
});

describe('continueAdapter', () => {
  let cwd: string;
  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'agent-forge-continue-'));
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('writes .continue/rules/*.md and .continue/mcpServers/mcp.json [CT2][CT4]', async () => {
    const ir: IR = {
      manifest: manifest(),
      rules: [{ id: 'main', body: 'Be terse.' }],
      mcp_servers: [
        { name: 'gh', transport: 'stdio', command: 'npx', args: ['-y', 'pkg'] },
      ],
    };
    await continueAdapter.write(ir, 'project', cwd, {});
    expect(existsSync(join(cwd, '.continue', 'rules', 'main.md'))).toBe(true);
    expect(existsSync(join(cwd, '.continue', 'mcpServers', 'mcp.json'))).toBe(
      true,
    );
    // The undocumented root AGENTS.md write is gone [CT2].
    expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(false);
  });

  it('round-trips rules + commands + mcp', async () => {
    const ir: IR = {
      manifest: manifest(),
      rules: [{ id: 'main', body: 'Be terse.' }],
      commands: [{ name: 'deploy', body: 'Deploy the app.' }],
      mcp_servers: [
        { name: 'gh', transport: 'stdio', command: 'npx', args: ['-y', 'pkg'] },
      ],
    };
    await continueAdapter.write(ir, 'project', cwd, {});
    const re = await continueAdapter.read('project', cwd);
    expect(re.rules).toEqual(ir.rules);
    expect(re.commands).toEqual(ir.commands);
    expect(re.mcp_servers).toEqual(ir.mcp_servers);
  });

  it('warns about hooks/skills/agents (unsupported); commands are supported [CT3]', async () => {
    const ir: IR = {
      manifest: manifest(),
      hooks: [{ id: 'h', events: ['turn.end'], command: 'x' }],
      skills: [{ name: 's', description: 'x', body: 'y' }],
      agents: [{ name: 'a', body: 'You are a.' }],
      commands: [{ name: 'c', body: 'b' }],
    };
    const report = await continueAdapter.write(ir, 'project', cwd, {});
    expect(report.warnings.length).toBeGreaterThanOrEqual(3);
    expect(report.written).toContain(join(cwd, '.continue', 'prompts', 'c.md'));
  });
});
