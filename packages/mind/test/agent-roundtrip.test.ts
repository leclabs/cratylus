// T1.2 — the heart of the inversion: every agent module projects BYTE-IDENTICAL
// to its Python-rendered SOUL. The byte-anchor is `.render/agents/<name>.md`
// (regenerate fresh via `python3 toolkit/resolve.py --reader strong-llm-lean`).
//
// Each agent module exports `<name>Resolved: ResolvedAgent`; `agentToClaudeMd`
// assembles the full SOUL (front-matter + provenance header + `## Organ` sections
// + `## Memory`) mirroring compose_agent_selection + decorate + render.

import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  type ResolvedAgent,
  agentToClaudeMd,
} from '../src/toolkit/agent-projection.js';

const mindRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const agentsDir = join(mindRoot, 'src', 'agents');
const renderDir = join(mindRoot, '.render', 'agents');

/** The `<name>Resolved` export from an agent module. */
async function resolvedOf(modPath: string): Promise<ResolvedAgent> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k.endsWith('Resolved'));
  return mod[key as string] as ResolvedAgent;
}

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

describe('T1.2 agent SOUL round-trip (byte-identical)', () => {
  it('all 11 agents project byte-identical to the Python-rendered SOUL', async () => {
    const names: string[] = [];
    for await (const p of glob('*.ts', { cwd: agentsDir })) {
      if (p !== 'base.ts') {
        names.push(p.replace(/\.ts$/, ''));
      }
    }
    names.sort();
    expect(names.length).toBe(11);

    const results: { name: string; ok: boolean; at: number }[] = [];
    for (const name of names) {
      const resolved = await resolvedOf(join(agentsDir, `${name}.ts`));
      const got = agentToClaudeMd(resolved);
      const want = readFileSync(join(renderDir, `${name}.md`), 'utf8');
      const at = firstDiff(got, want);
      results.push({ name, ok: at === -1, at });
    }

    const failures = results.filter((r) => !r.ok);
    const report = failures
      .map((r) => `${r.name}: first diff at byte ${r.at}`)
      .join('\n');
    expect(failures, `non-byte-identical agents:\n${report}`).toEqual([]);
  });
});
