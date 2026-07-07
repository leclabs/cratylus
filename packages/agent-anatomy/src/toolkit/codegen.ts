// Codegen prototype (T1.1 spike): read a `<organ>/<value>.md` cell and emit the
// typed fragment module `organs/<organ>/<value>.ts`:
//
//     import type { <OrganType> } from '@leclabs/agent-forge/anatomy';
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
import { ORGAN_NAMES } from '@leclabs/agent-forge/anatomy';
import {
  type ParsedAgent,
  type ParsedCell,
  type ParsedSkill,
  parseAgent,
  parseCell,
  parseSkill,
} from './cell.js';

/** organ name (kebab) → the exported TS type alias (PascalCase). */
const ORGAN_TYPE: Record<string, string> = {
  autonomy: 'Autonomy',
  role: 'Role',
  formality: 'Formality',
  'audience-adaptation': 'AudienceAdaptation',
  transparency: 'Transparency',
  objective: 'Objective',
  guardrails: 'Guardrails',
  'engineering-principles': 'EngineeringPrinciples',
  heuristics: 'Heuristics',
  capabilities: 'Capabilities',
  learning: 'Learning',
  'situation-awareness': 'SituationAwareness',
  actions: 'Actions',
  modalities: 'Modalities',
  model: 'Model',
  memory: 'Memory',
  trigger: 'Trigger',
  framing: 'Framing',
  'reasoning-strategy': 'ReasoningStrategy',
  satisficing: 'Satisficing',
  'output-format': 'OutputFormat',
  'self-evaluation': 'SelfEvaluation',
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

/** Emit the `.ts` module source for a parsed cell — a branded-string value. */
export function emitModule(cell: ParsedCell): string {
  const type = ORGAN_TYPE[cell.organ];
  if (!type) {
    throw new Error(`codegen: unknown organ "${cell.organ}"`);
  }
  const name = camelSlug(cell.slug);
  return [
    `import type { ${type} } from '@leclabs/agent-forge/anatomy';`,
    '',
    `export const ${name}: ${type} = ${backtickLiteral(`${cell.slug} ≜ ${cell.definiens}`)};`,
    '',
  ].join('\n');
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
    `  delineation: ${backtickLiteral(skill.delineation)},`,
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

/** The 6 SET organs (array fields on `Agent`); all others are scalar. */
const SET_ORGANS = new Set([
  'autonomy',
  'guardrails',
  'capabilities',
  'actions',
  'heuristics',
  'engineering-principles',
]);

/** organ name (kebab) → the `Agent` field name (camelCase). */
function organField(organ: string): string {
  return camelSlug(organ);
}

/**
 * Emit an agent module — the single `<name>: Agent` organ-selection vector
 * (projection derives from the vector in the adapters, no pre-resolved twin).
 * Scalar organs hold one branded value, set organs hold arrays; unselected are
 * `null` (completeness law). `persona`/`provenance` are not fragment organs —
 * they are emitted as the plain-string / `{mark}` placeholders (filled per agent).
 */
export function emitAgentModule(agent: ParsedAgent, _fileSlug: string): string {
  const camelName = camelSlug(agent.name);

  // Collect value imports: each (organ, value) → `../organs/<organ>/<value>.js`.
  const imports: string[] = [];
  const importedNames = new Map<string, string>(); // `${organ}/${value}` → local id
  for (const [organ, values] of agent.selection) {
    for (const value of values) {
      const key = `${organ}/${value}`;
      if (importedNames.has(key)) {
        continue;
      }
      const local = `${camelSlug(value)}_${camelSlug(organ)}`;
      importedNames.set(key, local);
      imports.push(
        `import { ${camelSlug(value)} as ${local} } from '../organs/${organ}/${value}.js';`,
      );
    }
  }
  imports.sort();

  const ref = (organ: string, value: string) =>
    importedNames.get(`${organ}/${value}`) as string;

  const agentFields: string[] = [
    `  name: '${agent.name}',`,
    "  persona: '',",
    '  provenance: null,',
  ];
  for (const [organ, values] of agent.selection) {
    const field = organField(organ);
    if (SET_ORGANS.has(organ)) {
      agentFields.push(
        `  ${field}: [${values.map((v) => ref(organ, v)).join(', ')}],`,
      );
    } else {
      agentFields.push(`  ${field}: ${ref(organ, values[0] as string)},`);
    }
  }
  // Every organ key is REQUIRED on `Agent` (completeness law): an organ the cell
  // does not select is spelled `null` (explicit omit-to-inherit).
  const selected = new Set<string>(agent.selection.map(([organ]) => organ));
  for (const organ of ORGAN_NAMES) {
    if (!selected.has(organ)) {
      agentFields.push(`  ${organField(organ)}: null,`);
    }
  }

  return [
    `import type { Agent } from '@leclabs/agent-forge/anatomy';`,
    ...imports,
    '',
    `export const ${camelName}: Agent = {`,
    ...agentFields,
    '};',
    '',
  ].join('\n');
}

/** Read an agent cell file → parsed agent + emitted module source. */
export function codegenAgent(cellPath: string): {
  agent: ParsedAgent;
  module: string;
} {
  const raw = readFileSync(cellPath, 'utf8');
  const fileSlug = basename(cellPath).replace(/\.md$/, '');
  const agent = parseAgent(raw, fileSlug);
  return { agent, module: emitAgentModule(agent, fileSlug) };
}

/** A cell is an agent iff its front-matter `kind:` is `agent`. */
function isAgentCell(raw: string): boolean {
  return /^kind:\s*agent\s*$/m.test(raw);
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
    } else if (isAgentCell(raw)) {
      ({ module } = codegenAgent(cellPath));
      const outDir = join(srcRoot, 'agents');
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
