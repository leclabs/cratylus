/**
 * E5.S3 — skills floor is met natively everywhere a plugin arch exists (the
 * negative guard / parsimony guard).
 *
 * Documented truth: every plugin-arch harness has native SKILL.md discovery
 * ([OC6][AM4][KL3][CL5][CC3][GM3][ZD2]); the adapters emit skills to those
 * native paths; NO skill-via-plugin code path exists. If a future harness
 * shows plugin-arch + no native skills, the pinned table forces a conscious
 * revisit — the guard fails on roster change, never silently.
 *
 * Fate split:
 * - the pinned table + roster guard: GREEN;
 * - shipped adapters (claude / opencode / gemini) emitting SKILL.md at the
 *   native path: GREEN against current behavior;
 * - the no-skill-via-plugin scan over src/adapters: GREEN;
 * - cline (native discovery exists [CL5], adapter declares skills: 'none'):
 *   TRACKED — the adapter does not yet discharge the floor for that harness;
 * - amp / kilo / zed rows: GRADUATED — amp and zed already shipped adapters;
 *   kilo-adapter's landing completes the triad (all three import
 *   successfully now), forcing this row's graduation by green-suite law
 *   (nominally convergence-owned, wave 7 — forced early, not authored here).
 */

import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, expect } from 'vitest';
import type { IR } from '../../../src/core/index.js';
import { adapterById, makeTmpDir, story } from '../helpers.js';

/**
 * The pinned assertion table: every plugin-arch harness (RETURN §1 `Plugin
 * arch` column, Pi excluded — E5.S8 is research-gated and out of this wave)
 * with its native project-scope SKILL.md discovery root and evidence ref.
 */
const PLUGIN_ARCH_HARNESSES = [
  {
    harness: 'opencode',
    nativeSkillsRoot: '.opencode/skills',
    ref: '[OC6]',
    adapterId: 'opencode',
  },
  {
    harness: 'amp',
    nativeSkillsRoot: '.agents/skills',
    ref: '[AM4]',
    adapterId: null,
  },
  {
    harness: 'kilo',
    nativeSkillsRoot: '.kilo/skills',
    ref: '[KL3]',
    adapterId: null,
  },
  {
    harness: 'cline',
    nativeSkillsRoot: '.cline/skills',
    ref: '[CL5]',
    adapterId: 'cline',
  },
  {
    harness: 'claude',
    nativeSkillsRoot: '.claude/skills',
    ref: '[CC3]',
    adapterId: 'claude',
  },
  {
    harness: 'gemini',
    nativeSkillsRoot: '.gemini/skills',
    ref: '[GM3]',
    adapterId: 'gemini',
  },
  {
    harness: 'zed',
    nativeSkillsRoot: '.agents/skills',
    ref: '[ZD2]',
    adapterId: null,
  },
] as const;

const skillIR = (target: string): IR => ({
  manifest: { agentForge: 1, scope: 'project', targets: [target] },
  skills: [
    {
      name: 'demo-cell',
      description: 'a demo skill cell for the native-path guard',
      body: '# demo-cell\n\nThe verb body of the demo cell.\n',
    },
  ],
});

let cwd: string;
beforeEach(() => {
  cwd = makeTmpDir();
});
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true });
});

story(
  'E5.S3',
  'the pinned table: every plugin-arch harness has native SKILL.md discovery (roster-change guard)',
  () => {
    // Exact roster — a new plugin-arch harness (or a dropped one) fails here,
    // forcing the conscious revisit the story mandates.
    expect(PLUGIN_ARCH_HARNESSES.map((r) => r.harness)).toEqual([
      'opencode',
      'amp',
      'kilo',
      'cline',
      'claude',
      'gemini',
      'zed',
    ]);
    // Every row carries a native discovery root and a source-ledger ref —
    // no plugin-arch harness lacks a native skills path, so no skill-plugin
    // shim is ever the cheaper path.
    for (const row of PLUGIN_ARCH_HARNESSES) {
      expect(row.nativeSkillsRoot.length).toBeGreaterThan(0);
      expect(row.ref).toMatch(/^\[[A-Z]{2}\d\]$/);
    }
  },
);

story(
  'E5.S3',
  'shipped adapters with skills support emit SKILL.md at the native discovery path',
  async () => {
    for (const id of ['claude', 'opencode', 'gemini'] as const) {
      const row = PLUGIN_ARCH_HARNESSES.find((r) => r.adapterId === id);
      expect(row).toBeDefined();
      const adapter = adapterById.get(id);
      expect(adapter).toBeDefined();
      const dir = join(cwd, id);
      const report = await adapter?.write(skillIR(id), 'project', dir, {});
      const nativeFile = join(
        dir,
        ...(row as { nativeSkillsRoot: string }).nativeSkillsRoot.split('/'),
        'demo-cell',
        'SKILL.md',
      );
      expect(
        existsSync(nativeFile),
        `${id}: SKILL.md not at native path ${nativeFile}; written: ${report?.written.join(', ')}`,
      ).toBe(true);
      const content = readFileSync(nativeFile, 'utf8');
      expect(content).toContain('name: demo-cell');
      expect(content).toContain('description: a demo skill cell');
    }
  },
);

story(
  'E5.S3',
  'cline: native SKILL.md discovery exists [CL5] but the adapter does not yet emit skills to that path',
  async () => {
    const cline = adapterById.get('cline');
    expect(cline).toBeDefined();
    // Documented: the harness discovers .cline/skills/ natively, so the
    // adapter must discharge the skills floor there (support above 'none').
    expect(cline?.capabilities.resources.skills).not.toBe('none');
    await cline?.write(skillIR('cline'), 'project', cwd, {});
    expect(
      existsSync(join(cwd, '.cline', 'skills', 'demo-cell', 'SKILL.md')),
    ).toBe(true);
  },
);

story(
  'E5.S3',
  'amp / kilo / zed: plugin-arch harnesses with native skills paths have no shipped adapter at all',
  async () => {
    // The rows exist in the pinned table; all three adapters now ship — the
    // import probe graduates (forced by kilo-adapter completing the triad).
    for (const id of ['amp', 'kilo', 'zed']) {
      const home: string = `../../../src/adapters/${id}/index.js`;
      const mod = (await import(home)) as Record<string, unknown>;
      expect(Object.keys(mod).length).toBeGreaterThan(0);
    }
  },
);

story(
  'E5.S3',
  'no skill-via-plugin code path exists anywhere in src/adapters (parsimony scan)',
  () => {
    const adaptersRoot = join(
      dirname(fileURLToPath(import.meta.url)),
      '..',
      '..',
      '..',
      'src',
      'adapters',
    );
    expect(existsSync(adaptersRoot)).toBe(true);
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true }).sort(
        (a, b) => a.name.localeCompare(b.name),
      )) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) walk(p);
        else if (p.endsWith('.ts')) files.push(p);
      }
    };
    walk(adaptersRoot);
    expect(files.length).toBeGreaterThan(0);

    // A skill-via-plugin code path would couple the two concerns on a source
    // line (a plugin artifact carrying skill content). Read-only scan: no
    // line in any adapter source mentions both.
    const offenders: string[] = [];
    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (/skill/i.test(line) && /plugin/i.test(line)) {
          offenders.push(`${file}:${i + 1}: ${line.trim()}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  },
);
