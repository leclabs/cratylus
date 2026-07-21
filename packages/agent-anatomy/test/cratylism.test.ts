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
// COVERAGE: engineering-principles + every organ/dimension FRAGMENT (the paradigm case
// — each fragment is one discovered concept-sign). Composite/rule/hook cells declare
// identity via `.name`/`.id`; their filename↔identity check is a stated extension, not
// yet asserted here (no silent cap — declared).
//
// NON-VACUOUS: a synthetic fragment whose basename ≠ its body-anchor is convicted; the
// live corpus (minus the ratchet) passes. Both asserted below.

import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const anatomyRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const organsRoot = join(anatomyRoot, 'src', 'organs');

/** The σ* anchor a fragment declares: the first bareword of its template-literal body. */
function bodyAnchor(source: string): string | null {
  const m = source.match(/export const \w+: \w+ = `([a-z0-9-]+)/);
  return m ? m[1] : null;
}

/** kebab file basename (drop `.ts`). */
function fileAnchor(path: string): string {
  return basename(path, '.ts');
}

// Shrink-only. `<dimension>/<file>` → the divergent body-anchor it must reconcile to.
const RATCHET: ReadonlyMap<string, string> = new Map([
  ['autonomy/mission-command', 'auftragstaktik'],
  ['framing/systems', 'systems-thinking'],
]);

async function fragmentFiles(): Promise<string[]> {
  const out: string[] = [];
  for await (const p of glob('*/*.ts', { cwd: organsRoot }))
    out.push(join(organsRoot, p));
  return out.sort();
}

describe('CRATYLISM gate — file names are the discovered σ* anchor', () => {
  it('every fragment basename == the σ* anchor its body declares (ratchet aside)', async () => {
    const files = await fragmentFiles();
    expect(files.length).toBeGreaterThan(20); // non-vacuous: the corpus is enumerated

    const divergences: string[] = [];
    const staleRatchet: string[] = [];

    for (const f of files) {
      const key = relative(organsRoot, f).replace(/\.ts$/, '');
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

  it('is non-vacuous — a synthetic gloss-over-anchor fragment is convicted', () => {
    const synthetic =
      'export const missionCommand: Autonomy = `auftragstaktik ⟨escalate ⇔ fork⟩`;';
    const anchor = bodyAnchor(synthetic);
    expect(anchor).toBe('auftragstaktik');
    // file 'mission-command.ts' would carry anchor 'auftragstaktik' → divergence caught
    expect(anchor).not.toBe('mission-command');
  });
});
