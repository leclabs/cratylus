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
  agentToClaudeMd,
  skillToClaudeMd,
} from '@leclabs/agent-forge/adapters/claude';
import type { Agent, Skill } from '@leclabs/agent-forge/anatomy';
import { describe, expect, it } from 'vitest';
import { dream } from '../src/skills/dream/skill.js';
import { wake } from '../src/skills/wake/skill.js';
import { fragmentToMarkdown } from '../src/toolkit/project.js';

/** Project a skill through the forge claude adapter — `f(name, formalBlock,
 *  composition())`, the SOLE projection path (the stored-body round-trip retired). */
function renderSkill(s: Skill): string {
  return skillToClaudeMd({
    name: s.name,
    trigger: `/${s.name}`,
    description: s.description,
    formalBlock: s.formalBlock,
    composedFrom: s.composition().map((c) => `/${c.name}`),
  });
}

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
  it('every dimension fragment projects non-empty AND carries its own text', async () => {
    // `fragmentToMarkdown` is `\n\n${value}\n`, so its output is length ≥ 3 for
    // EVERY input including the empty string: the old `length > 0` assertion was
    // a tautology that no corpus could ever fail. The real invariants are that
    // the fragment itself is non-empty and that projection CARRIES it.
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

  it('is non-vacuous — the strengthened predicate FAILS an empty fragment', () => {
    // control: a real fragment satisfies both legs
    const real = 'a real fragment';
    expect(real.trim().length).toBeGreaterThan(0);
    expect(fragmentToMarkdown(real)).toContain(real);
    // conviction: an empty one is caught by the non-emptiness leg — and would NOT
    // have been caught by the length-of-projection leg it replaces.
    expect(''.trim().length).toBe(0);
    expect(fragmentToMarkdown('').length).toBeGreaterThan(0);
  });

  it('every skill projects non-empty', async () => {
    const modules = await collect('skills/*/skill.ts');
    expect(modules.length).toBe(15);
    for (const rel of modules) {
      const s = await firstExport<Skill>(join(srcRoot, rel));
      const rendered = renderSkill(s);
      expect(rendered.length, rel).toBeGreaterThan(0);
      // carries the cell's own identity, not merely some non-empty wrapper
      expect(rendered, `${rel}: rendering carries the skill name`).toContain(
        s.name,
      );
    }
  });

  // De-braid model: a skill's SKILL.md is `f(name, formalBlock, composition())`,
  // rendered VERBATIM by the forge adapter — the σ* `formalBlock` inside the fence
  // plus a "Composed from …" provenance line from the lazy composition thunk. The
  // retired "absorbed declarations" mechanism (composition-formula consumed, decls
  // lifted out of a stored body) no longer exists: the formalBlock IS the whole
  // payload. This guards that the formalBlock reaches the projection intact AND the
  // composition thunk resolves to the live siblings' `/trigger`s.
  it('rendered dream + wake project their formalBlock + composed-from siblings', () => {
    const dreamMd = renderSkill(dream);
    // the σ* formalBlock law lines render VERBATIM inside the fence …
    expect(dreamMd).toContain(
      'dream ≜ read ⟨EPISODIC⟩ ↦ exemplify ↦ materialize',
    );
    expect(dreamMd).toContain('lock-precondition ≜');
    // … and the composition thunk reaches the projected "Composed from" line.
    expect(dreamMd).toContain('Composed from /exemplify · /materialize.');

    const wakeMd = renderSkill(wake);
    // Derived from the CELL, not a copied literal: a hardcoded first line pins the
    // block's current wording, so an intentional rewrite reads as a regression and
    // the test rots into a change-detector. What projection stability actually
    // claims is that the formalBlock reaches the artifact VERBATIM — assert that.
    expect(wakeMd).toContain(wake.formalBlock);
    expect(wake.formalBlock.split('\n')[0]).toMatch(/^WAKE ≜ /);
    expect(wakeMd).toContain('Composed from /dream · /praxis.');
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
