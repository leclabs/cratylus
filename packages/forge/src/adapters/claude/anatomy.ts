// The claude-code projection of the agent anatomy: assemble a full SOUL `.md`
// (front-matter + `## Dimension` sections + the `## Memory Protocol` genus block) from
// a typed agent's dimension vector; and project a skill cell to its SKILL.md. This is
// forge's claude adapter owning "project a typed Agent/Skill to claude-code
// markdown" — the inversion's projection-to-disk path.
//
// This used to be one of TWO projections in this adapter, the other being the IR
// serialize path (`write.ts` / `serializeAgent`) over a config-IR. That lineage was
// excised (depalimpsest-ir-intake S6); there is one projection here now.
//
// THIN GENERATOR: both surfaces are a pure map from a typed vector — the agent SOUL
// from an `Agent`, the SKILL.md from a `ResolvedSkill` (`f(name, formalBlock,
// composition)`). No body parsing, no ref-link projection, no per-harness section
// selection, no reader-density scaffold, no provenance banner — those were a
// transcribed palimpsest the running agent never consumed (census: zero ref-links,
// zero harness selectors on the live corpus). The skill body is emitted through the
// ONE generator `renderSkillCellBody` (`core/exemplify/skill-cell.ts`), shared with
// exemplify's standalone-cell path.

import type { Agent, DimensionManifest } from '@cratylus/schema';
import { anchorOf, markToColor } from '@cratylus/schema';
import type { CanonicalEvent, HarnessMechanism } from '@cratylus/schema/hook';
// The harness-neutral dimension→markdown-body machinery, imported DOWNWARD from core
// (the shared helpers `agentBody`/`dimensionTitle`/`skillBody` + the `ResolvedSkill`
// shape). Re-exported below so existing `adapters/claude` importers are unaffected.
import {
  type ResolvedSkill,
  agentBody,
  dimensionTitle,
  skillBody,
} from '../../core/anatomy-body.js';
import { enforcingValuesOf } from '../../core/exemplify/dimension-fields.js';
// The projection PORT, imported from its DEFINING module. This was load-bearing
// while a `core/index.js` barrel existed: it `export *`ed the IR lineage, so one
// barrel-shaped type import dragged all 26 of those modules into every projection
// consumer's closure — invisible to a substring grep. The barrel and the lineage
// are both gone; naming the defining module stays the rule, so no future barrel
// can quietly re-create the edge.
import type {
  AgentDefContext,
  HarnessAdapter,
} from '../../core/harness-adapter.js';
import { canonicalToClaude } from './events.js';
import { serializeClaudeHooksReport } from './hooks.js';

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
function agentFrontMatter(
  a: Agent,
  mechanisms: ReadonlyMap<string, HarnessMechanism>,
  anatomy: DimensionManifest,
): string[] {
  const fm: string[] = [`name: ${a.name}`, `description: ${a.description}`];
  if (a.provenance?.mark) {
    fm.push(`color: ${markToColor(a.provenance.mark)}`);
  }
  fm.push(...agentHooksFrontMatter(a, mechanisms, anatomy));
  return fm;
}

/**
 * The `hooks:` front-matter block — an enforcing fragment's mechanism, attached
 * to THIS agent and no other.
 *
 * This is where composition becomes enforcement. Claude Code reads a `hooks` key
 * in a subagent's front-matter and fires those hooks only while that subagent
 * runs, which means the scope of a guardrail is the fact that the agent composes
 * it — not a name the enforcement code carries about the agent. That is the whole
 * point: the previous mechanism was a global hook plus a runtime `agent_type`
 * allowlist, i.e. scope living in the enforcement code, invisible from the agent
 * it governed and silently stale the moment either side moved.
 *
 * Only `harness`-substrate fragments appear here. A git-substrate constraint
 * fires in git's own process and is NOT a harness hook; it is routed elsewhere
 * and must never reach this block.
 *
 * `order` is honoured explicitly. A dir-scan or object-key order would impose
 * something alphabetical, and these sequences are semantic — a blocking gate must
 * evaluate before a non-blocking nudge.
 */
function agentHooksFrontMatter(
  a: Agent,
  mechanisms: ReadonlyMap<string, HarnessMechanism>,
  anatomy: DimensionManifest,
): string[] {
  // Which fields hold values at all is a fact of the CATALOG, so an agent's
  // enforcing set is read against the set's catalog — there is no other catalog
  // to read it against, and a dimension nobody declared enforces nothing.
  const withMech = enforcingValuesOf(a, anatomy)
    .filter((f) => f.substrate === 'harness')
    .map((f) => ({ f, m: mechanisms.get(f.realizedBy ?? anchorOf(f)) }))
    .filter(
      (x): x is { f: typeof x.f; m: HarnessMechanism } => x.m !== undefined,
    );
  const enforcing = withMech.sort(
    (x, y) =>
      (x.m.order ?? Number.MAX_SAFE_INTEGER) -
      (y.m.order ?? Number.MAX_SAFE_INTEGER),
  );
  if (enforcing.length === 0) return [];

  // native claude event → the entries firing on it, in `order`.
  const byEvent = new Map<string, string[]>();
  for (const { f, m } of enforcing) {
    for (const event of f.events) {
      const native = canonicalToClaude[event as CanonicalEvent];
      // Unrealizable events are REFUSED upstream at build time, never dropped
      // here — a silent skip at emission is the fail-open this design removes.
      if (!native) continue;
      const lines: string[] = [];
      if (m.matcher) {
        lines.push(`    - matcher: ${JSON.stringify(m.matcher)}`);
        lines.push('      hooks:');
      } else {
        lines.push('    - hooks:');
      }
      lines.push('        - type: command');
      lines.push(`          command: ${JSON.stringify(m.command)}`);
      if (m.timeout !== undefined)
        lines.push(`          timeout: ${m.timeout}`);
      const acc = byEvent.get(native) ?? [];
      acc.push(...lines);
      byEvent.set(native, acc);
    }
  }
  if (byEvent.size === 0) return [];
  const out: string[] = ['hooks:'];
  for (const [event, lines] of [...byEvent].sort(([x], [y]) =>
    x < y ? -1 : x > y ? 1 : 0,
  )) {
    out.push(`  ${event}:`);
    out.push(...lines);
  }
  return out;
}

/** Frame a body as a claude artifact: front-matter fence + body. */
function frameClaudeMd(frontMatter: string[], body: string): string {
  const lines: string[] = ['---', ...frontMatter, '---', ''];
  lines.push(body.replace(/\n+$/, ''), '');
  return lines.join('\n');
}

/**
 * The full claude-code SOUL for an agent, projected from its `Agent` vector under
 * the set's context. Also the hand-callable entry (a single agent, no plugin set)
 * — which is why `mechanisms` may be absent. `manifest` may NOT: a SOUL projected
 * without one has no dimension sections at all, and that renders as a
 * plausible, well-formed, empty agent rather than as an error.
 */
export function agentToClaudeMd(a: Agent, ctx: AgentDefContext): string {
  return frameClaudeMd(
    agentFrontMatter(a, ctx.mechanisms ?? new Map(), ctx.manifest),
    agentBody(a, ctx.manifest),
  );
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
  substrate: 'harness',
  home: '.claude',
  agentExt: '.md',
  hooksFile: 'settings.json',
  // Realizable ⇔ the canonical event has a Claude native peer. `canonicalToClaude`
  // IS the realization map, so asking it is asking the mechanism itself — there is
  // no second list to drift. A git-substrate event never reaches here; it routes.
  realizes: (event) => event in canonicalToClaude,
  // Scopable ⇔ realizable, and for ONE reason: Claude attaches a hook inside the
  // agent's own front-matter, so ATTACHMENT IS THE SCOPE. There is no selector to
  // express and therefore no event Claude can fire but not narrow — the two
  // predicates coincide here, which is precisely why the distinction stayed
  // invisible until codex, whose only surface is global, forced it.
  //
  // Coincidence, NOT identity: this is an alias of `realizes` by argument, not a
  // definition of `scopes`. An adapter added later that attaches globally must
  // answer this question on its own terms.
  scopes: (event) => event in canonicalToClaude,
  // Claude reads its hooks out of `~/.claude/`, and `deploy --kind hooks` stages
  // each cell's workers under `hooks/<anchor>/`. `$HOME` and not a resolved path:
  // the emitted config is a deploy target read at RUN time on whatever host it
  // lands on, so it must not bake in the projecting machine's home.
  hookCommand: (anchor, workerFilename) =>
    `sh "$HOME/.claude/hooks/${anchor}/${workerFilename}"`,
  agentDef: (a, ctx) => ({
    filename: `${a.name}.md`,
    content: agentToClaudeMd(a, ctx),
  }),
  skillDef: (s) => ({ filename: 'SKILL.md', content: skillToClaudeMd(s) }),
  hooks: (hooks) => {
    const r = serializeClaudeHooksReport([...hooks]);
    return {
      filename: r.filename,
      settings: r.hooks,
      warnings: r.warnings,
      skipped: r.skipped,
    };
  },
};
