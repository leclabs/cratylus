import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { claudeAdapter } from '../../src/adapters/claude/index.js';
import { codexAdapter } from '../../src/adapters/codex/index.js';
import { copilotAdapter } from '../../src/adapters/copilot/index.js';
import { geminiAdapter } from '../../src/adapters/gemini/index.js';
import { opencodeAdapter } from '../../src/adapters/opencode/index.js';
import type { IR, Manifest } from '../../src/core/index.js';

const adapters = [
  claudeAdapter,
  opencodeAdapter,
  codexAdapter,
  geminiAdapter,
  copilotAdapter,
];

const manifest = (): Manifest => ({
  agentForge: 1,
  scope: 'project',
  targets: adapters.map((a) => a.id),
});

const fullIR = (): IR => ({
  manifest: manifest(),
  rules: [{ id: 'main', body: '# Project rules\n\nBe terse.' }],
  skills: [
    {
      name: 'review',
      description: 'Review code',
      body: '# steps',
      allowed_tools: ['Read'],
    },
  ],
  commands: [{ name: 'plan', body: 'Plan the work.', description: 'planning' }],
  agents: [{ name: 'planner', body: 'You plan.', model: 'gpt-5' }],
  hooks: [
    {
      id: 'fmt',
      events: ['tool.use.post'],
      matcher: 'Edit',
      command: './fmt.sh',
      timeout: 30,
    },
    { id: 'stop', events: ['turn.end'], command: 'notify-send done' },
  ],
  mcp_servers: [
    { name: 'gh', transport: 'stdio', command: 'npx', args: ['-y', 'pkg'] },
  ],
  permissions: { allow: ['Read(*)'], deny: ['Bash(rm -rf:*)'] },
  env: { DEBUG: 'true' },
});

describe('Phase 2 cross-adapter portability', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'agent-forge-port2-'));
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('compiles a full IR to all 5 adapters', async () => {
    const ir = fullIR();
    for (const adapter of adapters) {
      const subDir = join(cwd, adapter.id);
      // Each adapter writes into its own subdirectory so outputs don't collide
      const fs = await import('node:fs/promises');
      await fs.mkdir(subDir, { recursive: true });
      const report = await adapter.write(ir, 'project', subDir, {});
      expect(report.written.length).toBeGreaterThan(0);
    }
  });

  it('claude emits all 8 resource types (its declared full coverage)', async () => {
    const subDir = join(cwd, 'claude');
    const fs = await import('node:fs/promises');
    await fs.mkdir(subDir, { recursive: true });
    const report = await claudeAdapter.write(fullIR(), 'project', subDir, {});
    expect(existsSync(join(subDir, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(join(subDir, '.claude', 'settings.json'))).toBe(true);
    expect(existsSync(join(subDir, '.claude', 'commands', 'plan.md'))).toBe(
      true,
    );
    expect(existsSync(join(subDir, '.claude', 'agents', 'planner.md'))).toBe(
      true,
    );
    expect(
      existsSync(join(subDir, '.claude', 'skills', 'review', 'SKILL.md')),
    ).toBe(true);
    expect(report.warnings).toEqual([]);
    expect(report.skipped).toEqual([]);
  });

  // opencode-adapter-truth (2026-07): commands [OC4] + agents [OC2] are real
  // surfaces (this test used to pin the fabricated "unsupported" warning);
  // env has no documented surface at all [OC1] and is the one that's now
  // warned-and-skipped; mcp/permission land in the one config home,
  // opencode.json, not a fabricated .opencode/mcp.json sidecar [OC7][OC8].
  it('opencode emits commands + agents + mcp/permission in opencode.json; warns about env (unsupported)', async () => {
    const subDir = join(cwd, 'opencode');
    const fs = await import('node:fs/promises');
    await fs.mkdir(subDir, { recursive: true });
    const report = await opencodeAdapter.write(fullIR(), 'project', subDir, {});
    expect(report.warnings.some((w) => w.includes('env'))).toBe(true);
    expect(
      existsSync(join(subDir, '.opencode', 'skills', 'review', 'SKILL.md')),
    ).toBe(true);
    expect(existsSync(join(subDir, '.opencode', 'commands', 'plan.md'))).toBe(
      true,
    );
    expect(existsSync(join(subDir, '.opencode', 'agents', 'planner.md'))).toBe(
      true,
    );
    expect(existsSync(join(subDir, '.opencode', 'mcp.json'))).toBe(false);
    expect(existsSync(join(subDir, '.opencode', 'env.json'))).toBe(false);
    const config = JSON.parse(
      await fs.readFile(join(subDir, 'opencode.json'), 'utf8'),
    ) as {
      mcp?: Record<string, unknown>;
      permission?: Record<string, unknown>;
    };
    expect(config.mcp?.gh).toBeDefined();
    expect(config.permission).toBeDefined();
  });

  it('codex emits TOML config + prompts/agents/skills', async () => {
    const subDir = join(cwd, 'codex');
    const fs = await import('node:fs/promises');
    await fs.mkdir(subDir, { recursive: true });
    await codexAdapter.write(fullIR(), 'project', subDir, {});
    expect(existsSync(join(subDir, '.codex', 'config.toml'))).toBe(true);
    expect(existsSync(join(subDir, '.codex', 'prompts', 'plan.md'))).toBe(true);
    expect(existsSync(join(subDir, '.codex', 'agents', 'planner.toml'))).toBe(
      true,
    );
  });

  it('gemini emits settings.json with mapped event names', async () => {
    const subDir = join(cwd, 'gemini');
    const fs = await import('node:fs/promises');
    await fs.mkdir(subDir, { recursive: true });
    await geminiAdapter.write(fullIR(), 'project', subDir, {});
    expect(existsSync(join(subDir, '.gemini', 'settings.json'))).toBe(true);
    const settings = JSON.parse(
      await fs.readFile(join(subDir, '.gemini', 'settings.json'), 'utf8'),
    );
    // tool.use.post → AfterTool, turn.end → AfterAgent
    expect(settings.hooks.AfterTool).toBeDefined();
    expect(settings.hooks.AfterAgent).toBeDefined();
  });

  it('copilot warns about permissions; emits AGENTS.md, skills, mcp, hooks, agents, prompts [CP1][CP5]', async () => {
    const subDir = join(cwd, 'copilot');
    const fs = await import('node:fs/promises');
    await fs.mkdir(subDir, { recursive: true });
    const report = await copilotAdapter.write(fullIR(), 'project', subDir, {});
    expect(report.warnings.some((w) => w.includes('permissions'))).toBe(true);
    expect(existsSync(join(subDir, 'AGENTS.md'))).toBe(true);
    expect(existsSync(join(subDir, '.vscode', 'mcp.json'))).toBe(true);
    expect(
      existsSync(join(subDir, '.github', 'agents', 'planner.agent.md')),
    ).toBe(true);
    expect(
      existsSync(join(subDir, '.github', 'prompts', 'plan.prompt.md')),
    ).toBe(true);
  });

  it('every adapter exposes an eventMap for the events command', () => {
    for (const a of adapters) {
      expect(a.eventMap).toBeDefined();
      expect(Object.keys(a.eventMap!).length).toBeGreaterThan(0);
    }
  });
});
