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
  type ResolvedAgent,
  agentToClaudeMd,
} from '@leclabs/koine/adapters/claude';
import type { Fragment } from '@leclabs/koine/anatomy';
import { describe, expect, it } from 'vitest';
import { fragmentToMarkdown, skillToMarkdown } from '../src/toolkit/project.js';
import type { SkillCell } from '../src/toolkit/skill-cell.js';

const mindRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(mindRoot, 'src');

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
      const f = await firstExport<Fragment>(join(srcRoot, rel));
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

  it('every agent resolves and projects a SOUL', async () => {
    const modules = (await collect('agents/*.ts')).filter(
      (r) => !r.endsWith('base.ts'),
    );
    expect(modules.length).toBe(11);
    for (const rel of modules) {
      const mod = (await import(
        pathToFileURL(join(srcRoot, rel)).href
      )) as Record<string, unknown>;
      const resolvedKey = Object.keys(mod).find((k) => k.endsWith('Resolved'));
      expect(resolvedKey, `${rel} exports a *Resolved agent`).toBeDefined();
      const soul = agentToClaudeMd(
        mod[resolvedKey as string] as ResolvedAgent,
        'strong-llm-lean',
      );
      expect(soul.length, rel).toBeGreaterThan(0);
    }
  });
});
