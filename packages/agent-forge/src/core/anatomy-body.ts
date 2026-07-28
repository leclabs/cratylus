// The HARNESS-NEUTRAL dimension→markdown-body machinery: the shared helpers that map
// a typed `Agent` vector / `ResolvedSkill` to its composed markdown BODY, before
// any harness-specific framing (claude front-matter, codex TOML) wraps it.
//
// This is core, not an adapter: the composed SOUL body is identical whichever
// harness carries it (a claude `.md` body, a codex `.toml` `developer_instructions`),
// so BOTH adapters import these DOWNWARD from core — never sideways from each
// other. (Kills the former `codex/anatomy.ts → claude/anatomy.ts` edge.)

import type { Agent, Dimension, Value } from '../anatomy/index.js';
import { DIMENSION_NAMES, bodyOf } from '../anatomy/index.js';
import { renderSkillCellBody } from './exemplify/skill-cell.js';

// ── Dimension → markdown helpers ─────────────────────────────────────────────────

/** `audience-adaptation` → `Audience-Adaptation`, `output-format` → `Output-Format`. */
export function dimensionTitle(dimension: string): string {
  return dimension
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');
}

/** dimension kebab name → its `Agent` camelCase field. */
export function dimensionField(dimension: string): keyof Agent {
  return dimension.replace(/-(\w)/g, (_, c: string) =>
    c.toUpperCase(),
  ) as keyof Agent;
}

/**
 * The agent def BODY (no front-matter) — derived from the `Agent` VECTOR alone:
 * `# <emoji> <name>`, the `## Archetype` identity section, then each non-null dimension
 * (in ANATOMY declaration order) as a `## <Dimension-Title>` heading + its branded
 * value(s) — the value string IS the SOUL body ⟨α, residue⟩, emitted verbatim; a
 * set dimension lists its members blank-separated. `null` dimensions are omitted
 * (harness-inherit). Closed `rstrip() + "\n"`.
 */
export function agentBody(a: Agent): string {
  const emoji = a.provenance?.mark.emoji ?? '';
  const heading = emoji ? `${emoji} ${a.name}` : a.name;
  const out: string[] = [`# ${heading}`, ''];
  // Doctrine-agnostic leading block (verbatim), above `## Archetype` — the consumer's
  // founding-doctrine carry when set; the engine knows only that it leads.
  if (a.preamble) {
    out.push(a.preamble, '');
  }
  if (a.archetype) {
    out.push('## Archetype', '', a.archetype, '');
  }
  for (const dimension of DIMENSION_NAMES) {
    const value = a[dimensionField(dimension)];
    if (value === null || value === undefined) {
      continue;
    }
    out.push(`## ${dimensionTitle(dimension)}`, '');
    for (const v of Array.isArray(value) ? value : [value]) {
      // `bodyOf`, not `v as string`. A value may carry its own enforcement, in
      // which case it is an OBJECT and the old cast rendered `[object Object]`
      // straight into the SOUL — a corruption tsc could not see, because the cast
      // was the thing suppressing it. The SOUL carries the DECLARATION face only:
      // substrate and events are where the rule binds, not what it says.
      out.push(bodyOf(v as Value<Dimension>), '');
    }
  }
  return `${out.join('\n').replace(/\n+$/, '')}\n`;
}

// ── Resolved skill shape + body ──────────────────────────────────────────────

/** A resolved skill ready to project to its SKILL.md (harness-neutral). */
export interface ResolvedSkill {
  readonly name: string;
  readonly trigger: string;
  /** Front-matter `description` (the SKILL.md `description`). */
  readonly description: string;
  /**
   * Optional host-discovery copy (`skill_description:`). When present it is the
   * SKILL.md `description` instead of `description` (the `deploy: skill-dir` path).
   */
  readonly skillDescription?: string;
  /** The σ* set-builder block (declarations-above / laws-below), emitted verbatim
   *  inside the fence. Sourced from the `Skill.formalBlock` IR field. */
  readonly formalBlock: string;
  /** The composed-anchor provenance names, already harness-projected (or []). */
  readonly composedFrom: readonly string[];
  /** OPTIONAL doctrine-AGNOSTIC leading block, emitted VERBATIM as the SKILL.md's
   *  first section (above the fenced formal block, or above the `## Tool` section for
   *  a `deploy: skill-dir` cell). The engine knows only "a leading block"; a consumer
   *  fills it (agent-canon injects its founding doctrine so a FOREIGN agent invoking
   *  the skill still holds the axiom). Absent ⇒ omitted. */
  readonly preamble?: string;
  /**
   * A `deploy: skill-dir` cell (e.g. `memory`) emits its `## Tool` section body
   * VERBATIM as the SKILL.md body, NOT a generated composed body. When set, this
   * is that section text and the generator path is bypassed.
   */
  readonly toolSection?: string;
  /**
   * The RUNTIME capability this skill is a face of (mirrors `Skill.runtime`). When
   * set, the projection emits a thin shim beside the SKILL.md and the body BINDS it
   * — without this the shim is unreachable: the cell would carry a script it cannot
   * name, which is why every skill fell back to embedding the bin name in prose.
   * Plain `string` (not `RuntimeCapability`) keeps core free of an anatomy import.
   */
  readonly runtime?: { readonly capability: string };
}

/** The verb H1, derived from the skill name (the anchor carries the verb). */
function deriveVerb(name: string): string {
  const words = name.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * The SKILL.md body for a resolved skill. A `deploy: skill-dir` cell (the
 * `toolSection` path, e.g. `memory`) emits that section VERBATIM; every other
 * cell renders through the ONE generator `renderSkillCellBody` as
 * `# <verb>` + fenced `formalBlock` + "Composed from …". Shared by the claude and
 * codex adapters. Returns `rstrip() + "\n"`.
 */
export function skillBody(s: ResolvedSkill): string {
  // `deploy: skill-dir` (memory): the `## Tool` section verbatim, no composition.
  if (s.toolSection !== undefined) {
    const pre = s.preamble ? `${s.preamble}\n\n` : '';
    return `${pre}${s.toolSection.replace(/\n+$/, '')}\n`;
  }
  return renderSkillCellBody({
    verb: deriveVerb(s.name),
    block: s.formalBlock,
    composedFrom: s.composedFrom,
    preamble: s.preamble,
    runtime: s.runtime,
  });
}
