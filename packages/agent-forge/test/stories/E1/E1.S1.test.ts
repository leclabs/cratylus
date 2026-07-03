/**
 * E1.S1 · claude full-surface lift — lift an existing Claude Code install
 * into IR with nothing dropped silently.
 *
 * Fixture per §2/Claude-Code (harness-landscape-research.RETURN.md): fake
 * $HOME `~/.claude/CLAUDE.md`; project `CLAUDE.md` + `CLAUDE.local.md`;
 * `.claude/agents/one.md` (frontmatter incl. `permissionMode`);
 * `.claude/skills/s1/SKILL.md`; `.claude/settings.json`
 * (permissions+env+hooks — NO `mcpServers` key: settings.json carries only
 * MCP policy [CC8]); `.mcp.json` (one stdio, one http server) [CC7].
 * Decoy files at undocumented paths guard the surface-set bullet.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect } from 'vitest';
import { runImport } from '../../../src/cli/commands/import.js';
import { runLint } from '../../../src/cli/commands/lint.js';
import { readIR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, story } from '../helpers.js';
import { captured, put, scratch, skillMd } from './util.js';

const fx = scratch();

const USER_HOME_MARKER = 'USER-HOME-RULE-MARKER';
const AGENT_BODY = 'You are one. Plan tasks, then stop.';

function buildFixture(cwd: string, home: string): void {
  // user scope (fake $HOME) — documented user surface [CC1]
  put(home, '.claude/CLAUDE.md', `# User memory\n\n${USER_HOME_MARKER}\n`);

  // project scope — documented surfaces [CC1][CC2][CC3][CC7][CC8]
  put(cwd, 'CLAUDE.md', '# Project rules\n\nCLAUDE-RULE-MARKER: be terse.\n');
  put(cwd, 'CLAUDE.local.md', '# Local overrides\n\nLOCAL-RULE-MARKER\n');
  put(
    cwd,
    '.claude/agents/one.md',
    `---\nname: one\ndescription: Plans tasks\nmodel: inherit\npermissionMode: acceptEdits\n---\n${AGENT_BODY}`,
  );
  put(cwd, '.claude/skills/s1/SKILL.md', skillMd('s1'));
  put(
    cwd,
    '.claude/settings.json',
    JSON.stringify(
      {
        permissions: { allow: ['Read(*)'], deny: ['Bash(rm -rf:*)'] },
        env: { DEBUG: 'true' },
        hooks: {
          PreToolUse: [
            {
              matcher: 'Edit|Write',
              hooks: [
                { type: 'command', command: './scripts/guard.sh', timeout: 30 },
              ],
            },
          ],
        },
      },
      null,
      2,
    ),
  );
  put(
    cwd,
    '.mcp.json',
    JSON.stringify(
      {
        mcpServers: {
          github: {
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-github'],
            env: { GITHUB_TOKEN: 'x' },
          },
          linear: { type: 'http', url: 'https://mcp.linear.app/mcp' },
        },
      },
      null,
      2,
    ),
  );

  // decoys at UNdocumented paths — must never become resources [CC7][CC8]
  put(
    cwd,
    '.claude/mcp.json',
    JSON.stringify({
      mcpServers: { 'phantom-mcp-server': { command: 'npx' } },
    }),
  );
  put(
    cwd,
    '.claude/hooks.json',
    JSON.stringify({
      hooks: {
        PreToolUse: [
          { hooks: [{ type: 'command', command: './phantom-hook.sh' }] },
        ],
      },
    }),
  );
}

story(
  'E1.S1',
  'import claude exits 0 and lifts rule/agent/skill/hook/2 mcp/permissions/env; lint passes',
  async () => {
    const home = fx.home();
    const cwd = fx.tmp();
    buildFixture(cwd, home);

    const imp = await captured(() =>
      runImport({ client: 'claude', scope: 'project', cwd }, ALL_ADAPTERS),
    );
    expect(imp.code).toBe(0);

    const ir = await readIR('project', cwd);
    expect(ir.rules?.length ?? 0).toBeGreaterThanOrEqual(1);
    expect(ir.agents?.map((a) => a.name)).toEqual(['one']);
    expect(ir.skills?.map((s) => s.name)).toEqual(['s1']);
    expect(ir.hooks?.length ?? 0).toBeGreaterThanOrEqual(1);
    expect(ir.mcp_servers?.map((s) => s.name).sort()).toEqual([
      'github',
      'linear',
    ]);
    expect(ir.permissions?.allow).toEqual(['Read(*)']);
    expect(ir.permissions?.deny).toEqual(['Bash(rm -rf:*)']);
    expect(ir.env).toEqual({ DEBUG: 'true' });

    const root = join(cwd, '.agent-forge');
    expect(existsSync(join(root, 'permissions.yaml'))).toBe(true);
    expect(existsSync(join(root, 'env.yaml'))).toBe(true);
    expect(existsSync(join(root, 'mcp', 'servers.yaml'))).toBe(true);

    const lint = await captured(() =>
      runLint({ scope: 'project', cwd }, ALL_ADAPTERS),
    );
    expect(lint.code).toBe(0);
  },
);

story.tracked(
  'E1.S1',
  'import report names every unrepresentable source field (agent permissionMode: path + field)',
  async () => {
    const home = fx.home();
    const cwd = fx.tmp();
    buildFixture(cwd, home);

    const { code, out } = await captured(() =>
      runImport({ client: 'claude', scope: 'project', cwd }, ALL_ADAPTERS),
    );
    expect(code).toBe(0);
    // Documented truth [CC2]: agent frontmatter carries permissionMode; the IR
    // cannot represent it, so the import report must name it. No import-report
    // artifact exists today — runImport prints resource counts only.
    expect(out).toContain('permissionMode');
  },
);

story(
  'E1.S1',
  'zero resources sourced from paths outside the documented §2/Claude-Code surface set',
  async () => {
    const home = fx.home();
    const cwd = fx.tmp();
    buildFixture(cwd, home);

    const { code } = await captured(() =>
      runImport({ client: 'claude', scope: 'project', cwd }, ALL_ADAPTERS),
    );
    expect(code).toBe(0);

    const ir = await readIR('project', cwd);
    const flat = JSON.stringify(ir);
    // decoys at undocumented paths never materialize
    expect(flat).not.toContain('phantom-mcp-server');
    expect(flat).not.toContain('phantom-hook.sh');
    // user-scope memory never leaks into a project-scope import
    for (const rule of ir.rules ?? []) {
      expect(rule.body).not.toContain(USER_HOME_MARKER);
    }
  },
);
