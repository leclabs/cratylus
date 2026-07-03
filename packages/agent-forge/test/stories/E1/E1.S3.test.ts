/**
 * E1.S3 · fabricated paths are never read as truth.
 *
 * Per §3-documented fabricated read path, the fixture contains ONLY that
 * path (none of the documented surfaces). Documented behavior: the import
 * yields ZERO resources of the affected type and the report warns naming
 * the unrecognized path. Today every one of these paths IS read as truth
 * (phantom resources) and no warning artifact exists — both bullets are
 * tracked, split so each gap graduates independently.
 */

import { expect } from 'vitest';
import { runImport } from '../../../src/cli/commands/import.js';
import { type IR, type Scope, readIR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, story } from '../helpers.js';
import { captured, put, scratch, skillMd } from './util.js';

const fx = scratch();

interface FabricatedSpec {
  client: string;
  scope: Scope;
  /** The fabricated path as the story P names it. */
  path: string;
  /** Exact-string fragment a compliant warning must carry. */
  warnFragment: string;
  ref: string;
  resource: string;
  count: (ir: IR) => number;
  build: (cwd: string, home: string) => void;
}

const SPECS: readonly FabricatedSpec[] = [
  {
    client: 'opencode',
    scope: 'project',
    path: '.opencode/mcp.json',
    warnFragment: '.opencode/mcp.json',
    ref: '[OC7]',
    resource: 'mcp_servers',
    count: (ir) => ir.mcp_servers?.length ?? 0,
    build: (cwd) => {
      put(
        cwd,
        '.opencode/mcp.json',
        JSON.stringify({ mcpServers: { phantom: { command: 'npx' } } }),
      );
    },
  },
  {
    client: 'cline',
    scope: 'project',
    path: '.cline/hooks.json',
    warnFragment: '.cline/hooks.json',
    ref: '[CL2]',
    resource: 'hooks',
    count: (ir) => ir.hooks?.length ?? 0,
    build: (cwd) => {
      put(
        cwd,
        '.cline/hooks.json',
        JSON.stringify({
          hooks: {
            PreToolUse: [
              { hooks: [{ type: 'command', command: './phantom.sh' }] },
            ],
          },
        }),
      );
    },
  },
  {
    client: 'copilot',
    scope: 'user',
    path: '~/.config/github-copilot/*',
    warnFragment: '.config/github-copilot',
    ref: '[CP8]',
    resource: 'rules+skills+mcp_servers',
    count: (ir) =>
      (ir.rules?.length ?? 0) +
      (ir.skills?.length ?? 0) +
      (ir.mcp_servers?.length ?? 0),
    build: (_cwd, home) => {
      put(home, '.config/github-copilot/AGENTS.md', 'PHANTOM-RULE\n');
      put(home, '.config/github-copilot/skills/s1/SKILL.md', skillMd('s1'));
      put(
        home,
        '.config/github-copilot/mcp.json',
        JSON.stringify({ mcpServers: { phantom: { command: 'npx' } } }),
      );
    },
  },
  {
    client: 'copilot',
    scope: 'project',
    path: '.copilot/skills/',
    warnFragment: '.copilot/skills',
    ref: '[CP2]',
    resource: 'skills',
    count: (ir) => ir.skills?.length ?? 0,
    build: (cwd) => {
      put(cwd, '.copilot/skills/s1/SKILL.md', skillMd('s1'));
    },
  },
  {
    client: 'cline',
    scope: 'user',
    path: '~/.cline/rules',
    warnFragment: '.cline/rules',
    ref: '[CL1]',
    resource: 'rules',
    count: (ir) => ir.rules?.length ?? 0,
    build: (_cwd, home) => {
      put(home, '.cline/rules/r.md', 'PHANTOM-RULE\n');
    },
  },
  {
    client: 'crush',
    scope: 'project',
    path: '.crush/mcp.json',
    warnFragment: '.crush/mcp.json',
    ref: '[CR1]',
    resource: 'mcp_servers',
    count: (ir) => ir.mcp_servers?.length ?? 0,
    build: (cwd) => {
      put(
        cwd,
        '.crush/mcp.json',
        JSON.stringify({ mcpServers: { phantom: { command: 'npx' } } }),
      );
    },
  },
  {
    client: 'cursor',
    scope: 'user',
    path: '~/.cursor/AGENTS.md',
    warnFragment: '.cursor/AGENTS.md',
    ref: '[CU1]',
    resource: 'rules',
    count: (ir) => ir.rules?.length ?? 0,
    build: (_cwd, home) => {
      put(home, '.cursor/AGENTS.md', 'PHANTOM-RULE\n');
    },
  },
];

async function runSpec(spec: FabricatedSpec): Promise<{ out: string; ir: IR }> {
  const home = fx.home();
  const cwd = fx.tmp();
  spec.build(cwd, home);
  const { code, out } = await captured(() =>
    runImport({ client: spec.client, scope: spec.scope, cwd }, ALL_ADAPTERS),
  );
  expect(code).toBe(0);
  const ir = await readIR(spec.scope, cwd);
  return { out, ir };
}

/**
 * Every fabricated path's read retirement has landed (convergence-graduation,
 * 2026-07: cursor's user-scope `~/.cursor/AGENTS.md` read was the last read
 * side still consulting one — read.ts is now project-scope-only for that
 * file, E8.S5) — the adapter never consults any of these paths, so the
 * zero-lift leg holds for every spec.
 */
for (const spec of SPECS) {
  story(
    'E1.S3',
    `${spec.client} ${spec.path}: zero ${spec.resource} imported from the fabricated path ${spec.ref}`,
    async () => {
      const { ir } = await runSpec(spec);
      expect(
        spec.count(ir),
        `phantom ${spec.resource} imported from ${spec.path}`,
      ).toBe(0);
    },
  );
}

/**
 * The import report now names every documented-fabricated path still present
 * on disk (convergence-graduation, 2026-07: `auditImport`'s new `fabricated`
 * leg, wired through `runImport`'s console output).
 */
for (const spec of SPECS) {
  story(
    'E1.S3',
    `${spec.client} ${spec.path}: import report warns naming the unrecognized path ${spec.ref}`,
    async () => {
      const { out } = await runSpec(spec);
      expect(out).toContain(spec.warnFragment);
    },
  );
}
