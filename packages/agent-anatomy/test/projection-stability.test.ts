// Projection-stability gate (T6.1e — replaces the retired byte-identity oracles).
// The byte-identity oracles (full-roundtrip / agent-roundtrip / roundtrip /
// skill-roundtrip) proved TS === legacy `.md`/`.render`; that job is DONE and the
// `.md` cells are gone — `.ts` is now the sole source, so there is nothing to
// round-trip against. This guards the surviving invariant: EVERY fragment, skill,
// and agent module still imports and PROJECTS (non-empty, no throw), at the
// expected cardinalities. A broken module / projection fails the suite.

import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  type ResolvedSkill,
  agentToClaudeMd,
  skillToClaudeMd,
} from '@leclabs/agent-forge/adapters/claude';
import type { Agent } from '@leclabs/agent-forge/anatomy';
import { describe, expect, it } from 'vitest';
import { dream } from '../src/skills/dream.js';
import { wake } from '../src/skills/wake.js';
import { fragmentToMarkdown, skillToMarkdown } from '../src/toolkit/project.js';
import type { SkillCell } from '../src/toolkit/skill-cell.js';

const anatomyRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(anatomyRoot, 'src');

async function firstExport<T>(modPath: string): Promise<T> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  return mod[key as string] as T;
}

async function collect(pattern: string): Promise<string[]> {
  const out: string[] = [];
  for await (const p of glob(pattern, { cwd: srcRoot })) {
    out.push(p);
  }
  return out.sort();
}

describe('projection stability (.ts is the sole source)', () => {
  it('every organ fragment projects non-empty', async () => {
    const modules = await collect('organs/**/*.ts');
    expect(modules.length).toBeGreaterThan(100);
    for (const rel of modules) {
      const f = await firstExport<string>(join(srcRoot, rel));
      expect(fragmentToMarkdown(f).length, rel).toBeGreaterThan(0);
    }
  });

  it('every skill projects non-empty', async () => {
    const modules = await collect('skills/*.ts');
    expect(modules.length).toBe(15);
    for (const rel of modules) {
      const s = await firstExport<SkillCell>(join(srcRoot, rel));
      expect(skillToMarkdown(s).length, rel).toBeGreaterThan(0);
    }
  });

  // Self-sufficiency falsifier (skill-projection-drops-absorbed-declarations):
  // the rendered SKILL.md must carry the absorbed-declaration bullets — the
  // cell's "no concept is referenced out" mechanism — while the composition-
  // formula line (`<name> ≜ …`) stays consumed. The regression rendered the
  // `Absorbed declarations …:` header over an EMPTY body.
  it('rendered dream + wake SKILL.md carry their absorbed declarations', () => {
    const render = (cell: SkillCell): string =>
      skillToClaudeMd(
        {
          name: cell.name,
          trigger: `/${cell.name}`,
          description: cell.description,
          body: cell.body,
          composedFrom: [],
          sourcePath: `packages/agent-anatomy/src/skills/${cell.name}.ts`,
        } satisfies ResolvedSkill,
        (slug) => `**${slug}**`,
      );

    const dreamMd = render(dream);
    expect(dreamMd).toContain('- **memory** ≜');
    expect(dreamMd).toContain('- **fold-then-route** ≜');
    expect(dreamMd).toContain('- **node** ≜');
    expect(dreamMd).toContain('- **palimpsest** ≜');
    // The prose composition formula is consumed, not emitted …
    expect(dreamMd).not.toMatch(/^dream ≜ the memory-consolidation/m);
    // … while the fenced `dream ≜` law line renders verbatim.
    expect(dreamMd).toContain('dream ≜ exemplify : E → I');

    const wakeMd = render(wake);
    expect(wakeMd).toContain('- **continuity-thread** ≜');
    expect(wakeMd).toContain('- **memory store** ≜');
    expect(wakeMd).not.toMatch(/^wake ≜/m);
    expect(wakeMd).toContain(
      'WAKE ≜ register → dream → load → orient → resume',
    );

    // The header-over-empty-body shape is asserted ABSENT: the first
    // non-blank line after the header is a declaration bullet.
    for (const md of [dreamMd, wakeMd]) {
      expect(md).toMatch(/Absorbed declarations[^\n]*:\n\n- \*\*/);
    }
  });

  it('every agent resolves and projects a SOUL', async () => {
    const modules = (await collect('agents/*.ts')).filter(
      (r) => !r.endsWith('base.ts'),
    );
    expect(modules.length).toBe(10);
    for (const rel of modules) {
      const agent = await firstExport<Agent>(join(srcRoot, rel));
      const soul = agentToClaudeMd(agent);
      expect(soul.length, rel).toBeGreaterThan(0);
    }
  });
});
