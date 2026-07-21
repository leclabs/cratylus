// The claude-code projection of the agent ANATOMY: assemble a full SOUL `.md`
// (front-matter + `## Dimension` sections + the `## Memory Protocol` genus block) from
// a typed agent's dimension vector; and project a skill cell to its SKILL.md. This is
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
import { markToColor } from '../../anatomy/index.js';
// The harness-neutral dimension→markdown-body machinery, imported DOWNWARD from core
// (the shared helpers `agentBody`/`dimensionTitle`/`skillBody` + the `ResolvedSkill`
// shape). Re-exported below so existing `adapters/claude` importers are unaffected.
import {
  type ResolvedSkill,
  agentBody,
  dimensionTitle,
  skillBody,
} from '../../core/anatomy-body.js';
import type { HarnessAdapter } from '../../core/index.js';
import { serializeClaudeHooksReport } from './write.js';

// Re-export the shared, harness-neutral body machinery so `adapters/claude`
// consumers keep importing them from here (byte-identical projection).
export { type ResolvedSkill, agentBody, dimensionTitle, skillBody };

// ── Agent projection (from the Agent vector directly) ────────────────────────

/**
 * The SOUL front-matter: `name`, `description`, `color`. `description` is the
 * agent's σ_human* `description` field VERBATIM — the human-read selection line
 * the subagent-router surfaces. It is NOT `archetype` (σ*, the model-read identity
 * body, routed to `## Archetype` in the body) and NOT emoji-prefixed; the mark's
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
// The `ResolvedSkill` shape and its `skillBody` generator live in
// `core/anatomy-body` (harness-neutral, shared with codex) and are imported +
// re-exported at the top of this module. Only the claude FRAMING is local.

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

// ── HarnessAdapter port ──────────────────────────────────────────────────────

/**
 * The claude realization of the `HarnessAdapter` port: agent → `<name>.md`,
 * skill → `SKILL.md`, hooks → the `settings.json` `hooks` block fragment. No
 * `surface` (claude has no `AGENTS.md` index). Wraps the concrete functions
 * above — projection output is byte-identical to calling them directly.
 */
export const claudeHarnessAdapter: HarnessAdapter = {
  name: 'claude',
  agentDef: (a) => ({ filename: `${a.name}.md`, content: agentToClaudeMd(a) }),
  skillDef: (s) => ({ filename: 'SKILL.md', content: skillToClaudeMd(s) }),
  hooks: (hooks) => {
    const r = serializeClaudeHooksReport([...hooks]);
    return { settings: r.hooks, warnings: r.warnings, skipped: r.skipped };
  },
};
