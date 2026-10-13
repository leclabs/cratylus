// Projection stability (.ts is the sole source): surviving fragments and skills
// project through forge's omp adapter.

import { readdirSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet } from '@cratylus/forge/project';
import type { Skill } from '@cratylus/schema';
import { describe, expect, it } from 'vitest';
import canon from '../src/index.js';
import { formalize } from '../src/skills/formalize/skill.js';
import { fragmentToMarkdown } from '../tooling/project.js';
import { firstExport } from './support/cell-module.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(canonRoot, 'src');

async function collect(pattern: string): Promise<string[]> {
  const out: string[] = [];
  for await (const p of glob(pattern, { cwd: srcRoot })) out.push(p);
  return out.sort();
}

async function project() {
  return projectPluginSet({
    plugins: [canon],
    adapter: adapterByName('omp'),
  });
}

describe('projection stability (.ts is the sole source)', () => {
  it('every dimension fragment projects non-empty and carries its own text', async () => {
    const modules = await collect('dimensions/**/*.ts');
    expect(modules.length).toBeGreaterThan(100);
    for (const rel of modules) {
      const f = await firstExport<string>(join(srcRoot, rel));
      expect(f.trim().length, `${rel}: fragment is non-empty`).toBeGreaterThan(
        0,
      );
      expect(fragmentToMarkdown(f), `${rel}: projection carries it`).toContain(
        f,
      );
    }
  });

  it('is non-vacuous — the strengthened predicate fails an empty fragment', () => {
    const real = 'a real fragment';
    expect(real.trim().length).toBeGreaterThan(0);
    expect(fragmentToMarkdown(real)).toContain(real);
    expect(''.trim().length).toBe(0);
    expect(fragmentToMarkdown('').length).toBeGreaterThan(0);
  });

  it('every skill projects non-empty through omp', async () => {
    const modules = await collect('skills/*/skill.ts');
    expect(modules.length).toBeGreaterThan(0);
    const tree = await project();
    for (const rel of modules) {
      const skill = await firstExport<Skill>(join(srcRoot, rel));
      const path = `skills/${skill.name}/SKILL.md`;
      const rendered = tree.files.find((f) => f.path === path)?.content;
      expect(rendered, `${rel}: projected by omp`).toBeDefined();
      expect(rendered?.length, `${rel}: non-empty`).toBeGreaterThan(0);
      expect(rendered, `${rel}: carries the skill name`).toContain(skill.name);
    }
  });

  it('the formalize skill projects its formalBlock and composition through omp', async () => {
    const tree = await project();
    const rendered = tree.files.find(
      (f) => f.path === 'skills/formalize/SKILL.md',
    )?.content;
    expect(rendered).toContain(formalize.formalBlock);
    expect(rendered).toContain('Composed from /conceptualize · /signify.');
  });

  it('the built skill roster equals the source roster', async () => {
    const src = (await collect('skills/*/skill.ts')).map(
      (r) => r.split('/')[1],
    );
    const distSkills = join(canonRoot, 'dist', 'skills');
    const built = readdirSync(distSkills, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    expect(built, 'stale cells in dist/ still project').toEqual(src);
  });
});
