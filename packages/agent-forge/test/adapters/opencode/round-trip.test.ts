import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { opencodeAdapter } from '../../../src/adapters/opencode/index.js';
import type { IR, Manifest } from '../../../src/core/index.js';

const manifest = (): Manifest => ({
  agentForge: 1,
  scope: 'project',
  targets: ['opencode'],
});

describe('opencodeAdapter', () => {
  let cwd: string;

  beforeEach(() => {
    cwd = mkdtempSync(join(tmpdir(), 'agent-forge-oc-'));
  });
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true });
  });

  it('detect() returns true when AGENTS.md or .opencode/ exists', async () => {
    expect(await opencodeAdapter.detect('project', cwd)).toBe(false);
    writeFileSync(join(cwd, 'AGENTS.md'), '# rules', 'utf8');
    expect(await opencodeAdapter.detect('project', cwd)).toBe(true);
  });

  it('writes AGENTS.md from rules', async () => {
    const ir: IR = {
      manifest: manifest(),
      rules: [{ id: 'main', body: '# Rules\n\nBe terse.' }],
    };
    const report = await opencodeAdapter.write(ir, 'project', cwd, {});
    expect(report.warnings).toEqual([]);
    expect(existsSync(join(cwd, 'AGENTS.md'))).toBe(true);
    expect(readFileSync(join(cwd, 'AGENTS.md'), 'utf8')).toContain('Be terse');
  });

  it('writes hooks as YAML manifest + JS shim', async () => {
    const ir: IR = {
      manifest: manifest(),
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
    const report = await opencodeAdapter.write(ir, 'project', cwd, {});
    expect(report.warnings).toEqual([]);
    expect(
      existsSync(join(cwd, '.opencode', 'plugins', 'agent-forge-hooks.yaml')),
    ).toBe(true);
    expect(
      existsSync(join(cwd, '.opencode', 'plugins', 'agent-forge-hooks.ts')),
    ).toBe(true);

    const shim = readFileSync(
      join(cwd, '.opencode', 'plugins', 'agent-forge-hooks.ts'),
      'utf8',
    );
    expect(shim).toContain('tool.execute.after'); // canonical → opencode mapping applied
    expect(shim).toContain('./fmt.sh');
  });

  it('warns + skips hooks that have no opencode equivalent', async () => {
    const ir: IR = {
      manifest: manifest(),
      hooks: [
        // Claude-only event; no opencode mapping
        { id: 'noisy', events: ['subagent.start'], command: 'echo' },
      ],
    };
    const report = await opencodeAdapter.write(ir, 'project', cwd, {});
    expect(report.warnings.length).toBeGreaterThan(0);
    expect(report.skipped.length).toBeGreaterThan(0);
    expect(
      existsSync(join(cwd, '.opencode', 'plugins', 'agent-forge-hooks.ts')),
    ).toBe(false);
  });

  it('round-trips rules + hooks via the YAML sidecar', async () => {
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
  });

  // opencode-adapter-truth (2026-07): commands + agents are real surfaces
  // (.opencode/commands/*.md [OC4], .opencode/agents/*.md [OC2]), not
  // unsupported — this test used to pin the fabricated "opencode has no
  // commands/agents" warning; it now pins the corrected write.
  it('writes commands + agents (which opencode natively supports) [OC2][OC4]', async () => {
    const ir: IR = {
      manifest: manifest(),
      commands: [{ name: 'c', body: 'b' }],
      agents: [{ name: 'a', body: 'b' }],
    };
    const report = await opencodeAdapter.write(ir, 'project', cwd, {});
    expect(existsSync(join(cwd, '.opencode', 'commands', 'c.md'))).toBe(true);
    expect(existsSync(join(cwd, '.opencode', 'agents', 'a.md'))).toBe(true);
    // The agent had no IR mode; opencode's frontmatter requires the field, so
    // the adapter defaults it — and discloses the default, never fabricates
    // silently.
    expect(
      readFileSync(join(cwd, '.opencode', 'agents', 'a.md'), 'utf8'),
    ).toContain('mode:');
    expect(report.warnings.some((w) => w.includes('mode'))).toBe(true);
    expect(report.warnings.some((w) => w.includes('no subagent system'))).toBe(
      false,
    );
    expect(
      report.warnings.some((w) => w.includes('no slash-command system')),
    ).toBe(false);
  });

  // opencode-adapter-truth (2026-07): the ONE config home is opencode.json —
  // mcp under its "mcp" key [OC7], permission under its "permission" key
  // [OC8]; the .opencode/{mcp,permissions,env}.json sidecars this test used
  // to assert are fabricated paths, never written. env has no documented
  // surface at all [OC1] — skipped with a warning, never emitted.
  it('writes skills + opencode.json (mcp, permission); no fabricated sidecars, no env.json (Phase 2)', async () => {
    const ir: IR = {
      manifest: manifest(),
      skills: [
        {
          name: 'review',
          description: 'Review code',
          body: '# steps',
          allowed_tools: ['Read'],
        },
      ],
      mcp_servers: [
        {
          name: 'github',
          transport: 'stdio',
          command: 'npx',
          args: ['-y', 'pkg'],
        },
      ],
      permissions: { allow: ['Read(*)'] },
      env: { DEBUG: 'true' },
    };
    const report = await opencodeAdapter.write(ir, 'project', cwd, {});
    expect(
      existsSync(join(cwd, '.opencode', 'skills', 'review', 'SKILL.md')),
    ).toBe(true);
    expect(existsSync(join(cwd, '.opencode', 'mcp.json'))).toBe(false);
    expect(existsSync(join(cwd, '.opencode', 'permissions.json'))).toBe(false);
    expect(existsSync(join(cwd, '.opencode', 'env.json'))).toBe(false);
    const config = JSON.parse(
      readFileSync(join(cwd, 'opencode.json'), 'utf8'),
    ) as {
      mcp?: Record<string, unknown>;
      permission?: Record<string, unknown>;
    };
    expect(config.mcp?.github).toBeDefined();
    expect(config.permission).toBeDefined();
    // Skill with allowed_tools triggers a 'opencode ignores allowed_tools' warning.
    expect(report.warnings.some((w) => w.includes('allowed_tools'))).toBe(true);
    // env has no documented surface — skipped with a warning, not written.
    expect(report.warnings.some((w) => w.includes('env'))).toBe(true);
  });

  it('round-trips Phase-2 resources (skills, mcp); env has no surface and never round-trips', async () => {
    const ir: IR = {
      manifest: manifest(),
      skills: [{ name: 'review', description: 'Review code', body: '# steps' }],
      mcp_servers: [
        {
          name: 'github',
          transport: 'stdio',
          command: 'npx',
          args: ['-y', 'pkg'],
        },
      ],
      env: { DEBUG: 'true', NODE_ENV: 'development' },
    };
    await opencodeAdapter.write(ir, 'project', cwd, {});
    const re = await opencodeAdapter.read('project', cwd);
    expect(re.skills).toEqual(ir.skills);
    expect(re.mcp_servers).toEqual(ir.mcp_servers);
    expect(re.env).toBeUndefined();
  });
});
