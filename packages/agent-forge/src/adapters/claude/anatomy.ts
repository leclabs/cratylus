// The claude-code projection of the agent ANATOMY: assemble a full SOUL `.md`
// (front-matter + `## Organ` sections + the `## Memory Protocol` genus block) from
// a typed agent's organ vector; and project a skill cell to its SKILL.md. This is
// agent-forge's claude adapter owning "project a typed Agent/Skill to claude-code
// markdown" — the inversion's projection-to-disk path.
//
// Distinct from this adapter's IR serialize path (`write.ts` / `serializeAgent`):
// that projects the config-IR resources; THIS projects the anatomy SOULs. Two
// concepts, one adapter, no collision (mirrors `@leclabs/agent-forge/anatomy` sitting
// beside the core IR `Agent`/`Skill`).
//
// THIN GENERATOR: both surfaces are a pure map from a typed vector — the agent SOUL
// from an `Agent`, the SKILL.md from a `ResolvedSkill` (`f(name, formalBlock,
// composition)`). No body parsing, no ref-link projection, no per-harness section
// selection, no reader-density scaffold, no provenance banner — those were a
// transcribed palimpsest the running agent never consumed (census: zero ref-links,
// zero harness selectors on the live corpus). The skill body is emitted through the
// ONE generator `renderSkillCellBody` (`core/exemplify/skill-cell.ts`), shared with
// exemplify's standalone-cell path.

import type { Agent } from '../../anatomy/index.js';
import { ORGAN_NAMES, markToColor } from '../../anatomy/index.js';
import { renderSkillCellBody } from '../../core/exemplify/skill-cell.js';

// ── Agent projection (from the Agent vector directly) ────────────────────────

/** `audience-adaptation` → `Audience-Adaptation`, `output-format` → `Output-Format`. */
export function organTitle(organ: string): string {
  return organ
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');
}

/** organ kebab name → its `Agent` camelCase field. */
function organField(organ: string): keyof Agent {
  return organ.replace(/-(\w)/g, (_, c: string) =>
    c.toUpperCase(),
  ) as keyof Agent;
}

/**
 * The agent def BODY (no front-matter) — derived from the `Agent` VECTOR alone:
 * `# <emoji> <name>`, the `## Persona` identity section, then each non-null organ
 * (in ANATOMY declaration order) as a `## <Organ-Title>` heading + its branded
 * value(s) — the value string IS the SOUL body ⟨α, residue⟩, emitted verbatim; a
 * set organ lists its members blank-separated. `null` organs are omitted
 * (harness-inherit). Closed `rstrip() + "\n"`.
 */
export function agentBody(a: Agent): string {
  const emoji = a.provenance?.mark.emoji ?? '';
  const heading = emoji ? `${emoji} ${a.name}` : a.name;
  const out: string[] = [`# ${heading}`, ''];
  if (a.persona) {
    out.push('## Persona', '', a.persona, '');
  }
  for (const organ of ORGAN_NAMES) {
    const value = a[organField(organ)];
    if (value === null || value === undefined) {
      continue;
    }
    out.push(`## ${organTitle(organ)}`, '');
    for (const v of Array.isArray(value) ? value : [value]) {
      out.push(v as string, '');
    }
  }
  return `${out.join('\n').replace(/\n+$/, '')}\n`;
}

/**
 * The SOUL front-matter: `name`, `description`, `color`. `description` is the
 * agent's σ_human* `description` field VERBATIM — the human-read selection line
 * the subagent-router surfaces. It is NOT `persona` (σ*, the model-read identity
 * body, routed to `## Persona` in the body) and NOT emoji-prefixed; the mark's
 * emoji drives `color` via `markToColor`, a separate axis.
 */
function agentFrontMatter(a: Agent): string[] {
  const fm: string[] = [`name: ${a.name}`, `description: ${a.description}`];
  if (a.provenance?.mark) {
    fm.push(`color: ${markToColor(a.provenance.mark)}`);
  }
  return fm;
}

/** Frame a body as a claude artifact: front-matter fence + body. */
function frameClaudeMd(frontMatter: string[], body: string): string {
  const lines: string[] = ['---', ...frontMatter, '---', ''];
  lines.push(body.replace(/\n+$/, ''), '');
  return lines.join('\n');
}

/** The full claude-code SOUL for an agent, projected from its `Agent` vector. */
export function agentToClaudeMd(a: Agent): string {
  return frameClaudeMd(agentFrontMatter(a), agentBody(a));
}

// ── Skill projection ────────────────────────────────────────────────────────

/** A resolved skill ready to project to its SKILL.md. */
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
  /**
   * A `deploy: skill-dir` cell (e.g. `memory`) emits its `## Tool` section body
   * VERBATIM as the SKILL.md body, NOT a generated composed body. When set, this
   * is that section text and the generator path is bypassed.
   */
  readonly toolSection?: string;
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
    return `${s.toolSection.replace(/\n+$/, '')}\n`;
  }
  return renderSkillCellBody({
    verb: deriveVerb(s.name),
    block: s.formalBlock,
    composedFrom: s.composedFrom,
  });
}

/**
 * The skill SKILL.md front-matter. A composed `kind: skill` cell carries
 * `name / description / trigger`; a `deploy: skill-dir` cell (the `toolSection`
 * path, e.g. `memory`) carries only `name / description` — no `trigger` line
 * (no command affordance).
 */
function skillFrontMatter(s: ResolvedSkill): string[] {
  const fm = [
    `name: ${s.name}`,
    `description: ${s.skillDescription ?? s.description}`,
  ];
  if (s.toolSection === undefined) {
    fm.push(`trigger: ${s.trigger}`);
  }
  return fm;
}

/** The full SKILL.md for a skill: front-matter + generated body. */
export function skillToClaudeMd(s: ResolvedSkill): string {
  return frameClaudeMd(skillFrontMatter(s), skillBody(s));
}
