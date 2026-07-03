import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import TOML from '@iarna/toml';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { codexAdapter } from '../../../src/adapters/codex/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';

const manifest = (): Manifest => ({
  agentForge: 1,
  scope: 'project',
  targets: ['codex'],
});

describe('codexAdapter', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'agent-forge-codex-'));
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('writes AGENTS.md, .codex/config.toml, prompts, agents, skills', async () => {
    const ir: IR = {
      manifest: manifest(),
      rules: [{ id: 'main', body: '# Rules\n\nBe terse.' }],
      commands: [{ name: 'plan', body: 'Plan tasks' }],
      agents: [
        { name: 'planner', body: 'You are the planner.', model: 'gpt-5' },
      ],
      skills: [{ name: 'review', description: 'Review code', body: '# steps' }],
      hooks: [
        {
          id: 'pre-bash',
          events: ['tool.use.pre'],
          matcher: 'Bash',
          command: './pre.sh',
        },
      ],
      mcp_servers: [
        { name: 'gh', transport: 'stdio', command: 'npx', args: ['-y', 'pkg'] },
      ],
    };
    const report = await codexAdapter.write(ir, 'project', cwd, {});
    expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
    expect(existsSync(join(cwd, '.codex', 'config.toml'))).toBe(true);
    expect(existsSync(join(cwd, '.codex', 'prompts', 'plan.md'))).toBe(true);
    expect(existsSync(join(cwd, '.codex', 'agents', 'planner.toml'))).toBe(
      true,
    );
    // Skills land in .agents/skills/, NOT .codex/skills/ [CX2].
    expect(
      existsSync(join(cwd, '.agents', 'skills', 'review', 'SKILL.md')),
    ).toBe(true);
    expect(existsSync(join(cwd, '.codex', 'skills'))).toBe(false);

    const toml = readFileSync(join(cwd, '.codex', 'config.toml'), 'utf8');
    // No fabricated `[features] codex_hooks` gate [CX4].
    expect(toml).not.toContain('codex_hooks');
    expect(toml).toContain('Bash');
    expect(report.warnings).toEqual([]);
  });

  it('warns when a tool.use.* hook uses a non-Bash matcher', async () => {
    const ir: IR = {
      manifest: manifest(),
      hooks: [
        {
          id: 'edit',
          events: ['tool.use.post'],
          matcher: 'Edit|Write',
          command: './fmt.sh',
        },
      ],
    };
    const report = await codexAdapter.write(ir, 'project', cwd, {});
    expect(report.warnings.some((w) => w.includes('ineffective'))).toBe(true);
  });

  it('drops hooks with no Codex event equivalent', async () => {
    const ir: IR = {
      manifest: manifest(),
      hooks: [{ id: 'idle', events: ['agent.idle'], command: 'echo' }],
    };
    const report = await codexAdapter.write(ir, 'project', cwd, {});
    expect(report.skipped.length).toBe(1);
    expect(report.warnings.some((w) => w.includes('agent.idle'))).toBe(true);
  });

  it('round-trips rules + commands + skills + mcp', async () => {
    const ir: IR = {
      manifest: manifest(),
      rules: [{ id: 'main', body: 'Be terse.' }],
      commands: [{ name: 'plan', body: 'Plan tasks', description: 'planning' }],
      skills: [{ name: 'review', description: 'Review code', body: '# steps' }],
      mcp_servers: [
        { name: 'gh', transport: 'stdio', command: 'npx', args: ['-y', 'pkg'] },
      ],
    };
    await codexAdapter.write(ir, 'project', cwd, {});
    const re = await codexAdapter.read('project', cwd);
    expect(re.rules).toEqual(ir.rules);
    expect(re.commands).toEqual(ir.commands);
    expect(re.skills).toEqual(ir.skills);
    expect(re.mcp_servers).toEqual(ir.mcp_servers);
  });

  it('env has no documented Codex TOML shape: dropped with a named warning, not fabricated [CX6]', async () => {
    const ir: IR = { manifest: manifest(), env: { DEBUG: 'true' } };
    const report = await codexAdapter.write(ir, 'project', cwd, {});
    expect(existsSync(join(cwd, '.codex', 'config.toml'))).toBe(false);
    expect(report.warnings.some((w) => w.includes('env'))).toBe(true);
    const re = await codexAdapter.read('project', cwd);
    expect(re.env).toBeUndefined();
  });

  it('round-trips agents through TOML (name/description/model/body — no tools/color surface)', async () => {
    const ir: IR = {
      manifest: manifest(),
      agents: [
        {
          name: 'planner',
          body: 'You plan.',
          description: 'plans',
          model: 'gpt-5',
        },
      ],
    };
    await codexAdapter.write(ir, 'project', cwd, {});
    const re = await codexAdapter.read('project', cwd);
    expect(re.agents).toEqual(ir.agents);
  });

  it('agent tools/color are dropped with a named warning, not fabricated [CX1]', async () => {
    const ir: IR = {
      manifest: manifest(),
      agents: [
        {
          name: 'planner',
          body: 'You plan.',
          tools: ['Read', 'Grep'],
          color: 'blue',
        },
      ],
    };
    const report = await codexAdapter.write(ir, 'project', cwd, {});
    expect(report.warnings.some((w) => w.includes('tools'))).toBe(true);
    expect(report.warnings.some((w) => w.includes('color'))).toBe(true);
    const obj = TOML.parse(
      readFileSync(join(cwd, '.codex', 'agents', 'planner.toml'), 'utf8'),
    ) as Record<string, unknown>;
    expect('tools' in obj).toBe(false);
    expect('color' in obj).toBe(false);
  });
});
