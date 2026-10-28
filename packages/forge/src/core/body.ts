// The HARNESS-NEUTRAL factor→markdown-body machinery: the shared helpers that map
// a typed `Agent` vector / `ResolvedSkill` to its composed markdown BODY, before
// any harness-specific framing (a claude or omp front-matter) wraps it.
//
// This is core, not an adapter: the composed Target body is identical whichever
// harness carries it (a claude `.md` body, an omp `.md` body),
// so BOTH adapters import these DOWNWARD from core — never sideways from each
// other.

import type {
  Agent,
  Entry,
  FactorManifest,
  FactorMeta,
  JsonSchema,
  Slot,
} from '@cratylus/schema';
import { bodyOf, factorValueOf, termOf } from '@cratylus/schema';
import { renderSkillBody } from './exemplify/skill-body.js';

// ── Factor → markdown helpers ────────────────────────────────────────────────────

/** factor kebab name → its `Agent` camelCase field. */
export function factorField(factor: string): string {
  return factor.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());
}

/**
 * The entries an agent holds for one factor FIELD. The completeness law makes
 * every non-attribute field a list; anything else is a vector the canon did not
 * compose, refused here rather than rendered as a silently empty section.
 */
export function entriesOf(a: Agent, field: string): readonly Entry[] {
  const held = factorValueOf(a, field);
  if (!Array.isArray(held)) {
    throw new Error(
      `agent '${a.name}': its '${field}' field is not a list of entries`,
    );
  }
  return held as readonly Entry[];
}

/**
 * One entry line: `- ` + (`<slot>: ` or `<slot> (<slot precising definition>): `) +
 * `**<term>**` + (` (<note>)`) + ` — <precising definition>` + (` (fixed)` when the level
 * is fixed). A value whose precising definition is empty is its term alone, so it carries
 * no ` — <precising definition>`.
 */
function entryLine(entry: Entry, slots: readonly Slot[] | undefined): string {
  const body = bodyOf(entry.value);
  const term = termOf(entry.value);
  const precisingDefinition = body.slice(term.length + ' ≜ '.length);
  let slot = '';
  if (entry.slot !== undefined) {
    const c = slots?.find((s) => s.name === entry.slot)?.precisingDefinition;
    slot = c ? `${entry.slot} (${c}): ` : `${entry.slot}: `;
  }
  const note = entry.note ? ` (${entry.note})` : '';
  const explained = term === body ? '' : ` — ${precisingDefinition}`;
  const fixed = entry.level === 'fixed' ? ' (fixed)' : '';
  return `- ${slot}**${term}**${note}${explained}${fixed}`;
}

/**
 * The agent def BODY (no front-matter) — derived from the `Agent` VECTOR alone:
 * `# <emoji> <name>` (`# <name>` with no mark), the description, then one
 * `## <Group>` per factor group in catalog order, and under it one `### <factor>`
 * per TEXT factor in catalog order, each held entry a line in held order. A factor
 * the agent holds no entry of states no departure, and renders no section; a group
 * none of whose text factors holds an entry is omitted. A `binding` factor is never
 * text — it compiles to harness settings — and an `attribute` factor occupies no
 * field; a group with no text factor is omitted. Then the agent's deliverable,
 * field by field, where its contract states one ({@link Agent.contract}). Closed
 * `rstrip() + "\n"`.
 *
 * The SECTION ORDER is the catalog's own declaration order — which is why the
 * catalog is a parameter and not a module read: the sequence of an agent's
 * sections is a fact about the canon that declared the factors.
 */
export function agentBody(a: Agent, manifest: FactorManifest): string {
  const heading = a.mark ? `${a.mark.emoji} ${a.name}` : a.name;
  const out: string[] = [`# ${heading}`, '', a.description, ''];
  // Groups by FIRST APPEARANCE, each gathering its text factors in catalog order,
  // so a group the manifest interleaves still renders as one section.
  const groups = new Map<string, [string, FactorMeta][]>();
  for (const [factor, meta] of Object.entries(manifest)) {
    if (meta.projection !== 'text' || meta.arity === 'attribute') continue;
    const factors = groups.get(meta.group) ?? [];
    factors.push([factor, meta]);
    groups.set(meta.group, factors);
  }
  for (const [group, factors] of groups) {
    const sections: string[] = [];
    for (const [factor, meta] of factors) {
      const entries = entriesOf(a, factorField(factor));
      if (entries.length === 0) continue;
      sections.push(`### ${factor}`, '');
      for (const entry of entries) sections.push(entryLine(entry, meta.slots));
      sections.push('');
    }
    if (sections.length > 0) out.push(`## ${group}`, '', ...sections);
  }
  if (a.contract?.deliverable !== undefined)
    out.push(...deliverableSection(a.contract.deliverable), '');
  return `${out.join('\n').replace(/\n+$/, '')}\n`;
}

/** What a schema holds, in a few words: its type, the item type of a list, the
 *  values it allows and the least number of items. */
function shapeOf(s: JsonSchema): string {
  const items = s.items;
  const base =
    s.type === 'array'
      ? `list of ${items?.type === 'object' ? 'objects' : `${items?.type ?? 'value'}s`}`
      : s.type === 'object' && s.additionalProperties !== undefined
        ? `map of ${typeof s.additionalProperties === 'object' ? (s.additionalProperties.type ?? 'value') : 'value'}s`
        : (s.type ?? 'value');
  const allowed = (s.enum ?? items?.enum)?.map((v) => `\`${v}\``).join(' or ');
  return [
    base,
    ...(allowed ? [allowed] : []),
    ...(s.minItems ? [`at least ${s.minItems}`] : []),
  ].join(', ');
}

/** Each field of an object schema as a line, `required` or `optional`, with what
 *  it means; an object's or a list of objects' own fields nested beneath it. */
function fieldLines(s: JsonSchema, depth: number): string[] {
  const object = s.type === 'array' ? s.items : s;
  return Object.entries(object?.properties ?? {}).flatMap(([name, field]) => {
    const need = object?.required?.includes(name) ? 'required' : 'optional';
    const meaning = field.description ? `: ${field.description}` : '';
    return [
      `${'  '.repeat(depth)}- \`${name}\` (${shapeOf(field)}, ${need})${meaning}`,
      ...fieldLines(field, depth + 1),
    ];
  });
}

/**
 * The agent's DELIVERABLE, as its contract states it ({@link Agent.contract}): what
 * it returns, field by field with what each means, so the agent knows what it
 * reports before it reports, launched or dispatched alike. The harness checks the
 * same schema at the return.
 */
function deliverableSection(schema: JsonSchema): string[] {
  return [
    '## Deliverable',
    '',
    ...(schema.description ? [schema.description, ''] : []),
    'Return it as one JSON object with these fields:',
    '',
    ...fieldLines(schema, 0),
  ];
}

// ── Resolved skill shape + body ──────────────────────────────────────────────

/** A resolved skill ready to project to its SKILL.md (harness-neutral). */
export interface ResolvedSkill {
  readonly name: string;
  readonly trigger: string;
  /** Front-matter `description` (the SKILL.md `description`). */
  readonly description: string;
  /** The formal set-builder block (declarations-above / laws-below), emitted verbatim
   *  inside the fence. Sourced from the `Skill.formalBlock` IR field. */
  readonly formalBlock: string;
  /** The names of the skills it composes (its provenance), already harness-projected (or []). */
  readonly composedFrom: readonly string[];
  /** OPTIONAL doctrine-AGNOSTIC leading block, emitted VERBATIM as the SKILL.md's
   *  first section (above the fenced formal block). The engine knows only "a
   *  leading block"; the skill that applies a principle fills it (`Skill.preamble`).
   *  Absent ⇒ omitted. */
  readonly preamble?: string;
  /**
   * The RUNTIME capability this skill is a face of (mirrors `Skill.runtime`). When
   * set, the projection emits a thin shim beside the SKILL.md and the body BINDS it
   * — without this the shim is unreachable: the skill would carry a script it cannot
   * name, which is why every skill fell back to embedding the bin name in prose.
   * Plain `string` (not `RuntimeCapability`) keeps core free of a canon `manifest`
   * import.
   */
  readonly runtime?: { readonly capability: string };
}

/** The verb H1, derived from the skill name (the term carries the verb). */
function deriveVerb(name: string): string {
  const words = name.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The SKILL.md body for a resolved skill, rendered through the ONE generator
 * `renderSkillBody` as `# <verb>` + fenced `formalBlock` + "Composed from …".
 * Shared by the claude and omp adapters. Returns `rstrip() + "\n"`.
 */
export function skillBody(s: ResolvedSkill): string {
  return renderSkillBody({
    verb: deriveVerb(s.name),
    block: s.formalBlock,
    composedFrom: s.composedFrom,
    preamble: s.preamble,
    runtime: s.runtime,
  });
}
