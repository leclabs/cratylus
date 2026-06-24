// T1.1 + T1.3 full migration gate: EVERY organ value-cell and EVERY skill
// projects back BYTE-IDENTICAL to its current `.md` cell body (the Python
// `parse_cell` body: `raw.split('---', 2)[2]`). A single ✗ fails the suite and
// names the cell + the first divergent byte.

import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Fragment } from '@leclabs/koine/anatomy';
import { describe, expect, it } from 'vitest';
import { fragmentToMarkdown, skillToMarkdown } from '../src/toolkit/project.js';
import type { SkillCell } from '../src/toolkit/skill-cell.js';

const mindRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(mindRoot, 'src');

/** The canonical cell body: everything after the second `---` (mirrors parse_cell). */
function canonicalBody(cellRelPath: string): string {
  const raw = readFileSync(join(mindRoot, cellRelPath), 'utf8');
  const first = raw.indexOf('---');
  const second = raw.indexOf('---', first + 3);
  return raw.slice(second + 3);
}

/** The first exported value of a generated module (the fragment / skill const). */
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

describe('full migration round-trip (byte-identical)', () => {
  it('every organ value-cell round-trips', async () => {
    const modules = await collect('organs/**/*.ts');
    expect(modules.length).toBeGreaterThan(100);
    const failures: string[] = [];
    for (const rel of modules) {
      const modPath = join(srcRoot, rel);
      const f = await firstExport<Fragment>(modPath);
      // organs/<organ>/<value>.ts ↔ <organ>/<value>.md
      const cellRel = `${rel.replace(/^organs\//, '').replace(/\.ts$/, '')}.md`;
      const got = fragmentToMarkdown(f);
      const want = canonicalBody(cellRel);
      if (got !== want) {
        failures.push(
          `${cellRel}: ${JSON.stringify(got)} !== ${JSON.stringify(want)}`,
        );
      }
    }
    expect(
      failures,
      `non-byte-identical fragments:\n${failures.join('\n')}`,
    ).toEqual([]);
  });

  it('every skill round-trips', async () => {
    const modules = await collect('skills/*.ts');
    expect(modules.length).toBe(15);
    const failures: string[] = [];
    for (const rel of modules) {
      const modPath = join(srcRoot, rel);
      const s = await firstExport<SkillCell>(modPath);
      const cellRel = `skill/${relative('skills', rel).replace(/\.ts$/, '')}.md`;
      const got = skillToMarkdown(s);
      const want = canonicalBody(cellRel);
      if (got !== want) {
        failures.push(`${cellRel}: first diff at byte ${firstDiff(got, want)}`);
      }
    }
    expect(
      failures,
      `non-byte-identical skills:\n${failures.join('\n')}`,
    ).toEqual([]);
  });
});

/** Index of the first differing byte (or -1 if equal up to the shorter length). */
function firstDiff(a: string, b: string): number {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) {
      return i;
    }
  }
  return a.length === b.length ? -1 : n;
}
