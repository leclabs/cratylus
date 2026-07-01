// The CODEX projection of the agent ANATOMY — the second harness, proving the
// thesis of `koine-absorbs-mind` T2.4: because projection IS the export adapter,
// a agent-anatomy agent authored once reaches EVERY agent-forge harness for free. T2.1 did this
// for claude; this mirrors it for codex.
//
// Codex's native agent surface differs from claude's `.md` SOUL:
//   - a SUBAGENT is `agents/<name>.toml` — `{ name, description, system_prompt,
//     color? }` (the same TOML shape the codex IR write path emits, `write.ts`).
//   - the always-loaded INSTRUCTION surface is `AGENTS.md` (project rules).
//   - a SKILL is `skills/<name>/SKILL.md` (the AgentSkills spec, shared with claude).
//
// The composed SOUL BODY itself is HARNESS-NEUTRAL — it is the agent's organ
// sections, identical content whichever harness carries it. So this module REUSES
// `agentBody` / `subtractReset` / `skillBody` / `ResolvedAgent` / `ResolvedSkill`
// from the claude adapter (those are the anatomy-composition machinery, not
// claude-specific framing) and only adds the codex-specific FRAMING: the agent
// body → a `.toml` `system_prompt`, and the codex SKILL.md / AGENTS.md surfaces.
//
// Per T2.4: the codex harness reset (`codexHarnessReset`) is a reasonable
// FIRST-PASS (accuracy out of scope) — subtract it at export via `projectAgentDelta`.

import TOML from '@iarna/toml';
import {
  type ResolvedAgent,
  type ResolvedSkill,
  agentBody,
  bodyHash,
  provenanceHeader,
  skillBody,
  subtractReset,
} from '../claude/anatomy.js';
import type { HarnessReset } from '../claude/harness-reset.js';

// Re-export the shared, harness-neutral resolved shapes so a codex consumer can
// import everything it needs from the codex adapter.
export type { ResolvedAgent, ResolvedSkill };

// ── Agent projection → agents/<name>.toml ────────────────────────────────────

/**
 * The codex subagent TOML object for a resolved agent: `{ name, description,
 * system_prompt, color? }`. `system_prompt` is the composed SOUL body (the
 * harness-neutral organ sections + memory genus block) — the SAME `agentBody` the
 * claude SOUL carries, just delivered as a TOML field instead of a `.md` body.
 *
 * `profile` (default `strong-llm-lean/codex`) is recorded as a leading provenance
 * comment inside `system_prompt` so the projected `.toml` carries the same
 * regenerate-don't-hand-edit banner + content-hash as the claude SOUL.
 */
export function agentToCodexTomlObject(
  a: ResolvedAgent,
  profile = 'strong-llm-lean/codex',
): Record<string, unknown> {
  const body = agentBody(a);
  const bh = bodyHash(body);
  const header = provenanceHeader(a.sourcePath, profile, bh);
  const systemPrompt = `${header}\n\n${body.replace(/\n+$/, '')}\n`;
  const obj: Record<string, unknown> = {
    name: a.name,
    description: a.mark?.emoji
      ? `${a.mark.emoji} ${a.description}`
      : a.description,
    system_prompt: systemPrompt,
  };
  if (a.mark?.hue) {
    obj.color = a.mark.hue;
  }
  return obj;
}

/**
 * The full `agents/<name>.toml` text for a resolved agent (the codex counterpart
 * of `agentToClaudeMd`). Serialized via `@iarna/toml` (the same serializer the
 * codex IR write path uses), so the multi-line `system_prompt` is a TOML `"""`
 * literal.
 */
export function agentToCodexToml(
  a: ResolvedAgent,
  profile = 'strong-llm-lean/codex',
): string {
  const obj = agentToCodexTomlObject(a, profile);
  return TOML.stringify(obj as TOML.JsonMap);
}

/**
 * The DELTA codex `.toml` for an agent: like `agentToCodexToml` but with the
 * harness reset subtracted first (the opt-in subtraction path, mirroring claude's
 * `projectAgentDelta`). Pass `codexHarnessReset` for the codex first-pass reset.
 */
export function projectCodexAgentDelta(
  a: ResolvedAgent,
  reset: HarnessReset,
  profile = 'strong-llm-lean/codex',
): string {
  return agentToCodexToml(subtractReset(a, reset), profile);
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
 * agent does not need (mirrors the same rehoming intent as `koine-absorbs-mind`
 * T6.2). Front-matter is the AgentSkills required pair.
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
 * `system_prompt`; this is the discovery shell (a fuller rules projection from the
 * agent-anatomy rule corpus is a later, separate concern).
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
