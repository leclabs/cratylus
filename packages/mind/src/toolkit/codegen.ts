// Codegen prototype (T1.1 spike): read a `<organ>/<value>.md` cell and emit the
// typed fragment module `organs/<organ>/<value>.ts`:
//
//     import type { <OrganType> } from '@leclabs/koine/anatomy';
//     export const <camelSlug>: <OrganType> = {
//       organ: '<organ>',
//       slug: '<slug>',
//       definiens: `…`,
//       mark: { emoji: '…', hue: '…' },   // persona/provenance only
//     };
//
// Prose (definiens) → a backticked template literal (backtick / ${ / backslash
// escaped). The `(organ, value)` pair becomes the module path; the camelSlug is
// the JS-identifier export name, while `slug` keeps the canonical kebab.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import {
  type ParsedCell,
  type ParsedSkill,
  parseCell,
  parseSkill,
} from './cell.js';

/** organ name (kebab) → the exported TS type alias (PascalCase). */
const ORGAN_TYPE: Record<string, string> = {
  address: 'Address',
  persona: 'Persona',
  mandate: 'Mandate',
  comportment: 'Comportment',
  'register-fit': 'RegisterFit',
  disclosure: 'Disclosure',
  provenance: 'Provenance',
  telos: 'Telos',
  charter: 'Charter',
  instructions: 'Instructions',
  heuristics: 'Heuristics',
  competence: 'Competence',
  'disposition-memory': 'DispositionMemory',
  gestalt: 'Gestalt',
  effectors: 'Effectors',
  sensors: 'Sensors',
  substrate: 'Substrate',
  ledger: 'Ledger',
  percept: 'Percept',
  construal: 'Construal',
  deliberation: 'Deliberation',
  resolve: 'Resolve',
  enaction: 'Enaction',
  appraisal: 'Appraisal',
};

/** kebab-or-dotted slug → a safe camelCase JS identifier for the export. */
export function camelSlug(slug: string): string {
  const camel = slug
    .split(/[-.]/)
    .map((part, i) =>
      i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join('');
  // A slug may begin with a digit (rare); prefix to keep a valid identifier.
  return /^[0-9]/.test(camel) ? `_${camel}` : camel;
}

/** Escape a string for safe embedding in a backticked template literal. */
function backtickLiteral(s: string): string {
  const escaped = s
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  return `\`${escaped}\``;
}

/** Emit the `.ts` module source for a parsed cell. */
export function emitModule(cell: ParsedCell): string {
  const type = ORGAN_TYPE[cell.organ];
  if (!type) {
    throw new Error(`codegen: unknown organ "${cell.organ}"`);
  }
  const name = camelSlug(cell.slug);
  const lines = [
    `import type { ${type} } from '@leclabs/koine/anatomy';`,
    '',
    `export const ${name}: ${type} = {`,
    `  organ: '${cell.organ}',`,
    `  slug: '${cell.slug}',`,
    `  definiens: ${backtickLiteral(cell.definiens)},`,
  ];
  if (cell.mark) {
    lines.push(
      `  mark: { emoji: '${cell.mark.emoji}', hue: '${cell.mark.hue}' },`,
    );
  }
  lines.push('};', '');
  return lines.join('\n');
}

/** Read a cell file → parsed cell + emitted module source. */
export function codegenCell(cellPath: string): {
  cell: ParsedCell;
  module: string;
} {
  const raw = readFileSync(cellPath, 'utf8');
  const cell = parseCell(raw);
  return { cell, module: emitModule(cell) };
}

/**
 * Emit a skill module. The body is carried VERBATIM in a backtick literal (the
 * `render: verbatim` mirror) so projection is byte-exact; the typed `Skill`
 * fields are queryable metadata. `composition` is emitted as sibling-skill name
 * ANCHORS (strings), NOT eager sibling imports — the skill graph has genuine
 * cycles (conceptualize↔exemplify↔signify↔materialize, elicit↔probe), so an
 * eager `const`-reference array would hit ESM temporal-dead-zone at module eval.
 * The anchors preserve the composition data losslessly; resolving them to live
 * `Skill` objects (the T0.1 `composition: Skill[]`) is a lazy-thunk concern for
 * T1.2 (see the finding in the round-trip report).
 */
export function emitSkillModule(skill: ParsedSkill): string {
  const name = camelSlug(skill.name);
  const composition =
    skill.composition.length === 0
      ? '[]'
      : `[${skill.composition.map((c) => `'${c}'`).join(', ')}]`;
  return [
    `import type { SkillCell } from '../toolkit/skill-cell.js';`,
    '',
    `export const ${name}: SkillCell = {`,
    `  name: '${skill.name}',`,
    `  trigger: ${backtickLiteral(skill.trigger)},`,
    `  delineation: ${backtickLiteral(skill.delineation)},`,
    `  verb: ${backtickLiteral(skill.verb)},`,
    `  formalBlock: ${backtickLiteral(skill.formalBlock)},`,
    `  composition: ${composition},`,
    `  body: ${backtickLiteral(skill.body)},`,
    '};',
    '',
  ].join('\n');
}

/** Read a skill cell file → parsed skill + emitted module source. */
export function codegenSkill(cellPath: string): {
  skill: ParsedSkill;
  module: string;
} {
  const raw = readFileSync(cellPath, 'utf8');
  const fileSlug = basename(cellPath).replace(/\.md$/, '');
  const skill = parseSkill(raw, fileSlug);
  return { skill, module: emitSkillModule(skill) };
}

/** A cell is a skill iff its front-matter `kind:` is `skill`. */
function isSkillCell(raw: string): boolean {
  return /^kind:\s*skill\s*$/m.test(raw);
}

// CLI: `tsx src/toolkit/codegen.ts <cell.md> [<cell.md> …]` — writes each value
// cell to `src/organs/<organ>/<value>.ts` and each skill cell to
// `src/skills/<name>.ts` (the proposed TS source root). `MIND_SRC_OUT` overrides
// the `src/` destination root.
if (import.meta.url === `file://${process.argv[1]}`) {
  const srcRoot = process.env.MIND_SRC_OUT ?? join(process.cwd(), 'src');
  for (const cellPath of process.argv.slice(2)) {
    const raw = readFileSync(cellPath, 'utf8');
    const base = basename(cellPath).replace(/\.md$/, '');
    let outPath: string;
    let module: string;
    if (isSkillCell(raw)) {
      ({ module } = codegenSkill(cellPath));
      const outDir = join(srcRoot, 'skills');
      mkdirSync(outDir, { recursive: true });
      outPath = join(outDir, `${base}.ts`);
    } else {
      const { cell, module: m } = codegenCell(cellPath);
      module = m;
      const outDir = join(srcRoot, 'organs', cell.organ);
      mkdirSync(outDir, { recursive: true });
      outPath = join(outDir, `${base}.ts`);
    }
    writeFileSync(outPath, module);
    process.stdout.write(`${cellPath} → ${outPath}\n`);
  }
}
