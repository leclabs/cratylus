// SKILL-SHAPE gate — the TS port of `toolkit/verify.py` `gate_skill_operative`. One
// law over every `SkillCell` module:
//
//   OPERATIVE  — a skill carries ≥1 operative element beyond its heading + the
//                prose `≜` composition formula (a list step, a fenced block, or
//                substantive prose). An empty body projects a vacuous SKILL.md and
//                round-trips on emptiness, so the byte-identity oracle can't catch
//                it — this gate does. (mirrors `gate_skill_operative`.)
//
// SOURCE-GRAIN: the surface is each module's σ* `formalBlock` (the forge IR field;
// the retired verbatim `body`'s successor), not the projected `.md`.
//
// NON-VACUOUS: an injected empty-body skill blocks OPERATIVE; the live corpus passes.
// Asserted.

import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Skill } from '@leclabs/agent-forge/anatomy';
import { describe, expect, it } from 'vitest';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

/** Line indices inside a ``` fenced block (markers included). Mirrors `fence_lines`. */
function fenceMask(body: string): Set<number> {
  const lines = body.split('\n');
  const mask = new Set<number>();
  let open = -1;
  for (let i = 0; i < lines.length; i++) {
    if ((lines[i] as string).startsWith('```')) {
      if (open === -1) {
        open = i;
      } else {
        for (let j = open; j <= i; j++) {
          mask.add(j);
        }
        open = -1;
      }
    }
  }
  return mask;
}

/** Does `body` contain at least one fenced block? (a fenced block IS operative.) */
function hasFence(body: string): boolean {
  return fenceMask(body).size > 0;
}

/**
 * OPERATIVE: ≥1 element beyond heading + ≜ formula. Excluded as scaffolding: the
 * H1/H2 headings, blank lines, fenced markers, and the single prose `≜` line. A
 * fenced block short-circuits to operative. Mirrors `gate_skill_operative`.
 */
function isOperative(body: string): boolean {
  if (hasFence(body)) {
    return true;
  }
  const mask = fenceMask(body);
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (mask.has(i)) {
      continue;
    }
    const s = (lines[i] as string).trim();
    if (!s) {
      continue;
    }
    if (s.startsWith('#')) {
      continue; // H1/H2 headings are scaffolding
    }
    if ((lines[i] as string).includes('≜')) {
      continue; // the prose composition-formula line is scaffolding
    }
    return true; // a list step or substantive prose line
  }
  return false;
}

async function firstExport<T>(modPath: string): Promise<T> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  return mod[key as string] as T;
}

async function allSkills(): Promise<Array<{ rel: string; cell: Skill }>> {
  const out: Array<{ rel: string; cell: Skill }> = [];
  for await (const p of glob('skills/*/skill.ts', { cwd: srcRoot })) {
    out.push({ rel: p, cell: await firstExport<Skill>(join(srcRoot, p)) });
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

describe('SKILL-SHAPE gate — operative content', () => {
  it('every skill carries ≥1 operative element (OPERATIVE)', async () => {
    const skills = await allSkills();
    expect(skills.length).toBe(15);
    const failures = skills
      .filter(({ cell }) => !isOperative(cell.formalBlock))
      .map(({ cell }) => `OPERATIVE ${cell.name}: no operative content`);
    expect(failures, failures.join('\n')).toEqual([]);
  });

  // ── NON-VACUOUS: the gate BITES on an injected violation ───────────────────────
  it('OPERATIVE FAILS on a heading + ≜-formula-only body', () => {
    const vacuous = '\n\n# do-nothing\n\nx ≜ exemplify\n';
    expect(isOperative(vacuous)).toBe(false);
    // and the inverse: add one prose step → operative again.
    expect(isOperative(`${vacuous}\nDo the actual thing.\n`)).toBe(true);
  });
});
