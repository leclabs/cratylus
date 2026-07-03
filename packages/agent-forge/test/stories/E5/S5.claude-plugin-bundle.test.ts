/**
 * E5.S5 — Claude plugin as a bundling target.
 *
 * Documented truth: one IR (skills + agents + hooks + mcp servers) compiles —
 * via a `--as-plugin <name>` / manifest-override mode — to a distributable
 * Claude plugin: `.claude-plugin/plugin.json` (`name` required [CC4]) +
 * `skills/` + `agents/` + `hooks/hooks.json` + `.mcp.json`, matching the
 * documented component layout [CC4][CC5], with `${CLAUDE_PLUGIN_ROOT}` for
 * intra-plugin paths; the dir passes Claude Code's own structural validation.
 *
 * claude-surfaces (2026-07), forced/disclosed: the mode is a dedicated
 * export (`writeClaudePlugin`), not a `claudeAdapter.write()` opts flag — a
 * plugin bundle is a distinct compile MODE (own output tree, own entry
 * point), not a per-scope dialect emission `write()` already owns. The two
 * call sites below were probes written before that shape was settled;
 * updated to call the real entry point. The CLI reaches it via
 * `compile --as-plugin <name>` (`src/cli/commands/compile.ts`).
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, expect } from 'vitest';
import * as claudeMod from '../../../src/adapters/claude/index.js';
import type { IR } from '../../../src/core/index.js';
import { makeTmpDir, story } from '../helpers.js';

/** One IR carrying all four plugin-bundlable resource kinds. */
const fullIR: IR = {
  manifest: { agentForge: 1, scope: 'project', targets: ['claude'] },
  skills: [
    {
      name: 'demo-cell',
      description: 'a demo skill for plugin bundling',
      body: '# demo-cell\n\nBody.\n',
    },
  ],
  agents: [
    {
      name: 'scout',
      description: 'a demo subagent',
      body: 'You are scout.',
    },
  ],
  hooks: [
    {
      id: 'guard',
      events: ['tool.use.pre'],
      matcher: '*',
      command: 'echo guard',
    },
  ],
  mcp_servers: [
    {
      name: 'demo-mcp',
      transport: 'stdio',
      command: 'demo-mcp-server',
    },
  ],
};

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story(
  'E5.S5',
  'a full IR compiles to the documented Claude plugin tree: .claude-plugin/plugin.json + skills/ + agents/ + hooks/hooks.json + .mcp.json [CC4][CC5]',
  async () => {
    await claudeMod.writeClaudePlugin(fullIR, cwd, 'demo-plugin');
    // Probe: neither a plugin-mode export on the adapter module nor a
    // .claude-plugin manifest in the output exists today.
    const pluginSurface = Object.keys(claudeMod).filter((m) =>
      /plugin/i.test(m),
    );
    const manifestPath = join(cwd, '.claude-plugin', 'plugin.json');
    expect(
      existsSync(manifestPath) || pluginSurface.length > 0,
      `no --as-plugin bundling mode: no .claude-plugin/plugin.json emitted and no plugin-mode member on the claude adapter module (searched exports: ${Object.keys(claudeMod).join(', ')})`,
    ).toBe(true);
    // The documented component layout, once the mode lands:
    expect(existsSync(join(cwd, 'skills', 'demo-cell', 'SKILL.md'))).toBe(true);
    expect(existsSync(join(cwd, 'agents', 'scout.md'))).toBe(true);
    expect(existsSync(join(cwd, 'hooks', 'hooks.json'))).toBe(true);
    expect(existsSync(join(cwd, '.mcp.json'))).toBe(true);
  },
);

story(
  'E5.S5',
  'the emitted plugin dir passes structural validation: plugin.json carries the required name [CC4] and hooks use ${CLAUDE_PLUGIN_ROOT}',
  async () => {
    await claudeMod.writeClaudePlugin(fullIR, cwd, 'demo-plugin');
    const manifestPath = join(cwd, '.claude-plugin', 'plugin.json');
    expect(
      existsSync(manifestPath),
      'no .claude-plugin/plugin.json — the bundling mode is absent',
    ).toBe(true);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      name?: string;
    };
    // `name` is the one required plugin.json field [CC4].
    expect(typeof manifest.name).toBe('string');
    expect((manifest.name as string).length).toBeGreaterThan(0);
    // Intra-plugin paths use the documented substitution.
    const hooks = readFileSync(join(cwd, 'hooks', 'hooks.json'), 'utf8');
    expect(hooks).toContain('${CLAUDE_PLUGIN_ROOT}');
  },
);
