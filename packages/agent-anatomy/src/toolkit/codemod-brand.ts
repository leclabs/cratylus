// E1 green-keeping codemod (canon-collapse). Rewrites the existing corpus cells
// from the `describe-era` shapes to the MODEL address shape so the repo typechecks
// the instant the anatomy types change (`Fragment` object → per-organ branded
// string; SkillCell/HookCell structural-field strip). It is a MECHANICAL pass:
//
//   organ value cell  `{ organ, slug, definiens }`  →  `<slug> ≜ <definiens>`
//                     (the branded-string body ⟨α, residue⟩; residue := old
//                      definiens VERBATIM — O* later reduces it to `D ∖ fired(α)`)
//   skill cell        drop the derivable `trigger` (= `/`+name) and `verb` lines;
//                     keep name / description / body / composition / body
//   hook cell         drop `kind` (restates the type) and `slug` (== id == filename);
//                     rename `definiens` → `residue`; keep events/command/workers
//
// It reads each organ cell's RUNTIME value (dynamic import — type-only imports
// erase, so the object shape is readable regardless of the anatomy types) and
// re-emits, preserving the module's `import`s and `export const <name>: <Type>`.
// `organs/persona` + `organs/provenance` are EXCLUDED (their fragment kinds are
// removed; those cells are deleted, not rewritten). Already-branded string cells
// (e.g. `autonomy/decision-authority.ts`) are left untouched.
//
// Run: `tsx src/toolkit/codemod-brand.ts` (from the agent-anatomy package root).

import { readFileSync, writeFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(here, '..');
const organsRoot = join(srcRoot, 'organs');
const skillsRoot = join(srcRoot, 'skills');
const hooksRoot = join(srcRoot, 'hooks');

/** Escape a string for safe embedding in a backticked template literal. */
function backtick(s: string): string {
  return `\`${s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``;
}

interface Report {
  organsRewritten: string[];
  organsSkipped: string[];
  skillsRewritten: string[];
  hooksRewritten: string[];
}

async function rewriteOrgans(report: Report): Promise<void> {
  const rels: string[] = [];
  for await (const p of glob('**/*.ts', { cwd: organsRoot })) {
    if (p.startsWith('persona/') || p.startsWith('provenance/')) continue;
    rels.push(p);
  }
  rels.sort();
  for (const rel of rels) {
    const abs = join(organsRoot, rel);
    const src = readFileSync(abs, 'utf8');
    const mod = (await import(pathToFileURL(abs).href)) as Record<
      string,
      unknown
    >;
    // The object-shaped value cell has one export carrying `{ slug, definiens }`.
    const entry = Object.entries(mod).find(
      ([, v]) =>
        typeof v === 'object' &&
        v !== null &&
        typeof (v as Record<string, unknown>).slug === 'string' &&
        typeof (v as Record<string, unknown>).definiens === 'string',
    );
    if (!entry) {
      report.organsSkipped.push(rel); // already branded (string export) — leave it
      continue;
    }
    const value = entry[1] as { slug: string; definiens: string };
    const decl = src.match(/export const (\w+):\s*([A-Za-z0-9_]+)\s*=/);
    if (!decl)
      throw new Error(`${rel}: no \`export const NAME: Type =\` found`);
    const [, name, type] = decl;
    const prefix = src.slice(0, decl.index); // imports + leading blank lines
    const body = backtick(`${value.slug} ≜ ${value.definiens}`);
    const out = `${prefix.replace(/\s+$/, '')}\n\nexport const ${name}: ${type} = ${body};\n`;
    writeFileSync(abs, out);
    report.organsRewritten.push(rel);
  }
}

async function rewriteSkills(report: Report): Promise<void> {
  const rels: string[] = [];
  for await (const p of glob('*.ts', { cwd: skillsRoot })) rels.push(p);
  rels.sort();
  for (const rel of rels) {
    const abs = join(skillsRoot, rel);
    const src = readFileSync(abs, 'utf8');
    // Drop the two derivable single-line fields (`trigger` = `/`+name, `verb`).
    const out = src
      .replace(/^ {2}trigger:.*\n/m, '')
      .replace(/^ {2}verb:.*\n/m, '');
    if (out !== src) {
      writeFileSync(abs, out);
      report.skillsRewritten.push(rel);
    }
  }
}

async function rewriteHooks(report: Report): Promise<void> {
  const rels: string[] = [];
  for await (const p of glob('*.ts', { cwd: hooksRoot })) rels.push(p);
  rels.sort();
  for (const rel of rels) {
    const abs = join(hooksRoot, rel);
    const src = readFileSync(abs, 'utf8');
    // Drop `kind` (restates the type) + `slug` (== id == filename); rename the
    // σ*-identity field `definiens` → `residue`.
    const out = src
      .replace(/^ {2}kind:.*\n/m, '')
      .replace(/^ {2}slug:.*\n/m, '')
      .replace(/^ {2}definiens:/m, '  residue:');
    if (out !== src) {
      writeFileSync(abs, out);
      report.hooksRewritten.push(rel);
    }
  }
}

const report: Report = {
  organsRewritten: [],
  organsSkipped: [],
  skillsRewritten: [],
  hooksRewritten: [],
};
await rewriteOrgans(report);
await rewriteSkills(report);
await rewriteHooks(report);
process.stdout.write(
  `codemod-brand:\n  organs rewritten: ${report.organsRewritten.length}\n  organs skipped (already branded): ${report.organsSkipped.length} [${report.organsSkipped.join(', ')}]\n  skills rewritten: ${report.skillsRewritten.length}\n  hooks rewritten:  ${report.hooksRewritten.length}\n`,
);
