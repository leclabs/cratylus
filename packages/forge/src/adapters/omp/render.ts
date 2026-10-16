// The OMP (Oh My Pi) projection of the agent anatomy — the only one of the two harnesses
// whose persona is a NATIVE artifact of the harness rather than a
// launch-time argument.
//
// THE AGENT DEFINITION IS THE SINGLE SOURCE OF TRUTH. omp discovers task agents from
// the `agents/` directory of every extension package it loads
// (`omp://task-agent-discovery.md`): YAML front-matter carrying a required `name` and
// `description`, and a BODY that IS the system prompt. That one file is this adapter's
// whole projection of an agent, and BOTH ways of reaching it read it through omp's own
// discovery — dispatched as a subagent, omp runs it itself; started as a MAIN session
// by `omp --agent <name>`, the cratylus extension ({@link ompCapabilityExtensions})
// resolves the same declaration and carries it into the session (decision 0047).
// One declaration, nothing outside the harness wrapping it, nothing to drift.
//
// IDENTITY IS NOT THE PROFILE. omp's own `--profile <name>` silos AUTH, MCP,
// MODELS, SESSIONS and `agent.db` — an ENVIRONMENT, and a property of the HOST
// an operator is running on, not of the agent this module composes. A profile
// and an agent are ORTHOGONAL facts about one session; an operator who wants both
// passes both flags, and forge asserts neither for them.
//
// THE LAYOUT IS AN OMP EXTENSION PACKAGE, the owned root install places
// (`~/.cratylus/omp`), and every path below is relative to that root:
//
//   - an AGENT is `agents/<name>.md`, discovered by omp from the package's
//     `agents/` for every project, first-wins by exact name after a project's
//     `.omp/agents` and the user's own `~/.omp/agent/agents`.
//   - a SKILL is `skills/<name>/SKILL.md`, the AgentSkills shape, discovered from
//     the package's `skills/`.
//   - ENFORCEMENT and the capability tools are TypeScript modules under
//     `extensions/`, which the package's `package.json` names (`omp.extensions`).
//     No hook CONFIG exists at all: the package names its modules.
//
// At project scope the same layout lands under the project's `.omp/`, which omp reads
// natively as `agents/`, `skills/` and `extensions/`.
//
// NOTHING IS SCOPED PER AGENT. omp loads extension modules for every session, and
// nothing in an agent declaration names a module of its own. So every module this
// adapter emits is SESSION-WIDE. A worker hook composed into named agents is
// therefore one omp cannot scope (`scopes` is false), and projection reports it as
// such rather than widen it to every session.
//
// WHAT AN AGENT'S DELIVERABLE AND MODEL BECOME are omp's own declaration settings:
// the deliverable as `output`, and the model as the model role named for the agent,
// falling back to the tier and effort it holds (decision 0111). Every agent keeps
// omp's default tools and may dispatch any agent (decision 0142).
//
// The composed Target BODY is HARNESS-NEUTRAL — the agent's dimension sections,
// identical whichever harness carries them. So this module REUSES `agentBody` /
// `skillBody` from core and adds only the omp-specific FRAMING.

// The bin's ONE authored home. This artifact is named after the TOOL that emits
// it, so a rename must carry it — the same reason a cell carries `{{fact:runtime-bin}}`
// rather than the literal. `forge → runtime` is a permitted edge (ARCHITECTURE's
// north star); spelling the name here instead would be a second home for it, which
// `bin-name-single-home` catches and rightly refused.
import { ACTING_AGENT_ENV, VERSION_SKEW, explain } from '@cratylus/runtime';
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import type { Capability } from '@cratylus/runtime/capability';
import { INSTALLATION_ENV } from '@cratylus/runtime/runtime-config';
import {
  type Agent,
  type Entry,
  assignmentIn,
  checkAssignment,
  dimensionValueOf,
} from '@cratylus/schema';
import type { Hook } from '@cratylus/schema/hook';
import { type ResolvedSkill, agentBody, skillBody } from '../../core/body.js';
import {
  type AgentDefContext,
  type DispatchIsolation,
  type HarnessAdapter,
  type HarnessProjection,
  type RoleRouting,
  SESSION_SCOPE,
  type StatusSegmentHost,
} from '../../core/harness-adapter.js';
import {
  OMP_ENVELOPE_KIND,
  OMP_REFUSAL_SHAPE,
  OMP_WIRE_TOOL,
  OMP_WORKER_TOOL,
  canonicalToOmp,
  ompBindingOf,
} from './events.js';

export type { ResolvedSkill };

/** The task-agent discovery dir of an omp extension package (and of a project's
 *  `.omp/`): `agents/`. */
export const OMP_AGENT_DEF_DIR = 'agents';

/** Where agent `<name>`'s definition lands, relative to the root it is placed in:
 *  the owned root's `agents/`, which omp discovers as an extension package's, or a
 *  project's `.omp/agents/`. One artifact serves dispatch and `omp --agent <name>`. */
export function ompAgentRel(name: string): string {
  return `${OMP_AGENT_DEF_DIR}/${name}.md`;
}

/** Where skill `<name>` lands, relative to the root it is placed in: ONE path,
 *  `skills/<name>`, which omp discovers in an extension package and in a project's
 *  `.omp/`. `agents` goes unused: omp scopes no skill reader per agent. */
export function ompSkillRel(
  name: string,
  _agents: readonly string[],
): readonly string[] {
  return [`skills/${name}`];
}

/** The directory every extension module lands in, relative to the root it is placed
 *  in, and the one the owned root's `package.json` names its modules from. */
export const OMP_EXTENSIONS_DIR = 'extensions';

/** Where omp loads an extension package for every project of a user, relative to its
 *  home (`.omp`): its own plugin directory, where `omp plugin link` puts a package by
 *  name. */
export const OMP_PACKAGE_DIR = 'plugins';

/** The emitted SCOPE-ACTIVATED module's filename: the session-wide hooks of the cells
 *  no agent composes. */
export const OMP_SESSION_MODULE = `${CLI_BIN}-session.ts`;

/** The emitted DISPATCH ISOLATION module's filename. A second file, since it retires
 *  with the agents that declare a worktree of their own and with nothing else. */
export const OMP_ISOLATION_MODULE = `${CLI_BIN}-isolation.ts`;

/** The capabilities omp is offered as tools: those that explain themselves
 *  (`<bin> <capability> --explain`), the concept journal and the ledger. */
export const OMP_CAPABILITY_TOOLS: readonly Capability[] = [
  'concepts',
  'ledger',
  'versionSkew',
];

/** The capabilities omp offers whole, as a tool of every turn, rather than mounted
 *  as an `xd://` device: a device's prompt line is its purpose shortened, with no
 *  `when` and no verb, so an agent asked what is in flight would never meet the
 *  verb that works it out from the ledger. Offered whole, its own explanation,
 *  each verb's purpose and `when` included, reaches every turn. The concept
 *  journal stays a device: its line leads with reading the design, and the agents
 *  that recover it first are sent to it by their session-start note. */
export const OMP_ESSENTIAL_CAPABILITIES: readonly Capability[] = ['ledger'];

/** The emitted CRATYLUS module's filename: the one omp extension that is
 *  cratylus's own, named for the bin, which offers every capability that explains
 *  itself as a tool and launches a session as an agent declaration. */
export const OMP_CRATYLUS_MODULE = `${CLI_BIN}.ts`;

/** The omp flag the CRATYLUS module registers: `omp --agent <name>` starts the
 *  main session as the agent declaration omp discovers by that name (decision
 *  0047). */
const OMP_AGENT_FLAG = 'agent';

/** What an agent dispatching a delegate from `eval` code is warned: no `task` call
 *  carries that dispatch, so its assignment is neither shown nor checked, and its
 *  lifecycle is not captured in the ledger. */
const EVAL_DISPATCH_WARNING =
  'dispatch from eval code: its assignment is not shown or checked and the ledger does not capture it; dispatch with the task tool to have both.';

/** `eval` code that dispatches a delegate: the eval prelude's `agent(…)` or `workpool(…)`,
 *  or the task tool called as `tool.task` or `tool["task"]`. */
const EVAL_DISPATCH =
  /(?<![\w.$])(?:agent|workpool)\s*\(|(?<![\w.$])tool\s*(?:\??\.\s*task\b|\[\s*["'`]task["'`]\s*\])/;

/** The status-line slot the CRATYLUS module shows a launched agent's mark and
 *  name in, named from the bin so a rename carries it. */
const OMP_AGENT_STATUS_KEY = `${CLI_BIN}-agent`;

// ── Model roles: the role each agent's `model` names ─────────────────────────

/** The host config files omp reads its settings from — the ONE spelling, shared by
 *  every fact the host keeps there. `agent/config.yml`, or `agent/config.yaml` when
 *  config.yml is absent: omp reads the first that exists and never merges the two. */
const OMP_CONFIG_RELS = ['agent/config.yml', 'agent/config.yaml'] as const;

/** omp's model roles, as {@link HarnessAdapter.roleRouting} exposes them. A
 *  declaration's `model` names the role named for its agent first, which the host may
 *  bind in its `modelRoles`, and then `@<tier>:<effort>`, which omp tries when the host
 *  binds no such role: the role named for the tier, at that effort. Install binds a
 *  role only as the operator answers, as the host's own setting (decision 0112). */
export const ompRoleRouting: RoleRouting = {
  configRels: OMP_CONFIG_RELS,
  tierRole: (tier) => tier,
  agentRole: ({ tier, effort }) => `@${tier}:${effort}`,
};

// ── Dispatch isolation: the copy an isolated task runs in ────────────────────

/** omp's task isolation, as {@link HarnessAdapter.dispatchIsolation} exposes it.
 *  A task tool call takes `isolated` only while the setting
 *  `task.isolation.enabled` is true, and runs that task in a copy of the checkout it
 *  was dispatched from. What the copy built is applied back into the dispatcher's
 *  checkout unless `task.isolation.apply` is false, and kept as a branch
 *  `omp/task/<id>` in the dispatcher's repository, the agent's own commits, when
 *  `task.isolation.merge` is `branch` — `patch` keeps only a diff. The copy is made
 *  from the dispatcher's checkout as it stands (its HEAD, its uncommitted work): the
 *  task tool takes no ref to make it from. The isolation module holds these as
 *  session-scoped runtime overrides, so no host setting is written. */
export const ompDispatchIsolation: DispatchIsolation = {
  settings: {
    'task.isolation.enabled': true,
    'task.isolation.apply': false,
    'task.isolation.merge': 'branch',
  },
  lacks:
    "made from the dispatcher's HEAD and not from the branch its work belongs on, so the work it builds must be moved onto that branch before it is merged",
};

// ── Status line: where a session's agent renders ─────────────────────────────

/** omp's status line, as {@link HarnessAdapter.statusSegment} exposes it. An extension's
 *  status (`ctx.ui.setStatus`, which is how the cratylus extension shows the agent a
 *  session was started as) renders inside
 *  the line only where the layout lists `status`; omp's own layouts never do. The
 *  layout is read from `statusLine.leftSegments` only under `statusLine.preset:
 *  custom`, so a host that never chose a preset is on `default` — whose layout is what
 *  `defaultLayout` copies, so a host moved to `custom` sees the line it already had.
 *
 *  These are omp's own defaults, copied and not imported: `STATUS_LINE_PRESETS.default`
 *  (packages/tui/src/status-line/presets.ts) and `CUSTOM_STATUS_LINE_DEFAULTS.left`
 *  (schema.ts). The `custom` preset's own separator is the default preset's, so no
 *  separator is carried. */
export const ompStatusSegment: StatusSegmentHost = {
  configRels: OMP_CONFIG_RELS,
  segment: 'status',
  defaultPreset: 'default',
  defaultLayout: {
    left: [
      'pi',
      'vim',
      'model',
      'mode',
      'collab',
      'stream',
      'path',
      'git',
      'pr',
      'context_pct',
      'cost',
    ],
    right: ['session_name'],
    segmentOptions: {
      model: { showThinkingLevel: true },
      path: { abbreviate: true, maxLength: 40, stripWorkPrefix: true },
      git: {
        showBranch: true,
        showStaged: true,
        showUnstaged: true,
        showUntracked: true,
      },
    },
  },
  customLeft: ['vim', 'model', 'mode', 'path', 'git', 'pr'],
};

// ── Typed handoffs: where an agent's assignment schema is carried ─────────────

/** The front-matter key an agent's assignment schema is carried under, where the
 *  cratylus extension reads it (omp passes unknown keys through untouched). */
export const OMP_ASSIGNMENT_KEY = 'assignment';

// ── Agent projection → agent/agents/<name>.md ────────────────────────────────

/**
 * The omp agent definition: the front-matter omp reads, then the composed Target
 * body, which IS the system prompt.
 *
 * **FRONT-MATTER, in this order:** `name`, `description`, `mark` (only with one),
 * `key: null`, `model`, `spawns: "*"`, `blocking: true` (only for a gate holder),
 * `output` and `assignment` (only with a typed handoff), `autoloadSkills` (only with
 * skills). No `tools`: every agent keeps omp's
 * default tools (decision 0081), and `spawns` says outright that it may dispatch
 * any agent (decision 0142), whatever omp would infer from its tools.
 * `parseAgentFields` treats a missing `name` or `description` as a parse failure
 * and SKIPS the file — a persona that silently does not exist.
 *
 * **`key` IS RESERVED.** It is the slot of an ipseic agent's key (decision 0048), and
 * every agent this corpus composes holds it empty.
 *
 * **`model` NAMES THE AGENT'S OWN ROLE, THEN ITS TIER AND EFFORT, NEVER A MODEL**
 * (decisions 0111, 0112). `model: ["@<name>", "@<tier>:<effort>"]` is tried in order
 * by omp: the role named for the agent, which the host may bind in its own
 * `modelRoles`, and where it binds none, the tier and effort the agent holds. Which
 * model a role or tier runs on is the host's own setting, never this declaration's.
 * Each entry is quoted, because a YAML value starting with `@` is a scanner error
 * unquoted.
 *
 * **THE TYPED HANDOFF** ({@link Agent.contract}): the deliverable schema is omp's
 * own `output`, which task dispatch uses as the child's structured-output schema
 * (omp's own task dispatch checks a return against it), and the assignment
 * schema is {@link OMP_ASSIGNMENT_KEY}, which the extension shows with each
 * dispatch and launch of the agent, warning when the assignment given is incomplete.
 *
 * **A GATE HOLDER IS `blocking`.** An agent whose decision rights hold `sign-off` holds
 * gates for the operator (decision 0250(3)). omp's own `blocking: true` runs its dispatch
 * inline, never as a background job, so the turn it ends on comes back through the
 * dispatcher's task result, where the cratylus extension shows a held one only as the
 * notice that it waits on the operator ({@link ompCapabilityExtensions}).
 *
 * **`autoloadSkills` CARRIES THE SKILL CLOSURE.** Which skills
 * an agent operates through is a fact about the COMPOSED AGENT: the skills it
 * declares together with every skill they compose, the closure projection
 * computes and hands this adapter as `Agent.skills`, rendered here in the order
 * it arrives. Emitted only when that list is non-empty, so an agent given none
 * carries no such key. omp honours the field for a
 * DISPATCHED subagent — the skills are injected before the child's first
 * prompt. A MAIN session started by `omp --agent` has no native path for it, so
 * the cratylus extension inlines them: every turn's system prompt carries the full
 * instructions of each named skill in omp's own autoload form
 * ({@link ompCapabilityExtensions}).
 *
 * **THE DESCRIPTION IS QUOTED, AND THAT IS NOT COSMETIC.** A plain YAML scalar
 * may not contain `: ` — `nico`'s description does ("its conceptual architecture
 * and canon: dimension catalogs"), which makes the document a scanner error.
 * omp survives that by falling back to a naive `key: value` line parser and
 * logging a warning on every discovery pass, so the defect is invisible right up
 * until a description grows a `#` or a newline and the fallback loses it too.
 * Double-quoted with `"` and `\` escaped, every description this corpus can
 * produce is a legal one-line YAML scalar. Each skill name is quoted by the same
 * rule, which makes the emitted flow sequence identical in shape to the one omp's
 * own agent-definition template writes.
 *
 * **THE BODY IS forge's `agentBody`**, harness-neutral: the mark, name and
 * description as its heading, then the agent's text values by group. Reach and model
 * are never text: reach is omp's default tools, and the model the setting above.
 */
export function agentToOmpMd(a: Agent, ctx: AgentDefContext): string {
  const fm = [`name: ${a.name}`, `description: ${yamlString(a.description)}`];
  if (a.mark !== null) fm.push(`mark: ${yamlString(a.mark.emoji)}`);
  const fallback =
    a.routing === undefined ? undefined : ompRoleRouting.agentRole(a.routing);
  const model = [`@${a.name}`, ...(fallback === undefined ? [] : [fallback])];
  fm.push('key: null', `model: [${model.map(yamlString).join(', ')}]`);
  fm.push('spawns: "*"');
  // A gate holder: its decision rights hold sign-off (an agent composed without
  // decision rights holds none).
  const rights = dimensionValueOf(a, 'decisionRights');
  if (Array.isArray(rights) && rights.some((e: Entry) => e.slot === 'sign-off'))
    fm.push('blocking: true');
  // The typed handoff: the deliverable as omp's own output schema, the assignment
  // where the cratylus extension reads it to show and check each dispatch and
  // launch. Each is one line of JSON, which YAML reads as the same object.
  if (a.contract?.deliverable !== undefined)
    fm.push(`output: ${JSON.stringify(a.contract.deliverable)}`);
  if (a.contract?.assignment !== undefined)
    fm.push(`${OMP_ASSIGNMENT_KEY}: ${JSON.stringify(a.contract.assignment)}`);
  // omp's own preload field. claude has one too (`skills`); a harness without one
  // gets the list as a required-reading declaration instead.
  if (a.skills?.length) {
    fm.push(`autoloadSkills: [${a.skills.map(yamlString).join(', ')}]`);
  }
  return `---\n${fm.join('\n')}\n---\n\n${agentBody(a, ctx.manifest).replace(/\n+$/, '')}\n`;
}

/** One line of YAML in its double-quoted form — the two characters that form
 *  requires escaped (`\` then `"`, in that order, or the escapes escape each
 *  other), and any newline folded to a space so the value cannot outrun the
 *  line-based fallback parser omp reaches for when the real one fails. */
function yamlString(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ')}"`;
}

// ── Skill projection → skills/<name>/SKILL.md ────────────────────────────────

/**
 * The omp SKILL.md for a resolved skill — the AgentSkills front-matter pair plus
 * the harness-neutral body, identical in shape to claude's projection because
 * both consume the same spec.
 */
export function skillToOmpMd(s: ResolvedSkill): string {
  const fm = [`name: ${s.name}`, `description: ${s.description}`];
  return `---\n${fm.join('\n')}\n---\n\n${skillBody(s).replace(/\n+$/, '')}\n`;
}

// ── Session hooks → extensions/<bin>-session.ts ──────────────────────────────

/** One `pi.on(...)` registration, already narrowed to its act where it has one. */
interface OmpRegistration {
  readonly anchor: string;
  readonly native: string;
  readonly tool: string | undefined;
  /** The tool name this act wears in the WORKER's wire contract, when it is an
   *  act at all — `OMP_WORKER_TOOL`. omp's own spelling (`tool`) narrows the
   *  handler; this one is what the synthesized envelope must carry, and the two
   *  differ because only one of them is a fact about omp. */
  readonly workerTool: string | undefined;
  readonly command: string;
}

/**
 * Realize the SCOPE-ACTIVATED cells — the ones no agent composes — as one module
 * at the SESSION scope.
 *
 * WHY THIS OP EXISTS AT ALL. `project` asked only for `hooks()`, a settings
 * fragment, and omp keeps no hook config: its loader scans each native config
 * root's `extensions/` dir, so the artifact is a module and the directory is the
 * registration. With nothing to answer, every one of canon's session-scoped cells
 * was warned about and dropped, and this harness deployed none of them.
 *
 * ONE MODULE, in the session root every `omp` session scans natively — the same
 * reach claude's user-level `settings.json` gives these cells.
 *
 * NOT the ambient form `MODEL.md` forbids. That prohibition is on an agent-composed
 * constraint filtering itself at runtime; these cells compose no agent — they bind
 * the session — and nothing emitted for them asks who is running.
 */
export function ompScopeActivatedExtensions(
  hooks: readonly Hook[],
): HarnessProjection[] {
  const regs: OmpRegistration[] = [];
  for (const hook of hooks) {
    for (const event of hook.events) {
      const binding = ompBindingOf(event);
      // Unrealizable here ⇒ no registration. The cell's loss is reported by the
      // projection seam; registering a handler for an event omp never fires would
      // read as coverage and deliver none.
      if (!binding) continue;
      regs.push({
        anchor: hook.id ?? event,
        native: binding.event,
        tool: binding.matcher,
        workerTool: OMP_WORKER_TOOL[event],
        command: hook.command,
      });
    }
  }
  const lines = renderRegistrations(regs);
  if (lines.length === 0) return [];
  return [
    {
      filename: OMP_SESSION_MODULE,
      scope: SESSION_SCOPE,
      content: ompExtensionModule('every session', lines),
    },
  ];
}

/**
 * The DISPATCH ISOLATION module: the `tool_call` handler that makes a dispatch of an
 * agent declaring a worktree of its own an isolated task, at the SESSION scope.
 *
 * omp has no agent-definition field that isolates an agent (`startsInWorktree` is
 * false); isolation is a flag of the `task` call. A handler may revise the input a
 * tool runs with, so this one sets `isolated: true` on every spawn whose `agent` is
 * one the corpus declares isolated, in a batch (`tasks[]`) or a flat call, and
 * touches no other spawn and no other tool. The agents are named in the module at
 * projection, from the corpus's declarations; nothing here asks who is running.
 *
 * The flag makes sense only where `task.isolation.enabled` holds
 * ({@link ompDispatchIsolation}), which this module holds at session start as a
 * session-scoped runtime override, with the rest of the isolation's settings, so no
 * host setting is written. With it off, omp refuses an isolated task — a loud
 * failure, where the alternative is the agent building in the checkout that
 * dispatched it.
 */
export function ompIsolationExtensions(
  agents: readonly Agent[],
): HarnessProjection[] {
  const isolated = agents
    .filter((a) => a.isolation !== undefined)
    .map((a) => a.name)
    .sort();
  if (isolated.length === 0) return [];
  const named = Object.fromEntries(isolated.map((n) => [n, true]));
  return [
    {
      filename: OMP_ISOLATION_MODULE,
      scope: SESSION_SCOPE,
      content: [
        `// GENERATED by @cratylus/forge — do not hand-edit; regenerate with \`${CLI_BIN} project\`.`,
        `// Runs a dispatch of ${isolated.map((n) => `\`${n}\``).join(', ')} as an isolated task.`,
        '//',
        ...SESSION_PLACEMENT,
        '',
        "import type { ExtensionAPI } from '@oh-my-pi/pi-coding-agent';",
        'import { lookup } from "@oh-my-pi/pi-coding-agent/config/registry";',
        'import { findScopedSettings, type Settings, settings } from "@oh-my-pi/pi-coding-agent/config/settings";',
        '',
        '// The agents that declare a worktree of their own, by the name a dispatch gives them.',
        `const ISOLATED: Readonly<Record<string, true>> = ${JSON.stringify(named)};`,
        "// The settings an isolated task needs, held as the session's runtime overrides.",
        `const SETTINGS: Readonly<Record<string, unknown>> = ${JSON.stringify(ompDispatchIsolation.settings)};`,
        '',
        'export default function (pi: ExtensionAPI) {',
        '  pi.on("session_start", () => {',
        '    const scope: Settings = findScopedSettings() ?? settings;',
        '    for (const [key, value] of Object.entries(SETTINGS))',
        '      (lookup(key) as { override(scope: Settings, value: unknown): void }).override(scope, value);',
        '  });',
        '  // A dispatch, known by the agent its items name, whatever the tool carrying it is called.',
        '  pi.on("tool_call", async (event) => {',
        '    const input = (event.input ?? {}) as Record<string, unknown>;',
        '    const batch = Array.isArray(input.tasks);',
        '    const spawns: unknown[] = batch ? (input.tasks as unknown[]) : [input];',
        '    let revised = false;',
        '    const next = spawns.map((spawn) => {',
        '      if (typeof spawn !== "object" || spawn === null) return spawn;',
        '      const call = spawn as Record<string, unknown>;',
        '      if (typeof call.agent !== "string" || !Object.hasOwn(ISOLATED, call.agent)) return spawn;',
        '      if (call.isolated === true) return spawn;',
        '      revised = true;',
        '      return { ...call, isolated: true };',
        '    });',
        '    if (!revised) return undefined;',
        '    return {',
        '      input: batch ? { ...input, tasks: next } : (next[0] as Record<string, unknown>),',
        '    };',
        '  });',
        '}',
        '',
      ].join('\n'),
    },
  ];
}

/**
 * Every registration of one module, deduped, each rendered once.
 *
 * ONE ACT, ONE RULING. Two registrations of a cell can land on one native event and
 * one command — purview binds the act `subagent.dispatch.pre` (`tool_call`, tool
 * `task`) AND the unnarrowed `tool.use.pre` (`tool_call`, any tool) — and a `task` call
 * then matches both, so the same dispatch was judged twice. Claude collapses identical
 * commands; omp registers code, so nothing collapses them unless this does. The
 * unnarrowed handler therefore skips the tools a narrowed registration of the same
 * command already covers. The rule lives here, once, for every module this adapter
 * emits, and not in any worker.
 */
function renderRegistrations(regs: readonly OmpRegistration[]): string[] {
  const seen = new Set<string>();
  const unique: OmpRegistration[] = [];
  for (const r of regs) {
    const key = JSON.stringify([r.native, r.tool ?? '', r.command]);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(r);
  }
  return unique.map((r) =>
    renderRegistration(
      r,
      r.tool !== undefined
        ? []
        : unique.flatMap((o) =>
            o.native === r.native &&
            o.command === r.command &&
            o.tool !== undefined
              ? [o.tool]
              : [],
          ),
    ),
  );
}

/** One `pi.on(...)` block — narrowed by an `if` when the act names a tool, and
 *  skipping the tools in `covered` when it does not. */
function renderRegistration(
  r: OmpRegistration,
  covered: readonly string[],
): string {
  const refusal = OMP_REFUSAL_SHAPE[r.native];
  const guard = r.tool
    ? `\n    if (event.toolName !== ${JSON.stringify(r.tool)}) return;`
    : covered.length > 0
      ? `\n    if (${JSON.stringify(covered)}.includes(event.toolName)) return;`
      : '';
  const kind = OMP_ENVELOPE_KIND[r.native];
  // THE VERDICT IS ON STDOUT, NEVER IN THE EXIT CODE, and reading it from the
  // wrong place is how this gate came to refuse work it had never judged. The
  // workers speak the Claude hook contract: a JSON verdict on stdout and `exit 0`
  // UNCONDITIONALLY — `allow`, `deny` and every fail-open path alike. So a
  // nonzero code means the worker MALFUNCTIONED or was not there, which is not a
  // refusal (`fail-open ∀error`), and a zero code means nothing on its own.
  //
  // WHAT THIS REPLACES, because the failure is instructive. The old form read
  // `r.exitCode`, and `ExecResult` is `{stdout, stderr, code, killed}` — there is
  // no `exitCode` on it. `undefined === 127` is false and `undefined !== 0` is
  // TRUE, so the two guards inverted into `{block: true, reason: ""}` on EVERY
  // fire: every `ask` and every `task` call refused, with an empty reason, for
  // reasons the worker never supplied. The `127` line was written to prevent
  // exactly that — "a governance mechanism bricking the session it was supposed to
  // govern" — and it was reading the same absent field, so the guard against the
  // catastrophe was the catastrophe. Measured against the installed binary:
  // `pi.exec("sh", ["-c", "exit 3"])` → `{"stdout":"","stderr":"","code":3,
  // "killed":false}`.
  const cmd = JSON.stringify(r.command);
  const call =
    kind === 'turn'
      ? `hooked(${cmd}, { stop_hook_active: event.stop_hook_active === true }, event.messages ?? [])`
      : kind === 'dispatch'
        ? `hooked(${cmd}, {}, dispatchTurn(event))`
        : kind === 'tool'
          ? (() => {
              const named = r.workerTool ?? r.tool;
              if (named === undefined)
                return `hooked(${cmd}, toolEnvelope(event))`;
              const wt = JSON.stringify(named);
              return `hooked(${cmd}, { tool_name: ${wt}, tool_input: workerInput(${wt}, event.input ?? {}) })`;
            })()
          : `exec(${cmd})`;
  // A BLOCKING EVENT REFUSES, IN THE SHAPE ITS OWN CALLER READS. `tool_call` is
  // answered by the tool wrapper (`{block, reason}`); `session_stop` is answered
  // by the stop pass (`{decision: "block", reason}`, its own type calling itself
  // "Claude/Codex-compatible"). The shapes are not interchangeable and neither
  // site complains about the other's — it returns and refuses nothing.
  //
  // EVERYTHING ELSE HAS TO SPEAK INSTEAD. `tool_result` takes no verdict, so a
  // subagent whose turn collapsed is reported by queueing a continuation, which is
  // the nearest thing to refusing a stop that omp offers there. Delivered once per
  // DISTINCT reason, because delivery re-opens the turn and a worker repeating
  // itself would otherwise re-open it forever.
  //
  // `turn.end` USED TO LIVE ON THIS BRANCH, and that was the whole degradation:
  // `agent_end` is notification-only, so the corpus's one turn-end BOUND could
  // only ever steer here. `session_stop` refuses for real, and carries the
  // `stop_hook_active` flag, which the bridge passes on to the worker.
  const act =
    refusal === 'stop'
      ? `
    const reason = await ${call};
    if (reason) return { decision: "block", reason };`
      : refusal
        ? `
    const reason = await ${call};
    if (reason) return { block: true, reason };`
        : kind
          ? `
    const reason = await ${call};
    if (reason && reason !== lastVerdict) {
      lastVerdict = reason;
      pi.sendUserMessage(reason, { deliverAs: "followUp" });
    }`
          : `
    await ${call};`;
  // The handler takes `ctx` only where it hands a worker an envelope: only the main
  // session runs such a worker. omp hands a subagent its parent's extensions, so
  // this module loads there too; `ctx.agent.kind` says which session is running
  // (`main` or `sub`), and a context with none is no main session.
  const args = kind ? '(event, ctx: HookContext)' : '(event)';
  const session = kind ? '\n    if (ctx.agent?.kind !== "main") return;' : '';
  return `  pi.on(${JSON.stringify(r.native)}, async ${args} => {${guard}${session}${act}
  });
  // ${r.anchor}`;
}

/**
 * Module-level half of the payload bridge — the lines emitted above
 * `export default`, verbatim, when a registration reads an envelope.
 *
 * `OMP_ENVELOPE_KIND` says why this exists at all. What lives HERE is only the
 * two shape translations, in and out: omp's `AgentMessage` blocks (`text` ·
 * `toolCall` · dropped `thinking`) written out as the transcript lines the
 * workers' `jq` already reads, and the workers' stdout verdict read back as a
 * reason string. Translating the SHAPE keeps the extraction semantics — whole
 * turn since the last real user message, tool activity marked, text-only
 * projection for the evidence check — in their one home inside the worker,
 * rather than re-deriving them here in a second language.
 */
const TURN_BRIDGE: readonly string[] = [
  '// The reason last delivered, so an unchanging one is not re-delivered — see the',
  '// `agent_end` registration for why delivery is bounded.',
  'let lastVerdict = "";',
  '',
  '// One value per module LOAD, and a module is loaded once per session — which is',
  "// exactly the lifetime the workers' per-session state files want.",
  'const sessionId = `omp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;',
  '',
  'type TurnBlock = { type?: string; text?: string; name?: string };',
  'type TurnMessage = { role?: string; content?: string | TurnBlock[] };',
  '',
  "// What a worker's registration reads off the handler context: which session is running.",
  'type HookContext = { agent?: { kind?: string } };',
  '',
  '/** omp messages as the JSONL transcript lines the workers parse. */',
  'function transcriptOf(messages: readonly TurnMessage[]): string {',
  '  const lines: string[] = [];',
  '  for (const m of messages) {',
  '    if (m.role === "user") {',
  '      const content =',
  '        typeof m.content === "string"',
  '          ? m.content',
  '          : (m.content ?? []).flatMap((c) =>',
  '              c.type === "text" ? [{ type: "text", text: c.text }] : [],',
  '            );',
  '      lines.push(JSON.stringify({ type: "user", message: { content } }));',
  '      continue;',
  '    }',
  '    // A tool result carries no text the agent wrote, and the worker skips such',
  '    // lines anyway; emitting them would only pad the file.',
  '    if (m.role !== "assistant" || typeof m.content === "string") continue;',
  '    const content = (m.content ?? []).flatMap((c) =>',
  '      c.type === "text"',
  '        ? [{ type: "text", text: c.text }]',
  '        : c.type === "toolCall"',
  '          ? [{ type: "tool_use", name: c.name }]',
  '          : [],',
  '    );',
  '    lines.push(JSON.stringify({ type: "assistant", message: { content } }));',
  '  }',
  '  return lines.join("\\n");',
  '}',
  '',
  "// omp's TOOL ARGUMENTS, as the shapes the workers' `jq` reads. The other half of",
  '// `OMP_WORKER_TOOL`: naming the tool correctly gets the worker into the right',
  "// branch, and that branch then reads named FIELDS out of `tool_input`. omp's",
  '// `ask` already carries `questions[].question` and `questions[].options[].label`,',
  '// so it passes through untouched; its `task` carries `{context, tasks[]}` and the',
  '// worker reads `.prompt`, so a dispatch would arrive with nothing judgeable and',
  '// be allowed on the worker\'s own "nothing judgeable" guard — a pass that looks',
  '// exactly like a considered verdict.',
  'function workerInput(',
  '  tool: string,',
  '  input: Record<string, unknown>,',
  '): Record<string, unknown> {',
  '  if (tool !== "Agent") return input;',
  '  const tasks = Array.isArray(input.tasks) ? input.tasks : [];',
  '  const prompt = [',
  '    typeof input.context === "string" ? input.context : "",',
  '    ...tasks.map((t) => {',
  '      const one = (t ?? {}) as { task?: unknown };',
  '      return typeof one.task === "string" ? one.task : "";',
  '    }),',
  '  ]',
  '    .filter((s) => s.trim() !== "")',
  '    .join("\\n\\n");',
  '  return prompt ? { ...input, prompt } : input;',
  '}',
  '',
  '// THE ENVELOPE OF A TOOL CALL NO SELECTOR NARROWED. `tool.use.pre` binds `tool_call`',
  '// with no tool name, so nothing at registration says which tool this fire is, and',
  '// the envelope carried an EMPTY `tool_name` — which the worker reads as "nothing to',
  '// judge" and allows, on every call it was registered to judge. The name is on the',
  "// event; it is spelled here in the workers' wire contract (`OMP_WIRE_TOOL`), and a",
  "// tool the table does not name passes through under omp's own spelling, which the",
  "// worker's `*)` branch allows.",
  `const WIRE_TOOL: Record<string, string> = ${JSON.stringify(OMP_WIRE_TOOL)};`,
  '',
  '// OMP MESSAGES A RUNNING AGENT THROUGH `write`, addressed to `agent://<id>` (and',
  '// `agent://all` for a broadcast). That is a message, not a file write: the worker',
  '// reads a `Write` as an act on the substrate and hands the judge the path alone,',
  '// never the words, while a `SendMessage` is the dispatch it judges by its body and',
  '// its recipient. So the envelope spells it as the contract does — `agent` holds',
  '// the address after `agent://`, `message` the content written. Every other write,',
  '// and every edit, keeps the spelling `WIRE_TOOL` gives it.',
  'const AGENT_ADDRESS = "agent://";',
  'function toolEnvelope(event: {',
  '  toolName?: string;',
  '  input?: Record<string, unknown>;',
  '}): Record<string, unknown> {',
  '  const raw = event.toolName ?? "";',
  '  const input = event.input ?? {};',
  '  if (',
  '    raw === "write" &&',
  '    typeof input.path === "string" &&',
  '    input.path.startsWith(AGENT_ADDRESS)',
  '  ) {',
  '    return {',
  '      tool_name: "SendMessage",',
  '      tool_input: {',
  '        agent: input.path.slice(AGENT_ADDRESS.length),',
  '        message: typeof input.content === "string" ? input.content : "",',
  '      },',
  '    };',
  '  }',
  '  const tool = WIRE_TOOL[raw] ?? raw;',
  '  return { tool_name: tool, tool_input: workerInput(tool, input) };',
  '}',
  '',
  '// A FINISHED DELEGATION IS A JUDGEABLE TURN, and this is the translation that',
  "// makes it one. `subagent.end` lands on the `task` tool's `tool_result`, whose",
  '// event carries no message list — which was read as "not a turn" and left the',
  '// worker firing on empty stdin. It is a turn: the prompt that launched the',
  "// delegate is the instruction, and the text it returned is the delegate's last",
  '// assistant turn, the pair the worker reads.',
  'function dispatchTurn(event: {',
  '  input?: Record<string, unknown>;',
  '  content?: readonly { type?: string; text?: string }[];',
  '}): TurnMessage[] {',
  '  const i = event.input ?? {};',
  '  const ask = [i.prompt, i.task, i.message, i.description].find(',
  '    (v): v is string => typeof v === "string" && v.trim() !== "",',
  '  );',
  '  const said = (event.content ?? [])',
  '    .filter((c) => c.type === "text" && typeof c.text === "string")',
  '    .map((c) => c.text as string)',
  '    .join("\\n")',
  '    .trim();',
  '  const out: TurnMessage[] = [];',
  '  if (ask) out.push({ role: "user", content: [{ type: "text", text: ask }] });',
  '  if (said)',
  '    out.push({ role: "assistant", content: [{ type: "text", text: said }] });',
  '  return out;',
  '}',
  '',
  "// THE WORKER'S VERDICT, read from where the worker actually writes it. The",
  '// workers speak the Claude hook contract: the verdict is JSON on STDOUT and the',
  '// exit status is 0 on every path — allow, deny, and each fail-open alike. So a',
  '// nonzero `code` is a malfunction rather than a refusal, and anything that does',
  '// not parse into one of the two verdict shapes is silence.',
  '//',
  "// FAILS OPEN AT EVERY STEP, which is the property the canon's hook cells are",
  '// written to (`fail-open ∀error`): a gate that could not run has refused',
  '// nothing, and one that answered unintelligibly has not refused either.',
  'function verdictOf(r: {',
  '  stdout?: string;',
  '  code?: number;',
  '  killed?: boolean;',
  '}): string | undefined {',
  '  if (r.killed || r.code !== 0) return undefined;',
  '  const text = (r.stdout ?? "").trim();',
  '  if (!text.startsWith("{")) return undefined;',
  '  let v: unknown;',
  '  try {',
  '    v = JSON.parse(text);',
  '  } catch {',
  '    return undefined;',
  '  }',
  '  const o = v as {',
  '    decision?: string;',
  '    reason?: string;',
  '    hookSpecificOutput?: {',
  '      permissionDecision?: string;',
  '      permissionDecisionReason?: string;',
  '    };',
  '  };',
  '  // PreToolUse shape (the pre-guard) …',
  '  const pre = o.hookSpecificOutput;',
  '  if (pre?.permissionDecision === "deny") {',
  '    return (pre.permissionDecisionReason ?? "").trim() || undefined;',
  '  }',
  '  // … and the Stop shape (the turn-end guard).',
  '  if (o.decision === "block") return (o.reason ?? "").trim() || undefined;',
  '  return undefined;',
  '}',
  '',
];

/**
 * Function-level half of the bridge — emitted inside `export default`, where `pi`
 * is in scope.
 *
 * The envelope goes to a FILE and arrives by redirect because `ExecOptions` has
 * no stdin slot (signal · timeout · cwd) and the workers read stdin. A temp dir
 * per fire, removed in `finally`, keeps a turn's transcript off any shared path.
 * The worker is fired once and its stdout read as its verdict (`verdictOf`); no
 * model is asked anything here.
 */
const TURN_EXEC: readonly string[] = [
  '  /** Fire the worker once, with `extra` merged into the envelope on stdin; its verdict. `undefined` ⇒ none. */',
  '  const hooked = async (',
  '    cmd: string,',
  '    extra: Record<string, unknown>,',
  '    messages?: readonly TurnMessage[],',
  '  ): Promise<string | undefined> => {',
  '    const dir = mkdtempSync(join(tmpdir(), "cratylus-hook-"));',
  '    try {',
  '      let full = extra;',
  '      if (messages) {',
  '        const transcript = join(dir, "transcript.jsonl");',
  '        writeFileSync(transcript, `${transcriptOf(messages)}\\n`);',
  '        full = { transcript_path: transcript, ...extra };',
  '      }',
  '      const envelope = join(dir, "envelope.json");',
  '      writeFileSync(envelope, JSON.stringify({ session_id: sessionId, cwd: pi.cwd, ...full }));',
  '      return verdictOf(await pi.exec("sh", ["-c", `${cmd} < ${envelope}`]));',
  '    } finally {',
  '      rmSync(dir, { recursive: true, force: true });',
  '    }',
  '  };',
];

/**
 * The extension module's text. Its hooks bind every session, and nothing in them
 * asks which agent is running.
 */
function ompExtensionModule(governs: string, registrations: string[]): string {
  // The payload bridge is emitted only where a registration reads one, so a module
  // of pure fire-and-forget hooks stays as small as it was.
  const needsTurn = registrations.some((r) => r.includes('hooked('));
  return [
    // The regenerate instruction NAMES THE COMMAND, so it interpolates the bin
    // rather than spelling it: a banner telling a host to run a command that no
    // longer exists is worse than no banner, and only derivation survives a rename.
    `// GENERATED by @cratylus/forge — do not hand-edit; regenerate with \`${CLI_BIN} project\`.`,
    `// The hooks in force for ${governs}.`,
    '//',
    ...SESSION_PLACEMENT,
    '// The hooks below carry no AGENT identity check and must not: they bind the',
    '// session. The one runtime question they ask is which session is running, and',
    '// only the main one hands a worker an envelope.',
    '',
    ...(needsTurn
      ? [
          "import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';",
          "import { tmpdir } from 'node:os';",
          "import { join } from 'node:path';",
        ]
      : []),
    // `ExtensionAPI`, NOT `HookAPI`. omp's own `docs/hooks.md` closes with the
    // fact this module got wrong: "The package root does not re-export `HookAPI`;
    // import legacy hook types from the hooks subpath." A default export is an
    // `ExtensionFactory = (pi: ExtensionAPI) => void | Promise<void>`, and that is
    // the type the root does export. Type-only, so the bad name was erased before
    // it could throw — it broke nobody's session and would fail the first person
    // who typechecked an emitted module.
    "import type { ExtensionAPI } from '@oh-my-pi/pi-coding-agent';",
    '',
    ...(needsTurn ? TURN_BRIDGE : []),
    'export default function (pi: ExtensionAPI) {',
    // `HookAPI.exec(command, args, options?)` — `args` is REQUIRED and the impl
    // does `ptree.exec([command, ...args])`. Passing an options object in its slot
    // made omp spread a non-iterable and every registration in this module died at
    // load with "Spread syntax requires ...iterable[Symbol.iterator] to be a
    // function" — measured against the installed binary, invisible to a stubbed
    // `pi`. There is no `shell` option either (`ExecOptions` is signal · timeout ·
    // cwd), and the commands are shell text carrying `$HOME`, so the shell is
    // named explicitly.
    '  const exec = (cmd: string) => pi.exec("sh", ["-c", cmd]);',
    ...(needsTurn ? TURN_EXEC : []),
    ...registrations,
    '}',
    '',
  ].join('\n');
}

/** The placement note of a module in the session scope: what is true of where the
 *  file sits, said once. */
const SESSION_PLACEMENT: readonly string[] = [
  `// This module sits in \`${OMP_EXTENSIONS_DIR}/\` of the ${CLI_BIN} extension package,`,
  '// whose `package.json` names it, so omp loads it in every session.',
];

// ── Capability interface and agent launch → extensions/<bin>.ts ──────────────

/**
 * The CRATYLUS module: ONE omp extension, at the SESSION scope, which omp loads in
 * any plain session, offering every capability that explains itself as one tool,
 * and starting the main session as any agent declaration omp discovers.
 *
 * A PORT, NEVER A COPY. At session load the module runs the installed
 * `<bin> <capability> --explain` for each such capability (the command on PATH,
 * never a path into a source workspace), and when the session starts it registers
 * one tool per capability,
 * composed from that answer alone: the name snake-cased from the explained name,
 * the label that name, the description the capability's purpose and when and each
 * verb's concept, purpose, when, effect and parameters; the parameters a required
 * `verb` of the explained verbs and every explained parameter with its
 * descriptions and its schema (the distinct schemas as `anyOf` where verbs declare
 * one name differently, so none is dropped); approval `read` for a verb that reads
 * and `write` for one that appends. A call runs `<bin> <capability> <verb>
 * [positional] [--flag=value…]` in the session's directory and returns its output;
 * a refusal is a tool error carrying the command's own message. Every value is
 * one `--flag=value` token, so a value led by `-` reaches the command literally.
 * The module names the command and the capabilities and nothing of what a
 * capability says, so a newer installed package changes the tools in the next
 * session, these bytes unchanged.
 *
 * OPEN REACH (decision 0081). Every agent, main or dispatched, is offered every verb
 * of every capability: no verb is withheld and no declaration narrows the tools.
 *
 * TYPED HANDOFFS, SHOWN AND NEVER REFUSED (decision 0142(3)). Every turn of every
 * session carries the assignment form of each agent that declares an assignment
 * schema ({@link OMP_ASSIGNMENT_KEY}). On every `task` call, in any session, each
 * such item is checked with the same `checkAssignment` the schema package exports
 * (its source carried here verbatim) against the one fenced `assignment` block of
 * the item's text or of the batch's shared context; a misfit is warned of, naming
 * the agent and each missing or ill-typed field with the agent's form, and the call
 * goes ahead. A main session launched as an agent with an assignment schema checks
 * its first prompt the same way, whether given on the command line, typed, or by any
 * other route, warns of a misfit, and starts.
 *
 * DISPATCH FROM `eval`. A dispatch from `eval` code (the prelude's `agent(…)` or
 * `workpool(…)`, or the task tool called as `tool.task` or `tool["task"]`) reaches
 * no `task` call, so its assignment is not checked and the ledger does not record
 * it. A session launched as an agent, and a delegate whose declaration carries a
 * typed assignment, is warned so ({@link EVAL_DISPATCH_WARNING}); the call goes ahead.
 *
 * THE ACTING AGENT (F1). Every capability call, a tool's and the module's own reads
 * and lifecycle records alike, names the agent making it in `CRATYLUS_AGENT`: the
 * declaration a main session was launched as, the agent a dispatched session runs
 * as, and no one otherwise (unknown, never an architect). Every shell (`bash`) call
 * runs with that agent named the same way: its command is led by a line exporting
 * `CRATYLUS_AGENT` (omp's bash tool takes no `env`), so a journal append made from
 * the architect's session records the architect and a lead's the lead (a commit
 * records the git user, as git does);
 * in a session that is no agent the line unsets it, and an ambient value is dropped
 * at load, so such a session names no one.
 *
 * NO CALL IS REFUSED FOR WHAT IT CHANGES (decision 0143). What a call may change is
 * a rule held by review and by the record, which names the agent each call names.
 *
 * EACH AGENT RUN RECORDED. Each agent run the harness sees for a story or a task is
 * sent to the ledger by `<bin> lifecycle`, so the ledger's cost is what the harness
 * saw: `dispatched` for each item of a `task` call whose assignment names a `story`
 * or a `task` at its top level, by the call's id and the item's, with the agent it
 * runs as (its role) and what it names, and `returned` when it returns, by the same
 * ids, with its tokens when the harness reports them. An item naming neither is not
 * sent, nor is its return: the module loads in every omp session, in any repository.
 * The module only sends; what is recorded is the runtime's, and no time is sent: the
 * ledger reads elapsed time from its entries. A failed send is warned of, and a
 * dispatch always goes ahead.
 *
 * ATTACH: A GATE HELD BY A DELEGATE (decision 0250(3)). A delegate holds a gate when its
 * declaration's decision rights hold `sign-off` and it ends its turn on a reply that is not
 * its declared deliverable: a reply is the deliverable when omp found it valid, or when it
 * is, or holds in one fenced block, a JSON object satisfying the declared `output` (omp's
 * own validator; plain-text results, omp's default, carry no verdict). A holder declaring
 * no JSON deliverable hands over to the operator alone, so holds a gate at every turn it
 * ends. A cancelled run, or one failed by its provider or by omp, holds none. The
 * dispatching session learns only that the delegate waits on the operator's sign-off and
 * how the operator joins it, omp's Agent Hub (Alt+A, select the agent, Enter), and later
 * its result:
 *
 *   - its DISPATCHED RUN comes back on the TASK RESULT, since a gate holder is declared
 *     `blocking` ({@link agentToOmpMd}): a held run's `<task-result>` becomes the waiting
 *     notice, and its details lose the reply (output, structured data, yield data, error,
 *     recent output); every other result and the call's error state stay as omp gave them.
 *   - each LATER RUN, one the operator prompts after joining it (or a peer wakes), is
 *     judged by the delegate on what it said in that run alone (the messages from its
 *     `agent_start`, outside the dispatched run omp's lifecycle names). omp hands the
 *     dispatcher such a run itself only when its run monitor accepts a yield as the run's
 *     result (whole or aborting; never one the yield tool rejected, nor an incremental
 *     section) or the run answers the dispatcher's own message; otherwise the extension
 *     does, from the delegate's session to its
 *     dispatcher's (both run in one omp process, which shares this module's state): the
 *     waiting notice for another gate, else its reply, as a follow-up message.
 *   - a later run omp hands over itself reaches the dispatcher as a background delivery,
 *     outside any task result: each turn of the dispatching session is given it with a
 *     held job as the waiting notice (the `context` event). Its verdict is the delegate's
 *     own on that run, taken from the delivery itself (omp's verdict on a structured
 *     result, else the reply it carries) with the declaration the delegate runs as, so it
 *     is bound to that result; it is kept once taken and, when held, recorded in the
 *     session with the agent (`<bin>-gate-hold`).
 *
 * omp LIMITS ON ATTACH, held as omp gives them: with `task.structured` on, omp reminds a
 * delegate that ends without its deliverable up to three times, the last forcing a yield;
 * an isolated delegate is joinable only until omp parks it. A held reply reaches the
 * dispatching session's own transcript (which its compaction reads, and the operator sees)
 * only where omp relays it natively: a run of a delegate waiting at a gate that the
 * dispatcher's own message woke, and, with `task.structured` on, a later run whose yield
 * omp accepts though it fails the contract. No `session_before_compact` handler covers it,
 * since registering one turns off omp's background compaction for every session.
 *
 * AGENT LAUNCH (decision 0047). The module registers omp's `--agent <name>` flag.
 * When a main session starts (or the operator switches to a new one) with it, the
 * name resolves through omp's OWN agent discovery — `discoverAgents` from omp's
 * task subsystem, the declarations task dispatch runs: the nearest project
 * `.omp/agents/`, then the user's `<agentDir>/agents/`, then extension packages,
 * plugins and bundled agents, first name wins — read afresh for that session, never
 * copied or cached. The mark is the declaration's `mark` front-matter key, read with
 * omp's own front-matter parser from the declaration's file; a bundled declaration
 * has none (its path is `embedded:<name>.md`), so it shows its name alone.
 *
 * MODEL AND EFFORT AS DISPATCH RESOLVES THEM. The session runs on what omp's task
 * dispatch would run the declaration on, through omp's own resolver
 * (`resolveAgentModelSelection`, then `resolveModelOverrideWithAuthFallback`): its
 * `task.agentModelOverrides` entry, else its `model` selectors with role aliases
 * expanded, else the session's own model; and the effort a selector carries
 * (`provider/model:high`, directly or in the configured value of a role alias)
 * wins over the declaration's `thinking-level`, which wins over the level the
 * resolved selector implies. `ctx.models.resolve` is not used: it drops the level.
 * The operator's explicit `--model` and `--thinking`, read with omp's own
 * `parseArgs`, win over the declaration's — each for its own dimension — and the
 * declaration's body is carried either way.
 *
 * THE DECLARATION IS THE ONLY SOURCE OF IDENTITY, STANCE AND PROCEDURE. omp's own
 * system prompt opens a launched session's turn, and parts of it prescribe a coding
 * assistant's identity and workflow. So, for a main session launched as a
 * declaration (never a plain one), each turn keeps omp's sections that describe the
 * harness and every section it does not know, and drops, by heading, those that
 * prescribe: Role, Engineering, Workflow, Delivery, Critical, the project context's
 * `<critical>` blocks, and the tool policy's line against settling for plausibility.
 * The titles removed are notified once per launch.
 *
 * THE SESSION START. The first turn of a launch whose declared procedure holds
 * `reconstitution` carries a session-start note rendered from that value: nothing is
 * recorded or changed before the read-back, which carries the current design, then
 * what is open, then the stories and tasks in flight; a ruling waits in it for the
 * operator's sign-off, and a read-back held at a gate or called by the operator ends
 * with the sign-off it waits on and ends the turn (0251, 0252). It holds only where
 * the launch starts a session with no conversation since its last compaction, and
 * again after the session is compacted; a resumed session continuing a
 * conversation reconstitutes nothing.
 * Every turn of a launch whose declared decision rights hold meaning (D) carries a
 * note rendered from that right: the meaning of the contexts it holds is its own,
 * the approval of their examples included, approved as they stand when they express
 * their meaning, and a decision it owns whose grounds it holds is taken in the turn
 * it holds them, or carried in the read-back for sign-off at a session's start or
 * where the operator called one (0086, 0251). Every turn of a launch whose memory
 * keeps the records as its source of truth under the honesty guardrail carries a
 * note rendered from those values: where things stand is what the records show, and
 * what they do not record is unknown. These hold what the agent's replies say by its
 * own text, not by a check on the reply (0106).
 *
 * Every turn's system prompt carries the declaration as prose — its name and
 * description in a sentence, then its body, never the raw front matter — then the
 * full instructions of each skill its `autoload-skills` names, found among the
 * skills omp discovered for the session (an unknown name skipped, as dispatch skips
 * it) and rendered by omp's own `buildSkillPromptMessage` in the autoload form a
 * dispatched child receives; all appended in `before_agent_start`, so a rebuilt
 * base prompt never drops them. The status line reads `<mark> <name>`, or `<name>`
 * without a mark (where the host hid extension status, install lists omp's `status`
 * segment so it renders).
 *
 * THE REST OF THE DECLARATION. Once per launch, held as
 * session-scoped runtime overrides on the session's own settings (never persisted)
 * and put back as they were when the launch ends (a switch to a session the name
 * no longer resolves for): personality `none`, as every dispatched child runs;
 * `read-summarize` true or false as declared, else the session's own setting; the
 * advisor through `resolveAgentAdvisorSelection` (`task.agentAdvisor` first, then
 * front matter; none without either, as for a child), a pattern landing on
 * `modelRoles.advisor` through `resolveAgentAdvisorRolePattern`, so the live session
 * starts or stops its advisor as `advisor.enabled` moves; pre-planning through
 * `resolveAgentPrewalkPattern` and `resolveAgentPrewalkDefault` (`task.agentPrewalk`
 * first), held on `prewalk.enabled`, which a live main session follows by
 * disarming or arming omp's default target `@smol`: it is turned off first, so a
 * hand-off configuration already armed is dropped, then on, a declared target
 * standing in that role only while omp arms it. Configuration files are defaults
 * the declaration overrides, as for a child; the operator's explicit `--advisor` and
 * `--prewalk` / `--no-prewalk` / `--prewalk-into` win their own dimension.
 *
 * ONE KNOWN omp LIMITATION, where launch holds what the declaration says and omp's
 * own dispatch does not: `read-summarize: true` (omp's dispatch applies only
 * `false`, so a dispatched child keeps the session's setting). For every other
 * value, launch holds what omp's dispatch gives a child.
 *
 * The active tools are never touched: the session holds exactly what omp grants for
 * the operator's selection, and nothing here limits whom it dispatches. An unknown
 * name ends startup with a non-zero exit before any turn. A subagent session, or a
 * session without the flag, gets nothing of this.
 */
export function ompCapabilityExtensions(): HarnessProjection[] {
  return [
    {
      filename: OMP_CRATYLUS_MODULE,
      scope: SESSION_SCOPE,
      content: [
        `// GENERATED by @cratylus/forge — do not hand-edit; regenerate with \`${CLI_BIN} project\`.`,
        `// Offers each capability of the installed \`${CLI_BIN}\` command that explains itself as one`,
        '// tool, composed at session load from what the command explains of it, and run by that',
        '// command on every call; and starts the main session as an agent declaration omp',
        '// discovers, by `omp --agent <name>`, holding the whole declaration as a dispatched child',
        '// holds it: its text, model, effort, skills loaded at start, read summarisation, advisor',
        "// and pre-planning, and no default personality; the operator's own flags win. One value",
        "// omp's own dispatch drops is held as declared: `read-summarize: true` (on). A delegate",
        '// holding a gate reaches the session that dispatched it only as a notice that it waits on',
        "// the operator's sign-off, and how the operator joins it in omp's Agent Hub, then its result.",
        '//',
        '// Nothing here describes a capability: its name, purpose, verbs and parameters are the',
        "// installed command's own explanation, so a newer installed package changes the tools in",
        '// the next session and this file not at all. Nothing here names an agent either: the',
        "// declaration is the one omp's own discovery finds, read afresh for each session.",
        '',
        'import { execFile } from "node:child_process";',
        'import { existsSync, readFileSync } from "node:fs";',
        'import { dirname, isAbsolute } from "node:path";',
        'import { fileURLToPath } from "node:url";',
        "import type { ExtensionAPI } from '@oh-my-pi/pi-coding-agent';",
        'import { type Args, parseArgs } from "@oh-my-pi/pi-coding-agent/cli/args";',
        'import {',
        '  DEFAULT_PREWALK_TARGET,',
        '  resolveAgentAdvisorRolePattern,',
        '  resolveAgentAdvisorSelection,',
        '  resolveAgentModelSelection,',
        '  resolveAgentPrewalkPattern,',
        '  resolveConfiguredModelPatterns,',
        '  resolveModelOverrideWithAuthFallback,',
        '} from "@oh-my-pi/pi-coding-agent/config/model-resolver";',
        'import { cfgModelRoles } from "@oh-my-pi/pi-coding-agent/config/model-settings";',
        'import { lookup } from "@oh-my-pi/pi-coding-agent/config/registry";',
        'import { findScopedSettings, type Settings, settings } from "@oh-my-pi/pi-coding-agent/config/settings";',
        'import { buildSkillPromptMessage, getActiveSkills } from "@oh-my-pi/pi-coding-agent/extensibility/skills";',
        'import { cfgPersonality, cfgPrewalkEnabled } from "@oh-my-pi/pi-coding-agent/session/settings";',
        'import { discoverAgents } from "@oh-my-pi/pi-coding-agent/task/discovery";',
        'import { SUBAGENT_WARNING_MISSING_YIELD } from "@oh-my-pi/pi-coding-agent/task/executor";',
        'import { resolveAgentPrewalkDefault } from "@oh-my-pi/pi-coding-agent/task/prewalk";',
        'import {',
        '  cfgTaskAgentAdvisor,',
        '  cfgTaskAgentModelOverrides,',
        '  cfgTaskAgentPrewalk,',
        '  cfgTaskPrewalk,',
        '} from "@oh-my-pi/pi-coding-agent/task/settings";',
        'import type { AgentDefinition } from "@oh-my-pi/pi-coding-agent/task/types";',
        'import { buildOutputValidator } from "@oh-my-pi/pi-coding-agent/tools/output-schema-validator";',
        'import { cfgReadSummarizeEnabled } from "@oh-my-pi/pi-coding-agent/tools/settings";',
        'import { parseFrontmatter } from "@oh-my-pi/pi-utils";',
        '',
        `const COMMAND = ${JSON.stringify(CLI_BIN)};`,
        `const INSTALLATION_ENV = ${JSON.stringify(INSTALLATION_ENV)};`,
        '// Where every capability call names the agent making it.',
        `const ACTING_AGENT = ${JSON.stringify(ACTING_AGENT_ENV)};`,
        '// The version tool as the build that projected this installation explains it: carried here, so',
        '// it is offered whatever command the capabilities reach, one that predates it included.',
        `const SKEW = ${JSON.stringify('versionSkew' satisfies Capability)};`,
        `const SKEW_EXPLAINED: Explanation = ${JSON.stringify(explain(VERSION_SKEW))};`,
        '// The installation this module was placed in: the root above its `extensions/`.',
        'const INSTALLATION = dirname(dirname(fileURLToPath(import.meta.url)));',
        `const CAPABILITIES: readonly string[] = ${JSON.stringify(OMP_CAPABILITY_TOOLS)};`,
        '// Those offered whole, a tool of every turn, rather than an `xd://` device whose prompt line is',
        '// its purpose shortened.',
        `const ESSENTIAL: readonly string[] = ${JSON.stringify(OMP_ESSENTIAL_CAPABILITIES)};`,
        `const ASSIGNMENT_KEY = ${JSON.stringify(OMP_ASSIGNMENT_KEY)};`,
        "// The schema package's own `assignmentIn` and `checkAssignment`, carried verbatim: the one",
        '// check every handoff is shown, here and at a launch alike.',
        `const assignmentIn: (text: string) => unknown = (${String(assignmentIn)});`,
        `const checkAssignment: (agent: string, schema: unknown, value: unknown) => { problem?: string } = (${String(checkAssignment)});`,
        `const AGENT_FLAG = ${JSON.stringify(OMP_AGENT_FLAG)};`,
        '// What an agent dispatching a delegate from `eval` code is warned, and that code.',
        `const EVAL_DISPATCH_WARNING = ${JSON.stringify(EVAL_DISPATCH_WARNING)};`,
        `const EVAL_DISPATCH = ${String(EVAL_DISPATCH)};`,
        `const AGENT_STATUS = ${JSON.stringify(OMP_AGENT_STATUS_KEY)};`,
        '// What a delegate holding a gate, or its later result, is handed to its dispatcher as; and the',
        "// dispatcher's record of a background result held at a gate.",
        `const ATTACH = ${JSON.stringify(`${CLI_BIN}-attach`)};`,
        `const HELD = ${JSON.stringify(`${CLI_BIN}-gate-hold`)};`,
        '// omp exports no module path to its advisor settings; its settings registry holds the handle.',
        'const ADVISOR_ENABLED = lookup("advisor.enabled") as Overridable<boolean>;',
        '',
        'interface Parameter {',
        '  name: string;',
        '  description: string;',
        '  required: boolean;',
        '  schema: Record<string, unknown>;',
        '  positional?: true;',
        '}',
        'interface Verb {',
        '  name: string;',
        '  concept: string;',
        '  purpose: string;',
        '  when: string;',
        '  effect: "reads" | "appends";',
        '  parameters: Parameter[];',
        '}',
        'interface Explanation {',
        '  name: string;',
        '  purpose: string;',
        '  when: string;',
        '  verbs: Verb[];',
        '}',
        '',
        "// A program's output; its own message, when it refuses.",
        'function execOf(file: string, args: string[], cwd?: string, signal?: AbortSignal, env?: NodeJS.ProcessEnv): Promise<string> {',
        '  const { promise, resolve, reject } = Promise.withResolvers<string>();',
        '  execFile(file, args, { cwd, signal, env, maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {',
        '    if (error) reject(new Error(String(stderr).trim() || String(stdout).trim() || error.message));',
        '    else resolve(String(stdout));',
        '  });',
        '  return promise;',
        '}',
        "// The installed command's output; its own message, when it refuses. Every call names the",
        '// installation this module was placed in, so the command can say which build projected it,',
        '// and the agent making it, when one is known.',
        'const run = (args: string[], cwd?: string, signal?: AbortSignal, agent?: string): Promise<string> =>',
        '  execOf(COMMAND, args, cwd, signal, {',
        '    ...process.env,',
        '    [INSTALLATION_ENV]: INSTALLATION,',
        '    ...(agent === undefined ? {} : { [ACTING_AGENT]: agent }),',
        '  });',
        '',
        '// The capabilities this installation expects that the reached command does not provide,',
        '// each with its own refusal, as found at load.',
        'const lacking = new Map<string, string>();',
        '// The version that projected this installation, as its own package records it.',
        'function projected(): string {',
        '  try {',
        '    const { version } = JSON.parse(readFileSync(`${INSTALLATION}/package.json`, "utf8")) as { version?: unknown };',
        '    if (typeof version === "string") return version;',
        '  } catch {',
        '    // said below',
        '  }',
        '  return "an unrecorded version";',
        '}',
        '// VERSION SKEW, said at every session start before any tool is called: the build that',
        '// projected this installation, as it records itself, against the version the reached',
        '// command answers for itself, whichever is older, and any capability the command lacks.',
        '// Silent when they match; nothing here chooses between builds.',
        '// The version the reached command answers for itself, which every build of it answers.',
        'const reached = async (): Promise<string> => (await run(["--version"])).trim();',
        'async function warnSkew(session: Session): Promise<void> {',
        '  const artifacts = projected();',
        '  let command: string;',
        '  try {',
        '    command = await reached();',
        '  } catch (error) {',
        '    command = `unknown (${(error as Error).message})`;',
        '  }',
        '  if (artifacts === command && lacking.size === 0) return;',
        '  const missing =',
        '    lacking.size === 0',
        '      ? ""',
        '      : ` It does not provide ${[...lacking].map(([c, why]) => `${c} (${why})`).join(", ")}, which this installation expects, so ${lacking.size === 1 ? "that is" : "those are"} not offered.`;',
        '  session.ui.notify(',
        '    `${COMMAND} version skew: this installation was projected by ${COMMAND} ${artifacts}, but the ${COMMAND} command its capabilities run is ${command}.${missing} Install again with the ${COMMAND} in use: ${COMMAND} install --harness omp`,',
        '    "warning",',
        '  );',
        '}',
        '',
        '// THIS MODULE AS LOADED. omp loads an extension once per process and every session of that',
        '// process, a dispatched one included, runs the module as loaded: an install that replaces it',
        '// reaches only processes started afterwards. So a session started in an older process says',
        "// so, since the checks of its dispatches and their capture in the ledger are the old module's.",
        'const MODULE = fileURLToPath(import.meta.url);',
        'const LOADED = readFileSync(MODULE, "utf8");',
        'function warnReplaced(session: Session): void {',
        '  const installed = existsSync(MODULE) ? readFileSync(MODULE, "utf8") : undefined;',
        '  if (installed === LOADED) return;',
        '  session.ui.notify(',
        '    `${COMMAND}: this omp process runs the ${COMMAND} extension it loaded when it started, which the installation has since ${installed === undefined ? "removed" : "replaced"}; its sessions, dispatched ones included, keep the earlier tools, dispatch checks and ledger capture until omp is restarted. Restart omp to run the installed one.`,',
        '    "warning",',
        '  );',
        '}',
        '',
        'const requirement = (p: Parameter): string => (p.required ? "required" : "optional");',
        '',
        'function description(e: Explanation): string {',
        '  return [',
        '    e.purpose,',
        '    `When: ${e.when}`,',
        '    ...e.verbs.map((v) =>',
        '      [',
        '        `Verb ${v.name} (concept: ${v.concept}; ${v.effect})`,',
        '        `Purpose: ${v.purpose}`,',
        '        `When: ${v.when}`,',
        '        ...v.parameters.map((p) => `Parameter ${p.name} (${requirement(p)}): ${p.description}`),',
        '      ].join("\\n"),',
        '    ),',
        '  ].join("\\n\\n");',
        '}',
        '',
        '// A required `verb` (implied where the capability explains one verb alone), then each',
        '// parameter once, with what each verb says of it and its schema: the one schema every',
        '// verb declares, or each distinct one under `anyOf`.',
        'function parameters(e: Explanation): Record<string, unknown> {',
        '  const sole = e.verbs.length === 1;',
        '  const properties: Record<string, Record<string, unknown>> = sole',
        '    ? {}',
        '    : {',
        '        verb: {',
        '          type: "string",',
        '          enum: e.verbs.map((v) => v.name),',
        '          description: e.verbs.map((v) => `${v.name} (${v.effect})`).join("; "),',
        '        },',
        '      };',
        '  const said = new Map<string, { schemas: Map<string, Record<string, unknown>>; lines: string[] }>();',
        '  for (const v of e.verbs)',
        '    for (const p of v.parameters) {',
        '      const entry = said.get(p.name) ?? { schemas: new Map(), lines: [] };',
        '      entry.schemas.set(JSON.stringify(p.schema), p.schema);',
        '      entry.lines.push(`${v.name} (${requirement(p)}): ${p.description}`);',
        '      said.set(p.name, entry);',
        '    }',
        '  for (const [name, { schemas, lines }] of said) {',
        '    const distinct = [...schemas.values()];',
        '    properties[name] = {',
        '      ...(distinct.length === 1 ? distinct[0] : { anyOf: distinct }),',
        '      description: lines.join("\\n"),',
        '    };',
        '  }',
        '  return { type: "object", properties, required: sole ? [] : ["verb"] };',
        '}',
        '',
        '// The command line of one call: the verb, its positional, then each flag given as one',
        '// `--flag=value` token, so a value led by `-` is never read as a flag. A positional led by',
        '// `-` is one the command cannot take literally; it goes as a flag-shaped token of its own',
        '// (`=` appended where it has none), which the command refuses in its own words and never',
        '// reads as a request for its help or its explanation.',
        'function argv(capability: string, verb: Verb | undefined, args: Record<string, unknown>): string[] {',
        '  const positional = verb?.parameters.find((p) => p.positional === true)?.name;',
        '  const words = [capability, verb?.name ?? String(args.verb)];',
        '  if (positional !== undefined && args[positional] != null) {',
        '    const word = String(args[positional]);',
        '    words.push(word.startsWith("-") && word !== "-" && !word.includes("=") ? `${word}=` : word);',
        '  }',
        '  for (const [key, value] of Object.entries(args)) {',
        '    if (key === "verb" || key === positional || value == null || value === false) continue;',
        '    if (Array.isArray(value)) for (const item of value) words.push(`--${key}=${String(item)}`);',
        '    else if (value === true) words.push(`--${key}`);',
        '    else words.push(`--${key}=${String(value)}`);',
        '  }',
        '  return words;',
        '}',
        '',

        'interface Launched {',
        "  // One agent declaration as omp's own discovery parses it.",
        '  declaration: AgentDefinition;',
        '  mark?: string;',
        '  // The schema its assignment must fit, when the declaration carries one.',
        '  assignment?: Schema;',
        '}',
        '// What of a session the launch reads or sets.',
        'interface Session {',
        '  cwd: string;',
        '  agent?: { kind: string; name?: string; id?: string; parentId?: string };',
        '  model?: { provider: string; id: string };',
        '  modelRegistry: Parameters<typeof resolveModelOverrideWithAuthFallback>[2];',
        '  ui: {',
        '    setStatus(key: string, text: string | undefined): void;',
        '    notify(message: string, type?: "info" | "warning" | "error"): void;',
        '  };',
        "  // The session's entries, on its current branch and whole, as omp's session manager keeps them.",
        '  sessionManager?: {',
        '    getBranch?(): readonly { type?: string; message?: { role?: string } }[];',
        '    getEntries?(): readonly { type?: string; customType?: string; data?: { key?: unknown; agent?: unknown } }[];',
        '  };',
        '}',
        '',
        '// Whether the session already holds a conversation since its last compaction: a resumed',
        '// session continuing one, not a new session or one compacted since it last spoke.',
        'function conversed(session: Session): boolean {',
        '  const branch = session.sessionManager?.getBranch?.() ?? [];',
        '  const since = branch.map((entry) => entry.type).lastIndexOf("compaction");',
        '  return branch',
        '    .slice(since + 1)',
        '    .some((entry) => entry.type === "message" && (entry.message?.role === "user" || entry.message?.role === "assistant"));',
        '}',
        'type Level = Parameters<ExtensionAPI["setThinkingLevel"]>[0];',
        '// A setting a launch holds as a runtime override.',
        'interface Overridable<T> {',
        '  segments: readonly string[];',
        '  override(scope: Settings, value: T): void;',
        '  clearOverride(scope: Settings): void;',
        '}',
        '',
        "// The declaration omp's task dispatch runs by `name` from `cwd`, discovered afresh by omp",
        '// itself (nearest project `.omp/agents/`, then the user agent dir, then extension packages,',
        '// plugins and bundled agents; first name wins), with the mark its front matter declares. A',
        '// bundled declaration has no file (`embedded:<name>.md`): omp declares no mark on one.',
        'async function discover(name: string, cwd: string): Promise<{ found?: Launched; names: string[] }> {',
        '  const agents: AgentDefinition[] = (await discoverAgents(cwd)).agents;',
        '  const names = agents.map((a) => a.name);',
        '  const declaration = agents.find((a) => a.name === name);',
        '  if (declaration === undefined) return { names };',
        '  const said = frontmatterOf(declaration);',
        '  const mark = typeof said.mark === "string" && said.mark.trim() !== "" ? said.mark.trim() : undefined;',
        '  return { found: { declaration, mark, assignment: schemaOf(said) }, names };',
        '}',
        '',
        "// A declaration's front matter as its file says it, read with omp's own parser. A bundled",
        '// declaration has no file (`embedded:<name>.md`), and so none.',
        'function frontmatterOf(declaration: AgentDefinition | undefined): Record<string, unknown> {',
        '  const file = declaration?.filePath;',
        '  return file !== undefined && isAbsolute(file) && existsSync(file)',
        '    ? parseFrontmatter(readFileSync(file, "utf8"), { location: file }).frontmatter',
        '    : {};',
        '}',
        '',
        '// The assignment schema a declaration carries, when it carries one.',
        'function schemaOf(said: Record<string, unknown>): Schema | undefined {',
        '  const schema = said[ASSIGNMENT_KEY];',
        '  return typeof schema === "object" && schema !== null ? (schema as Schema) : undefined;',
        '}',
        '',
        '// ── Typed handoffs ──',
        '',
        '// The fields a schema requires, as typed handoffs state them.',
        'interface Schema {',
        '  required?: readonly string[];',
        '}',
        '',
        '// One item of a `task` call: the agent it runs as and its own id (its name, else its',
        '// position), with its assignment once checked.',
        'interface Handoff {',
        '  item: Record<string, unknown>;',
        '  agent: string;',
        '  id: string;',
        '  index: number;',
        '  assignment?: Record<string, unknown>;',
        '}',
        '',
        '// A dispatch is known by what it carries — the agent each item runs as and its task, one item',
        '// or a batch of them — never by what the harness calls the tool carrying it, which a host or',
        '// a provider may present under another name.',
        'function isDispatch(input: Record<string, unknown>): boolean {',
        '  const items: unknown[] = Array.isArray(input.tasks) ? input.tasks : [input];',
        '  return items.length > 0 && items.every((raw) => {',
        '    if (typeof raw !== "object" || raw === null) return false;',
        '    const item = raw as Record<string, unknown>;',
        '    return typeof item.task === "string" && (typeof item.agent === "string" || typeof input.agent === "string");',
        '  });',
        '}',
        '',
        '// The items of a dispatch, batch (`tasks[]`) or flat, each with the agent it names.',
        'function itemsOf(input: Record<string, unknown>): Handoff[] {',
        '  const items: unknown[] = Array.isArray(input.tasks) ? input.tasks : [input];',
        '  return items.flatMap((raw, index) => {',
        '    if (typeof raw !== "object" || raw === null) return [];',
        '    const item = raw as Record<string, unknown>;',
        '    const agent = typeof item.agent === "string" ? item.agent : typeof input.agent === "string" ? input.agent : "task";',
        '    const named = [item.name, item.id].find((v): v is string => typeof v === "string" && v !== "");',
        '    return [{ item, agent, id: named ?? String(index), index }];',
        '  });',
        '}',
        '',
        '// The assignment an item is dispatched with: the block in its own text, else the one in the',
        "// batch's shared context.",
        'function assignmentOf(item: Record<string, unknown>, input: Record<string, unknown>): unknown {',
        '  const own = typeof item.task === "string" ? assignmentIn(item.task) : undefined;',
        '  if (own !== undefined) return own;',
        '  return typeof input.context === "string" ? assignmentIn(input.context) : undefined;',
        '}',
        '',
        'const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));',
        '',
        "// omp's own sections that prescribe an identity, a stance or a procedure, by heading: a session",
        '// launched as a declaration takes all three from the declaration alone. Every other section,',
        '// one omp adds later included, describes the harness and is kept.',
        'const PRESCRIBES: readonly string[] = ["Role", "Engineering", "Workflow", "Delivery", "Critical"];',
        "// The line of omp's tool policy that prescribes a stance (never settle for plausibility).",
        'const PRESCRIBED_LINE = /settle for plausibility/i;',
        '',
        "// One part of omp's system prompt without the sections that prescribe: a `§` section or a `#`",
        '// one so titled, to its next heading of the same or a higher level; the `<critical>` blocks',
        '// opening the Critical section, which ends where they do; the `<critical>` blocks of the',
        '// project context; and the prescriptive line of the tool policy. The titles removed are said.',
        'function harnessOnly(text: string): { text: string; removed: string[] } {',
        '  const removed: string[] = [];',
        '  const say = (title: string) => {',
        '    if (!removed.includes(title)) removed.push(title);',
        '  };',
        '  const out: string[] = [];',
        '  let section = "";',
        '  let dropping = 0;',
        '  let critical = false;',
        '  let inBlock = false;',
        '  for (const raw of text.split("\\n")) {',
        '    let line = raw;',
        '    const top = /^§\\s+(.+?)\\s*$/.exec(line);',
        '    if (top) {',
        '      section = top[1] ?? "";',
        '      critical = false;',
        '      inBlock = false;',
        '      dropping = PRESCRIBES.includes(section) ? 1 : 0;',
        '      if (dropping === 0) out.push(line);',
        '      else {',
        '        say(section);',
        '        critical = section === "Critical";',
        '      }',
        '      continue;',
        '    }',
        '    if (critical) {',
        '      // The Critical section is its opening `<critical>` blocks; what follows them is not.',
        '      let rest = line;',
        '      for (;;) {',
        '        if (inBlock) {',
        '          const end = rest.indexOf("</critical>");',
        '          if (end < 0) {',
        '            rest = "";',
        '            break;',
        '          }',
        '          rest = rest.slice(end + "</critical>".length);',
        '          inBlock = false;',
        '          continue;',
        '        }',
        '        const trimmed = rest.trimStart();',
        '        if (!trimmed.startsWith("<critical>")) {',
        '          rest = trimmed;',
        '          break;',
        '        }',
        '        inBlock = true;',
        '        rest = trimmed.slice("<critical>".length);',
        '      }',
        '      if (inBlock || rest === "") continue;',
        '      critical = false;',
        '      dropping = 0;',
        '      line = rest;',
        '    }',
        '    const sub = /^#{1,2}\\s+(.+?)\\s*$/.exec(line);',
        '    if (sub) {',
        '      if (dropping === 2) dropping = 0;',
        '      if (PRESCRIBES.includes(sub[1] ?? "")) {',
        '        say(sub[1] ?? "");',
        '        if (dropping === 0) dropping = 2;',
        '      }',
        '    }',
        '    if (dropping > 0) continue;',
        '    if (section === "Tool Policy" && PRESCRIBED_LINE.test(line)) {',
        '      say("Tool Policy: plausibility");',
        '      continue;',
        '    }',
        '    out.push(line);',
        '  }',
        '  // The project context describes the host; its `<critical>` blocks, inside it or right after',
        '  // it, prescribe.',
        '  const joined = out',
        '    .join("\\n")',
        '    .replace(/(<project-context>[\\s\\S]*?<\\/project-context>)((?:\\s*<critical>[\\s\\S]*?<\\/critical>)*)/g, (_all, context: string, after: string) => {',
        '      const inner = context.replace(/\\s*<critical>[\\s\\S]*?<\\/critical>/g, "");',
        '      if (inner !== context || after !== "") say("project context <critical>");',
        '      return inner;',
        '    });',
        '  return { text: joined, removed };',
        '}',
        '',
        '// The form an agent takes its assignment in, read from its schema: one fenced `assignment`',
        '// block holding a JSON object, then each field with its type, its least number of items,',
        '// whether it is required, and what it names; for a schema of alternatives (`anyOf`), each',
        '// alternative so, any one of which fits.',
        'function formOf(agent: string, schema: Schema): string {',
        '  type Form = {',
        '    description?: string;',
        '    properties?: Record<string, { type?: string; minItems?: number; description?: string; items?: { type?: string } }>;',
        '    required?: readonly string[];',
        '  };',
        '  const lines = (s: Form, indent: string): string[] => [',
        '    `${indent}\\`\\`\\`assignment\\n${indent}{${Object.keys(s.properties ?? {}).map((n) => `"${n}": …`).join(", ")}}\\n${indent}\\`\\`\\``,',
        '    ...Object.entries(s.properties ?? {}).map(([name, f]) => {',
        '      const type = f.type === "array" ? `list of ${f.items?.type ?? "value"}s` : (f.type ?? "value");',
        '      const least = f.minItems ? `, at least ${f.minItems}` : f.type === "array" ? ", may be empty" : "";',
        '      const need = (s.required ?? []).includes(name) ? "required" : "optional";',
        '      return `${indent}- \\`${name}\\` (${type}${least}, ${need})${f.description ? `: ${f.description}` : ""}`;',
        '    }),',
        '  ];',
        '  const alternatives = (schema as { anyOf?: readonly Form[] }).anyOf ?? [];',
        '  const head = `- ${agent}: give its assignment in the task text as one fenced code block with info string \\`assignment\\` holding one JSON object`;',
        '  if (alternatives.length === 0) return [`${head}:`, ...lines(schema as Form, "  ")].join("\\n");',
        '  return [',
        '    `${head}, in any one of these forms:`,',
        '    ...alternatives.flatMap((form, i) => [',
        '      `  ${i + 1}.${form.description ? ` ${form.description}` : ""}`,',
        '      ...lines(form, "    "),',
        '    ]),',
        '  ].join("\\n");',
        '}',
        '',
        '// One `### <name>` section of a declaration body, without its heading; empty when absent.',
        'function declared(body: string, name: string): string {',
        '  return new RegExp(`^### ${name}\\\\s*\\\\n([\\\\s\\\\S]*?)(?=^#{1,3} |(?![\\\\s\\\\S]))`, "m").exec(body)?.[1] ?? "";',
        '}',
        '',
        '// The session-start note of a declaration whose procedure starts with reconstitution,',
        '// rendered from that procedure value, and the scope its note gives it, as its body states',
        '// them (0252: nothing is recorded or changed before the read-back; a read-back held or',
        '// called ends the turn); none for any other.',
        'function reconstitutionNote(body: string): string | undefined {',
        '  const value = /^- \\*\\*reconstitution\\*\\*(?: \\(([^)]*)\\))?(?: — (.*?))?(?: \\(fixed\\))?\\s*$/m.exec(declared(body, "procedure"));',
        '  if (value === null) return undefined;',
        '  return [',
        '    "# Session start: reconstitution",',
        '    "",',
        '    `This session starts with reconstitution${value[2] ? ` (${value[2]})` : ""}${value[1] ? `: ${value[1]}` : ""}.`,',
        "    `Read each touched context's overview and the delivered workflow overview (${COMMAND}:workflow, or the project's own workflow context where its journal holds it) first, then the detail you need of its design and of its cuts. The delivered workflow is the practice you work by, shown apart from the project's design and never part of it: read it whole, never only recalled from tool descriptions or memory.`,",
        '    "Your sources are the journal, the ledger and the example files the design names; the work itself — the project tree, source, tests — is not a source: never list, search or open it.",',
        '    "Nothing is recorded or changed before the read-back: no dispatch, no journal append, no edit before it. In it tell the operator, in visible text rather than only in your thinking, the records as they stand now: first the current design, then what is open, each open decision named as open, then the stories and tasks in flight as the ledger records them, in your own communication style.",',
        '    "Say nothing to the operator before the read-back. Its bottom line is the state of the records; a ruling you hold now comes after it, as its own topic, carried in the read-back and recorded only once the operator signs off.",',
        '    "A read-back held at a gate or called by the operator ends with the sign-off it waits on and ends your turn: nothing follows it until the operator answers.",',
        '  ].join("\\n");',
        '}',
        '',
        '// The per-turn note of a declaration whose decision rights hold meaning (D), rendered from',
        '// that right as the design holds it: the meaning of the contexts it holds is its own,',
        '// the approval of their examples included (0086), and a decision it owns whose grounds it',
        "// holds is taken in the turn it holds them, except that at a session's start or under a",
        '// read-back the operator called the ruling waits for sign-off (0251); none for any other.',
        'function meaningNote(body: string): string | undefined {',
        '  if (!/^- meaning(?: \\([^)]*\\))?: \\*\\*D\\*\\*/m.test(declared(body, "decision-rights"))) return undefined;',
        '  return [',
        '    "# Meaning: yours",',
        '    "",',
        '    "The meaning of every context you hold is yours: its concepts, each question on them, and the approval of every one of its examples. No one else approves or confirms an example of a context you hold, and you ask no one to.",',
        '    "Approval judges one thing: whether an example expresses its concepts\' meaning accurately. Approve yourself, as they stand and in the turn they reach you, the examples returned to you that do, keeping each context\'s model its own; send back only an example that misses its meaning, naming the meaning it misses.",',
        "    \"Settle on sight: a decision you own whose grounds you hold is taken in the turn you hold them and reported with its reason, never deferred to a later round, another party's return or anyone's answer. At a session's start, or where the operator has called a read-back before recording, carry the ruling in the read-back and record it only once the operator signs off.\",",
        '  ].join("\\n");',
        '}',
        '',
        '// The per-turn note of a declaration that keeps the records as its source of truth under the',
        '// honesty guardrail, rendered from those two values: where things stand is what the records',
        '// show, observed apart from inferred; none for any other.',
        'function recordsNote(body: string): string | undefined {',
        '  if (!/^- \\*\\*source-of-truth\\*\\*/m.test(declared(body, "memory"))) return undefined;',
        '  if (!/^- \\*\\*honesty\\*\\*/m.test(declared(body, "guardrails"))) return undefined;',
        '  return [',
        '    "# The records",',
        '    "",',
        '    "The journal, the ledger and your delegates\' reports are the record of the design and its work, authoritative over anything remembered. State where things stand as they record it, what you observed apart from what you infer.",',
        '    "What they do not record is unknown: say it is unrecorded, never turn its absence into a fact about the work.",',
        '  ].join("\\n");',
        '}',
        '',
        "// ATTACH. A delegate holds a gate where its declaration's decision rights hold sign-off and it",
        '// ends its turn on a reply that is not its declared deliverable; one that declares no JSON',
        '// deliverable hands over to the operator alone, so holds one at every turn it ends. The session',
        '// that dispatched it learns only that it waits on the operator and how the operator joins it,',
        "// by omp's Agent Hub, and later its result: on the task result of its dispatch (a gate holder is",
        '// declared blocking, so its dispatch always comes back there), and on each later turn the',
        '// operator prompts in its session after joining it, whether the extension hands it over or omp',
        '// does.',
        '',
        '// A declaration that holds gates: its decision rights hold sign-off.',
        'function gated(declaration: AgentDefinition | undefined): declaration is AgentDefinition {',
        '  return declaration !== undefined && /^- sign-off \\(/m.test(declared(declaration.systemPrompt, "decision-rights"));',
        '}',
        '',
        '// Whether a reply is the deliverable a contract declares: a JSON object satisfying it, the whole',
        '// reply or one fenced block of it. A contract omp cannot use fails nothing.',
        'function delivers(reply: string, contract: unknown): boolean {',
        '  const { validator, error } = buildOutputValidator(contract);',
        '  if (error !== undefined) return true;',
        '  const said = [reply, ...Array.from(reply.matchAll(/```[^\\n]*\\n([\\s\\S]*?)```/g), (m) => m[1] ?? "")];',
        '  return said.some((text) => {',
        '    let value: unknown;',
        '    try {',
        '      value = JSON.parse(text.trim());',
        '    } catch {',
        '      return false;',
        '    }',
        '    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;',
        '    return validator?.validate(value).success ?? true;',
        '  });',
        '}',
        '',
        "// Whether a gate holder's reply holds a gate: it declares no JSON deliverable, or the reply is",
        '// not that deliverable.',
        'function holds(declaration: AgentDefinition, reply: string): boolean {',
        '  return declaration.output === undefined || !delivers(reply, declaration.output);',
        '}',
        '',
        '// A task run that failed or was cut short, which is no reply of its delegate: omp gives it an',
        "// error, unless that error is the reply's own shortfall (no deliverable, or one failing its",
        '// contract).',
        'function failed(r: Record<string, unknown>): boolean {',
        '  if (r.aborted === true) return true;',
        '  return r.error !== undefined && r.error !== SUBAGENT_WARNING_MISSING_YIELD && verdictOf(r) !== "invalid";',
        '}',
        '',
        "// omp's verdict on a run's structured output against its contract, where it gave one.",
        'function verdictOf(r: Record<string, unknown>): unknown {',
        '  const output = r.structuredOutput;',
        '  return typeof output === "object" && output !== null && "status" in output ? output.status : undefined;',
        '}',
        '',
        '// What the dispatching session is told of a delegate holding a gate: that it waits on the',
        "// operator's sign-off, and how the operator joins its session, by omp's own Agent Hub.",
        'function waiting(id: string, agent: string): string {',
        '  return [',
        '    `<task-result id="${id}" agent="${agent}" status="waiting on the operator">`,',
        "    `${id} (${agent}) waits on the operator's sign-off, in its own session. The operator joins it in omp's Agent Hub: Alt+A, select ${id}, Enter. Its result reaches you once the operator answers.`,",
        '    "</task-result>",',
        '  ].join("\\n");',
        '}',
        '',
        '// Text matched literally inside a pattern.',
        'function literal(text: string): string {',
        '  return text.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");',
        '}',
        '',
        "// A result as omp's task tool renders it: one envelope per run, by its id.",
        'function envelopeOf(id: string): RegExp {',
        '  return new RegExp(`<task-result id="${literal(id)}"[^>]*>[\\\\s\\\\S]*?</task-result>`);',
        '}',
        '',
        "// One job's part of omp's background delivery of several, from its header to the next.",
        'function jobOf(jobId: string): RegExp {',
        '  return new RegExp(`── Job ${literal(jobId)}(?: \\\\([^\\\\n]*\\\\))? ──\\\\n([\\\\s\\\\S]*?)(?=\\\\n── Job |\\\\n</system-notice>)`);',
        '}',
        '',
        "// A message of a session's conversation, as far as attach reads it.",
        'interface Said {',
        '  role?: string;',
        '  customType?: string;',
        '  timestamp?: number;',
        '  stopReason?: string;',
        '  toolName?: string;',
        '  isError?: boolean;',
        '  content?: string | { type: string; text?: string; name?: string }[];',
        '  details?: {',
        '    from?: unknown;',
        '    jobs?: { jobId?: unknown; type?: unknown; status?: unknown; agentId?: string; schema?: { status?: unknown } }[];',
        '    status?: unknown;',
        '    type?: unknown;',
        '    complete?: unknown;',
        '  };',
        '}',
        '',
        "// A yield omp's run monitor accepts as a run's result, which has omp hand that run to the",
        '// dispatcher itself: a submission the yield tool took (success or aborted, never a rejected one)',
        '// that is whole: not an incremental section, unless it completes the batch or aborts.',
        'function acceptedYield(m: Said): boolean {',
        '  if (m.role !== "toolResult" || m.toolName !== "yield" || m.isError === true) return false;',
        '  const { status, type, complete } = m.details ?? {};',
        '  if (status !== "success" && status !== "aborted") return false;',
        '  return !(Array.isArray(type) && type.length > 0) || complete === true || status === "aborted";',
        '}',
        '',
        "// A message's text.",
        'function textOf(m: Said): string {',
        '  return typeof m.content === "string"',
        '    ? m.content',
        '    : (m.content ?? []).flatMap((c) => (c.type === "text" ? [c.text ?? ""] : [])).join("");',
        '}',
        '',
        '// What attach keeps, shared by every session of this omp process, which runs each delegate in',
        "// its own session beside the one that dispatched it: each live session's API by its agent's",
        "// registry id, so a delegate's later turn reaches its dispatcher; the declaration each delegate",
        '// runs as, by its registry id; the delegates whose dispatched run is in flight, any other run of',
        '// theirs being one the operator (or a peer) prompted; and the verdict on each later result omp',
        '// handed a session (the agent held at a gate, or none), kept once taken, since every turn',
        '// reads it anew.',
        'const sessionsById = new Map<string, ExtensionAPI>();',
        'const declaredById = new Map<string, string>();',
        'const dispatchedRuns = new Set<string>();',
        'const verdicts = new Map<string, string | false>();',
        '',
        '// The declaration as the system prompt carries it: its front matter as one sentence of',
        '// prose, then its body.',
        'function instructions({ name, description, systemPrompt }: AgentDefinition): string {',
        '  return `You are the agent ${name}: ${description}\\n\\n${systemPrompt}`;',
        '}',
        '',
        '// The skills the declaration loads at start, found among those omp discovered for the session',
        '// (a name omp does not know is skipped, as dispatch skips it), each as omp renders it for a',
        "// dispatched child: its full instructions in omp's autoload message.",
        'async function skills({ autoloadSkills }: AgentDefinition): Promise<string[]> {',
        '  const known = getActiveSkills();',
        '  const loaded = (autoloadSkills ?? [])',
        '    .map((name) => known.find((skill) => skill.name === name))',
        '    .filter((skill) => skill !== undefined);',
        '  return Promise.all(',
        '    loaded.map(async (skill) => (await buildSkillPromptMessage(skill, { args: "" }, "autoload")).message),',
        '  );',
        '}',
        '',
        "// What the session's runtime settings layer holds at `path`, so a launch puts back exactly that.",
        'function runtimeAt(scope: Settings, path: readonly string[]): unknown {',
        '  let at: unknown = scope.overlayLayers().overrides;',
        '  for (const key of path)',
        '    at = typeof at === "object" && at !== null ? (at as Record<string, unknown>)[key] : undefined;',
        '  return at;',
        '}',
        '',
        '// Holds `value` as a session-scoped runtime override of `setting`, which omp never persists,',
        '// and returns what puts the runtime layer back as it was.',
        'function hold<T>(scope: Settings, setting: Overridable<T>, value: T): () => void {',
        '  const prior = runtimeAt(scope, setting.segments);',
        '  setting.override(scope, value);',
        '  return () => (prior === undefined ? setting.clearOverride(scope) : setting.override(scope, prior as T));',
        '}',
        '',
        "// The runtime layer's model roles with `role` as `pattern`; every other role still resolves",
        '// through whichever layer configures it.',
        'function withRole(scope: Settings, role: string, pattern: string): Record<string, string> {',
        '  const runtime = runtimeAt(scope, cfgModelRoles.segments);',
        '  return { ...(typeof runtime === "object" && runtime !== null ? (runtime as Record<string, string>) : {}), [role]: pattern };',
        '}',
        '',
        "// omp's settings listeners act a microtask after a change; past one macrotask they have acted.",
        'function settled(): Promise<void> {',
        '  const { promise, resolve } = Promise.withResolvers<void>();',
        '  setTimeout(resolve, 0);',
        '  return promise;',
        '}',
        '',
        'export default async function (pi: ExtensionAPI) {',
        '  // The acting agent is only what this module names on each call: an ambient one is dropped,',
        '  // so no shell command inherits a name.',
        '  delete process.env[ACTING_AGENT];',
        '  pi.registerFlag(AGENT_FLAG, {',
        '    description: "Start the session as the agent declaration omp discovers by this name",',
        '    type: "string",',
        '  });',
        '  let launched: Launched | undefined;',
        '  // The launch whose typed assignment no prompt has carried yet.',
        '  let awaiting: { name: string; schema: Schema } | undefined;',
        "  // Whether the launch has been told which of omp's prompt sections it runs without.",
        '  let told = false;',
        "  // Whether the launch's first turn carries the session-start note: its procedure starts",
        '  // with reconstitution and its session is new, or was compacted, rather than continuing',
        '  // a conversation.',
        '  let owed = false;',
        '  let noted = false;',
        '  // What puts back each setting the current launch holds, in the order it took them.',
        '  const undo: (() => void)[] = [];',
        '',
        '  // The agent making a call: the declaration a main session was launched as, the agent a',
        '  // dispatched session runs as; unknown otherwise.',
        '  function actor(session: Session | undefined): string | undefined {',
        '    const kind = session?.agent?.kind;',
        '    const name = kind === "sub" ? session?.agent?.name : kind === "main" ? launched?.declaration.name : undefined;',
        '    return name === "" ? undefined : name;',
        '  }',
        '',
        "  // THE ACTING AGENT ON SHELL CALLS: a `bash` call's command is led by a line naming the",
        "  // session's agent in `CRATYLUS_AGENT` (omp's bash tool takes no `env`), so what the command",
        "  // records in the journal is that agent's own (a commit records the git user, as git does); in",
        '  // a session that is no agent the line unsets it, naming no one. No call is refused (0143).',
        '  pi.on("tool_call", (event, ctx) => {',
        '    if (event.toolName !== "bash" || typeof event.input !== "object" || event.input === null) return undefined;',
        '    const input = event.input as Record<string, unknown>;',
        '    if (typeof input.command !== "string") return undefined;',
        '    const agent = actor(ctx as unknown as Session);',
        "    const named = agent === undefined ? `unset ${ACTING_AGENT}` : `export ${ACTING_AGENT}='${agent.replaceAll(\"'\", \"'\\\\''\")}'`;",
        '    input.command = `${named}\\n${input.command}`;',
        '    return undefined;',
        '  });',
        '',
        '  // A launch ends: its prompt and every setting it holds go with it.',
        '  function end(): void {',
        '    launched = undefined;',
        '    awaiting = undefined;',
        '    told = false;',
        '    owed = false;',
        '    noted = false;',
        '    for (const restore of undo.splice(0).reverse()) restore();',
        '  }',
        '',
        '  // The launch comes to owe the session-start note, when its procedure starts with reconstitution.',
        '  function owe(declaration: AgentDefinition): void {',
        '    owed = reconstitutionNote(declaration.systemPrompt) !== undefined;',
        '    noted = false;',
        '  }',
        '',
        "  // The rest of the declaration, as omp's task dispatch resolves it for a child, each held",
        "  // only where the operator's own command line says nothing of that dimension. Configuration",
        '  // files are defaults the declaration overrides, as they are for a dispatched child.',
        '  async function settle(scope: Settings, declaration: AgentDefinition, operator: Args): Promise<void> {',
        '    const keep = <T>(setting: Overridable<T>, value: T) => undo.push(hold(scope, setting, value));',
        '    // No default personality, as every dispatched child runs.',
        '    keep(cfgPersonality, "none");',
        "    // Summarised reads: on or off as declared; undeclared, the session's own setting. (omp's",
        '    // own dispatch applies only `false`; launch holds `true` as the declaration says.)',
        '    if (declaration.readSummarize !== undefined) keep(cfgReadSummarizeEnabled, declaration.readSummarize);',
        "    // The advisor: `task.agentAdvisor` first, then the declaration's `advisor`; none without",
        "    // either, as for a child. A pattern is that advisor's model, expanded against the",
        "    // session's roles; the live session starts or stops its advisor as `advisor.enabled` moves.",
        '    if (operator.advisor !== true) {',
        '      const advisor = resolveAgentAdvisorSelection({',
        '        settingsOverride: cfgTaskAgentAdvisor.get(scope)[declaration.name],',
        '        agentAdvisor: declaration.advisor,',
        '      });',
        '      if (advisor?.model !== undefined)',
        '        keep(cfgModelRoles, withRole(scope, "advisor", resolveAgentAdvisorRolePattern(advisor.model, scope)));',
        '      keep(ADVISOR_ENABLED, advisor !== undefined);',
        '    }',
        "    // Pre-planning: `task.agentPrewalk` first, then the declaration's `prewalk`. The live main",
        "    // session disarms as `prewalk.enabled` turns off and arms omp's default target (`@smol`)",
        '    // as it turns on, but only when nothing is armed; so it is turned off first, dropping a',
        '    // hand-off the configuration armed, and a declared target stands in `@smol` only while',
        '    // omp resolves the arm. Its listener runs a microtask after each change: hence `settled`.',
        '    if (operator.prewalk !== true && operator.noPrewalk !== true && operator.prewalkInto === undefined) {',
        '      const target = resolveAgentPrewalkPattern({',
        '        settingsOverride: cfgTaskAgentPrewalk.get(scope)[declaration.name],',
        '        agentPrewalk: resolveAgentPrewalkDefault(declaration, cfgTaskPrewalk.get(scope)),',
        '      });',
        '      keep(cfgPrewalkEnabled, false);',
        '      if (target !== undefined) {',
        '        await settled();',
        '        const patterns = resolveConfiguredModelPatterns(target, scope);',
        '        const standIn =',
        '          target === DEFAULT_PREWALK_TARGET',
        '            ? undefined',
        '            : hold(',
        '                scope,',
        '                cfgModelRoles,',
        '                withRole(scope, DEFAULT_PREWALK_TARGET.slice(1), patterns.length > 0 ? patterns.join(",") : target),',
        '              );',
        '        cfgPrewalkEnabled.override(scope, true);',
        '        await settled();',
        '        standIn?.();',
        '      }',
        '    }',
        '  }',
        '',
        '  // A new main session reads the declaration afresh: its model, effort, settings and status',
        '  // now, its prompt at each turn. An unknown name ends startup; later, it only ends the launch.',
        '  async function launch(ctx: Session, startup: boolean): Promise<void> {',
        '    if (ctx.agent?.kind !== "main") return;',
        '    end();',
        '    const name = pi.getFlag(AGENT_FLAG);',
        '    if (typeof name !== "string") return;',
        '    const { found, names } = await discover(name, ctx.cwd);',
        '    if (found === undefined) {',
        '      const message = `Unknown agent "${name}". Available: ${names.join(", ")}`;',
        '      if (startup) {',
        '        process.stderr.write(`${COMMAND}: ${message}\\n`);',
        '        process.exit(1);',
        '      }',
        '      ctx.ui.setStatus(AGENT_STATUS, undefined);',
        '      ctx.ui.notify(message, "error");',
        '      return;',
        '    }',
        '    const { declaration } = found;',
        "    // The session's own settings: every resolution reads them and every override lands there.",
        '    const scope = findScopedSettings() ?? settings;',
        "    // The operator's own `--model`, `--thinking`, `--advisor` and `--prewalk` family, read as",
        '    // omp reads its command line, win; the declaration applies where the operator gave none.',
        '    const operator = parseArgs(process.argv.slice(2), new Map([[AGENT_FLAG, { type: "string" }]]));',
        '    // A launch as an agent taking a typed assignment is shown it as a dispatch of it is: a',
        '    // prompt given on the command line is checked now; with none, the first prompt is.',
        '    if (found.assignment !== undefined) {',
        '      const given = (operator as { messages?: unknown }).messages;',
        '      const prompts = Array.isArray(given) ? given.filter((m): m is string => typeof m === "string") : [];',
        '      if (startup && prompts.length > 0) checkLaunch(ctx, name, found.assignment, prompts.join("\\n\\n"));',
        '      else awaiting = { name, schema: found.assignment };',
        '    }',
        '    const current = ctx.model === undefined ? undefined : `${ctx.model.provider}/${ctx.model.id}`;',
        "    // The model and effort exactly as omp's task dispatch resolves them for this declaration:",
        '    // its selectors (role aliases expanded, `task.agentModelOverrides` first), falling back to',
        "    // the session's own model; then the effort a selector's `:level` carries, else the",
        "    // declaration's `thinking-level`, else the level the resolved selector implies.",
        '    const patterns =',
        '      operator.model !== undefined',
        '        ? [operator.model]',
        '        : resolveAgentModelSelection({',
        '            settingsOverride: cfgTaskAgentModelOverrides.get(scope)[name],',
        '            agentModel: declaration.model,',
        '            settings: scope,',
        '            activeModelPattern: current,',
        '          }).patterns;',
        '    const resolved = await resolveModelOverrideWithAuthFallback(patterns, current, ctx.modelRegistry, scope);',
        '    const model = resolved.model;',
        '    if (operator.model === undefined) {',
        '      if (model === undefined) {',
        '        if (patterns.length > 0)',
        '          ctx.ui.notify(`Agent "${name}": no available model matches ${patterns.join(", ")}`, "warning");',
        '      } else if (model.provider !== ctx.model?.provider || model.id !== ctx.model?.id) {',
        '        await pi.setModel(model);',
        '      }',
        '    }',
        '    const level = resolved.explicitThinkingLevel',
        '      ? resolved.thinkingLevel',
        '      : (declaration.thinkingLevel ?? resolved.thinkingLevel);',
        '    if (operator.thinking === undefined && level !== undefined) pi.setThinkingLevel(level as Level);',
        '    await settle(scope, declaration, operator);',
        '    ctx.ui.setStatus(AGENT_STATUS, found.mark === undefined ? name : `${found.mark} ${name}`);',
        '    launched = found;',
        '    if (!conversed(ctx)) owe(declaration);',
        '  }',
        '  pi.on("session_start", async (_event, ctx) => {',
        '    const self = (ctx as unknown as Session).agent;',
        '    if (self?.id !== undefined) sessionsById.set(self.id, pi);',
        '    if (self?.kind === "sub" && self.id !== undefined && self.name !== undefined) declaredById.set(self.id, self.name);',
        '    warnReplaced(ctx as unknown as Session);',
        '    await warnSkew(ctx as unknown as Session);',
        '    return launch(ctx as unknown as Session, true);',
        '  });',
        '  pi.on("session_switch", (_event, ctx) => launch(ctx as unknown as Session, false));',
        '  // A compacted session has lost its conversation, so the launch owes the session-start note again.',
        '  pi.on("session_compact", (_event, ctx) => {',
        '    if (launched !== undefined && (ctx as unknown as Session).agent?.kind === "main") owe(launched.declaration);',
        '  });',
        "  // A launch's first prompt checked against its typed assignment: a misfit is warned of, with",
        '  // the form, and the agent starts all the same.',
        '  function checkLaunch(session: Session, name: string, schema: Schema, prompt: string): void {',
        '    awaiting = undefined;',
        '    const { problem } = checkAssignment(name, schema, assignmentIn(prompt));',
        '    if (problem !== undefined)',
        '      session.ui.notify(`${name} starts with an incomplete assignment: ${problem}\\n${formOf(name, schema)}`, "warning");',
        '  }',
        '  pi.on("input", (event, ctx) => {',
        '    const session = ctx as unknown as Session;',
        '    if (awaiting !== undefined && session.agent?.kind === "main")',
        '      checkLaunch(session, awaiting.name, awaiting.schema, String(event.text ?? ""));',
        '    return undefined;',
        '  });',
        "  // Every turn's prompt is omp's own, kept where it describes the harness and without what",
        '  // prescribes an identity, a stance or a procedure, then the declaration and the full',
        '  // instructions of the skills it loads at start, so the declaration is the only source of',
        '  // who the agent is and how it works, and a rebuilt base prompt drops neither. A launch',
        '  // whose first prompt came by a route with no `input` event has it checked here. In every',
        '  // session, launched or not, main or dispatched, the turn also carries the assignment form',
        '  // of each agent that takes a typed one; the first turn of a launch whose procedure starts',
        '  // with reconstitution carries a note saying so; and every turn of a launch whose decision',
        '  // rights hold meaning, or that keeps the records as its source of truth under honesty,',
        '  // carries a note of each.',
        '  pi.on("before_agent_start", async (event, ctx) => {',
        '    const now = launched;',
        '    const session = ctx as unknown as Session;',
        '    const forms = await dispatchForms(session);',
        '    if (now === undefined || session.agent?.kind !== "main")',
        '      return forms === undefined ? undefined : { systemPrompt: [...event.systemPrompt, forms] };',
        '    if (awaiting !== undefined) checkLaunch(session, awaiting.name, awaiting.schema, String(event.prompt ?? ""));',
        '    const removed: string[] = [];',
        '    const base = event.systemPrompt.map((part: string) => {',
        '      const kept = harnessOnly(part);',
        '      removed.push(...kept.removed.filter((title) => !removed.includes(title)));',
        '      return kept.text;',
        '    });',
        '    if (removed.length > 0 && !told) {',
        '      told = true;',
        '      session.ui.notify(`Launched as ${now.declaration.name}: omp prompt sections removed: ${removed.join(", ")}`, "info");',
        '    }',
        '    // The first turn of a launch that owes the session-start note alone: a turn-scoped note,',
        '    // gone from every later turn.',
        '    const start = owed && !noted ? reconstitutionNote(now.declaration.systemPrompt) : undefined;',
        '    noted = true;',
        '    const meaning = meaningNote(now.declaration.systemPrompt);',
        '    const records = recordsNote(now.declaration.systemPrompt);',
        '    return {',
        '      systemPrompt: [',
        '        ...base,',
        '        instructions(now.declaration),',
        '        ...(await skills(now.declaration)),',
        '        ...(forms === undefined ? [] : [forms]),',
        '        ...(start === undefined ? [] : [start]),',
        '        ...(meaning === undefined ? [] : [meaning]),',
        '        ...(records === undefined ? [] : [records]),',
        '      ],',
        '    };',
        '  });',
        '',
        '  // The assignment form of each agent that takes a typed one. None: no section.',
        '  async function dispatchForms(session: Session): Promise<string | undefined> {',
        '    const agents: AgentDefinition[] = (await discoverAgents(session.cwd)).agents;',
        '    const forms = agents.flatMap((a) => {',
        '      const schema = schemaOf(frontmatterOf(a));',
        '      return schema === undefined ? [] : [formOf(a.name, schema)];',
        '    });',
        '    return forms.length === 0',
        '      ? undefined',
        '      : ["# Assignment forms", "", "Give a dispatch of these agents its assignment in its task text so:", "", ...forms].join("\\n");',
        '  }',
        '',
        '  // An agent run the harness sees, sent to the ledger of the repository holding `cwd` as',
        "  // the dispatching agent (`actor`); what is recorded of it is the runtime's. A failed send is",
        '  // warned of, and nothing more.',
        '  async function record(event: Record<string, unknown>, at: { cwd: string; actor?: string }, ctx?: Session): Promise<void> {',
        '    try {',
        '      await run(["lifecycle", JSON.stringify(event)], at.cwd, undefined, at.actor);',
        '    } catch (error) {',
        '      ctx?.ui.notify(`${COMMAND} lifecycle: ${messageOf(error)}`, "warning");',
        '    }',
        '  }',
        "  // Each item dispatched and not yet returned, by its task call and position: the harness's",
        '  // ids its return is recorded by, and the agent that dispatched it.',
        '  interface Dispatch {',
        '    call: string;',
        '    agent: string;',
        '    cwd: string;',
        '    actor?: string;',
        '  }',
        '  const dispatches = new Map<string, Dispatch>();',
        '  // The return of the item dispatched under `key`, with its tokens when the harness reports',
        '  // them, recorded once: a return delivered again finds no dispatch.',
        '  async function returned(key: string, tokens: unknown, ctx?: Session): Promise<void> {',
        '    const at = dispatches.get(key);',
        '    if (at === undefined) return;',
        '    dispatches.delete(key);',
        '    const counted = typeof tokens === "number" && Number.isInteger(tokens) && tokens >= 0;',
        '    await record({ kind: "returned", call: at.call, agent: at.agent, ...(counted ? { tokens } : {}) }, at, ctx);',
        '  }',
        '',
        "  // A dispatch from `eval` code (the prelude's `agent(…)` or `workpool(…)`, or the task tool called",
        '  // through `tool`) never reaches the `task` call where its assignment is shown and checked and',
        '  // its lifecycle captured. So a session launched as an agent, or a delegate whose declaration',
        "  // carries a typed assignment, is warned so; the call goes ahead. A plain session and omp's own",
        '  // delegates are told nothing.',
        '  pi.on("tool_call", async (event, ctx) => {',
        '    if (event.toolName !== "eval") return undefined;',
        '    const input: unknown = event.input;',
        '    const code = input !== null && typeof input === "object" && "code" in input ? input.code : undefined;',
        '    if (typeof code !== "string" || !EVAL_DISPATCH.test(code)) return undefined;',
        '    const session = ctx as unknown as Session;',
        '    const agent = session.agent;',
        '    if (agent?.kind === "main" && launched === undefined) return undefined;',
        '    if (agent?.kind === "sub") {',
        '      const declaration = (await discoverAgents(session.cwd)).agents.find((a) => a.name === agent.name);',
        '      if (schemaOf(frontmatterOf(declaration)) === undefined) return undefined;',
        '    } else if (agent?.kind !== "main") return undefined;',
        '    session.ui.notify(EVAL_DISPATCH_WARNING, "warning");',
        '    return undefined;',
        '  });',
        '',
        "  // EVERY dispatch, in any session: each item's assignment checked against its agent's",
        '  // contract, each misfit warned of, and each item naming a story or a task recorded with',
        '  // them; the dispatch goes ahead.',
        '  pi.on("tool_call", async (event, ctx) => {',
        '    const input = (event.input ?? {}) as Record<string, unknown>;',
        '    if (!isDispatch(input)) return undefined;',
        '    const session = ctx as unknown as Session;',
        '    const agents: AgentDefinition[] = (await discoverAgents(session.cwd)).agents;',
        '    const handoffs = itemsOf(input);',
        '    const problems: string[] = [];',
        '    for (const h of handoffs) {',
        '      const value = assignmentOf(h.item, input);',
        '      if (typeof value === "object" && value !== null && !Array.isArray(value))',
        '        h.assignment = value as Record<string, unknown>;',
        '      const schema = schemaOf(frontmatterOf(agents.find((a) => a.name === h.agent)));',
        '      if (schema === undefined) continue;',
        '      const { problem } = checkAssignment(h.agent, schema, value);',
        '      if (problem !== undefined) problems.push(`${problem}\\n${formOf(h.agent, schema)}`);',
        '    }',
        '    if (problems.length > 0) session.ui.notify(`dispatch warning, going ahead: ${problems.join("\\n")}`, "warning");',
        '    for (const h of handoffs) {',
        '      const names = Object.fromEntries(',
        '        ["story", "task"].flatMap((field) => {',
        '          const value = h.assignment?.[field];',
        '          return typeof value === "string" && value.trim() !== "" ? [[field, value]] : [];',
        '        }),',
        '      );',
        '      // An item naming neither is no work of a story or task: nothing is sent, now or on return.',
        '      if (Object.keys(names).length === 0) continue;',
        '      const at: Dispatch = { call: event.toolCallId, agent: h.id, cwd: session.cwd, actor: actor(session) };',
        '      dispatches.set(`${event.toolCallId}#${h.index}`, at);',
        '      await record({ kind: "dispatched", call: at.call, agent: at.agent, role: h.agent, ...names }, at, session);',
        '    }',
        '    return undefined;',
        '  });',
        '',
        '  // A settled dispatch returns each item it ran, with its tokens. The call is known by its',
        '  // id, whatever the tool carrying it is called.',
        '  //',
        '  // ATTACH, on the task result: a delegate holding a gate is given there only as the waiting',
        "  // notice, in the content and in the details alike; every other result, and the call's error",
        '  // state, pass as omp gave them.',
        '  pi.on("tool_result", async (event, ctx) => {',
        '    const session = ctx as unknown as Session;',
        '    const given = event as { details?: { results?: unknown; progress?: unknown }; content?: unknown };',
        '    const results = (Array.isArray(given.details?.results) ? given.details.results : []).map(',
        '      (raw) => (raw ?? {}) as Record<string, unknown>,',
        '    );',
        '    for (const r of results) await returned(`${event.toolCallId}#${String(r.index)}`, r.tokens, session);',
        '    const replied = results.filter((r) => !failed(r) && verdictOf(r) !== "valid");',
        '    if (replied.length === 0) return undefined;',
        '    const agents: AgentDefinition[] = (await discoverAgents(session.cwd)).agents;',
        '    const held = replied.filter((r) => {',
        '      const declaration = agents.find((a) => a.name === r.agent);',
        '      return gated(declaration) && holds(declaration, String(r.output ?? ""));',
        '    });',
        '    if (held.length === 0) return undefined;',
        '    const ids = held.map((r) => String(r.id));',
        '    const parts = (Array.isArray(given.content) ? given.content : []) as { type: string; text?: string }[];',
        '    let content = parts.map((part) => ({ ...part }));',
        '    for (const r of held) {',
        '      const notice = waiting(String(r.id), String(r.agent));',
        '      const part = content.find((p) => p.type === "text" && envelopeOf(String(r.id)).test(p.text ?? ""));',
        '      if (part !== undefined) part.text = (part.text ?? "").replace(envelopeOf(String(r.id)), () => notice);',
        '      else {',
        '        // Its envelope is not where omp renders it: nothing rendered is kept, so its reply cannot',
        '        // pass; each other result is given as its own output.',
        '        content = results.map((o) => ({',
        '          type: "text",',
        '          text: ids.includes(String(o.id))',
        '            ? waiting(String(o.id), String(o.agent))',
        '            : `<task-result id="${String(o.id)}" agent="${String(o.agent)}">\\n${String(o.output ?? o.error ?? "")}\\n</task-result>`,',
        '        }));',
        '        break;',
        '      }',
        '    }',
        '    const progress = Array.isArray(given.details?.progress) ? given.details.progress : undefined;',
        '    const details = {',
        '      ...given.details,',
        '      results: results.map((r) => {',
        '        if (!ids.includes(String(r.id))) return r;',
        '        const { structuredOutput: _data, extractedToolData: _yielded, stderr: _stderr, error: _error, ...kept } = r;',
        '        return { ...kept, output: waiting(String(r.id), String(r.agent)) };',
        '      }),',
        '      ...(progress === undefined',
        '        ? {}',
        '        : {',
        '            progress: progress.map((p: Record<string, unknown>) =>',
        '              ids.includes(String(p.id)) ? { ...p, recentOutput: [] } : p,',
        '            ),',
        '          }),',
        '    };',
        '    return { content, details };',
        '  });',
        "  // A background item settles outside its call: omp's own lifecycle event says so. It says too",
        "  // when a delegate's dispatched run (the one a blocking dispatch waits on) starts and ends.",
        '  const bus = (pi as unknown as { events?: { on?(channel: string, fn: (data: unknown) => void): unknown } }).events;',
        '  bus?.on?.("task:subagent:lifecycle", (data) => {',
        '    const e = (data ?? {}) as Record<string, unknown>;',
        '    const id = typeof e.id === "string" ? e.id : undefined;',
        '    if (e.status === "started" && e.detached !== true && id !== undefined) dispatchedRuns.add(id);',
        '    if (!["completed", "failed", "aborted"].includes(String(e.status))) return;',
        '    if (e.detached !== true && id !== undefined) dispatchedRuns.delete(id);',
        '    if (e.detached === true) void returned(`${String(e.parentToolCallId)}#${String(e.index)}`, e.tokens);',
        '  });',
        '',
        "  // ATTACH, in a delegate's session: each run it starts outside its dispatched run is one the",
        '  // operator prompted after joining it (or a peer woke), and holds the messages it adds, so what it',
        '  // said is read from that run alone, never from earlier ones.',
        '  let ongoing: { later: boolean; messages: Said[] } | undefined;',
        '  pi.on("agent_start", (_event, ctx) => {',
        '    const self = (ctx as unknown as Session).agent;',
        '    ongoing = { later: self?.kind === "sub" && self.id !== undefined && !dispatchedRuns.has(self.id), messages: [] };',
        '  });',
        '  pi.on("message_end", (event) => {',
        '    ongoing?.messages.push((event as { message: Said }).message);',
        '  });',
        "  // As such a run ends, the delegate's own verdict on it is taken, on what it said in that run.",
        '  // omp hands the dispatching session that run only where its monitor accepts a yield as its',
        "  // result or the run answers the dispatcher's own message; otherwise the extension does: the",
        '  // waiting notice for another gate, else its reply. A yield the tool rejected, or an incremental',
        '  // section, is no such result.',
        '  pi.on("agent_end", async (event, ctx) => {',
        '    const current = ongoing;',
        '    const session = ctx as unknown as Session;',
        '    const self = session.agent;',
        '    if (current?.later !== true || self?.id === undefined || (event as { willContinue?: boolean }).willContinue === true) return;',
        '    const replies = current.messages.filter((m) => m.role === "assistant");',
        '    const last = replies.at(-1);',
        '    if (last === undefined || last.stopReason === "error" || last.stopReason === "aborted") return;',
        '    if (current.messages.some(acceptedYield)) return;',
        '    if (current.messages.some((m) => m.role === "custom" && m.details?.from === self.parentId)) return;',
        '    const declaration = (await discoverAgents(session.cwd)).agents.find((a) => a.name === self.name);',
        '    if (!gated(declaration)) return;',
        '    const reply = textOf(last);',
        '    const held = holds(declaration, reply);',
        '    const dispatcher = self.parentId === undefined ? undefined : sessionsById.get(self.parentId);',
        '    dispatcher?.sendMessage(',
        '      {',
        '        customType: ATTACH,',
        '        content: held',
        '          ? waiting(self.id, declaration.name)',
        '          : `<task-result id="${self.id}" agent="${declaration.name}" status="completed">\\n<output>\\n${reply}\\n</output>\\n</task-result>`,',
        '        display: true,',
        '        details: { id: self.id, held },',
        '      },',
        '      { triggerTurn: true, deliverAs: "followUp" },',
        '    );',
        '  });',
        '',
        '  // ATTACH, on a later result omp hands over itself (a run that yields, or answers the',
        "  // dispatcher's own message): it reaches the dispatching session as a background delivery",
        '  // outside any task result, so each turn of that session is given it with a held job as the',
        "  // waiting notice. The verdict is the delegate's own on that run, taken from the delivery itself",
        "  // (omp's verdict on a structured result, else the reply it carries) with the declaration the",
        '  // delegate runs as, so it is bound to that result alone; it is taken once and kept, a held one',
        "  // in the session's own record too.",
        '  pi.on("context", async (event, ctx) => {',
        '    const session = ctx as unknown as Session;',
        '    const messages = (event as { messages: Said[] }).messages;',
        '    let agents: AgentDefinition[] | undefined;',
        '    let recorded: Map<string, string> | undefined;',
        '    let changed = false;',
        '    const given: Said[] = [];',
        '    for (const m of messages) {',
        '      const jobs = m.role === "custom" && m.customType === "async-result" ? (m.details?.jobs ?? []) : [];',
        '      const text = textOf(m);',
        '      const held: { jobId: string; id: string; agent: string }[] = [];',
        '      for (const job of jobs) {',
        '        const id = job.agentId;',
        '        if (job.type !== "task" || id === undefined) continue;',
        '        const key = `${id}@${String(m.timestamp)}`;',
        '        let verdict = verdicts.get(key);',
        '        if (verdict === undefined) {',
        '          recorded ??= new Map(',
        '            (session.sessionManager?.getEntries?.() ?? []).flatMap((e) =>',
        '              e.type === "custom" && e.customType === HELD && typeof e.data?.key === "string"',
        '                ? [[e.data.key, String(e.data.agent ?? "")] as const]',
        '                : [],',
        '            ),',
        '          );',
        '          const name = recorded.get(key) ?? declaredById.get(id) ?? "";',
        '          agents ??= (await discoverAgents(session.cwd)).agents;',
        '          const declaration = agents.find((a) => a.name === name);',
        '          const reply =',
        '            jobs.length === 1',
        '              ? (/^<system-notice>\\n[^\\n]*\\n([\\s\\S]*)\\n<\\/system-notice>$/.exec(text)?.[1] ?? text)',
        '              : (jobOf(String(job.jobId)).exec(text)?.[1] ?? text);',
        '          const holding =',
        '            recorded.has(key) ||',
        '            (gated(declaration) &&',
        '              (job.schema !== undefined',
        '                ? declaration.output === undefined || job.schema.status === "invalid"',
        '                : job.status === "completed" && holds(declaration, reply)));',
        '          verdict = holding ? name : false;',
        '          verdicts.set(key, verdict);',
        '          if (holding && !recorded.has(key)) pi.appendEntry(HELD, { key, agent: name });',
        '        }',
        '        if (verdict !== false) held.push({ jobId: String(job.jobId), id, agent: verdict });',
        '      }',
        '      if (held.length === 0) {',
        '        given.push(m);',
        '        continue;',
        '      }',
        '      changed = true;',
        '      const notices = `<system-notice>\\n${held.map((h) => waiting(h.id, h.agent)).join("\\n\\n")}\\n</system-notice>`;',
        '      let rewritten = jobs.length === 1 ? notices : text;',
        '      for (const h of jobs.length === 1 ? [] : held) {',
        '        if (!jobOf(h.jobId).test(rewritten)) {',
        '          // Not where omp renders a job: nothing of the message is kept, so no reply can pass.',
        '          rewritten = notices;',
        '          break;',
        '        }',
        '        rewritten = rewritten.replace(jobOf(h.jobId), () => `── Job ${h.jobId} ──\\n${waiting(h.id, h.agent)}`);',
        '      }',
        '      given.push({ ...m, content: rewritten });',
        '    }',
        '    return changed ? { messages: given } : undefined;',
        '  });',
        '  pi.on("session_shutdown", (_event, ctx) => {',
        '    const id = (ctx as unknown as Session).agent?.id;',
        '    if (id !== undefined && sessionsById.get(id) === pi) sessionsById.delete(id);',
        '  });',
        '',
        '  // Each capability as its installed command explains it, asked once, at load, and offered',
        '  // as one tool with every verb it explains, to every agent. One the command cannot explain',
        '  // is not offered and is said at session start: a skew never fails the load.',
        '  for (const capability of CAPABILITIES) {',
        '    let explanation: Explanation;',
        '    if (capability === SKEW) explanation = SKEW_EXPLAINED;',
        '    else',
        '      try {',
        '        explanation = JSON.parse(await run([capability, "--explain"]));',
        '        if (!Array.isArray(explanation.verbs)) throw new Error("it explains no verbs");',
        '      } catch (error) {',
        '        lacking.set(capability, (error as Error).message.split("\\n")[0] ?? "");',
        '        continue;',
        '      }',
        '    const verbs = new Map(explanation.verbs.map((v) => [v.name, v]));',
        '    // A capability explaining one verb alone takes no `verb`: it is that one.',
        '    const sole = explanation.verbs.length === 1 ? explanation.verbs[0] : undefined;',
        '    const verbOf = (args: Record<string, unknown>): Verb | undefined => sole ?? verbs.get(String(args.verb));',
        '    const tool = explanation.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");',
        '    pi.registerTool({',
        '      name: tool,',
        '      label: explanation.name,',
        '      description: description(explanation),',
        '      loadMode: ESSENTIAL.includes(capability) ? ("essential" as const) : ("discoverable" as const),',
        '      parameters: pi.typebox.Type.Unsafe(parameters(explanation)),',
        '      approval: (args: Record<string, unknown>) => (verbOf(args)?.effect === "reads" ? "read" : "write"),',
        '      async execute(_id: string, args: Record<string, unknown>, signal: AbortSignal | undefined, _update: unknown, ctx: Session) {',
        '        // The version tool reports what each side holds of itself: the version this installation',
        '        // records, and the one the reached command answers now.',
        '        if (capability === SKEW)',
        '          return { content: [{ type: "text" as const, text: JSON.stringify({ artifacts: projected(), command: await reached() }, null, 2) }] };',
        "        // A refusal is a tool error carrying the command's own message.",
        '        try {',
        '          const text = await run(argv(capability, verbOf(args), args), ctx.cwd, signal, actor(ctx));',
        '          return { content: [{ type: "text" as const, text }] };',
        '        } catch (error) {',
        '          return { content: [{ type: "text" as const, text: messageOf(error) }], isError: true };',
        '        }',
        '      },',
        '    });',
        '  }',
        '}',
        '',
      ].join('\n'),
    },
  ];
}

// ── HarnessAdapter port ──────────────────────────────────────────────────────

/**
 * The omp realization of the `HarnessAdapter` port.
 *
 * No `hooks()`: that op returns a JSON settings fragment for a harness that keeps
 * hook config in a file, and omp keeps none. The cells no agent composes go through
 * code instead — `scopeActivatedSurface`, a `.ts` module at the session scope.
 *
 * No `enforcingSurface`: omp loads no module for one agent alone, so a constraint
 * composed into named agents cannot be narrowed to them (`scopes` is false), and
 * projection reports it as a hook omp cannot scope per agent.
 */
export const ompHarnessAdapter: HarnessAdapter = {
  name: 'omp',
  substrate: 'harness',
  home: '.omp',
  agentExt: '.md',
  // OMP loads this generated session hook module.
  hooksFile: `extensions/${OMP_SESSION_MODULE}`,
  // `autoloadSkills` names skills omp preloads into the agent it defines.
  preloadsSkills: true,
  // omp's agent definition reader takes no field that isolates an agent: its task
  // isolation is a flag of each dispatch, so nothing here starts one agent in a
  // worktree of its own off a line. Projection warns; `dispatchIsolation` is what
  // the agent gets instead.
  startsInWorktree: false,
  // The model roles: a definition names the role named for its agent, then the tier
  // and effort it holds; the host binds roles and tiers, install only as answered.
  roleRouting: ompRoleRouting,
  // The owned root is linked into omp's plugin directory, as `omp plugin link` does.
  packageDir: OMP_PACKAGE_DIR,
  // The isolated task a declared worktree becomes, and the settings it holds.
  dispatchIsolation: ompDispatchIsolation,
  statusSegment: ompStatusSegment,
  agentRel: ompAgentRel,
  nativeEvents: canonicalToOmp,
  realizes: (event) => ompBindingOf(event) !== undefined,
  // NOTHING IS SCOPABLE: omp loads extension modules for every session, and no
  // agent declaration names one of its own, so no event can be narrowed to one
  // agent. A hook an agent composes is reported, never widened to every session.
  scopes: () => false,
  // `$HOME` and not a resolved path: the emitted module is read at RUN time on
  // whatever host it lands on, so it must not bake in the projecting machine's home.
  hookCommand: (anchor, workerFilename) =>
    `sh "$HOME/.${CLI_BIN}/omp/hooks/${anchor}/${workerFilename}"`,
  agentDef: (a, ctx) => ({
    filename: `${a.name}.md`,
    content: agentToOmpMd(a, ctx),
  }),
  skillDef: (s) => ({ filename: 'SKILL.md', content: skillToOmpMd(s) }),
  skillRel: ompSkillRel,
  // The session module: the cells no agent composes.
  scopeActivatedSurface: (hooks) => ompScopeActivatedExtensions(hooks),
  // The dispatch isolation module: what this harness composes from the agents
  // beyond their definitions. Starting a session as one goes through `omp --agent`,
  // which the capability module below registers, so nothing here launches anything.
  launchSurface: (agents) => ompIsolationExtensions(agents),
  // The capabilities a plain session is offered as tools, each composed at load
  // from the installed command's own explanation, and `--agent`.
  capabilitySurface: ompCapabilityExtensions,
  // Every scoped artifact is an extension module at the SESSION scope, which reads as
  // itself OR as omission, so a caller may pass a projection's `scope` field straight
  // through: it lands in `extensions/`, which the owned root's package names. Nothing is
  // placed per agent, so an agent's scope is refused rather than widened.
  scopedRel: (filename, agent) => {
    if (agent !== undefined && agent !== SESSION_SCOPE) {
      throw new Error(
        `omp places nothing for one agent alone, but '${filename}' is staged for '${agent}'; project the tree again`,
      );
    }
    return `${OMP_EXTENSIONS_DIR}/${filename}`;
  },
};
