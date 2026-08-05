// cell-gloss census — one gloss, one sign, across every cell shape in `@cratylus/schema`.
//
// THE DEFECT THIS EXISTS TO CONVICT. `RuleCell` and `HookCell` are sibling files in one
// package directory. Both declared a field glossed _"σ*-signified canonical identity"_.
// One called it `definiens`, the other `residue`, and the only thing holding the two
// together was a line in `hook-rule-boundary.test.ts` writing `definiens: c.residue` —
// an adapter whose entire job was bridging two names for one concept. Nothing in the
// tree could see it: the compiler is happy with any two field names, and every gate in
// the suite reads one shape or the other, never both side by side.
//
// So the collision was found by a human reading two files, and the NEXT one would be
// too. This gate is the census that makes it convictable: it reads the DECLARED GLOSS
// off each cell field's own doc comment and asserts the map gloss → sign is a function.
//
// THE DISAMBIGUATION RULE IT ENFORCES (`MODEL.md:50`, `schema/src/rule-cell.ts`):
//
//   PARSIMONIOUS: body(c) = ⟨α(c), residue(c)⟩ ∧ residue(c) = D(c) ∖ fired(α(c))
//
// `D` and `residue` are different objects across one subtraction. A CELL's σ*-signified
// identity is the post-subtraction side — PARSIMONIOUS quantifies over it — so on every
// cell shape it is named `residue`, and that is the second leg here. `definiens` ≜ `D`
// stays alive for the PRE-subtraction side (`AcceptCell.definiens`, the witness input;
// the ρ-class `dimension-definiens`, raw post-`≜` text) and this gate never touches it:
// it censuses `*Cell` interfaces in schema, which is exactly where the ambiguity lived.
//
// WHY GLOSS-KEYED AND NOT FIELD-KEYED. Keying on field NAMES would find nothing — two
// names is the defect, not the signal. The gloss is the concept's own self-report, so
// the head phrase (everything before the em-dash, parentheticals dropped) is the key:
// the tail elaborates for a reader, the head names the thing.

import { readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const schemaSrc = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'schema',
  'src',
);

/** The gloss every cell shape must carry on exactly one field, under exactly one sign. */
const IDENTITY = /σ\*-signified canonical identity/;

/** One declared field of one cell interface: its SIGN and the CONCEPT its gloss names. */
interface CellField {
  readonly cell: string;
  readonly sign: string;
  readonly gloss: string;
}

/**
 * A doc comment reduced to the concept it names: parentheticals and code ticks dropped
 * (elaboration, not concept), then the HEAD phrase before the em-dash. Two fields that
 * key alike are declaring the same thing however differently they gloss the tail.
 */
function glossKey(doc: string): string {
  const head = (
    doc
      .replace(/^\s*\*/gm, ' ')
      .replace(/\([^()]*\)/g, ' ')
      .replace(/`/g, '')
      .split('—')[0] ?? ''
  )
    .replace(/\s+/g, ' ')
    .trim();
  return head.replace(/[\s.,;:]+$/, '').toLowerCase();
}

/**
 * Every `⟨cell, sign, gloss⟩` an `*Cell` interface declares. Read from SOURCE TEXT, not
 * from types: a gloss is a comment, and no type-level reflection can see one. The doc
 * capture is TEMPERED (`(?!\*\/)`) so one field's comment can never swallow the next.
 */
function cellFields(src: string): CellField[] {
  const out: CellField[] = [];
  for (const block of src.matchAll(
    /export interface (\w*Cell)\s*\{([\s\S]*?)\n\}/g,
  )) {
    const cell = block[1] as string;
    for (const f of (block[2] as string).matchAll(
      /\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*readonly (\w+)\??\s*:/g,
    ))
      out.push({ cell, sign: f[2] as string, gloss: glossKey(f[1] as string) });
  }
  return out;
}

/** Every gloss borne by more than one sign — the census's whole verdict. */
function collisions(fields: readonly CellField[]): string[] {
  const byGloss = new Map<string, Set<string>>();
  for (const f of fields) {
    const signs = byGloss.get(f.gloss) ?? new Set<string>();
    signs.add(f.sign);
    byGloss.set(f.gloss, signs);
  }
  return [...byGloss]
    .filter(([, signs]) => signs.size > 1)
    .map(([gloss, signs]) => `"${gloss}" → ${[...signs].sort().join(' + ')}`)
    .sort();
}

/** The signs each cell interface files its σ*-identity gloss under. */
function identitySigns(
  fields: readonly CellField[],
): Map<string, readonly string[]> {
  const byCell = new Map<string, string[]>();
  for (const f of fields) {
    if (!IDENTITY.test(f.gloss)) continue;
    byCell.set(f.cell, [...(byCell.get(f.cell) ?? []), f.sign]);
  }
  return byCell;
}

/** Every `.ts` under `schema/src`, recursively. */
function schemaSources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? schemaSources(join(dir, e.name))
      : extname(e.name) === '.ts'
        ? [join(dir, e.name)]
        : [],
  );
}

/** The live census over `@cratylus/schema` — every cell shape the corpus authors against. */
async function census(): Promise<CellField[]> {
  const out: CellField[] = [];
  for (const path of schemaSources(schemaSrc))
    out.push(...cellFields(await readFile(path, 'utf8')));
  return out;
}

describe('cell-gloss census — one concept, one sign, across every schema cell shape', () => {
  it('reaches the schema cell shapes — an empty census is a DARK scan, not a clean corpus', async () => {
    const fields = await census();
    const cells = new Set(fields.map((f) => f.cell));
    expect([...cells].sort(), 'the cell interfaces censused').toEqual([
      'HookCell',
      'RuleCell',
    ]);
    expect(fields.length, 'glossed cell fields').toBeGreaterThan(8);
  });

  it('no two cell interfaces declare one gloss under two signs', async () => {
    const found = collisions(await census());
    expect(
      found,
      `one concept, two signs — pick the σ* and rename the other:\n${found.join('\n')}`,
    ).toEqual([]);
  });

  it('every cell shape names its σ*-signified identity `residue`, exactly once', async () => {
    const signs = identitySigns(await census());
    const cells = new Set((await census()).map((f) => f.cell));
    expect([...signs.keys()].sort(), 'every cell shape declares one').toEqual(
      [...cells].sort(),
    );
    // `residue` ≜ D ∖ fired(α) — the post-subtraction side PARSIMONIOUS quantifies
    // over. `definiens` ≜ D is the PRE-subtraction input and never a cell field.
    for (const [cell, borne] of signs)
      expect(borne, `${cell}'s σ*-identity field`).toEqual(['residue']);
  });

  // ── the convicting fixtures — the same two predicates, fed the historical defect ──

  it('is non-vacuous — the census FAILS the exact collision it was built from', () => {
    // `rule-cell.ts` and `hook-cell.ts` as they stood before the 2026-08-05 ruling.
    const before = [
      'export interface RuleCell {',
      '  /** σ*-signified canonical identity — the `accept()`/REFLEXIVE target. */',
      '  readonly definiens: string;',
      '}',
      'export interface HookCell {',
      '  /** σ*-signified canonical identity (`body = ⟨α, residue⟩`) — the `accept()` target. */',
      '  readonly residue: string;',
      '}',
    ].join('\n');

    // the injection landed: both fields parsed, and they DO key to one concept
    const fields = cellFields(before);
    expect(fields.map((f) => f.sign)).toEqual(['definiens', 'residue']);
    expect(new Set(fields.map((f) => f.gloss)).size, 'one gloss').toBe(1);

    // the conviction — and it names both signs, so the failure is actionable
    expect(collisions(fields)).toEqual([
      '"σ*-signified canonical identity" → definiens + residue',
    ]);

    // the control: the SAME source with the ruling applied must go clean
    const after = before.replace('readonly definiens:', 'readonly residue:');
    expect(collisions(cellFields(after))).toEqual([]);
  });

  it('is non-vacuous — the σ*-identity leg REFUSES a lone cell that names it `definiens`', () => {
    // A collision needs two cells; this leg must bite on ONE, or a first cell shape
    // could ship the wrong sign unopposed and the census would have nothing to compare.
    const lone = [
      'export interface SkillCell {',
      '  /** σ*-signified canonical identity — the `accept()` target. */',
      '  readonly definiens: string;',
      '}',
    ].join('\n');
    const fields = cellFields(lone);
    expect(collisions(fields), 'one cell cannot collide').toEqual([]);
    expect(identitySigns(fields).get('SkillCell')).toEqual(['definiens']);

    const fixed = lone.replace('readonly definiens:', 'readonly residue:');
    expect(identitySigns(cellFields(fixed)).get('SkillCell')).toEqual([
      'residue',
    ]);
  });

  it('is non-vacuous — the gloss key REFUSES to merge two genuinely different concepts', () => {
    // The rule cuts BOTH ways: `definiens` ≜ D and `residue` ≜ D ∖ fired(α) are
    // different objects, so a gate that keyed on the shared root word would demand
    // one sign for two concepts. The key is the GLOSS, and these two differ.
    expect(glossKey('D(c) — the definiens (the core σ* fragment).')).not.toBe(
      glossKey('σ*-signified canonical identity — the `accept()` target.'),
    );
    // …while two tails elaborating one head DO merge, which is the whole mechanism.
    expect(
      glossKey('σ*-signified canonical identity — the REFLEXIVE target.'),
    ).toBe(
      glossKey(
        'σ*-signified canonical identity (`body = ⟨α, residue⟩`) — the `accept()` target.',
      ),
    );
  });
});
