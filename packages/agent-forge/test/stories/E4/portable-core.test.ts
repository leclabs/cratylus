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

/** Targets that compile the portable core clean today. */
const CLEAN_TARGETS = [
  'claude',
  'codex',
  'copilot',
  'crush',
  'cursor',
  'gemini',
  'opencode',
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

  story.tracked(
    'E4.S7',
    'all 10 targets compile the portable core with zero warnings and zero skips (aider drops skills+mcp [AI1][AI5]; cline and continue drop skills [CL5][CT3])',
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
      expect(report.totalWarnings).toBe(0);
      expect(report.totalSkipped).toBe(0);
    },
  );
});
