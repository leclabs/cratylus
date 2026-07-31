// The CODEX projection of the agent ANATOMY — the second harness, proving the
// thesis: because projection IS the export adapter,
// a agent-canon agent authored once reaches EVERY agent-forge harness for free. T2.1 did this
// for claude; this mirrors it for codex.
//
// Codex's native agent surface differs from claude's `.md` SOUL:
//   - a SUBAGENT is `agents/<name>.toml` — `{ name, description,
//     developer_instructions, model? }` (the documented fields [CX1] — no
//     fabricated `system_prompt`/`tools`/`color`).
//   - the always-loaded INSTRUCTION surface is `AGENTS.md` (project rules).
//   - a SKILL is `skills/<name>/SKILL.md` (the AgentSkills spec, shared with claude).
//
// The composed SOUL BODY itself is HARNESS-NEUTRAL — it is the agent's dimension
// sections, identical content whichever harness carries it. So this module REUSES
// `agentBody` / `skillBody` (over the `Agent` vector + the `ResolvedSkill` shape)
// from the claude adapter (those are the anatomy-composition machinery, not
// claude-specific framing) and only adds the codex-specific FRAMING: the agent
// body → a `.toml` `developer_instructions`, and the codex SKILL.md / AGENTS.md surfaces.

import TOML from '@iarna/toml';
import type { Agent } from '../../anatomy/index.js';
// The composed SOUL body is HARNESS-NEUTRAL, so the body machinery lives in core
// (`agentBody`/`skillBody` + the `ResolvedSkill` shape) — imported DOWNWARD from
// core, NOT sideways from the claude adapter.
import {
  type ResolvedSkill,
  agentBody,
  skillBody,
} from '../../core/anatomy-body.js';
// The projection PORT, imported from its DEFINING module — see the note in
// `adapters/claude/anatomy.ts`.
import type {
  AgentDefContext,
  HarnessAdapter,
} from '../../core/harness-adapter.js';
import type { HarnessMechanism } from '../../core/hook/index.js';
import { CODEX_AGENT_SCOPED_EVENTS, canonicalToCodex } from './events.js';

// Re-export the shared, harness-neutral resolved skill shape so a codex consumer
// can import everything it needs from the codex adapter.
export type { ResolvedSkill };

// ── Agent projection → agents/<name>.toml ────────────────────────────────────

/**
 * The codex subagent TOML object for a resolved agent: `{ name, description,
 * developer_instructions, model? }` — the documented codex agent-TOML fields
 * [CX1]. `developer_instructions` is the composed SOUL body (the
 * harness-neutral dimension sections + memory genus block) — the SAME `agentBody` the
 * claude SOUL carries, just delivered as a TOML field instead of a `.md` body.
 * No `color` is emitted: Codex's agent TOML has no documented color field, so
 * carrying `mark.hue` here would be the same fabrication [CX1] fixes on the
 * codex TOML surface.
 *
 * No provenance comment is injected into `developer_instructions`: the
 * regenerate-don't-hand-edit banner + content-hash is build-provenance the running
 * agent never consumes (mirrors `skillToCodexMd`, which already omits it).
 * `_profile` is retained for API symmetry but no longer recorded.
 */
export function agentToCodexTomlObject(
  a: Agent,
  ctx: Partial<AgentDefContext> = {},
  _profile = 'strong-llm-lean/codex',
): Record<string, unknown> {
  // The catalog travels because the SOUL body does: `developer_instructions` is
  // the same `agentBody` the claude `.md` carries, so it owes the same sections.
  const body = agentBody(a, ctx.anatomy);
  const developerInstructions = `${body.replace(/\n+$/, '')}\n`;
  const obj: Record<string, unknown> = {
    name: a.name,
    // σ_human* — the router-read one-line bound, NOT σ* (archetype stays the model-read
    // identity, projected into `developer_instructions` via `agentBody`). Mirrors the
    // claude adapter's fix: the TOML `description` is `a.description`, not emoji+archetype.
    description: a.description,
    developer_instructions: developerInstructions,
  };
  return obj;
}

/**
 * The full `agents/<name>.toml` text for a resolved agent (the codex counterpart
 * of `agentToClaudeMd`). Serialized via `@iarna/toml` (the same serializer the
 * codex TOML surface uses), so the multi-line `developer_instructions` is a
 * TOML `"""` literal.
 */
export function agentToCodexToml(
  a: Agent,
  ctx: Partial<AgentDefContext> = {},
  profile = 'strong-llm-lean/codex',
): string {
  const obj = agentToCodexTomlObject(a, ctx, profile);
  return TOML.stringify(obj as TOML.JsonMap);
}

// ── Skill projection → skills/<name>/SKILL.md ────────────────────────────────

/**
 * The codex SKILL.md for a resolved skill. Codex consumes the AgentSkills spec
 * (frontmatter `name` + `description`, then the body), the same surface claude
 * uses — so the body is the SAME thin `skillBody` generator (`# <verb>` + fenced
 * `formalBlock` + "Composed from …", or the `deploy: skill-dir` verbatim section).
 * The framing differs from `skillToClaudeMd` only in the front-matter: the codex
 * AgentSkills pair (`name` + `description`, no `trigger`).
 */
export function skillToCodexMd(s: ResolvedSkill): string {
  const fm: Record<string, unknown> = {
    name: s.name,
    description: s.skillDescription ?? s.description,
  };
  const body = skillBody(s);
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
 * always-loaded project rules file is `AGENTS.md`; the per-agent archetype lives in
 * `agents/<name>.toml`. This emits a thin index pointing at the projected
 * subagents (the shared rules surface), so a codex workspace discovers them.
 *
 * Kept deliberately minimal — the load-bearing agent content is the `.toml`
 * `developer_instructions`; this is the discovery shell (a fuller rules
 * projection from the agent-canon rule corpus is a later, separate concern).
 */
export function agentsMdSurface(agentNames: readonly string[]): string {
  const out: string[] = ['# Agents', ''];
  out.push(
    'Projected from the agent-canon corpus via agent-forge’s codex adapter. Each agent’s',
    'archetype is its subagent definition under `agents/<name>.toml`; invoke one by',
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

// ── Enforcing constraints → ~/.codex/hooks.json ──────────────────────────────

/**
 * Realize the canon's PER-AGENT constraints on codex's GLOBAL hook surface.
 *
 * This is the adapter earning its name. The canon says what it means — a
 * constraint composed into the agents it governs — and each harness gets as close
 * to that as it can. Claude attaches a hook to a subagent directly, so its adapter
 * needs nothing here. Codex declares hooks globally in `hooks.json`, so the
 * per-agent intent has to be re-expressed with the selector codex does offer.
 *
 * It offers exactly one: for `SubagentStart`/`SubagentStop`, `matcher` is a regex
 * over `agent_type`. So a constraint bound to {nico, mav} becomes one global hook
 * with `matcher: "^(mav|nico)$"` — the same scope, said in codex's language. The
 * filter is GENERATED from composition, which is the whole point: the hand-written
 * allowlist this replaces was the fragile pointcut, and a generated one cannot go
 * stale against the agents it names.
 *
 * For every other event the documented hook input carries no agent identifier
 * (`session_id`, `cwd`, `permission_mode`, `tool_name` — no agent). A constraint
 * bound to two agents cannot be narrowed to them there, and emitting it anyway
 * would silently govern EVERY agent. That is a widened blast radius wearing a
 * projection, so it THROWS — the same refusal discipline as an unrealizable event,
 * for the same reason: a constraint that cannot be scoped as written must fail
 * loudly, not land over-applied.
 */
export function codexHooksJson(
  bindings: readonly {
    anchor: string;
    fragment: unknown;
    agents: readonly string[];
  }[],
  mechanisms: ReadonlyMap<string, HarnessMechanism> = new Map(),
): { filename: string; content: string } | null {
  const harness = bindings.filter(
    (b) => (b.fragment as { substrate?: string }).substrate === 'harness',
  );
  if (harness.length === 0) return null;
  const block: Record<string, unknown[]> = {};
  for (const b of harness) {
    const f = b.fragment as {
      events: readonly string[];
      realizedBy?: string;
    };
    // The mechanism is INJECTED — MODEL makes it a function of (fragment,
    // adapter) that deploy emits, never a field the source cell carries.
    const m = mechanisms.get(f.realizedBy ?? b.anchor);
    if (!m) continue;
    for (const event of f.events) {
      const native = canonicalToCodex[event as keyof typeof canonicalToCodex];
      // The seam decided mode before this ran and withholds a degraded binding
      // entirely, so neither guard below should ever fire on the projection path.
      // They remain as EMISSION guards, not decisions: if this function is called
      // directly, it must still never widen. Skipping is the only safe default —
      // emitting an unscopable hook would govern every agent on the host, and
      // throwing here would be a second decision site.
      if (!native) continue;
      if (!CODEX_AGENT_SCOPED_EVENTS.has(native)) continue;
      // The generated selector — composition, said in codex's language.
      const matcher = `^(${[...b.agents].sort().join('|')})$`;
      const entry: Record<string, unknown> = {
        matcher,
        hooks: [
          {
            type: 'command',
            command: m.command,
            ...(m.timeout !== undefined ? { timeout: m.timeout } : {}),
          },
        ],
      };
      const bucket = block[native] ?? [];
      bucket.push(entry);
      block[native] = bucket;
    }
  }
  if (Object.keys(block).length === 0) return null;
  return {
    filename: 'hooks.json',
    content: `${JSON.stringify({ hooks: block }, null, 2)}\n`,
  };
}

// ── HarnessAdapter port ──────────────────────────────────────────────────────

/**
 * The codex realization of the `HarnessAdapter` port: agent → `<name>.toml`,
 * skill → `SKILL.md`, plus the `AGENTS.md` instruction `surface`. No `hooks`
 * (the codex projection does not emit a settings fragment). Wraps the concrete
 * functions above — projection output is byte-identical to calling them directly.
 */
export const codexHarnessAdapter: HarnessAdapter = {
  name: 'codex',
  substrate: 'harness',
  home: '.codex',
  agentExt: '.toml',
  hooksFile: 'hooks.json',
  // Realizable ⇔ the canonical event has a Codex peer. `canonicalToCodex` IS the
  // realization map, so asking it is asking the mechanism itself.
  //
  // This previously read `() => false`, on the strength of a source comment saying
  // codex projects no hooks. Codex has a full hook surface; the claim was inherited
  // rather than checked, and it made every enforcing guardrail unrealizable here —
  // which would have refused the entire corpus on a false premise.
  realizes: (event) => event in canonicalToCodex,
  // Codex declares hooks in ONE global `hooks.json`, so narrowing is possible only
  // where the hook input carries an agent identifier to match on — the two events
  // in `CODEX_AGENT_SCOPED_EVENTS`. `Stop` fires fine and names nobody.
  //
  // This adapter DECLARES the incapacity; it does not decide what follows from it.
  // The refusal is the seam's (`assertRealizable`), so the law has one home.
  scopes: (event) => {
    const native = canonicalToCodex[event as keyof typeof canonicalToCodex];
    return native !== undefined && CODEX_AGENT_SCOPED_EVENTS.has(native);
  },
  hookCommand: (anchor, workerFilename) =>
    `sh "$HOME/.codex/hooks/${anchor}/${workerFilename}"`,
  // SCOPE-ACTIVATED cells land on codex's GLOBAL hook surface, and that is not a
  // compromise here — it is the right home. These cells bind the SESSION, so there
  // is no agent to narrow to and nothing a matcher could add. The mismatch that
  // made `enforcingSurface` necessary applies only to AGENT-composed constraints.
  //
  // This op was absent, and its absence was read as "codex has no hook surface" —
  // so the codex build deleted canon's whole hooks dir and every codex agent ran
  // with no stance guardrail, no memory nudge and no resume notice. Codex has had
  // `~/.codex/hooks.json` all along.
  hooks: (hooks) => {
    const block: Record<string, unknown[]> = {};
    const warnings: string[] = [];
    const skipped: { path: string; reason: string }[] = [];
    for (const hook of hooks) {
      for (const event of hook.events) {
        const native = canonicalToCodex[event as keyof typeof canonicalToCodex];
        if (!native) {
          warnings.push(
            `hook '${hook.id ?? '?'}': canonical event '${event}' has no codex equivalent`,
          );
          skipped.push({
            path: `hooks/${hook.id ?? '?'}`,
            reason: `no codex mapping for ${event}`,
          });
          continue;
        }
        const cmd: Record<string, unknown> = {
          type: 'command',
          command: hook.command,
        };
        if (hook.timeout !== undefined) cmd.timeout = hook.timeout;
        if (hook.id !== undefined) cmd.id = hook.id;
        block[native] ??= [];
        block[native].push({ hooks: [cmd] });
      }
    }
    return { filename: 'hooks.json', settings: block, warnings, skipped };
  },
  agentDef: (a, ctx) => ({
    filename: `${a.name}.toml`,
    content: agentToCodexToml(a, ctx),
  }),
  skillDef: (s) => ({ filename: 'SKILL.md', content: skillToCodexMd(s) }),
  surface: (agentNames) => ({
    filename: 'AGENTS.md',
    content: agentsMdSurface(agentNames),
  }),
  enforcingSurface: (bindings) => codexHooksJson(bindings),
};
