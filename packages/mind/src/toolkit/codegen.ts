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
import { type ParsedCell, parseCell } from './cell.js';

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
    .map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
  // A slug may begin with a digit (rare); prefix to keep a valid identifier.
  return /^[0-9]/.test(camel) ? `_${camel}` : camel;
}

/** Escape a string for safe embedding in a backticked template literal. */
function backtickLiteral(s: string): string {
  const escaped = s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
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
    lines.push(`  mark: { emoji: '${cell.mark.emoji}', hue: '${cell.mark.hue}' },`);
  }
  lines.push('};', '');
  return lines.join('\n');
}

/** Read a cell file → parsed cell + emitted module source. */
export function codegenCell(cellPath: string): { cell: ParsedCell; module: string } {
  const raw = readFileSync(cellPath, 'utf8');
  const cell = parseCell(raw);
  return { cell, module: emitModule(cell) };
}

// CLI: `tsx src/toolkit/codegen.ts <cell.md> [<cell.md> …]` — writes each
// emitted module to `src/organs/<organ>/<value>.ts` (the proposed TS source
// root). `MIND_ORGANS_OUT` overrides the destination root.
if (import.meta.url === `file://${process.argv[1]}`) {
  const outRoot = process.env.MIND_ORGANS_OUT ?? join(process.cwd(), 'src', 'organs');
  for (const cellPath of process.argv.slice(2)) {
    const { cell, module } = codegenCell(cellPath);
    const outDir = join(outRoot, cell.organ);
    mkdirSync(outDir, { recursive: true });
    const outPath = join(outDir, basename(cellPath).replace(/\.md$/, '.ts'));
    writeFileSync(outPath, module);
    process.stdout.write(`${cellPath} → ${outPath}\n`);
  }
}
