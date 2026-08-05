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
// cell (file basename == declared `.name`/`.id`) · the dimension DIRS and the MANIFEST
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
import { DIMENSION_NAMES } from '../src/manifest.js';

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

/**
 * The first string-valued export of a module — the DEPLOYED payload, as distinct
 * from the file's source text. Comments may name cratylus-local paths freely
 * (they never ship); only the exported value crosses into a consumer.
 */
async function firstExportString(abs: string): Promise<string | null> {
  const mod = await import(abs);
  for (const k of Object.keys(mod))
    if (k !== 'default' && typeof mod[k] === 'string') return mod[k] as string;
  return null;
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
 * catalog key no dir can fill: the direction a typo'd `MANIFEST` entry hides in,
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

  // The axiom ships by TWO routes with very different reach: the dimension catalog
  // (`cratylism.ts` → only agents whose vector selects it — today, `nico` alone) and
  // the plugin `preamble` (`genus/founding-doctrine.ts` → EVERY SOUL + EVERY SKILL.md).
  // The preamble once carried a hand-transcribed copy, so cleaning the dimension left
  // 26 artifacts shipping the superseded axiom while the suite stayed green. The carry
  // is now BY IMPORT; these legs keep it that way.
  it('the intrinsic preamble carries the canonized σ* value verbatim', async () => {
    const { foundingDoctrine } = await import(
      '../src/genus/founding-doctrine.js'
    );
    const { cratylism } = await import(
      '../src/dimensions/engineering-principles/cratylism.js'
    );
    // `EngineeringPrinciples` is `Value<O>` — the UNION `Fragment<O> | Enforcing<O>`
    // — and `.length` exists on only one arm, so reading it off the union does not
    // compile. Narrow with the corpus's own derived predicate rather than casting:
    // the axiom is a BARE σ* fragment, and if it ever became enforcing this leg
    // would be measuring the wrong thing and should fail loudly here.
    const { enforcing } = await import('@cratylus/schema');
    if (enforcing(cratylism)) {
      throw new Error(
        'cratylism is declared ENFORCING — the prime principle is a bare σ* fragment, and this gate measures its body',
      );
    }
    expect(cratylism.length).toBeGreaterThan(80); // non-vacuous: a real axiom, not ''
    expect(
      foundingDoctrine,
      'preamble has drifted from the canonized cratylism value — carry it by import, never transcribe',
    ).toContain(cratylism);
  });

  // SCOPE FLOOR — the intrinsic carry rides into foreign repos, blank cwds, and foreign
  // agents invoking a canon skill. Anything in it naming a workspace-local artifact is a
  // dangling reference THERE, which is ambient content in the intrinsic carry — the very
  // distinction `founding-doctrine.ts` draws against `rules/repo-preamble.ts`. The apex
  // confidence-order (`cratylism ≻ VISION ≻ MODEL`) named two non-deployed docs and rode
  // out to every SOUL for exactly that reason; its one home is the AMBIENT carry.
  it('the intrinsic preamble names no workspace-local artifact', async () => {
    const { foundingDoctrine } = await import(
      '../src/genus/founding-doctrine.js'
    );
    // Repo-local, non-deployed grounding docs + the ambient carry itself.
    const local = ['VISION', 'MODEL.md', 'ENGINE', 'CANON.md', 'AGENTS.md'];
    const leaked = local.filter((d) => {
      // `¬ contingent on workspace-root AGENTS.md` legitimately names the ambient
      // carry to DISCLAIM it; a bare mention elsewhere is the leak.
      const stripped = foundingDoctrine.replace(
        '¬ contingent on workspace-root AGENTS.md',
        '',
      );
      return stripped.includes(d);
    });
    expect(
      leaked,
      `intrinsic preamble references workspace-local artifact(s) — move to rules/repo-preamble.ts: ${leaked.join(', ')}`,
    ).toEqual([]);
    // non-vacuous: the predicate convicts the string that actually shipped
    expect(
      'apex confidence-order : cratylism ≻ VISION ≻ MODEL'.includes('VISION'),
    ).toBe(true);
  });

  // The axiom's PROSE homes drift where its literal home cannot: a gloss re-explaining
  // cratylism passes the literal-home leg (different bytes) while saying something the
  // canonized value no longer says. It happened twice — `AGENTS.md` and `CANON.md`
  // §Relationship both re-explained it, and had already diverged on the third derived
  // principle (`signify` vs `σ*`). `AGENTS.md`'s own definiens is `doctrine-pointers`:
  // it points at CANON, so restating CANON there is the duplication. This leg pins the
  // confidence-order — the clause that recurred in both — out of `src` entirely; its
  // home is the hand-authored CANON.md, which is LOCKED and never generated from source.
  it('the apex confidence-order has no home in src — it belongs to CANON.md', async () => {
    const order = '≻ VISION'; // the confidence-order's distinguishing fragment
    const homes: string[] = [];
    for await (const p of glob('**/*.ts', { cwd: srcRoot })) {
      if (readFileSync(join(srcRoot, p), 'utf-8').includes(order))
        homes.push(p);
    }
    expect(
      homes,
      `the confidence-order names workspace-local docs and is restated in src — point at CANON.md §Relationship instead: ${homes.join(', ')}`,
    ).toEqual([]);
    // non-vacuous: the predicate convicts the clause that shipped from two homes
    expect('cratylism ≻ VISION ≻ MODEL'.includes(order)).toBe(true);
  });

  // SCOPE FLOOR, consumer register. The scaffold template's output is a CONSUMER's
  // `<target>/AGENTS.md` — cratylus's tree is not in context there, so a
  // `packages/…` path or a VISION/MODEL/ENGINE/CANON reference resolves to nothing.
  // Same seam as the intrinsic carry, one register over; it shipped `(packages/
  // canon)` into every scaffolded project until this leg existed. Naming the
  // upstream catalog is fine — it is provenance, not a path claim.
  it('the consumer scaffold template names no cratylus-local path', async () => {
    const { anatomyProjectTemplate } = await import(
      '../src/toolkit/project-template.js'
    );
    const emitted = [
      anatomyProjectTemplate.agentsMd('<subject>'),
      anatomyProjectTemplate.planMd('<subject>'),
    ].join('\n');
    const local = [
      'packages/',
      'VISION.md',
      'MODEL.md',
      'ENGINE.md',
      'CANON.md',
    ];
    const leaked = local.filter((d) => emitted.includes(d));
    expect(
      leaked,
      `consumer scaffold references cratylus-local artifact(s) — they do not exist in the target repo: ${leaked.join(', ')}`,
    ).toEqual([]);
    // non-vacuous: the predicate convicts the string that actually shipped
    expect(
      'projecting the canon catalog (`packages/canon`) into this'.includes(
        'packages/',
      ),
    ).toBe(true);
  });

  // SCOPE FLOOR, projected-cell register. Dimension values and skill formalBlocks
  // deploy into a CONSUMER's `.claude/`, where cratylus's tree is absent. Clean
  // today — this leg keeps it that way, since nothing else in the suite would notice
  // a `packages/…` path or a VISION/MODEL reference entering a cell. Completes the
  // seam: intrinsic carry · consumer scaffold · projected cells all gated; only
  // `rules/repo-preamble.ts` (cratylus-local, ρ=human) may name them.
  it('no projected cell names an cratylus-local path', async () => {
    const local = [
      'packages/',
      'VISION.md',
      'MODEL.md',
      'ENGINE.md',
      'CANON.md',
    ];
    const leaked: string[] = [];
    let checked = 0;
    for await (const p of glob('dimensions/*/*.ts', { cwd: srcRoot })) {
      const v = await firstExportString(join(srcRoot, p));
      if (v === null) continue;
      checked++;
      for (const d of local)
        if (v.includes(d)) leaked.push(`dimensions/${p}: ${d}`);
    }
    for await (const p of glob('skills/*/skill.ts', { cwd: srcRoot })) {
      const mod = await import(join(srcRoot, p));
      const s = mod[Object.keys(mod).find((k) => k !== 'default') as string];
      const block = typeof s?.formalBlock === 'string' ? s.formalBlock : '';
      if (!block) continue;
      checked++;
      for (const d of local) if (block.includes(d)) leaked.push(`${p}: ${d}`);
    }
    expect(checked).toBeGreaterThan(20); // non-vacuous: cells were actually read
    expect(
      leaked,
      `projected cell(s) name an cratylus-local artifact — absent in a consumer repo: ${leaked.join(', ')}`,
    ).toEqual([]);
  });

  it('cratylism has ONE literal home — no second transcription in src', async () => {
    const opening = 'cratylism ⟨names natural'; // the axiom's own σ* opening
    const homes: string[] = [];
    for await (const p of glob('**/*.ts', { cwd: srcRoot })) {
      if (readFileSync(join(srcRoot, p), 'utf-8').includes(opening))
        homes.push(p);
    }
    expect(homes.length, 'the axiom was not found at all — gate is DARK').toBe(
      1,
    );
    expect(
      homes,
      `a second literal home re-opens the drift this gate exists to close: ${homes.join(', ')}`,
    ).toEqual(['dimensions/engineering-principles/cratylism.ts']);
  });

  it('the dimension DIRS and the MANIFEST keys agree BOTH ways (dir == discovered axis)', async () => {
    const dirs = await dimensionDirs();
    expect(dirs.length).toBeGreaterThan(20); // non-vacuous: the dimension dirs are enumerated
    expect(DIMENSION_NAMES.length).toBeGreaterThan(20); // …and so is the catalog
    const drift = dirDrift(dirs, DIMENSION_NAMES);
    expect(
      drift,
      `dirs with no MANIFEST key: ${drift.orphanDirs.join(', ')} · MANIFEST keys with no dir: ${drift.missingDirs.join(', ')}`,
    ).toEqual({ orphanDirs: [], missingDirs: [] });
  });

  it('is non-vacuous — a dir with no key and a KEY WITH NO DIR are both convicted', async () => {
    const dirs = await dimensionDirs();

    // FORWARD — a dir the catalog never declared (a value dir under a coined name).
    expect(dirDrift([...dirs, 'telepathy'], DIMENSION_NAMES)).toEqual({
      orphanDirs: ['telepathy'],
      missingDirs: [],
    });

    // REVERSE — a catalog key no value dir can ever fill: the typo'd MANIFEST entry,
    // which offers a dimension the corpus cannot supply. The synthetic keyset is
    // built FROM `DIMENSION_NAMES` rather than by editing the live `MANIFEST`,
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
