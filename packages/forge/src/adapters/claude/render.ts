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
import {
  canonicalActToClaude,
  canonicalToClaude,
  claudeBindingOf,
} from './events.js';
import { serializeClaudeHooksReport } from './hooks.js';
import {
  CLAUDE_HOOK_OUTPUT_CAP,
  PERSONA_LAUNCH_MATCHER,
  personaRequiredReadingCommand,
  personaSkillCommand,
  personaSkillOutputSize,
} from './persona-launch.js';

// Re-export the shared, harness-neutral body machinery so `adapters/claude`
// consumers keep importing them from here (byte-identical projection).
export { type ResolvedSkill, agentBody, dimensionTitle, skillBody };

// ── Agent projection (from the Agent vector directly) ────────────────────────

/**
 * The Claude model tier each held role runs on: `Agent.holds` (a role's anchor) keyed
 * to a tier ALIAS, never a model id, so the projection names no model version and
 * Claude resolves the alias to whatever it currently serves for that tier. Claude
 * Code has no host-configurable role aliases — a definition's `model` takes an id, a
 * tier alias or `inherit` — so the table lives here, in the one adapter that needs
 * it, and canon names no tier. Work that holds, cuts or judges against the design
 * (architect, planner, assayer) sits on the top tier; work bounded by a spec
 * (implementer, integrator) sits on the middle one — the integrator lands and joins
 * what the implementers built to their specs and decides nothing they did not.
 * A role absent from this table emits no `model`, and neither does an agent holding
 * none: both run on the session's model.
 */
export const CLAUDE_ROLE_TIERS: Readonly<Record<string, string>> = {
  implementer: 'sonnet',
  integrator: 'sonnet',
  planner: 'opus',
  assayer: 'opus',
  architect: 'opus',
};

/** The tier aliases an operator is offered for a role, beside typing a model id. */
export const CLAUDE_MODEL_TIERS: readonly string[] = [
  'opus',
  'sonnet',
  'haiku',
];

/**
 * The Target front-matter: `name`, `description`, `model`, `color`, `skills`. `description`
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
 * omitted when that list is empty. A `--agent` MAIN session preloads none of it, so
 * an agent with skills also carries a `SessionStart` hook printing them
 * (`personaLaunchEntry`).
 *
 * `model` is the tier alias {@link CLAUDE_ROLE_TIERS} gives the role the agent holds
 * (`Agent.holds`), right after `description`, and is omitted for a role the table
 * lacks and for an agent holding none. It is a definition's default, and the host's
 * own choice outranks it: `--model` for a `--agent` main session, and for a subagent
 * `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` with `CLAUDE_CODE_SUBAGENT_MODEL` (the
 * variable alone does not displace a definition's `model`).
 */
function agentFrontMatter(
  a: Agent,
  mechanisms: ReadonlyMap<string, HarnessMechanism>,
  manifest: DimensionManifest,
  oversized: ReadonlySet<string>,
): string[] {
  const fm: string[] = [
    `name: ${a.name}`,
    `description: ${JSON.stringify(a.description)}`,
  ];
  const tier =
    a.holds !== undefined && Object.hasOwn(CLAUDE_ROLE_TIERS, a.holds)
      ? CLAUDE_ROLE_TIERS[a.holds]
      : undefined;
  if (tier !== undefined) fm.push(`model: ${tier}`);
  if (a.provenance?.mark) {
    fm.push(`color: ${markToColor(a.provenance.mark)}`);
  }
  if (a.skills?.length) {
    fm.push('skills:', ...a.skills.map((s) => `  - ${JSON.stringify(s)}`));
  }
  fm.push(...agentHooksFrontMatter(a, mechanisms, manifest, oversized));
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
 *
 * The same block carries the agent's persona-launch `SessionStart` entry, so one
 * agent has one `hooks:` key however many reasons it has for a hook.
 */
function agentHooksFrontMatter(
  a: Agent,
  mechanisms: ReadonlyMap<string, HarnessMechanism>,
  manifest: DimensionManifest,
  oversized: ReadonlySet<string>,
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
  // The persona's composed skills reach a `--agent` MAIN session through this same
  // block: Claude preloads `skills` only for a dispatched subagent. The entry is the
  // FIRST of its event, so the skills are in context before any enforcing hook runs.
  const launch = personaLaunchEntry(a, oversized);
  if (enforcing.length === 0 && launch.length === 0) return [];

  // native claude event → the entries firing on it, in `order`.
  const byEvent = new Map<string, string[]>();
  if (launch.length > 0) byEvent.set('SessionStart', launch);
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

/**
 * The `SessionStart` entry that loads an agent's composed skills into a `--agent`
 * main session (see `persona-launch.ts`): empty for an agent with no skills. The
 * hook does not fire when the agent is dispatched as a subagent, where `skills`
 * already preloads them, so no skill loads twice. One handler per skill, in the
 * agent's `skills` order, because Claude caps each handler's output on its own.
 *
 * A skill in `oversized` — one the set's projection found too large to print — gets a
 * handler that names it as required reading instead of printing it. That notice is
 * a hook and not a section of the body: it must reach the main session and not a
 * dispatched holder, which has the skill preloaded.
 */
function personaLaunchEntry(
  a: Agent,
  oversized: ReadonlySet<string>,
): string[] {
  if (!a.skills?.length) return [];
  const roots = { home: CLAUDE_HOME_EXPR, skillRel: claudeSkillRel };
  return [
    `    - matcher: ${JSON.stringify(PERSONA_LAUNCH_MATCHER)}`,
    '      hooks:',
    ...a.skills.flatMap((skill) => [
      '        - type: command',
      `          command: ${JSON.stringify(
        oversized.has(skill)
          ? personaRequiredReadingCommand(skill)
          : personaSkillCommand(a.name, skill, roots),
      )}`,
    ]),
  ];
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
 *
 * A skill the set's projection found too large for the launch hook
 * (`ctx.oversizedSkills`) stays in `skills` — a dispatched subagent preloads a skill
 * of any size — and its hook handler names it as required reading instead of
 * printing it.
 */
export function agentToClaudeMd(a: Agent, ctx: AgentDefContext): string {
  return frameClaudeMd(
    agentFrontMatter(
      a,
      ctx.mechanisms ?? new Map(),
      ctx.manifest,
      ctx.oversizedSkills ?? new Set(),
    ),
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

/** The persona badge's filename, in each persona's own scope — the text the status
 *  line prints for a session running that persona. Derived from the bin, so a
 *  rename carries it. */
export const CLAUDE_PERSONA_BADGE_FILE = `${CLI_BIN}-persona-badge.txt`;

/** The status-line worker's filename — invoked as `sh <path>` and never sourced, so
 *  it is a `.sh` like every worker this harness runs. Derived from the bin. */
export const CLAUDE_STATUS_LINE_FILE = `${CLI_BIN}-status-line.sh`;

/** `$HOME` and not a resolved path: a command written into `settings.json` is read
 *  at RUN time on whatever host it lands on, so it must not bake in the projecting
 *  machine's home. The ONE spelling of it, shared by the hook and status-line
 *  commands. */
const CLAUDE_HOME_EXPR = '$HOME/.claude';

/** Where a persona's badge file is, relative to the worker's OWN directory — derived
 *  from `scopedRel`'s two answers, so the layout has no third home in shell. `$name`
 *  stays a shell variable: the worker learns the persona at run time. */
const STATUS_LINE_BADGE_REL = posix.relative(
  posix.dirname(claudeScopedRel(CLAUDE_STATUS_LINE_FILE, SESSION_SCOPE)),
  claudeScopedRel(CLAUDE_PERSONA_BADGE_FILE, '$name'),
);

/**
 * The status-line worker — ONE script for every persona, because Claude Code's
 * status line is one command in `settings.json` and carries no persona of its own.
 * The status line's stdin JSON names the running agent (`agent.name`) under
 * `--agent`, and carries no `agent` key in a bare session, so the persona is asked of
 * the harness at RUN time and nothing else is: the worker holds no persona list.
 *
 * It prints the persona's badge file — placed in that persona's own scope, so
 * PLACEMENT decides who has a badge — and nothing where no such file exists: a bare
 * session, and an agent that is no projected persona (`Explore`), get none. A name
 * that is a path never reaches the filesystem.
 *
 * Given ONE argument, a host command, it is a WRAPPER: it runs `sh -c "$1"` on the
 * same stdin, and puts the badge and one space before the first line of what that
 * prints — the badge alone when the host printed nothing. Without a badge the host's
 * output passes through byte for byte. The stdin is held in a file rather than a
 * variable so neither the badge lookup nor the host command sees it altered.
 *
 * IT FAILS OPEN: with no `jq` there is no way to read the persona, so it prints the
 * host's output and no badge, or nothing. A status line must never take a session
 * down over a decoration.
 */
export const CLAUDE_STATUS_LINE_SCRIPT = [
  '#!/bin/sh',
  `# GENERATED by @cratylus/forge — do not hand-edit; regenerate with \`${CLI_BIN} project\`.`,
  '#',
  '# The persona badge on the status line: reads the status line input on stdin, asks it',
  "# which persona runs (`.agent.name`), and prints that persona's badge file.",
  "# With one argument — the host's own status line command — it runs that command on",
  '# the same input and puts the badge in front of the first line it prints.',
  '',
  'in=$(mktemp) || exit 0',
  'out=$(mktemp) || { rm -f "$in"; exit 0; }',
  `trap 'rm -f "$in" "$out"' EXIT`,
  'cat > "$in"',
  '',
  "# THE BADGE FILE: `personas/<name>/` beside this worker's own scope, or none. A name",
  '# with a slash, or `.`/`..`, names no persona.',
  'badge=',
  'if command -v jq >/dev/null 2>&1; then',
  `  name=$(jq -r '.agent.name // empty' < "$in" 2>/dev/null)`,
  '  case $name in',
  "    ''|*/*|.|..) ;;",
  '    *)',
  '      dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd) || dir=',
  `      if [ -n "$dir" ] && [ -f "$dir/${STATUS_LINE_BADGE_REL}" ]; then badge=$dir/${STATUS_LINE_BADGE_REL}; fi`,
  '      ;;',
  '  esac',
  'fi',
  '',
  'if [ "$#" -eq 0 ]; then',
  '  if [ -n "$badge" ]; then cat "$badge"; fi',
  '  exit 0',
  'fi',
  '',
  "# WRAPPING: the host's command sees exactly what this worker was given.",
  'sh -c "$1" < "$in" > "$out"',
  'status=$?',
  'if [ -n "$badge" ]; then',
  '  printf \'%s\' "$(cat "$badge")"',
  '  if [ -s "$out" ]; then printf \' \'; fi',
  'fi',
  'cat "$out"',
  'exit "$status"',
  '',
].join('\n');

/** The persona badge text — the mark emoji and name, or the name alone for an agent
 *  with no provenance, which carries no mark. Baked at projection because the status
 *  line can be asked which persona runs and nothing about it. No hue, ever: this
 *  text is a word on the operator's own status line, and a color is the host's
 *  to give it. */
function claudePersonaBadgeText(a: Agent): string {
  return a.provenance ? `${a.provenance.mark.emoji} ${a.name}` : a.name;
}

/**
 * The launch spec: the ONE generic launcher and the ONE status-line worker, both
 * session-scoped because neither names a persona, and each persona's badge file in
 * that persona's own scope. An empty agent set emits nothing — a launcher with no
 * definition it could ever resolve reads as an affordance and delivers a refusal,
 * and a worker with no badge to print does nothing at all.
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
    {
      filename: CLAUDE_STATUS_LINE_FILE,
      scope: SESSION_SCOPE,
      content: CLAUDE_STATUS_LINE_SCRIPT,
      executable: true,
    },
    ...[...agents]
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .map((a) => ({
        filename: CLAUDE_PERSONA_BADGE_FILE,
        scope: a.name,
        content: claudePersonaBadgeText(a),
      })),
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
  // A `--agent` MAIN session preloads none of them, so a hook prints each skill; the
  // cap on what one hook may print is Claude Code's. The output holds each skill's
  // directory, so the size is measured with the host's real home where the caller knows
  // it, and with the `$HOME` expression as the definition spells it where not — the
  // shell prints `$HOME` verbatim, so the substitution is the shell's own.
  mainSessionSkillHook: {
    cap: CLAUDE_HOOK_OUTPUT_CAP,
    size: (name, skillMd, hostHome) =>
      personaSkillOutputSize(
        `${hostHome === undefined ? CLAUDE_HOME_EXPR : CLAUDE_HOME_EXPR.replace('$HOME', hostHome)}/${claudeSkillRel(name)}`,
        skillMd,
      ),
  },
  skillRel: (name) => [claudeSkillRel(name)],
  // The 1:1 map, declared on the port so deploy can EMIT it into the host config the
  // runtime reads. It stays 1:1 deliberately: the runtime REVERSES it (native →
  // canonical) to name what it observed, and the ACT bindings — many acts onto one
  // native event — have no reverse, so they travel beside it as `nativeActs`.
  nativeEvents: canonicalToClaude,
  // The act bindings the projection itself narrows by (`claudeBindingOf` consults
  // them first), emitted so the runtime binds the same ⟨event, matcher⟩ pair.
  nativeActs: canonicalActToClaude,
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
    `sh "${CLAUDE_HOME_EXPR}/hooks/${anchor}/${workerFilename}"`,
  agentRel: claudeAgentRel,
  launchSurface: claudeLaunchSurface,
  launcherFile: CLAUDE_LAUNCHER_FILE,
  // The status line is ONE command in `settings.json`, so the badge is a worker that
  // command runs, placed at the session scope beside the launcher.
  statusLine: {
    file: CLAUDE_STATUS_LINE_FILE,
    command: `sh "${CLAUDE_HOME_EXPR}/${claudeScopedRel(CLAUDE_STATUS_LINE_FILE, SESSION_SCOPE)}"`,
  },
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
