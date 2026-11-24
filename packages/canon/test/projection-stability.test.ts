// Projection stability (.ts is the sole source): surviving factor values project, and
// the canon projects agents, rules and hooks and no skill, through forge's omp adapter.

import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { projectPluginSet } from '@cratylus/forge/project';
import { describe, expect, it } from 'vitest';
import canon from '../src/index.js';
import { valueToMarkdown } from '../tooling/project.js';
import { firstExport } from './support/first-export.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(canonRoot, 'src');

async function collect(pattern: string): Promise<string[]> {
  const out: string[] = [];
  for await (const p of glob(pattern, { cwd: srcRoot })) out.push(p);
  return out.sort();
}

describe('projection stability (.ts is the sole source)', () => {
  it('every value of a factor projects non-empty and carries its own text', async () => {
    const modules = await collect('factors/**/*.ts');
    expect(modules.length).toBeGreaterThan(100);
    for (const rel of modules) {
      const value = await firstExport<string>(join(srcRoot, rel));
      expect(value.trim().length, `${rel}: value is non-empty`).toBeGreaterThan(
        0,
      );
      expect(valueToMarkdown(value), `${rel}: projection carries it`).toContain(
        value,
      );
    }
  });

  it('is non-vacuous — the strengthened predicate fails an empty value', () => {
    const real = 'a real value';
    expect(real.trim().length).toBeGreaterThan(0);
    expect(valueToMarkdown(real)).toContain(real);
    expect(''.trim().length).toBe(0);
    expect(valueToMarkdown('').length).toBeGreaterThan(0);
  });

  it('projects every agent through omp and places no skill', async () => {
    const tree = await projectPluginSet({
      plugins: [canon],
      adapter: adapterByName('omp'),
    });
    const agents = await collect('agents/*.ts');
    expect(agents.length).toBeGreaterThan(0);
    for (const rel of agents) {
      const name = rel.replace(/^agents\//, '').replace(/\.ts$/, '');
      expect(
        tree.files.find((f) => f.path === `agents/${name}.md`),
        `${rel}: projected by omp`,
      ).toBeDefined();
    }
    expect(
      tree.files.filter((f) => f.path.startsWith('skills/')).map((f) => f.path),
    ).toEqual([]);
  });
});
