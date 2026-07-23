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
// cell (file basename == declared `.name`/`.id`) · every dimension DIRECTORY (dir name ==
// a declared ANATOMY key). The file/directory structure IS the discovered naming.
//
// NON-VACUOUS: a synthetic fragment whose basename ≠ its body-anchor is convicted; the
// live corpus (minus the ratchet) passes. Both asserted below.

import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIMENSION_NAMES } from '@leclabs/agent-forge/anatomy';
import { describe, expect, it } from 'vitest';

const anatomyRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(anatomyRoot, 'src');
const dimensionsRoot = join(srcRoot, 'dimensions');

/** The σ* anchor a fragment declares: the first bareword of its template-literal body. */
function bodyAnchor(source: string): string | null {
  const m = source.match(/export const \w+: \w+ = `([a-z0-9-]+)/);
  return m ? m[1] : null;
}

/** The declared identity a composite/rule/hook cell carries: its first `name`/`id`. */
function declaredId(source: string): string | null {
  const m = source.match(/\b(?:name|id): '([a-z0-9-]+)'/);
  return m ? m[1] : null;
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

  it('every dimension DIRECTORY name is a declared ANATOMY key (dir == discovered axis)', async () => {
    const dirs: string[] = [];
    for await (const e of glob('*', {
      cwd: dimensionsRoot,
      withFileTypes: true,
    })) {
      if (e.isDirectory()) dirs.push(e.name);
    }
    expect(dirs.length).toBeGreaterThan(20); // non-vacuous: the dimension dirs are enumerated
    const keys = new Set<string>(DIMENSION_NAMES);
    const orphanDirs = dirs.filter((d) => !keys.has(d));
    expect(orphanDirs, `dirs not in ANATOMY: ${orphanDirs.join(', ')}`).toEqual(
      [],
    );
  });
});
