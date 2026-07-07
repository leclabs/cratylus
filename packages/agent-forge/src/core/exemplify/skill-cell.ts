/**
 * The skill-cell renderer: a prose procedure's LLM-authored cell spec →
 * a well-formed SKILL.md — `name`+`description` frontmatter, a verb H1, and
 * a fenced set-builder formal block (declarations-above / laws-below).
 *
 * SEMANTIC SEAM: choosing the symbols, definientia, and laws (the formalize
 * act) is an LLM pass; the frame renders deterministically and enforces the
 * mechanical cell laws — kebab name, non-empty declarations, and
 * self-sufficiency: every call-syntax symbol used in the block is declared
 * in-block (the greppable symbol table). Violations refuse loudly.
 */

import { ExemplifyRefusal } from './types.js';

export interface SkillDeclaration {
  /** The declared symbol (line-leading token of a `≜` declaration). */
  symbol: string;
  /** The definiens — the text after `≜`. */
  definiens: string;
}

export interface SkillCellSpec {
  /** Kebab-case cell name (frontmatter `name:`). */
  name: string;
  /** One-line description (frontmatter `description:`). */
  description: string;
  /** The H1 verb the formal block enacts. */
  verb: string;
  /** Optional prose between the H1 and the formal block. */
  intro?: string;
  /** Declarations-above. */
  declarations: readonly SkillDeclaration[];
  /** Laws-below (each law one line of the block). */
  laws: readonly string[];
}

const CALL_TOKEN = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
const DECLARED = /^(\S+)\s*(?:≜|:)/gmu;

/** Render the formal block (declarations-above / laws-below), validating
 *  self-sufficiency. */
export function renderBody(spec: SkillCellSpec): string {
  const reasons: string[] = [];
  if (spec.declarations.length === 0) {
    reasons.push('a cell needs at least one declaration');
  }
  const block = [
    `-- DECLARATIONS ${'-'.repeat(42)}`,
    ...spec.declarations.map((d) => `${d.symbol} ≜ ${d.definiens}`),
    '',
    `-- LAWS ${'-'.repeat(50)}`,
    ...spec.laws,
  ].join('\n');
  const declared = new Set(
    [...block.matchAll(DECLARED)].map((m) => m[1] as string),
  );
  const undeclared = [
    ...new Set([...block.matchAll(CALL_TOKEN)].map((m) => m[1] as string)),
  ].filter((s) => !declared.has(s));
  if (undeclared.length > 0) {
    reasons.push(
      `self-sufficiency fails — undeclared symbol(s) used in the block: ${undeclared.join(', ')}`,
    );
  }
  if (reasons.length > 0) throw new ExemplifyRefusal(reasons);
  return block;
}

/** The cell body: verb H1 + optional intro + the fenced formal block —
 *  frontmatter-less, the form the config-IR `Skill.body` carries (adapters
 *  compose destination frontmatter from the IR's name/description). */
export function renderSkillCellBody(spec: SkillCellSpec): string {
  const block = renderBody(spec);
  const intro = spec.intro ? `${spec.intro}\n\n` : '';
  return `# ${spec.verb}\n\n${intro}\`\`\`text\n${block}\n\`\`\`\n`;
}

/** The full standalone SKILL.md cell (frontmatter + body). */
export function renderSkillCell(spec: SkillCellSpec): string {
  const reasons: string[] = [];
  if (!/^[a-z0-9-]+$/.test(spec.name)) {
    reasons.push(`cell name '${spec.name}' is not kebab-case`);
  }
  if (!spec.description || /\n/.test(spec.description)) {
    reasons.push('description must be one non-empty line');
  }
  if (!/^\w/.test(spec.verb)) {
    reasons.push(`verb H1 '${spec.verb}' must start with a word character`);
  }
  if (reasons.length > 0) throw new ExemplifyRefusal(reasons);
  const frontmatter = `---\nname: ${spec.name}\ndescription: ${spec.description}\n---\n\n`;
  return `${frontmatter}${renderSkillCellBody(spec)}`;
}
