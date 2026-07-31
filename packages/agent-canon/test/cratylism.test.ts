// CRATYLISM gate — the core naming invariant, enforcing the ground principle
// `cratylism` (engineering-principles): a concept's canonical sign is DISCOVERED
// (cold-verified against the model's priors), never coined. Therefore every NAME in
// the corpus — including the FILE/DIRECTORY structure itself — must BE the discovered
// σ* anchor, not a conventional gloss that diverges from it.
//
// TWO LEGS of the invariant:
//   • STRUCTURAL (hermetic, asserted here, every run): a fragment's file basename ==
//     the σ* anchor its body declares (`export const … = \`<anchor> …\``). The file
//     name IS the discovered sign; a gloss filename over a different body-anchor is a
//     cratylism violation.
//   • SEMANTIC (non-hermetic, NOT asserted here): the anchor cold-DECODES to its
//     concept — the archaeology. Its instrument is the cold-oracle
//     (`src/toolkit/cold-oracle` `decodeCold` / `sweep.mjs`), run at authoring + CI,
//     never coined by author or operator. It cannot run in a hermetic unit test (it
//     calls the live model), so this gate asserts the structural leg and points to the
//     oracle for the semantic one. The principle is additionally enforced EVERY TURN by
//     PROJECTION: `cratylism` is in every canon-authoring agent's vector + `AGENTS.md`,
//     so the discipline is in-context at decision time.
//
// RATCHET — a shrink-only allowlist of known filename≠anchor divergences (a file whose
// name is an English gloss, not its body's discovered anchor). Each must be reconciled
// deliberately (rename the file to the anchor, OR re-signify the body if the filename
// is in fact the fitter sign). NO silent exemptions: a pin that STOPS diverging FAILS
// the suite (remove it); a new divergence is never pinnable silently.
//
// COVERAGE (comprehensive — all names are the discovered anchor): every
// dimension/dimension FRAGMENT (file basename == body σ*-anchor) · every composite/rule/hook
// cell (file basename == declared `.name`/`.id`) · the dimension DIRS and the ANATOMY
// keys, BOTH ways (no dir without a key, no key without a dir). The file/directory
// structure IS the discovered naming.
//
// NON-VACUOUS: a synthetic fragment whose basename ≠ its body-anchor is convicted; the
// live corpus (minus the ratchet) passes. Both asserted below.

import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { DIMENSION_NAMES } from '../src/anatomy.js';

const anatomyRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(anatomyRoot, 'src');
const dimensionsRoot = join(srcRoot, 'dimensions');

/** The σ* anchor a fragment declares: the first bareword of its template-literal body. */
function bodyAnchor(source: string): string | null {
  return source.match(/export const \w+: \w+ = `([a-z0-9-]+)/)?.[1] ?? null;
}

/** The declared identity a composite/rule/hook cell carries: its first `name`/`id`. */
function declaredId(source: string): string | null {
  return source.match(/\b(?:name|id): '([a-z0-9-]+)'/)?.[1] ?? null;
}

/** kebab file basename (drop `.ts`). */
function fileAnchor(path: string): string {
  return basename(path, '.ts');
}

// Shrink-only allowlist of known filename≠anchor divergences. EMPTY — the corpus fully
// conforms: the two founding divergences were reconciled by cold-discovery of the fitter
// sign (autonomy: body `auftragstaktik` → `mission-command`, the sign that decodes
// reliably across model populations; framing: file `systems` → `systems-thinking`, the
// file renamed to the discovered anchor). A future divergence is never pinnable silently.
const RATCHET: ReadonlyMap<string, string> = new Map();

/** The dimension DIRS on disk — the corpus half of the descriptor↔corpus pair. */
async function dimensionDirs(): Promise<string[]> {
  const dirs: string[] = [];
  for await (const e of glob('*', { cwd: dimensionsRoot, withFileTypes: true }))
    if (e.isDirectory()) dirs.push(e.name);
  return dirs.sort();
}

/**
 * Descriptor↔corpus drift, BOTH directions, as a function of the two sets so a
 * synthetic drifted pair can be fed to the same code the live leg runs.
 *
 * `orphanDirs` — a value dir the catalog never declared. `missingDirs` — a
 * catalog key no dir can fill: the direction a typo'd `ANATOMY` entry hides in,
 * offering a dimension the corpus can never supply. Checking one is half a check.
 */
function dirDrift(
  dirs: readonly string[],
  declared: readonly string[],
): { orphanDirs: string[]; missingDirs: string[] } {
  const onDisk = new Set<string>(dirs);
  const inCatalog = new Set<string>(declared);
  return {
    orphanDirs: dirs.filter((d) => !inCatalog.has(d)).sort(),
    missingDirs: declared.filter((k) => !onDisk.has(k)).sort(),
  };
}

async function fragmentFiles(): Promise<string[]> {
  const out: string[] = [];
  for await (const p of glob('*/*.ts', { cwd: dimensionsRoot }))
    out.push(join(dimensionsRoot, p));
  return out.sort();
}

describe('CRATYLISM gate — file names are the discovered σ* anchor', () => {
  it('every fragment basename == the σ* anchor its body declares (ratchet aside)', async () => {
    const files = await fragmentFiles();
    expect(files.length).toBeGreaterThan(20); // non-vacuous: the corpus is enumerated

    const divergences: string[] = [];
    const staleRatchet: string[] = [];

    for (const f of files) {
      const key = relative(dimensionsRoot, f).replace(/\.ts$/, '');
      const anchor = bodyAnchor(readFileSync(f, 'utf-8'));
      if (!anchor) continue; // not a σ*-fragment shape (e.g. an index) — out of scope
      const file = fileAnchor(f);
      const diverges = anchor !== file;
      if (RATCHET.has(key)) {
        if (!diverges) staleRatchet.push(key); // pin no longer needed → must be removed
      } else if (diverges) {
        divergences.push(
          `${key}.ts: file '${file}' ≠ discovered anchor '${anchor}'`,
        );
      }
    }

    expect(divergences, divergences.join('\n')).toEqual([]);
    expect(
      staleRatchet,
      `stale ratchet pins (remove): ${staleRatchet.join(', ')}`,
    ).toEqual([]);
  });

  it('is non-vacuous — a gloss filename over a different body-anchor diverges', () => {
    // a fictional cell: body declares the discovered anchor, file is a coined gloss
    const synthetic =
      'export const someValue: Framing = `discovered-anchor ⟨…⟩`;';
    const anchor = bodyAnchor(synthetic);
    const file = 'coined-gloss'; // basename that is a gloss, not the anchor
    expect(anchor).toBe('discovered-anchor');
    expect(anchor !== file).toBe(true); // the gate's divergence predicate convicts it
  });

  it('every composite/rule/hook file basename == its declared identity (name/id)', async () => {
    const divergences: string[] = [];
    let checked = 0;
    for (const kind of ['skills', 'agents', 'rules', 'hooks']) {
      // Skill cells are self-contained dirs `skills/<name>/skill.ts`: the
      // discovered sign is the DIRECTORY name (`name==parent-dir`), not the
      // uniform `skill` basename. Every other kind is still a flat `<id>.ts`.
      const isSkillDir = kind === 'skills';
      const pattern = isSkillDir ? '*/skill.ts' : '*.ts';
      for await (const p of glob(pattern, { cwd: join(srcRoot, kind) })) {
        const f = join(srcRoot, kind, p);
        const id = declaredId(readFileSync(f, 'utf-8'));
        if (!id) continue; // no declared identity (e.g. a barrel) — out of scope
        checked++;
        const file = isSkillDir ? dirname(p) : basename(p, '.ts');
        if (id !== file)
          divergences.push(`${kind}/${p}: file '${file}' ≠ id '${id}'`);
      }
    }
    expect(checked).toBeGreaterThan(20); // non-vacuous: identities were actually extracted
    expect(divergences, divergences.join('\n')).toEqual([]);
  });

  it('the dimension DIRS and the ANATOMY keys agree BOTH ways (dir == discovered axis)', async () => {
    const dirs = await dimensionDirs();
    expect(dirs.length).toBeGreaterThan(20); // non-vacuous: the dimension dirs are enumerated
    expect(DIMENSION_NAMES.length).toBeGreaterThan(20); // …and so is the catalog
    const drift = dirDrift(dirs, DIMENSION_NAMES);
    expect(
      drift,
      `dirs with no ANATOMY key: ${drift.orphanDirs.join(', ')} · ANATOMY keys with no dir: ${drift.missingDirs.join(', ')}`,
    ).toEqual({ orphanDirs: [], missingDirs: [] });
  });

  it('is non-vacuous — a dir with no key and a KEY WITH NO DIR are both convicted', async () => {
    const dirs = await dimensionDirs();

    // FORWARD — a dir the catalog never declared (a value dir under a coined name).
    expect(dirDrift([...dirs, 'telepathy'], DIMENSION_NAMES)).toEqual({
      orphanDirs: ['telepathy'],
      missingDirs: [],
    });

    // REVERSE — a catalog key no value dir can ever fill: the typo'd ANATOMY entry,
    // which offers a dimension the corpus cannot supply. The synthetic keyset is
    // built FROM `DIMENSION_NAMES` rather than by editing the live `ANATOMY`,
    // because a bare key added there makes every agent vector miss a field — that
    // is a COMPILE error, and reading one as a gate firing proves nothing about
    // this leg.
    expect(dirDrift(dirs, [...DIMENSION_NAMES, 'memroy'])).toEqual({
      orphanDirs: [],
      missingDirs: ['memroy'],
    });
    // …and the direction a RENAMED dir breaks: the old key is unfillable, the new
    // dir undeclared — one act, both readings. The victim is whichever dir the
    // corpus lists first, so this fixture does not silently stop biting the day a
    // particular dimension is renamed away.
    const [victim] = dirs;
    expect(
      victim,
      'no dimension dir to rename — the fixture is DARK',
    ).toBeTypeOf('string');
    expect(
      dirDrift(
        dirs.map((d) => (d === victim ? 'recall' : d)),
        DIMENSION_NAMES,
      ),
    ).toEqual({ orphanDirs: ['recall'], missingDirs: [victim] });

    // EXONERATES: the live corpus is genuinely clean, not merely unexamined.
    expect(dirDrift(dirs, DIMENSION_NAMES)).toEqual({
      orphanDirs: [],
      missingDirs: [],
    });
  });
});
