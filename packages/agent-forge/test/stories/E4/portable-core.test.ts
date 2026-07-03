/**
 * E4.S7 — shared-core IR compiles everywhere warning-free.
 *
 * The portable core is DOCUMENTED here as PORTABLE_CORE and the fixture is
 * generated from that documentation — doc drift breaks the fixture story.
 * Core: plain rules (id+body only), spec-core SKILL.md fields
 * (name/description/body [S3]), stdio mcp {command,args,env}, no hooks.
 */

import { rmSync } from 'node:fs';
import { afterEach, describe, expect } from 'vitest';

import { compile } from '../../../src/core/index.js';
import type { IR } from '../../../src/core/index.js';
import { ALL_ADAPTERS, makeTmpDir, story } from '../helpers.js';

/** The documented portable-core field set (E4.S7 bullet 2). */
const PORTABLE_CORE = {
  rule: ['id', 'body'],
  skill: ['name', 'description', 'body'],
  mcpStdio: ['name', 'transport', 'command', 'args', 'env'],
} as const;

/** Fixture VALUES per documented field; the fixture is assembled from
 * PORTABLE_CORE keys so an undocumented field cannot sneak in. */
const FIELD_VALUES: Record<string, Record<string, unknown>> = {
  rule: { id: 'main', body: '# Conventions\n\nKeep functions small.' },
  skill: {
    name: 'review',
    description: 'Review code',
    body: '# Review\n\nRead the diff.',
  },
  mcpStdio: {
    name: 'github',
    transport: 'stdio',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_TOKEN: 'xxx' },
  },
};

function fromDoc(kind: keyof typeof PORTABLE_CORE): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of PORTABLE_CORE[kind]) {
    const value = FIELD_VALUES[kind][field];
    if (value === undefined)
      throw new Error(`no fixture value for documented field ${kind}.${field}`);
    out[field] = value;
  }
  return out;
}

function portableIR(): IR {
  return {
    manifest: {
      agentForge: 1,
      scope: 'project',
      targets: ALL_ADAPTERS.map((a) => a.id),
    },
    rules: [fromDoc('rule') as NonNullable<IR['rules']>[number]],
    skills: [fromDoc('skill') as NonNullable<IR['skills']>[number]],
    mcp_servers: [
      fromDoc('mcpStdio') as NonNullable<IR['mcp_servers']>[number],
    ],
  };
}

/**
 * Targets that compile the portable core clean today. claude-surfaces
 * (2026-07), disclosed: claude REMOVED — a concat rule's CLAUDE.md now
 * always carries the informational @AGENTS.md-shim advisory [S7]
 * (round-trip.test.ts), so it is no longer warning-free for any
 * rules-bearing compile; the loss is real but permanent/by-design, not a
 * regression to bite on. amp/kilo/zed (wave-5/6 roster additions) join here —
 * clean on this fixture.
 */
const CLEAN_TARGETS = [
  'amp',
  'codex',
  'copilot',
  'crush',
  'cursor',
  'gemini',
  'kilo',
  'opencode',
  'zed',
] as const;

const cleanups: string[] = [];
afterEach(() => {
  for (const dir of cleanups.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('E4.S7 · portable core', () => {
  story(
    'E4.S7',
    'fixture is generated from the documented portable-core field set',
    () => {
      expect(Object.keys(fromDoc('rule')).sort()).toEqual(
        [...PORTABLE_CORE.rule].sort(),
      );
      expect(Object.keys(fromDoc('skill')).sort()).toEqual(
        [...PORTABLE_CORE.skill].sort(),
      );
      expect(Object.keys(fromDoc('mcpStdio')).sort()).toEqual(
        [...PORTABLE_CORE.mcpStdio].sort(),
      );
      const ir = portableIR();
      expect(ir.hooks).toBeUndefined();
      expect(ir.agents).toBeUndefined();
      expect(ir.commands).toBeUndefined();
    },
  );

  story(
    'E4.S7',
    'clean-today targets stay clean (bites on regression)',
    async () => {
      const cwd = makeTmpDir('af-e4s7-');
      cleanups.push(cwd);
      const adapters = ALL_ADAPTERS.filter((a) =>
        (CLEAN_TARGETS as readonly string[]).includes(a.id),
      );
      expect(adapters).toHaveLength(CLEAN_TARGETS.length);
      const report = await compile(portableIR(), adapters, 'project', cwd, {});
      for (const r of report.results) {
        expect(r.report?.warnings, `${r.adapter} warnings`).toEqual([]);
        expect(r.report?.skipped, `${r.adapter} skipped`).toEqual([]);
      }
    },
  );

  /**
   * The full 16-adapter roster's portable-core noise, each entry a
   * permanent/by-design dialect property — not a bug to silently hide:
   * aider/continue have no skills surface at all [AI1][CT3]; aider/pi/
   * standards have no (or an intentionally-omitted [PI2]) MCP surface
   * [AI5]; cline's MCP is real at user/CLI scope only, never project [CL6];
   * devin's MCP config is user-global-only, never project-scope [WS5]; pi
   * additionally warns that project-scope emissions are inert until the
   * folder is trusted [PI2]; claude's concat rule imports `@AGENTS.md` per
   * Anthropic's own documented shim [S7]. Graduation (convergence-graduation,
   * 2026-07) asserts this DOCUMENTED-warning contract, not a literal zero —
   * an adapter surfacing any warning/skip NOT listed here is undocumented
   * and fails loudly.
   */
  const DOCUMENTED_NOISE: Record<
    string,
    { warnings: readonly string[]; skipped: readonly string[] }
  > = {
    aider: {
      warnings: [
        'skills: Aider has no skills support (1 skipped)',
        'mcp: Aider has no MCP support (1 skipped)',
      ],
      skipped: ['skills/review'],
    },
    claude: {
      warnings: [
        "claude: CLAUDE.md's managed region imports @AGENTS.md — rule bodies are not duplicated there [S7]; author/emit AGENTS.md separately (hand-maintained, or an AGENTS.md-native target in this compile) so the import resolves",
      ],
      skipped: [],
    },
    cline: {
      warnings: [
        "mcp: no documented project-scope MCP surface — the extension reads VS Code globalStorage (cline_mcp_settings.json), not .cline/mcp.json; the CLI's user-scope override is the only documented file (1 server(s) skipped) [CL6]",
      ],
      skipped: ['mcp/github'],
    },
    continue: {
      warnings: ['skills: Continue has no skills support (1 skipped)'],
      skipped: ['skills/review'],
    },
    devin: {
      warnings: [
        'mcp: Windsurf MCP config is user-global only (~/.codeium/windsurf/mcp_config.json); not written at project scope [WS5]',
      ],
      skipped: ['mcp/github'],
    },
    pi: {
      warnings: [
        'mcp: pi omits MCP by design (1 skipped); the designated route is an extension [PI2]',
        'trust: project-scope emissions under .pi/ and .agents/skills/ are inert until the folder is trusted — decisions persist in ~/.pi/agent/trust.json [PI2]',
      ],
      skipped: ['mcp/github'],
    },
    standards: {
      warnings: [
        'mcp: no documented neutral-standards surface — dropped, nothing fabricated',
      ],
      skipped: ['mcp/github'],
    },
  };

  story(
    'E4.S7',
    'all 16 targets compile the portable core against the documented-warning contract exactly (zero UNDOCUMENTED warnings/skips; aider drops skills+mcp [AI1][AI5]; cline warns on undocumented project-scope MCP [CL6]; continue drops skills [CT3]; devin MCP is user-global-only [WS5]; pi omits MCP by design + warns on trust [PI2]; standards has no neutral MCP surface; claude warns the informational @AGENTS.md-shim advisory [S7])',
    async () => {
      const cwd = makeTmpDir('af-e4s7-all-');
      cleanups.push(cwd);
      const report = await compile(
        portableIR(),
        ALL_ADAPTERS,
        'project',
        cwd,
        {},
      );
      for (const r of report.results) {
        const expected = DOCUMENTED_NOISE[r.adapter] ?? {
          warnings: [],
          skipped: [],
        };
        expect(r.report?.warnings ?? [], `${r.adapter} warnings`).toEqual(
          expected.warnings,
        );
        expect(
          (r.report?.skipped ?? []).map((s) => s.path),
          `${r.adapter} skipped paths`,
        ).toEqual(expected.skipped);
      }
    },
  );
});
