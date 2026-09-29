// The claude-code projection of the agent anatomy: assemble a full Target `.md`
// (front-matter + `## Dimension` sections + the `## Memory Protocol` genus block) from
// a typed agent's dimension vector; and project a skill cell to its SKILL.md. This is
// forge's claude adapter owning "project a typed Agent/Skill to claude-code
// markdown" — the inversion's projection-to-disk path.
//
// This used to be one of TWO projections in this adapter, the other being the IR
// serialize path (`write.ts` / `serializeAgent`) over a config-IR. That lineage has
// been deleted; there is one projection here now.
//
// THIN GENERATOR: both surfaces are a pure map from a typed vector — the agent Target
// from an `Agent`, the SKILL.md from a `ResolvedSkill` (`f(name, formalBlock,
// composition)`). No body parsing, no ref-link projection, no per-harness section
// selection, no reader-density scaffold, no provenance banner — those were a
// transcribed palimpsest the running agent never consumed (census: zero ref-links,
// zero harness selectors on the live corpus). The skill body is emitted through the
// ONE generator `renderSkillCellBody` (`core/exemplify/skill-cell.ts`), shared with
// exemplify's standalone-cell path.

import { posix } from 'node:path';
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import type { Agent, DimensionManifest } from '@cratylus/schema';
import { anchorOf, markToColor } from '@cratylus/schema';
import type { HarnessMechanism } from '@cratylus/schema/hook';
// The harness-neutral dimension→markdown-body machinery, imported DOWNWARD from core
// (the shared helpers `agentBody`/`dimensionTitle`/`skillBody` + the `ResolvedSkill`
// shape). Re-exported below so existing `adapters/claude` importers are unaffected.
import {
  type ResolvedSkill,
  agentBody,
  dimensionTitle,
  skillBody,
} from '../../core/body.js';
import { enforcingValuesOf } from '../../core/exemplify/dimension-fields.js';
// The projection PORT, imported from its DEFINING module. This was load-bearing
// while a `core/index.js` barrel existed: it `export *`ed the IR lineage, so one
// barrel-shaped type import dragged all 26 of those modules into every projection
// consumer's closure — invisible to a substring grep. The barrel and the lineage
// are both gone; naming the defining module stays the rule, so no future barrel
// can quietly re-create the edge.
import {
  type AgentDefContext,
  type HarnessAdapter,
  type HarnessProjection,
  SESSION_SCOPE,
} from '../../core/harness-adapter.js';
import { canonicalToClaude, claudeBindingOf } from './events.js';
import { serializeClaudeHooksReport } from './hooks.js';

// Re-export the shared, harness-neutral body machinery so `adapters/claude`
// consumers keep importing them from here (byte-identical projection).
export { type ResolvedSkill, agentBody, dimensionTitle, skillBody };

// ── Agent projection (from the Agent vector directly) ────────────────────────

/**
 * The Target front-matter: `name`, `description`, `color`, `skills`. `description`
 * is the agent's σ_human* `description` field VERBATIM — the human-read selection
 * line the subagent-router surfaces. It is NOT `archetype` (σ*, the model-read
 * identity body, routed to `## Archetype` in the body) and NOT emoji-prefixed; the
 * mark's emoji drives `color` via `markToColor`, a separate axis.
 *
 * `description` and every skill name are written as JSON strings, each a legal
 * YAML double-quoted scalar whatever it holds. A plain scalar may not contain
 * `: `, and real descriptions do (nico's, assayer's), which made the whole
 * front matter invalid YAML — and Claude Code must parse it to read `skills`.
 *
 * `skills` is Claude Code's subagent preload field
 * (<https://code.claude.com/docs/en/sub-agents>): each listed skill's full content
 * is injected into the subagent's context at startup. It carries `Agent.skills`,
 * the closure projection hands this adapter, in the order it arrives, and is
 * omitted when that list is empty.
 */
function agentFrontMatter(
  a: Agent,
  mechanisms: ReadonlyMap<string, HarnessMechanism>,
  manifest: DimensionManifest,
): string[] {
  const fm: string[] = [
    `name: ${a.name}`,
    `description: ${JSON.stringify(a.description)}`,
  ];
  if (a.provenance?.mark) {
    fm.push(`color: ${markToColor(a.provenance.mark)}`);
  }
  if (a.skills?.length) {
    fm.push('skills:', ...a.skills.map((s) => `  - ${JSON.stringify(s)}`));
  }
  fm.push(...agentHooksFrontMatter(a, mechanisms, manifest));
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
  manifest: DimensionManifest,
): string[] {
  // Which fields hold values at all is a fact of the CATALOG, so an agent's
  // enforcing set is read against the set's catalog — there is no other catalog
  // to read it against, and a dimension nobody declared enforces nothing.
  const withMech = enforcingValuesOf(a, manifest)
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
      const binding = claudeBindingOf(event);
      // Unrealizable events are REFUSED upstream at build time, never dropped
      // here — a silent skip at emission is the fail-open this design removes.
      if (!binding) continue;
      const native = binding.event;
      // The ACT's selector is COMPUTED (the adapter knows which tool performs it);
      // a mechanism's own `matcher` — a
      // selector round-tripped off a host — answers only when the act does not.
      const matcher = binding.matcher ?? m.matcher;
      const lines: string[] = [];
      if (matcher) {
        lines.push(`    - matcher: ${JSON.stringify(matcher)}`);
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
 * The full claude-code Target for an agent, projected from its `Agent` vector under
 * the set's context. Also the hand-callable entry (a single agent, no plugin set)
 * — which is why `mechanisms` may be absent. `manifest` may NOT: a Target projected
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
// `core/body` (harness-neutral, shared with omp) and are imported +
// re-exported at the top of this module. Only the claude FRAMING is local.

/** The skill SKILL.md front-matter: `name / description / trigger`. */
function skillFrontMatter(s: ResolvedSkill): string[] {
  return [
    `name: ${s.name}`,
    `description: ${s.description}`,
    `trigger: ${s.trigger}`,
  ];
}

/** The full SKILL.md for a skill: front-matter + generated body. */
export function skillToClaudeMd(s: ResolvedSkill): string {
  return frameClaudeMd(skillFrontMatter(s), skillBody(s));
}

// ── HarnessAdapter port ──────────────────────────────────────────────────────

/**
 * The claude realization of the `HarnessAdapter` port: agent → `<name>.md`,
 * skill → `SKILL.md`, hooks → the `settings.json` `hooks` block fragment. Wraps
 * the concrete functions
 * above — projection output is byte-identical to calling them directly.
 */
/** Where agent `<name>`'s definition lives, relative to `.claude` — the ONE home
 *  of claude's agent layout, read by both `agentDef` and deploy. */
export function claudeAgentRel(name: string): string {
  return `agents/${name}.md`;
}

/** Where skill `<name>`'s dir lives, relative to `.claude`. ONE destination:
 *  claude reads user skills from a single root, so the projected agent set makes
 *  no difference to a skill's home here. */
export function claudeSkillRel(name: string): string {
  return `skills/${name}`;
}

/** Where claude keeps its persona scopes, relative to `.claude` — the ONE home of
 *  that directory, read by `scopedRel` and, through it, by every worker. It is a
 *  sibling of `agents/` on purpose: purview reaches a persona's own definition by
 *  going two directories above the scope and down into `agents/<name>.md`. */
export const CLAUDE_PERSONA_DIR = 'personas';

/** Where a scope's artifacts land, relative to `.claude` — the ONE home of claude's
 *  scope layout: `personas/<name>/`, and `personas/_session/` for the session
 *  copy (`agent` absent or {@link SESSION_SCOPE}). */
export function claudeScopedRel(filename: string, agent?: string): string {
  return `${CLAUDE_PERSONA_DIR}/${agent ?? SESSION_SCOPE}/${filename}`;
}

/** The generic persona launcher's filename — no extension, because it is invoked
 *  directly, never sourced. It is also the DISPATCH SENTINEL: the script compares
 *  `basename $0` against this exact name to decide whether the persona arrives as
 *  `$1` or as argv[0] (a symlink named after the persona). */
export const CLAUDE_LAUNCHER_FILE = 'claude-agent';

/**
 * The launcher's text — ONE script for every persona on the host, the shape omp's
 * launcher has: the persona is resolved at RUN time out of the definitions claude
 * already reads, so nothing here is per-persona and nothing is regenerated when a
 * persona is added, renamed or retired.
 *
 * `claude-agent planner` reads `$1`; `planner` — a symlink in a `PATH` dir — reads
 * argv[0] and does NOT consume `$1`, so every remaining word is claude's own. The
 * dispatch is decided BEFORE the symlink walk, which resolves away the name argv[0]
 * carries. The walk follows links (`readlink` without `-f`, absent on a stock
 * macOS) and is capped as a kernel caps it, so a cycle fails the launch instead of
 * hanging it.
 *
 * IT REFUSES A NAME THAT IS NO PERSONA, and says so on one stderr line, exit 2. A
 * link named `nosuch` would otherwise start `claude --agent nosuch` and leave the
 * refusal to whatever claude does with an unknown agent — the launcher is the one
 * place that knows the name came from a link and not from an operator's typing.
 *
 * The definition is located from the launcher's OWN resolved directory, by the
 * hop `scopedRel` and `agentRel` jointly imply, so the layout has no third home in
 * shell. Identity is claude's own `--agent`: it applies the agent's body as the
 * system prompt for a MAIN session. It preloads the agent's `skills` only for a
 * SUBAGENT — carrying them into the main session is not this launcher's job here.
 */
export const CLAUDE_LAUNCHER_SCRIPT = [
  '#!/bin/sh',
  `# GENERATED by @cratylus/forge — do not hand-edit; regenerate with \`${CLI_BIN} project\`.`,
  '#',
  `# ONE launcher for every persona: \`${CLAUDE_LAUNCHER_FILE} <agent> [claude flags]\`, or a`,
  '# symlink named after the agent (`ln -s … ~/.local/bin/planner`), which is then a',
  "# command taking claude's own flags and nothing else.",
  '',
  '# WHICH AGENT — decided before the symlink walk below, because that walk',
  '# resolves away the very name argv[0] is carrying.',
  'invoked=${0##*/}',
  `if [ "$invoked" = "${CLAUDE_LAUNCHER_FILE}" ]; then`,
  '  if [ "$#" -eq 0 ]; then',
  `    printf '${CLAUDE_LAUNCHER_FILE}: usage: ${CLAUDE_LAUNCHER_FILE} <agent> [claude flags ...]\\n' >&2`,
  '    exit 2',
  '  fi',
  '  name=$1',
  '  shift',
  'else',
  '  name=$invoked',
  'fi',
  '',
  '# Resolves its own directory: this file is deployed once and runs from wherever',
  '# it landed, including through a symlink in a PATH dir.',
  'self=$0',
  'hops=0',
  'while [ -L "$self" ] && [ "$hops" -lt 40 ]; do',
  '  hops=$((hops + 1))',
  '  target=$(readlink "$self") || exit 1',
  '  case $target in',
  '    /*) self=$target ;;',
  '    *) self=$(dirname -- "$self")/$target ;;',
  '  esac',
  'done',
  'dir=$(CDPATH= cd -- "$(dirname -- "$self")" && pwd) || exit 1',
  '',
  '# THE DEFINITION IS THE SOURCE OF TRUTH: the same file claude dispatches a',
  '# subagent of this name from.',
  `def=$dir/${posix.join(posix.relative(posix.dirname(claudeScopedRel(CLAUDE_LAUNCHER_FILE, SESSION_SCOPE)), '.'), claudeAgentRel('$name'))}`,
  'case $name in */*) def= ;; esac',
  'if [ -z "$def" ] || [ ! -f "$def" ]; then',
  `  printf '${CLAUDE_LAUNCHER_FILE}: no persona named %s\\n' "$name" >&2`,
  '  exit 2',
  'fi',
  '',
  'exec claude --agent "$name" "$@"',
  '',
].join('\n');

/**
 * The launch spec: the ONE generic launcher, session-scoped because it names no
 * persona. An empty agent set emits nothing — a launcher with no definition it
 * could ever resolve reads as an affordance and delivers a refusal.
 */
export function claudeLaunchSurface(
  agents: readonly Agent[],
): HarnessProjection[] {
  if (agents.length === 0) return [];
  return [
    {
      filename: CLAUDE_LAUNCHER_FILE,
      scope: SESSION_SCOPE,
      content: CLAUDE_LAUNCHER_SCRIPT,
      executable: true,
    },
  ];
}

export const claudeHarnessAdapter: HarnessAdapter = {
  name: 'claude',
  substrate: 'harness',
  home: '.claude',
  agentExt: '.md',
  hooksFile: 'settings.json',
  // This harness's own headless CLI answers its own model questions.
  judgeBin: 'claude',
  // The subagent `skills` field preloads each named skill into the agent.
  preloadsSkills: true,
  skillRel: (name) => [claudeSkillRel(name)],
  // The 1:1 map, declared on the port so deploy can EMIT it into the host config the
  // runtime reads. It stays 1:1 deliberately: the runtime REVERSES it (native →
  // canonical) to name what it observed, and the ACT bindings — many acts onto one
  // native event — have no reverse. An act is narrowed at emission, not observed.
  nativeEvents: canonicalToClaude,
  // Realizable ⇔ `claudeBindingOf` answers — the 1:1 map OR an act binding, asked as
  // one question so no site consults half the answer. Asking the realization map IS
  // asking the mechanism itself; there is no second list to drift. A git-substrate
  // event never reaches here; it routes.
  realizes: (event) => claudeBindingOf(event) !== undefined,
  // Scopable ⇔ realizable, and for ONE reason: Claude attaches a hook inside the
  // agent's own front-matter, so ATTACHMENT IS THE SCOPE. There is no selector to
  // express and therefore no event Claude can fire but not narrow — the two
  // predicates coincide here, which is precisely why the distinction stayed
  // invisible until a harness whose only surface is global forced it.
  //
  // Coincidence, NOT identity: this is an alias of `realizes` by argument, not a
  // definition of `scopes`. An adapter added later that attaches globally must
  // answer this question on its own terms.
  scopes: (event) => claudeBindingOf(event) !== undefined,
  // Claude reads its hooks out of `~/.claude/`, and `deploy --kind hooks` stages
  // each cell's workers under `hooks/<anchor>/`. `$HOME` and not a resolved path:
  // the emitted config is a deploy target read at RUN time on whatever host it
  // lands on, so it must not bake in the projecting machine's home.
  hookCommand: (anchor, workerFilename) =>
    `sh "$HOME/.claude/hooks/${anchor}/${workerFilename}"`,
  agentRel: claudeAgentRel,
  launchSurface: claudeLaunchSurface,
  launcherFile: CLAUDE_LAUNCHER_FILE,
  // A PERSONA'S SCOPE is a directory beside `agents/`, and it holds the persona's
  // stance manifest. Claude registers its mechanism once, in `settings.json`,
  // so the scope is not where the hook LIVES — it is what a worker looks for when
  // the payload names the running agent (`agent_type`). Presence is enrollment.
  scopedRel: claudeScopedRel,
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
