// The CODEX projection of the agent ANATOMY — the second harness, proving the
// thesis: because projection IS the export adapter,
// a agent-anatomy agent authored once reaches EVERY agent-forge harness for free. T2.1 did this
// for claude; this mirrors it for codex.
//
// Codex's native agent surface differs from claude's `.md` SOUL:
//   - a SUBAGENT is `agents/<name>.toml` — `{ name, description,
//     developer_instructions, model? }` (the documented fields [CX1]; the
//     same shape the codex IR write path emits, `write.ts` — no fabricated
//     `system_prompt`/`tools`/`color`).
//   - the always-loaded INSTRUCTION surface is `AGENTS.md` (project rules).
//   - a SKILL is `skills/<name>/SKILL.md` (the AgentSkills spec, shared with claude).
//
// The composed SOUL BODY itself is HARNESS-NEUTRAL — it is the agent's organ
// sections, identical content whichever harness carries it. So this module REUSES
// `agentBody` / `skillBody` (over the `Agent` vector + the `ResolvedSkill` shape)
// from the claude adapter (those are the anatomy-composition machinery, not
// claude-specific framing) and only adds the codex-specific FRAMING: the agent
// body → a `.toml` `developer_instructions`, and the codex SKILL.md / AGENTS.md surfaces.

import TOML from '@iarna/toml';
import type { Agent } from '../../anatomy/index.js';
import { type ResolvedSkill, agentBody, skillBody } from '../claude/anatomy.js';

// Re-export the shared, harness-neutral resolved skill shape so a codex consumer
// can import everything it needs from the codex adapter.
export type { ResolvedSkill };

// ── Agent projection → agents/<name>.toml ────────────────────────────────────

/**
 * The codex subagent TOML object for a resolved agent: `{ name, description,
 * developer_instructions, model? }` — the documented codex agent-TOML fields
 * [CX1]. `developer_instructions` is the composed SOUL body (the
 * harness-neutral organ sections + memory genus block) — the SAME `agentBody` the
 * claude SOUL carries, just delivered as a TOML field instead of a `.md` body.
 * No `color` is emitted: Codex's agent TOML has no documented color field, so
 * carrying `mark.hue` here would be the same fabrication [CX1] fixes on the
 * IR write path.
 *
 * No provenance comment is injected into `developer_instructions`: the
 * regenerate-don't-hand-edit banner + content-hash is build-provenance the running
 * agent never consumes (mirrors `skillToCodexMd`, which already omits it).
 * `_profile` is retained for API symmetry but no longer recorded.
 */
export function agentToCodexTomlObject(
  a: Agent,
  _profile = 'strong-llm-lean/codex',
): Record<string, unknown> {
  const body = agentBody(a);
  const developerInstructions = `${body.replace(/\n+$/, '')}\n`;
  const emoji = a.provenance?.mark.emoji;
  const obj: Record<string, unknown> = {
    name: a.name,
    description: emoji ? `${emoji} ${a.persona}` : a.persona,
    developer_instructions: developerInstructions,
  };
  return obj;
}

/**
 * The full `agents/<name>.toml` text for a resolved agent (the codex counterpart
 * of `agentToClaudeMd`). Serialized via `@iarna/toml` (the same serializer the
 * codex IR write path uses), so the multi-line `developer_instructions` is a
 * TOML `"""` literal.
 */
export function agentToCodexToml(
  a: Agent,
  profile = 'strong-llm-lean/codex',
): string {
  const obj = agentToCodexTomlObject(a, profile);
  return TOML.stringify(obj as TOML.JsonMap);
}

// ── Skill projection → skills/<name>/SKILL.md ────────────────────────────────

/**
 * The codex SKILL.md for a resolved skill. Codex consumes the AgentSkills spec
 * (frontmatter `name` + `description`, then the body), the same surface claude
 * uses — so the body is the SAME composed `skillBody`, projected with the codex
 * harness selector (`## Harness: codex` sections are kept; other-harness dropped).
 *
 * The framing differs from `skillToClaudeMd` only in the harness token passed to
 * `skillBody` and in OMITTING the provenance HTML comment: a codex SKILL.md is a
 * plain spec file, and the content-hash banner is build-provenance the running
 * agent does not need (mirrors the same rehoming intent). Front-matter is the
 * AgentSkills required pair.
 */
export function skillToCodexMd(
  s: ResolvedSkill,
  refProject: (slug: string) => string,
): string {
  const fm: Record<string, unknown> = {
    name: s.name,
    description: s.skillDescription ?? s.delineation,
  };
  const body = skillBody(s, refProject, 'codex');
  const lines = ['---', ...frontMatterLines(fm), '---', ''];
  lines.push(body.replace(/\n+$/, ''), '');
  return lines.join('\n');
}

/** Frontmatter `key: value` lines (the AgentSkills pair) in insertion order. */
function frontMatterLines(fm: Record<string, unknown>): string[] {
  return Object.entries(fm).map(([k, v]) => `${k}: ${v}`);
}

// ── AGENTS.md instruction surface ────────────────────────────────────────────

/**
 * The codex `AGENTS.md` instruction surface for a set of agents. Codex's
 * always-loaded project rules file is `AGENTS.md`; the per-agent persona lives in
 * `agents/<name>.toml`. This emits a thin index pointing at the projected
 * subagents (the shared rules surface), so a codex workspace discovers them.
 *
 * Kept deliberately minimal — the load-bearing agent content is the `.toml`
 * `developer_instructions`; this is the discovery shell (a fuller rules
 * projection from the agent-anatomy rule corpus is a later, separate concern).
 */
export function agentsMdSurface(agentNames: readonly string[]): string {
  const out: string[] = ['# Agents', ''];
  out.push(
    'Projected from the agent-anatomy corpus via agent-forge’s codex adapter. Each agent’s',
    'persona is its subagent definition under `agents/<name>.toml`; invoke one by',
    'name. Skills are under `skills/<name>/SKILL.md`.',
    '',
    '## Subagents',
    '',
  );
  for (const name of [...agentNames].sort()) {
    out.push(`- \`${name}\` — \`agents/${name}.toml\``);
  }
  out.push('');
  return out.join('\n');
}
