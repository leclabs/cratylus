// SKILL-SHAPE gate — the TS port of `toolkit/verify.py` `gate_skill_operative` +
// the CITE-TWICE half of `gate_skill_provenance`. Two
// laws over every `SkillCell` module:
//
//   OPERATIVE  — a skill carries ≥1 operative element beyond its heading + the
//                prose `≜` composition formula (a list step, a fenced block, or
//                substantive prose). An empty body projects a vacuous SKILL.md and
//                round-trips on emptiness, so the byte-identity oracle can't catch
//                it — this gate does. (mirrors `gate_skill_operative`.)
//   CITE-TWICE — composition XOR prose-formula: a skill must NOT carry BOTH a
//                Bindings region AND a prose `≜` formula. Both home the same
//                anchors → the duplication self-sufficient-formalism forbids. The
//                Bindings region is the sole composition home; a re-citing `≜` is a
//                FAIL. (mirrors `gate_skill_provenance`'s CITE-TWICE.)
//
// SOURCE-GRAIN: the surface is each module's verbatim `body` (the canonical cell
// body the Python gate read), not the `.md`.
//
// NON-VACUOUS: an injected empty-body skill blocks OPERATIVE; an injected
// both-present skill blocks CITE-TWICE; the live corpus passes both. All asserted.

import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { SkillCell } from '../src/toolkit/skill-cell.js';

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

/** Every `[[slug]]` anchor in a line. */
const REF_RE = /\[\[([a-z0-9-]+)\]\]/g;

/**
 * True if `body` has a prose `≜` COMPOSITION formula — the FIRST non-fenced `≜`
 * line, when it yields ≥1 sibling `[[ref]]`. Mirrors `_formula_refs`: the cell's
 * own `<verb> ≜ <definiens>` line (no refs) is NOT a composition formula, and a
 * later `≜` that merely appears in instructional prose is past the first line and
 * not the formula either. Only a first-`≜` line that cites siblings counts.
 */
function hasProseFormula(body: string): boolean {
  const mask = fenceMask(body);
  const lines = body.split('\n');
  const formula = lines.find((l, i) => l.includes('≜') && !mask.has(i));
  if (formula === undefined) {
    return false;
  }
  return [...formula.matchAll(REF_RE)].length > 0;
}

/** True if `body` has a `Bindings:` region (the cite-once home). Mirrors `_bindings_region`. */
function hasBindingsRegion(body: string): boolean {
  const mask = fenceMask(body);
  return body
    .split('\n')
    .some(
      (l, i) =>
        !mask.has(i) && /^\s*\*{0,2}Bindings\b\s*(?:\([^)]*\))?\s*:/.test(l),
    );
}

async function firstExport<T>(modPath: string): Promise<T> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  return mod[key as string] as T;
}

async function allSkills(): Promise<Array<{ rel: string; cell: SkillCell }>> {
  const out: Array<{ rel: string; cell: SkillCell }> = [];
  for await (const p of glob('skills/*.ts', { cwd: srcRoot })) {
    out.push({ rel: p, cell: await firstExport<SkillCell>(join(srcRoot, p)) });
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

describe('SKILL-SHAPE gate — operative content + cite-once', () => {
  it('every skill carries ≥1 operative element (OPERATIVE)', async () => {
    const skills = await allSkills();
    expect(skills.length).toBe(15);
    const failures = skills
      .filter(({ cell }) => !isOperative(cell.body))
      .map(({ cell }) => `OPERATIVE ${cell.name}: no operative content`);
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('no skill double-cites (Bindings XOR prose-≜ formula) (CITE-TWICE)', async () => {
    const skills = await allSkills();
    expect(skills.length).toBe(15);
    const failures = skills
      .filter(
        ({ cell }) =>
          hasBindingsRegion(cell.body) && hasProseFormula(cell.body),
      )
      .map(
        ({ cell }) =>
          `CITE-TWICE ${cell.name}: has BOTH a Bindings region and a prose ≜ formula`,
      );
    expect(failures, failures.join('\n')).toEqual([]);
  });

  // ── NON-VACUOUS: each gate BITES on an injected violation ──────────────────────
  it('OPERATIVE FAILS on a heading + ≜-formula-only body', () => {
    const vacuous = '\n\n# do-nothing\n\nx ≜ [[exemplify]]\n';
    expect(isOperative(vacuous)).toBe(false);
    // and the inverse: add one prose step → operative again.
    expect(isOperative(`${vacuous}\nDo the actual thing.\n`)).toBe(true);
  });

  it('CITE-TWICE FAILS on a body with BOTH a Bindings region and a prose ≜', () => {
    const doubleCite = [
      '\n\n# double\n',
      '\nx ≜ [[conceptualize]] then [[signify]]\n',
      '\nBindings: stage of [[exemplify]].\n',
      '\nDo the work.\n',
    ].join('');
    expect(hasBindingsRegion(doubleCite)).toBe(true);
    expect(hasProseFormula(doubleCite)).toBe(true);
    // a body with only Bindings (the legal cite-once form) does NOT trip it.
    const single =
      '\n\n# single\n\nBindings: stage of [[exemplify]].\n\nDo it.\n';
    expect(hasBindingsRegion(single) && hasProseFormula(single)).toBe(false);
  });
});
