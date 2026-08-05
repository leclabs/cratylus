// BOUNDARY-BINDING gate — `X @ home` must RESOLVE.
//
// A cell that does not own a symbol borrows it by boundary-binding: a line of the
// form `sym₁, sym₂ @ home`, which asserts "these are defined over there, go read
// them there." That assertion was never checked. `carry-on` carried
// `active, done @ praxis` for the whole life of the cell, and praxis has never
// declared `active` — it declares shard `state`, and `active` is one of its VALUES.
// Meanwhile `wake` declared a THIRD, incompatible meaning locally. One sign, three
// homes, and every gate in the suite was green: `symbols` checks that each GLYPH is
// registered in `operator-lexicon`, which says nothing about whether a NAME resolves.
//
// SCOPE — only bindings whose home is a live skill are checkable. `@ live-anatomy`,
// `@ memory-session-registry`, `@ cold-decode-oracle` name conceptual homes outside
// the skill corpus; there is nothing to resolve against and pretending otherwise
// would make the gate lie. Those are skipped, deliberately and visibly.

import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Skill } from '@cratylus/schema';
import { describe, expect, it } from 'vitest';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

async function loadSkills(): Promise<Map<string, Skill>> {
  const out = new Map<string, Skill>();
  for await (const rel of glob('skills/*/skill.ts', { cwd: srcRoot })) {
    const mod = (await import(
      pathToFileURL(join(srcRoot, rel)).href
    )) as Record<string, unknown>;
    for (const v of Object.values(mod)) {
      const s = v as Skill;
      if (s && typeof s === 'object' && 'name' in s && 'formalBlock' in s) {
        out.set(s.name, s);
      }
    }
  }
  return out;
}

/**
 * A boundary-binding line: `sym, sym … @ home`, home a bare lowercase anchor.
 *
 * `@` carries TWO senses in this corpus and only one is checkable:
 *   BORROW  `bound, done @ praxis`                     — go read these there
 *   REMIT   `boundary ≜ dimensions-only · domain-skills @ create-skill`
 *                                                       — that concern is theirs
 * The second is a definiens ABOUT ownership, not an import, and `create-skill`
 * rightly declares no `domain-skills`. A definition operator on the left is the
 * discriminator: a borrow is the whole line, a remit is part of one.
 */
const BINDING = /^([^@\n≜:⇔]+?)\s+@\s+([a-z][a-z0-9-]*)\s*$/;

/** Split the left side into borrowed names, dropping notation and ⟨glosses⟩. */
function borrowedNames(lhs: string): string[] {
  return lhs
    .replace(/⟨[^⟩]*⟩/g, '')
    .split(/[,·]/)
    .map((t) => t.trim())
    .filter((t) => /^[A-Za-z_][A-Za-z0-9_-]*$/.test(t));
}

/**
 * Is `sym` DECLARED in `block`? A declaration opens its line — `sym : T`,
 * `sym ≜ …`, `sym(x) ⇔ …` — or sits in a leading comma-list. Anchored at line
 * start so a mere mention in a law never counts as a definition.
 */
function declares(block: string, sym: string): boolean {
  const s = sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    new RegExp(`^${s}\\b`, 'm').test(block) ||
    new RegExp(`^[^\\n:≜⇔]*\\b${s}\\b[^\\n]*?[:≜⇔]`, 'm').test(block)
  );
}

function unresolved(skills: Map<string, Skill>): string[] {
  const bad: string[] = [];
  for (const [name, skill] of skills) {
    for (const line of String(skill.formalBlock).split('\n')) {
      const m = BINDING.exec(line.trim());
      if (!m) continue;
      const [, borrowed, homeName] = m;
      if (borrowed === undefined || homeName === undefined) continue;
      const home = skills.get(homeName);
      if (!home) continue; // conceptual home, not a skill — out of scope
      for (const sym of borrowedNames(borrowed)) {
        if (!declares(String(home.formalBlock), sym)) {
          bad.push(
            `${name}: \`${sym} @ ${homeName}\` — ${homeName} declares no \`${sym}\``,
          );
        }
      }
    }
  }
  return bad;
}

describe('BOUNDARY-BINDING gate — `X @ home` resolves in that home', () => {
  it('every skill-homed boundary-binding resolves', async () => {
    const skills = await loadSkills();
    expect(skills.size).toBeGreaterThan(10);
    expect(unresolved(skills)).toEqual([]);
  });

  it('CONVICTS: a binding whose home lacks the symbol is reported', async () => {
    const real = await loadSkills();
    const praxis = real.get('praxis');
    expect(praxis, 'praxis must exist for this fixture').toBeDefined();

    const injected = new Map(real);
    injected.set('__fixture__', {
      name: '__fixture__',
      description: 'synthetic',
      // `active` is exactly the symbol carry-on borrowed and praxis never declared.
      formalBlock: 'P ≜ a plan\nactive, done @ praxis\n',
      composition: () => [],
    } as unknown as Skill);

    const found = unresolved(injected);
    expect(found.join(' | ')).toContain('`active @ praxis`');
    // and it does NOT over-report: `done` IS declared by praxis.
    expect(found.join(' | ')).not.toContain('`done @ praxis`');
  });

  it('EXONERATES: a conceptual (non-skill) home is skipped, not failed', async () => {
    const injected = new Map(await loadSkills());
    injected.set('__fixture2__', {
      name: '__fixture2__',
      description: 'synthetic',
      formalBlock:
        'registered, released, stale @ memory-session-registry\n' +
        // …and a REMIT line, which is a definiens about ownership, not an import.
        'boundary ≜ dimensions-only · domain-skills @ create-skill\n',
      composition: () => [],
    } as unknown as Skill);
    expect(unresolved(injected)).toEqual([]);
  });
});
