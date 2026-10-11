// The OMP (Oh My Pi) projection of the agent anatomy — the only one of the two harnesses
// whose persona is a NATIVE artifact of the harness rather than a
// launch-time argument.
//
// THE AGENT DEFINITION IS THE SINGLE SOURCE OF TRUTH. omp discovers USER-level
// task agents from `~/.omp/agent/agents/*.md` (`omp://task-agent-discovery.md`):
// YAML front-matter carrying a required `name` and `description`, and a BODY
// that IS the system prompt. That one file is this adapter's whole projection of
// an agent, and BOTH ways of reaching it read it through omp's own discovery —
// dispatched as a subagent, omp runs it itself; started as a MAIN session by
// `omp --agent <name>`, the cratylus extension ({@link ompCapabilityExtensions})
// resolves the same declaration and carries it into the session (decision 0047).
// One declaration, nothing outside the harness wrapping it, nothing to drift.
//
// IDENTITY IS NOT THE PROFILE. omp's own `--profile <name>` silos AUTH, MCP,
// MODELS, SESSIONS and `agent.db` — an ENVIRONMENT, and a property of the HOST
// an operator is running on, not of the agent this module composes. A profile
// and an agent are ORTHOGONAL facts about one session; an operator who wants both
// passes both flags, and forge asserts neither for them.
//
// omp's native surfaces, read off `@oh-my-pi/pi-coding-agent`'s own source and,
// where noted, re-measured against an installed `omp` binary:
//
//   - an AGENT is `agent/agents/<name>.md` under `~/.omp` — the USER-level
//     task-agent root, merged first-wins by exact name with a project
//     `.omp/agents` (which wins) and the bundled defs (which lose).
//   - a SKILL is `skills/<name>/SKILL.md` under `~/.agents` (the AgentSkills
//     spec, shared with claude) — omp's vendor-neutral `.agent[s]`
//     provider reads that root NATIVELY, at priority 70, no flag and no
//     profile (confirmed in the installed package's resource loader:
//     `join(getHomeDir(), ".agents", "skills")` is scanned unconditionally,
//     the same call for every launch).
//   - ENFORCEMENT is a TypeScript module omp's extension loader binds either by
//     SCANNING a directory (`discoverExtensionPaths`, a native config root) or
//     by an explicit `--config … extensions:` entry naming a file OR a
//     directory (`collectFilesFromPaths`/`collectAutoExtensionEntries` in the
//     installed package sweep a directory entry exactly like a native root's
//     auto-discovery — verified empirically: a directory named in `extensions:`
//     loaded every loose `.ts` file inside it). No hook CONFIG exists at all:
//     the directory, or the overlay entry naming it, IS the declaration.
//
// NOTHING IS SCOPED PER AGENT. omp loads extension modules from directories it scans
// for every session (`agent/extensions/` under `~/.omp`), and nothing in an agent
// declaration names a module of its own. So every module this adapter emits is
// SESSION-WIDE, and nothing lands under `agent/personas/`: the per-agent modules that
// once did were reached by no session. A worker hook composed into named agents is
// therefore one omp cannot scope (`scopes` is false), and projection reports it as
// such rather than widen it to every session. A GUARD cell is the exception by
// construction: it judges inside the session module, and only in a main session
// launched (`--agent`) as an agent whose composition holds the guarded value.
//
// WHAT AN AGENT'S REACH, HANDOFF AND MODEL BECOME are omp's own declaration
// settings: the handoffs as `spawns`, the deliverable as `output`, and the model as
// a model role named for the agent, which install binds to the tier and effort it
// holds. Every agent keeps omp's default tools.
//
// The composed Target BODY is HARNESS-NEUTRAL — the agent's dimension sections,
// identical whichever harness carries them. So this module REUSES `agentBody` /
// `skillBody` from core and adds only the omp-specific FRAMING.

// The bin's ONE authored home. This artifact is named after the TOOL that emits
// it, so a rename must carry it — the same reason a cell carries `{{fact:runtime-bin}}`
// rather than the literal. `forge → runtime` is a permitted edge (ARCHITECTURE's
// north star); spelling the name here instead would be a second home for it, which
// `bin-name-single-home` catches and rightly refused.
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import type { Capability } from '@cratylus/runtime/capability';
import { type Agent, assignmentIn, checkAssignment } from '@cratylus/schema';
import type { Hook } from '@cratylus/schema/hook';
import { type ResolvedSkill, agentBody, skillBody } from '../../core/body.js';
import {
  type AgentDefContext,
  type ComposedGuard,
  type DispatchIsolation,
  type HarnessAdapter,
  type HarnessProjection,
  NEUTRAL_AGENT_ROOT,
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

/**
 * The SESSION root — omp's native USER config dir, relative to the harness
 * home, and the root EVERY artifact this adapter deploys is carried from.
 *
 * omp's native user config is `~/.omp/agent` (`getAgentDir()`,
 * `discovery/builtin.ts`) when no `--profile` names another. Two things hang
 * off it: the task-agent definitions omp discovers ({@link OMP_AGENT_DEF_DIR}),
 * and the SESSION-scoped modules — the copies every session reads automatically
 * because they sit on omp's own scan path (`extensions/`).
 */
export const OMP_SESSION_DIR = 'agent';

/**
 * omp's USER-level task-agent discovery dir, relative to {@link
 * OMP_SESSION_DIR} — `~/.omp/agent/agents/`.
 */
export const OMP_AGENT_DEF_DIR = 'agents';

/** Where agent `<name>`'s definition lands, relative to the harness home
 *  (`.omp`) — omp's OWN user-level task-agent root, read NATIVELY on every
 *  discovery pass.
 *
 *  `<name>.md` and not `<name>/APPEND_SYSTEM.md`, which is where this used to
 *  land. That filename was omp's vocabulary for what `--append-system-prompt`
 *  reads, and it made the persona a LAUNCH ARGUMENT — invisible to omp's own
 *  agent discovery, so a composed agent could be started as a session and could
 *  not be DISPATCHED as a subagent by the same name. One artifact answers both
 *  now: dispatch and `omp --agent <name>` resolve it through the same discovery. */
export function ompAgentRel(name: string): string {
  return `${OMP_SESSION_DIR}/${OMP_AGENT_DEF_DIR}/${name}.md`;
}

/**
 * Where skill `<name>` lands, relative to the harness home — ONE path, at the
 * harness-neutral root omp reads NATIVELY on every launch.
 *
 * `agents` goes UNUSED: the fan-out this signature still carries
 * existed here only because a persona WAS a profile, and a profile's
 * native config root is isolated from every other — so a skill reachable from
 * every persona needed N+1 copies. It no longer is: omp reads `~/.agents/skills`
 * NATIVELY, at provider priority 70, for every launch — personaed, bare, or
 * profiled — so one copy now serves every reader and the fan-out bought
 * nothing once the persona stopped being a profile.
 */
export function ompSkillRel(
  name: string,
  _agents: readonly string[],
): readonly string[] {
  return [`../${NEUTRAL_AGENT_ROOT}/skills/${name}`];
}

/** The emitted SCOPE-ACTIVATED module's filename: the session-wide hooks of the cells
 *  no agent composes. */
export const OMP_SESSION_MODULE = `${CLI_BIN}-session.ts`;

/** The emitted DISPATCH ISOLATION module's filename. A second file, since it retires
 *  with the agents that declare a worktree of their own and with nothing else. */
export const OMP_ISOLATION_MODULE = `${CLI_BIN}-isolation.ts`;

/** The capabilities omp is offered as tools: those that explain themselves
 *  (`<bin> <capability> --explain`), the concept journal and the work package
 *  capability. */
export const OMP_CAPABILITY_TOOLS: readonly Capability[] = [
  'concepts',
  'workPackage',
];

/** The emitted CRATYLUS module's filename: the one omp extension that is
 *  cratylus's own, named for the bin, which offers every capability that explains
 *  itself as a tool and launches a session as an agent declaration. */
export const OMP_CRATYLUS_MODULE = `${CLI_BIN}.ts`;

/** The omp flag the CRATYLUS module registers: `omp --agent <name>` starts the
 *  main session as the agent declaration omp discovers by that name (decision
 *  0047). */
const OMP_AGENT_FLAG = 'agent';

/** The status-line slot the CRATYLUS module shows a launched agent's mark and
 *  name in, named from the bin so a rename carries it. */
const OMP_AGENT_STATUS_KEY = `${CLI_BIN}-agent`;

// ── Model roles: the role each agent's `model` names ─────────────────────────

/** The host config files omp reads its settings from — the ONE spelling, shared by
 *  every fact the host keeps there. `agent/config.yml`, or `agent/config.yaml` when
 *  config.yml is absent: omp reads the first that exists and never merges the two. */
const OMP_CONFIG_RELS = ['agent/config.yml', 'agent/config.yaml'] as const;

/** The host's own model role each seedable tier takes its model from. */
const OMP_TIER_SOURCES: Readonly<Record<string, string>> = {
  frontier: 'default',
  fast: 'smol',
};

/** The tier seeded with a model of another family than the frontier's. */
const OMP_OTHER_FAMILY_TIER = 'frontier-other-family';

/** A thinking level at the end of a model selector (`provider/model:high`). */
const OMP_THINKING_LEVEL = /:(?:off|minimal|low|medium|high|xhigh|max)$/;

/** The provider of a model selector, the text before its first `/`; none for an
 *  alias or a bare name. */
function providerOf(selector: string): string | undefined {
  const slash = selector.indexOf('/');
  return slash > 0 && !selector.startsWith('@')
    ? selector.slice(0, slash)
    : undefined;
}

/** The value a tier's role is seeded with from the host's `modelRoles` entries, in
 *  file order: `frontier` the host's `default`, `fast` its `smol`, and
 *  `frontier-other-family` the first entry whose provider differs from the
 *  frontier's — each with its thinking level dropped. `undefined`: it cannot be. */
function ompTierSeed(
  tier: string,
  host: readonly (readonly [role: string, value: string])[],
): string | undefined {
  const hostValue = (role: string): string | undefined =>
    host.find(([r]) => r === role)?.[1];
  const model = (selector: string | undefined): string | undefined =>
    selector?.replace(OMP_THINKING_LEVEL, '');
  if (tier === OMP_OTHER_FAMILY_TIER) {
    const frontier = hostValue('frontier') ?? ompTierSeed('frontier', host);
    const family = frontier === undefined ? undefined : providerOf(frontier);
    if (family === undefined) return undefined;
    return model(
      host.find(([, v]) => {
        const provider = providerOf(v);
        return provider !== undefined && provider !== family;
      })?.[1],
    );
  }
  const source = OMP_TIER_SOURCES[tier];
  return source === undefined ? undefined : model(hostValue(source));
}

/** omp's model roles, as {@link HarnessAdapter.roleRouting} exposes them. A
 *  declaration's `model` names the role named for its agent; the host's `modelRoles`
 *  binds that role to `@<tier>:<effort>`, and each tier's role to a model. */
export const ompRoleRouting: RoleRouting = {
  configRels: OMP_CONFIG_RELS,
  agentRole: ({ tier, effort }) => `@${tier}:${effort}`,
  seedTier: ompTierSeed,
};

// ── Dispatch isolation: the copy an isolated task runs in ────────────────────

/** omp's task isolation, as {@link HarnessAdapter.dispatchIsolation} exposes it.
 *  Measured on omp 18.4.9. A task tool call takes `isolated` only while the host
 *  setting `task.isolation.enabled` is true, and runs that task in a copy of the
 *  checkout it was dispatched from. What the copy built is applied back into the
 *  dispatcher's checkout unless `task.isolation.apply` is false, and kept as a branch
 *  `omp/task/<id>` in the dispatcher's repository, the agent's own commits, when
 *  `task.isolation.merge` is `branch` — `patch` keeps only a diff. The copy is cut
 *  from the dispatcher's checkout as it stands (its HEAD, its uncommitted work): the
 *  task tool takes no ref to cut it from. */
export const ompDispatchIsolation: DispatchIsolation = {
  configRels: OMP_CONFIG_RELS,
  settings: {
    parent: ['task', 'isolation'],
    entries: { enabled: 'true', apply: 'false', merge: 'branch' },
  },
  lacks:
    "cut from the dispatcher's HEAD and not from the plan's line, so the land gate refuses the work until it is moved onto the line",
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

// ── Reach: what an agent may dispatch and use ───────────────────────────────

/** The handoffs omp supplies an agent for natively, by the handoff's anchor: the
 *  read-only researcher is omp's bundled `scout`. */
export const OMP_NATIVE_AGENTS: Readonly<Record<string, string>> = {
  researcher: 'scout',
};

/** The front-matter key an agent's assignment schema is carried under, where the
 *  cratylus extension reads it (omp passes unknown keys through untouched). */
export const OMP_ASSIGNMENT_KEY = 'assignment';

// ── Agent projection → agent/agents/<name>.md ────────────────────────────────

/**
 * The omp agent definition: the front-matter omp reads, then the composed Target
 * body, which IS the system prompt.
 *
 * **FRONT-MATTER, in this order:** `name`, `description`, `mark` (only with one),
 * `key: null`, `model`, `spawns` (only where the agent's handoffs are declared),
 * `output` and `assignment` (only with a typed handoff), `autoloadSkills` (only
 * with skills). No `tools`: every agent keeps omp's default tools (decision 0081).
 * `parseAgentFields` treats a missing `name` or `description` as a parse failure
 * and SKIPS the file — a persona that silently does not exist.
 *
 * **`key` IS RESERVED.** It is the slot of an ipseic agent's key (decision 0048), and
 * every agent this corpus composes holds it empty.
 *
 * **`model` NAMES THE AGENT'S OWN ROLE, NEVER A MODEL.** `model: "@<name>"` is omp's
 * model-role alias for the role named for the agent; install binds that role in the
 * host's `modelRoles` to the tier and effort the agent holds (`@<tier>:<effort>`),
 * and each tier's role to a model. Quoted, because a YAML value starting with `@` is
 * a scanner error unquoted.
 *
 * **`spawns` IS THE AGENT'S HANDOFFS**, each mapped through {@link OMP_NATIVE_AGENTS}
 * to the agent omp supplies for it (the researcher is omp's `scout`). `""` denies
 * every dispatch: an agent that hands off to no one dispatches no one. An agent
 * whose handoffs are undeclared carries no `spawns`, and omp's default stands.
 *
 * **THE TYPED HANDOFF** ({@link Agent.contract}): the deliverable schema is omp's
 * own `output`, which task dispatch uses as the child's structured-output schema
 * (made strict on each dispatch by the cratylus extension), and the assignment
 * schema is {@link OMP_ASSIGNMENT_KEY}, which the extension checks each dispatch
 * and each launch of the agent against.
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
 * are never text; they are the settings above.
 */
export function agentToOmpMd(a: Agent, ctx: AgentDefContext): string {
  const fm = [`name: ${a.name}`, `description: ${yamlString(a.description)}`];
  if (a.mark !== null) fm.push(`mark: ${yamlString(a.mark.emoji)}`);
  fm.push('key: null', `model: ${yamlString(`@${a.name}`)}`);
  if (a.dispatches !== undefined) {
    const spawns = a.dispatches.map((h) => OMP_NATIVE_AGENTS[h] ?? h);
    fm.push(`spawns: ${yamlString(spawns.join(', '))}`);
  }
  // The typed handoff: the deliverable as omp's own output schema, the assignment
  // where the cratylus extension reads it to check each dispatch and launch. Each
  // is one line of JSON, which YAML reads as the same object.
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

// ── Session hooks → agent/extensions/<bin>-session.ts ────────────────────────

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
 * registration. With nothing to answer, all five of canon's session-scoped cells
 * were warned about and dropped, and this harness deployed no mechanism at all —
 * no stance gate, no drift notice, no memory nudge, no resume notice.
 *
 * ONE MODULE, in the session root every `omp` session scans natively — the same
 * reach claude's user-level `settings.json` gives these cells.
 *
 * NOT the ambient form `MODEL.md` forbids. That prohibition is on an agent-composed
 * constraint filtering itself at runtime; these cells compose no agent — they bind
 * the session — and nothing emitted for them asks who is running.
 *
 * THE GUARDS the projected agents compose land in the same module
 * ({@link guardRegistrations}): each judges only a main session launched as an agent
 * whose composition holds the guarded value.
 */
export function ompScopeActivatedExtensions(
  hooks: readonly Hook[],
  guards: readonly ComposedGuard[] = [],
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
  if (lines.length === 0 && guards.length === 0) return [];
  return [
    {
      filename: OMP_SESSION_MODULE,
      scope: SESSION_SCOPE,
      content: ompExtensionModule('every session', lines, guards),
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
 * The flag makes sense only over the host settings install records
 * ({@link ompDispatchIsolation}): with `task.isolation.enabled` off, omp refuses an
 * isolated task — a loud failure, where the alternative is the agent building in the
 * checkout that dispatched it.
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
        '',
        '// The agents that declare a worktree of their own, by the name a dispatch gives them.',
        `const ISOLATED: Readonly<Record<string, true>> = ${JSON.stringify(named)};`,
        '',
        'export default function (pi: ExtensionAPI) {',
        '  pi.on("tool_call", async (event) => {',
        '    if (event.toolName !== "task") return undefined;',
        '    const input = event.input as Record<string, unknown>;',
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
 * ONE ACT, ONE JUDGMENT. Two registrations of a cell can land on one native event and
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
      ? `judged(${cmd}, ctx, { stop_hook_active: event.stop_hook_active === true }, event.messages ?? [])`
      : kind === 'dispatch'
        ? `judged(${cmd}, ctx, {}, dispatchTurn(event))`
        : kind === 'tool'
          ? (() => {
              const named = r.workerTool ?? r.tool;
              if (named === undefined)
                return `judged(${cmd}, ctx, toolEnvelope(event))`;
              const wt = JSON.stringify(named);
              return `judged(${cmd}, ctx, { tool_name: ${wt}, tool_input: workerInput(${wt}, event.input ?? {}) })`;
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
  // The handler takes `ctx` only where it judges: that is where the model and the
  // registry come from, and an unused parameter in a generated file reads as a
  // leftover rather than a contract.
  const args = kind ? '(event, ctx: JudgeContext)' : '(event)';
  // Only the main session is judged. The return comes BEFORE the worker is run, so
  // no judge is asked. A subagent says nothing; a context with no `agent` cannot
  // say which session it is, so the call goes unjudged AND the notice is relayed.
  // See "A GUARD BINDS A PERSONA’S MAIN SESSION ONLY" in the bridge for the signal.
  const unjudged = `${r.anchor} guard — could not tell which session is running, so this call was NOT judged.`;
  const session = kind
    ? `\n    if (ctx.agent?.kind !== "main") {\n      if (ctx.agent === undefined) relay(${JSON.stringify(unjudged)});\n      return;\n    }`
    : '';
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
  '// THE IDENTITY IS READ FROM PLACEMENT, never asked at runtime: this module sits',
  '// at `<scope>/extensions/`, so its grandparent directory names the scope. A',
  '// persona copy reports that persona; the session root reports its own dir name,',
  '// which is no persona and matches no allowlist — the bare-launch case falls out',
  '// of the placement instead of out of a branch.',
  '//',
  '// The DIRECTORY is what a worker needs, not the name. Enrollment is the',
  "// presence of that scope's own stance manifest, so this bridge hands over",
  '// WHERE to look and learns nothing about what is found: which cells gate this',
  '// persona, at which moments, against which contract are all answered inside',
  '// the scope, by the projection that wrote it. The session root has a module',
  '// and no manifest, so a bare launch resolves to silence by placement.',
  'const scopeDir = dirname(dirname(new URL(import.meta.url).pathname));',
  'const scopeName = basename(scopeDir);',
  '',
  '// The reason last delivered, so an unchanging one is not re-delivered — see the',
  '// `agent_end` registration for why delivery is bounded.',
  'let lastVerdict = "";',
  '',
  '// The notice last relayed, so an unchanging one is delivered ONCE per session rather',
  '// than at every turn end (a latched-away judge would repeat one line forever). An',
  "// absent verdict is not a clean one, and the worker's own notice is what says so.",
  'let lastNotice = "";',
  '',
  "// The judge's own deadline, set well inside omp's 30 s extension-handler kill",
  '// so an unreachable endpoint fails OPEN — loudly, via `dark` — instead of costing every',
  '// turn the full budget and then surfacing as `Extension error: handler timed',
  '// out`.',
  '//',
  '// IT WAS 12 s, ON A PREMISE THAT EXPIRED. That number came from "a healthy local',
  '// judge answers this rubric in about two seconds" — measured when the advisor role',
  '// pointed at a box on the LAN and the rubric was smaller. Re-measured against the',
  '// cloud model the role names today: 9.3 s for a 9 KB payload against a 29 KB',
  '// rubric, which is 77% of the old budget for a turn shorter than a working one.',
  '// A deadline a healthy judge routinely brushes is a deadline that reports outages',
  '// that did not happen, and it reported one on this very session.',
  '//',
  '// THE DEADLINE STAYS AND THE JUDGE IS SENT LESS. The 9.3 s above, and 17-19 s through',
  '// `omp -p` on haiku, were measured under a rubric that had grown to 29 KB and a',
  '// payload with no bound. The rubric has been cut since: stance-judge-prompt.md is',
  '// 2037 bytes and purview-judge-prompt.md 1908, and every worker caps what it sends at',
  '// 12 KB (12000 bytes), so a judgement fits the time the harness allows. Measured on the',
  '// advisor role (anthropic/claude-haiku-4-5, cold prompt cache, quiet provider): 21',
  '// calls over the six calibration turns and a 200000-byte turn after the cap took',
  '// 1.7-3.2 s, where the old rubric took 2.4-3.4 s on the same quiet provider. Time',
  '// follows the length of the verdict (100-220 output tokens) far more than the input,',
  '// so the cut buys margin for a provider under load rather than a quiet one, and no',
  '// deadline is raised to make a judgement fit.',
  'const JUDGE_TIMEOUT_MS = 22_000;',
  '',
  '// CONSECUTIVE misses, not the first one. This was a boolean latched by a single',
  '// timeout, on the reasoning that an endpoint which was away stays away — true of',
  '// the dead LAN box it was written for, false of a healthy provider having one slow',
  '// call. There, one transient blacked out the guard for the REST OF THE SESSION, and',
  '// every later turn went unjudged for a reason that had already passed. The latch is',
  '// still worth having: a genuinely dead endpoint must stop costing a full budget per',
  '// turn. It just has to be earned more than once. Reset by any answer.',
  'const JUDGE_MISS_LIMIT = 3;',
  'let judgeMisses = 0;',
  '',
  '// HOW LONG A RUN OF MISSES KEEPS THE JUDGE UNASKED, in wall time. A latch that only',
  '// an answer can clear is a latch that never opens, because a judge that is never',
  '// asked never answers — one burst of slow calls blacked out every guard for the rest',
  '// of a session. Two minutes: long enough that a dead endpoint costs one 22 s',
  '// deadline per two minutes instead of one per turn, short enough that a provider',
  '// whose burst has passed is asked again within a working turn or two.',
  'const JUDGE_COOLDOWN_MS = 120_000;',
  'let judgeRetryAt = 0;',
  '',
  '// One value per module LOAD, and a module is loaded once per session — which is',
  "// exactly the lifetime the workers' per-session state files want.",
  'const sessionId = `omp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;',
  '',
  'type TurnBlock = { type?: string; text?: string; name?: string };',
  'type TurnMessage = { role?: string; content?: string | TurnBlock[] };',
  '',
  '// WHAT THE JUDGE NEEDS OFF THE HANDLER CONTEXT, declared rather than imported.',
  '// `model` and `modelRegistry` are non-enumerable getters on the context omp',
  '// hands every handler — present on every event, invisible to `Object.keys`, and',
  '// not surfaced on the exported `ExtensionContext` type. Naming the two members',
  '// this module actually reads keeps the dependency honest and narrow.',
  'type JudgeContext = {',
  '  agent?: { kind?: string };',
  '  model?: Model<Api>;',
  '  modelRegistry?: {',
  '    find(provider: string, modelId: string): Model<Api> | undefined;',
  '    getApiKeyAndHeaders(',
  '      model: Model<Api>,',
  '    ): Promise<{ ok: boolean; apiKey?: string }>;',
  '  };',
  '};',
  '',
  '// A GUARD BINDS A PERSONA’S MAIN SESSION ONLY. omp hands a spawned subagent its',
  "// parent's extensions (`preloadedExtensionPaths: l ? [] : n.extensionPaths` beside",
  '// `parentAgentId` in the subagent session options), so this module also loads in',
  "// every subagent the persona dispatches — and would judge that subagent's calls",
  "// against the persona's contract. The one signal that says which session is",
  '// running is `ctx.agent.kind`, on the context omp hands every handler: the main',
  '// session carries `{ kind: "main", depth: 0 }` (TOP_LEVEL_AGENT), a subagent',
  '// carries `{ kind: "sub", parentId, depth }`. ESTABLISHED against the omp 18.4.4',
  '// binary (`~/.local/bin/omp`: the extension runner is built with',
  '// `kind: un ? "sub" : "main"`, and `createContext()` returns `agent: this.agent`).',
  '// Only `main` is judged; a subagent is judged by nothing and says nothing. A',
  '// context carrying no `agent` is judged by nothing either, but that one is',
  '// SAID: which session is running cannot be told, so the guard is not in force',
  '// for the call and each registration relays that through the same path as any',
  '// let-through notice.',
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
  '// assistant turn, which is exactly the pair the rubric judges.',
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
 *
 * THE JUDGE RUNS IN THIS PROCESS, and that is the point of `judged()`. The
 * workers' default judge backend spawns `claude -p`: a cross-harness dependency
 * on a foreign vendor's CLI, separately installed and separately authenticated,
 * which on this host had a lapsed OAuth session and therefore failed every
 * verdict open, in silence, on every harness at once. omp holds a model already.
 *
 * So the worker is run TWICE around a model call this module makes itself: once
 * with `STANCE_EMIT_PAYLOAD` to collect the gated, layer-1-annotated payload and
 * the rubric that scores it, then again with `STANCE_VERDICT_FILE` naming the
 * answer. The PROCEDURE — opt-in, agent scope, extraction, the deterministic
 * pre-filter, evidence verification, the block counters — stays in its one home
 * inside the worker, and everything either pass touches before the judge seam is
 * read-only, so the counters see exactly one pass.
 */
const TURN_EXEC: readonly string[] = [
  '  /** Fire the worker once, with `extra` merged into the envelope on stdin. */',
  '  const fire = async (',
  '    cmd: string,',
  '    dir: string,',
  '    extra: Record<string, unknown>,',
  '    env: Record<string, string> = {},',
  '  ) => {',
  '    const envelope = join(dir, "envelope.json");',
  '    writeFileSync(',
  '      envelope,',
  '      JSON.stringify({',
  '        session_id: sessionId,',
  '        cwd: pi.cwd,',
  '        agent_type: scopeName,',
  '        stance_scope: scopeDir,',
  '        ...extra,',
  '      }),',
  '    );',
  '    // `ExecOptions` carries no env slot either, so it is spelled into the',
  "    // command. Every value here is one of this module's own literals or a temp",
  '    // path it just made — never model output — so the quoting is total.',
  '    const prefix = Object.entries(env)',
  "      .map(([k, v]) => `${k}='${v}' `)",
  '      .join("");',
  '    return await pi.exec("sh", ["-c", `${prefix}${cmd} < ${envelope}`]);',
  '  };',
  '',
  "  /** One judgment, on this session's own provider. `undefined` ⇒ no verdict. */",
  '  const askJudge = async (',
  '    ctx: JudgeContext,',
  '    rubric: string,',
  '    payload: string,',
  '  ): Promise<string | undefined> => {',
  '    // A CONSECUTIVE run of misses, not the first one. A judge that repeatedly',
  '    // misses its deadline is away, and paying the full deadline again on every',
  '    // turn end buys nothing. But ONE slow answer from a healthy provider is not',
  '    // an outage, and treating it as one blacked out a whole session here. And a',
  '    // judge never asked can never answer, so the latch EXPIRES: inside the',
  '    // cooldown the judge is skipped; the first ask after it is the probe, and an',
  '    // answer clears the run while a miss on it starts a new cooldown.',
  '    if (judgeMisses >= JUDGE_MISS_LIMIT && Date.now() < judgeRetryAt) {',
  '      return undefined;',
  '    }',
  '    let stopDeadline = (): void => {};',
  '    try {',
  '      // The `advisor` role first: judging on the primary model is an expensive',
  '      // way to ask a small classification question, and omp already has a role',
  '      // whose entire purpose is reviewing this session.',
  '      const roles =',
  '        (pi.pi?.Settings?.instance?.get?.("modelRoles") as',
  '          | Record<string, string>',
  '          | undefined) ?? {};',
  '      const spec = roles.advisor ?? roles.smol ?? roles.tiny ?? "";',
  '      const bare = spec.replace(/:[a-z]+$/, "");',
  '      const cut = bare.indexOf("/");',
  '      const model =',
  '        (cut > 0',
  '          ? ctx.modelRegistry?.find(bare.slice(0, cut), bare.slice(cut + 1))',
  '          : undefined) ?? ctx.model;',
  '      if (!model) return undefined;',
  '      const auth = await ctx.modelRegistry?.getApiKeyAndHeaders(model);',
  "      // BOUNDED BY ITS OWN DEADLINE, well inside the host's. omp kills an",
  '      // extension handler at 30 s, and an unreachable judge does not fail — it',
  '      // HANGS. Without this race a dead endpoint costs every turn the full 30 s',
  '      // and then surfaces as `Extension error: handler timed out`, which reads',
  '      // as the guard being broken rather than the judge being away. Measured on',
  '      // an operator host whose configured `advisor` role pointed at a local',
  '      // server that had stopped answering: a one-word prompt did not return in',
  '      // 20 s, and every turn end paid 30 s.',
  '      //',
  '      // A JUDGE THAT DID NOT ANSWER IN TIME HAS REFUSED NOTHING, so the timeout',
  '      // lands on the same fail-open path as every other error here.',
  '      const answer = await Promise.race([',
  '        completeSimple(',
  '          model,',
  '          {',
  '            systemPrompt: [rubric],',
  '            messages: [',
  '              {',
  '                role: "user",',
  '                content: payload,',
  '                timestamp: Date.now(),',
  '              },',
  '            ],',
  '          },',
  '          {',
  '            maxTokens: 4096,',
  '            temperature: 0,',
  '            disableReasoning: true,',
  '            sessionId,',
  '            ...(auth?.ok ? { apiKey: auth.apiKey } : {}),',
  '          },',
  '        ),',
  '        new Promise<never>((_, reject) => {',
  '          const timer = setTimeout(() => {',
  '            judgeMisses += 1;',
  '            // The run is at its limit: stop asking until the cooldown has passed.',
  '            if (judgeMisses >= JUDGE_MISS_LIMIT) {',
  '              judgeRetryAt = Date.now() + JUDGE_COOLDOWN_MS;',
  '            }',
  '            reject(new Error("stance judge timed out"));',
  '          }, JUDGE_TIMEOUT_MS);',
  '          timer.unref?.();',
  '          stopDeadline = () => clearTimeout(timer);',
  '        }),',
  '      ]);',
  '      const text = (answer.content ?? [])',
  '        .filter((c) => c.type === "text" && typeof c.text === "string")',
  '        .map((c) => c.text as string)',
  '        .join("")',
  '        .trim();',
  '      // An answer clears the run and the cooldown: the latch measures a STANDING',
  '      // outage, never a tally of every slow call a long session accumulates.',
  '      if (text) {',
  '        judgeMisses = 0;',
  '        judgeRetryAt = 0;',
  '      }',
  '      return text || undefined;',
  '    } catch {',
  '      // A judge that could not run has refused nothing.',
  '      return undefined;',
  '    } finally {',
  '      // An answer that won the race must not leave its deadline armed: a stale',
  '      // timer would count a miss for a call that was answered.',
  '      stopDeadline();',
  '    }',
  '  };',
  '',
  '  /**',
  "   * A worker's let-through notice, to the operator and the agent both: it lands",
  '   * as a user-attributed prompt so the AGENT reads it in context and the',
  '   * OPERATOR reads it on screen, both parties to a guard needing to know it was',
  '   * not in force. Once per distinct line, and never a reason for the turn to',
  '   * fail: the guard let it through, so the notice cannot be what stops it.',
  '   */',
  '  const relay = (notice: string): void => {',
  '    if (notice === lastNotice) return;',
  '    lastNotice = notice;',
  '    try {',
  '      void Promise.resolve(',
  '        pi.sendUserMessage(notice, { deliverAs: "nextTurn", attribution: "agent" }),',
  '      ).catch(() => {});',
  '    } catch {',
  '      // Undelivered is not blocked.',
  '    }',
  '  };',
  '',
  '  /** Worker → in-process judge → worker. `undefined` ⇒ no refusal. */',
  '  const judged = async (',
  '    cmd: string,',
  '    ctx: JudgeContext,',
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
  '      const asked = await fire(cmd, dir, full, { STANCE_EMIT_PAYLOAD: "1" });',
  '      if (asked.code !== 0) return undefined;',
  '      const head = asked.stdout.trim();',
  '      // THE ONLY THING THIS PASS ASKS FOR IS THE PAYLOAD ENVELOPE, so any other',
  '      // line is the worker saying it let this fire through with no verdict (no',
  '      // `jq`, no input, a scope it could not read) before the judge was ever',
  '      // reached. Dropping it here made every such path',
  '      // silent on omp, whatever the worker printed. Relay it, and judge nothing.',
  '      if (head !== "" && !head.startsWith("{")) {',
  '        relay(head);',
  '        return undefined;',
  '      }',
  '      if (!head.startsWith("{")) return undefined;',
  '      let ask: { rubric?: string; payload?: string };',
  '      try {',
  '        ask = JSON.parse(head);',
  '      } catch {',
  '        return undefined;',
  '      }',
  '      // Nothing emitted ⇒ the worker gated this fire out (not enrolled, nothing',
  '      // judgeable in it). Nothing to judge and nothing to report.',
  '      if (!ask.rubric || !ask.payload) return undefined;',
  '      let rubric: string;',
  '      try {',
  '        rubric = readFileSync(ask.rubric, "utf8");',
  '      } catch {',
  '        return undefined;',
  '      }',
  '      const verdict = await askJudge(ctx, rubric, ask.payload);',
  '      const file = join(dir, "verdict.txt");',
  '      // AN ABSENT VERDICT IS NOT A CLEAN ONE. Returning early on a judge that',
  '      // did not answer is what made a dead endpoint read as approval, turn after',
  "      // turn, in silence — the exact bypass-by-omission the worker's own `dark`",
  '      // exists to refuse. Writing the empty file and firing anyway REACHES that',
  "      // announcement, so the harness inherits the canon's answer rather than",
  '      // re-deciding it here: refuse nothing, and SAY SO.',
  '      writeFileSync(file, verdict ?? "");',
  '      const answered = await fire(cmd, dir, full, { STANCE_VERDICT_FILE: file });',
  '      const out = answered.stdout.trim();',
  '      // A line that is not a verdict is the worker saying this fire went through',
  '      // WITHOUT one: the judge did not answer, the verdict did not parse, a block',
  '      // was discarded. Every guard notice is relayed, whatever words it opens',
  '      // with, so the operator reads that the guard was not in force.',
  '      // A verdict is JSON and travels through `verdictOf`.',
  '      if (answered.code === 0 && out !== "" && !out.startsWith("{")) {',
  '        relay(out);',
  '        return undefined;',
  '      }',
  '      // THIS FIRE WAS JUDGED — a verdict or a clean pass — so whatever notice was',
  '      // last relayed is history. Forgetting it is what lets the NEXT outage be said',
  '      // again even when its text is identical: kept, the dedupe would swallow the',
  '      // second outage whole and the guard would go dark in silence.',
  '      if (answered.code === 0) lastNotice = "";',
  '      return verdictOf(answered);',
  '    } finally {',
  '      rmSync(dir, { recursive: true, force: true });',
  '    }',
  '  };',
];

/**
 * Module-level half of a GUARD: its shape, the act a turn end judges, and the
 * verdict read back. Emitted after {@link TURN_BRIDGE}, whose message types and
 * judge context it reads.
 */
const GUARD_BRIDGE: readonly string[] = [
  '// A GUARD judges one act for the agents whose composition holds the value it guards,',
  '// through the judge this session already holds, which answers one JSON verdict.',
  'type Guard = {',
  '  id: string;',
  '  tell: string;',
  '  agents: readonly string[];',
  '  prompt: string;',
  '  refusesOn: string;',
  '  refusal: string;',
  '};',
  '',
  '/** The act a turn end is judged by: the reply that ended it, and the message it answered. */',
  'function replyOf(event: { last_assistant_message?: unknown; messages?: readonly TurnMessage[] }): string | undefined {',
  '  const text = (m: TurnMessage | undefined): string =>',
  '    m === undefined',
  '      ? ""',
  '      : typeof m.content === "string"',
  '        ? m.content',
  '        : (m.content ?? []).filter((c) => c.type === "text").map((c) => c.text ?? "").join("\\n");',
  '  const messages = event.messages ?? [];',
  '  const at = messages.map((m) => m.role).lastIndexOf("assistant");',
  '  const said = event.last_assistant_message;',
  '  const reply = typeof said === "string" && said.trim() !== "" ? said : text(messages[at]);',
  '  if (reply.trim() === "") return undefined;',
  '  const asked = text(messages.slice(0, at < 0 ? messages.length : at).findLast((m) => m.role === "user"));',
  '  return asked.trim() === ""',
  '    ? `Reply:\\n${reply}`',
  '    : `Message the reply answered:\\n${asked}\\n\\nReply:\\n${reply}`;',
  '}',
  '',
  '/** The verdict a judge answered, or `undefined` when its answer is not that JSON. */',
  'function verdictIn(answer: string, guard: Guard): { refuses: boolean; reason: string } | undefined {',
  '  const json = answer.replace(/^```(?:json)?\\s*/, "").replace(/\\s*```$/, "").trim();',
  '  let v: unknown;',
  '  try {',
  '    v = JSON.parse(json);',
  '  } catch {',
  '    return undefined;',
  '  }',
  '  if (typeof v !== "object" || v === null) return undefined;',
  '  const o = v as Record<string, unknown>;',
  '  if (typeof o[guard.refusesOn] !== "boolean") return undefined;',
  '  return { refuses: o[guard.refusesOn] === true, reason: typeof o.reason === "string" ? o.reason.trim() : "" };',
  '}',
  '',
];

/**
 * Function-level half of a GUARD, emitted after {@link TURN_EXEC}, whose
 * `askJudge` and `relay` it calls: whom it judges, and the judgment.
 *
 * ONLY A MAIN SESSION LAUNCHED AS A COMPOSING AGENT. The guard binds the agents
 * whose composition holds its value, so a subagent, a plain session and a session
 * launched as any other agent are judged by nothing. The launched agent is omp's
 * `--agent` flag, which the cratylus module registers.
 *
 * FAILS OPEN, ALOUD. A judge that does not answer, or answers anything but the
 * verdict, refuses nothing, and the session is told the act went unjudged. A stop
 * already refused once (`stop_hook_active`) is not refused again: the reason is
 * relayed instead, so a guard never holds a turn open forever.
 */
const GUARD_EXEC: readonly string[] = [
  '',
  '  /** The agent this main session was launched as (`--agent`); none for a subagent or a plain session. */',
  '  const launchedAs = (ctx: JudgeContext): string | undefined => {',
  '    if (ctx.agent?.kind !== "main") return undefined;',
  `    const name = pi.getFlag(${JSON.stringify(OMP_AGENT_FLAG)});`,
  '    return typeof name === "string" && name !== "" ? name : undefined;',
  '  };',
  '',
  '  /** One guard over one act. `undefined` ⇒ no refusal. */',
  '  const guardJudged = async (',
  '    guard: Guard,',
  '    ctx: JudgeContext,',
  '    act: string | undefined,',
  '    reentered: boolean,',
  '  ): Promise<string | undefined> => {',
  '    const agent = launchedAs(ctx);',
  '    if (agent === undefined || !guard.agents.includes(agent) || act === undefined) return undefined;',
  '    const answer = await askJudge(ctx, guard.prompt, act);',
  '    const verdict = answer === undefined ? undefined : verdictIn(answer, guard);',
  '    if (verdict === undefined) {',
  '      relay(',
  '        `${guard.id} guard — the judge gave no verdict${answer === undefined ? "" : ` (it answered: ${answer.slice(0, 200)})`}, so this act was NOT judged.`,',
  '      );',
  '      return undefined;',
  '    }',
  '    if (!verdict.refuses) return undefined;',
  '    const reason = `${guard.refusal} ${verdict.reason}`.trim();',
  '    if (reentered) {',
  '      relay(reason);',
  '      return undefined;',
  '    }',
  '    return reason;',
  '  };',
];

/**
 * One guard's registrations: its data, then one handler per event omp fires for
 * it. A turn end is judged by its last reply, a tool call by the call itself; each
 * refuses in the shape its own caller reads ({@link OMP_REFUSAL_SHAPE}).
 */
function guardRegistrations(
  { guard, agents }: ComposedGuard,
  index: number,
): string[] {
  const name = `guard${index}`;
  const data = {
    id: guard.id,
    tell: guard.tell,
    agents,
    prompt: guard.judge.prompt,
    refusesOn: guard.judge.refusesOn,
    refusal: guard.refusal,
  };
  const lines = [
    `  // ${guard.id} — holds the tell \`${guard.tell}\` for ${agents.join(', ')}.`,
    `  const ${name}: Guard = ${JSON.stringify(data)};`,
  ];
  for (const event of guard.events) {
    const binding = ompBindingOf(event);
    if (!binding) continue;
    const kind = OMP_ENVELOPE_KIND[binding.event];
    const refusal = OMP_REFUSAL_SHAPE[binding.event];
    const act =
      kind === 'turn'
        ? 'replyOf(event)'
        : kind === 'tool'
          ? 'JSON.stringify({ tool: event.toolName, input: event.input })'
          : undefined;
    if (act === undefined || refusal === undefined) continue;
    const narrow = binding.matcher
      ? `\n    if (event.toolName !== ${JSON.stringify(binding.matcher)}) return;`
      : '';
    const reentered =
      kind === 'turn' ? 'event.stop_hook_active === true' : 'false';
    const answer =
      refusal === 'stop'
        ? '{ decision: "block", reason }'
        : '{ block: true, reason }';
    lines.push(
      `  pi.on(${JSON.stringify(binding.event)}, async (event, ctx: JudgeContext) => {${narrow}
    const reason = await guardJudged(${name}, ctx, ${act}, ${reentered});
    if (reason) return ${answer};
  });`,
    );
  }
  return lines;
}

/**
 * The extension module's text.
 *
 * Its hooks bind every session, and nothing in them asks which agent is running.
 * Its GUARDS ({@link ComposedGuard}) are the one question of identity, and the one
 * allowed: each judges only a main session launched as an agent whose composition
 * holds the guarded value, named in the module at projection.
 */
function ompExtensionModule(
  governs: string,
  registrations: string[],
  guards: readonly ComposedGuard[] = [],
): string {
  const guardLines = guards.flatMap(guardRegistrations);
  // The payload bridge is emitted only where a registration reads one, so a module
  // of pure fire-and-forget hooks stays as small as it was. BOTH entries count:
  // `execWithTurn` delegates to `execWithEnvelope`, so a module that only ever
  // calls the latter still needs every line of the bridge. A guard asks the same
  // in-process judge, so it needs the bridge too.
  const needsTurn =
    guardLines.length > 0 || registrations.some((r) => r.includes('judged('));
  return [
    // The regenerate instruction NAMES THE COMMAND, so it interpolates the bin
    // rather than spelling it: a banner telling a host to run a command that no
    // longer exists is worse than no banner, and only derivation survives a rename.
    `// GENERATED by @cratylus/forge — do not hand-edit; regenerate with \`${CLI_BIN} project\`.`,
    `// The constraints in force for ${governs}.`,
    '//',
    ...SESSION_PLACEMENT,
    '// The hooks below carry no AGENT identity check and must not: they bind the',
    '// session. The one runtime question they ask is which session is running, and',
    '// only the main one is judged. A guard asks one more, which agent the main',
    '// session was launched as, and judges only the agents composing its value.',
    '',
    ...(needsTurn
      ? [
          "import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';",
          "import { tmpdir } from 'node:os';",
          "import { basename, dirname, join } from 'node:path';",
          // STATIC, and it resolves: omp's extension loader aliases
          // `@oh-my-pi/pi-ai` to its own bundled build, so this is the harness
          // handing the module its own model client rather than a dependency the
          // host has to install. `completeSimple` is the whole of what the judge
          // needs; the richer `judgment` module (`TextJudge`, `chatTextBackend`)
          // exists in omp's source but is NOT in the bundled compat entrypoint the
          // shipped binary carries — importing it silently kills the module load,
          // measured against v18.1.19.
          "import { completeSimple } from '@oh-my-pi/pi-ai';",
          "import type { Api, Model } from '@oh-my-pi/pi-ai';",
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
    ...(guardLines.length > 0 ? GUARD_BRIDGE : []),
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
    ...(guardLines.length > 0 ? GUARD_EXEC : []),
    ...registrations,
    ...guardLines,
    '}',
    '',
  ].join('\n');
}

/** The placement note of a module in the session scope: what is true of where the
 *  file sits, said once. */
const SESSION_PLACEMENT: readonly string[] = [
  '// This module sits in the SESSION config root',
  `// (\`${OMP_SESSION_DIR}/extensions/\`), which every \`omp\` session scans NATIVELY,`,
  '// with no `--config` entry required.',
];

// ── Capability interface and agent launch → agent/extensions/<bin>.ts ───────

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
 * TYPED HANDOFFS. On every `task` call, in any session, each item whose agent
 * declares an assignment schema ({@link OMP_ASSIGNMENT_KEY}) is checked with the
 * same `checkAssignment` the schema package exports (its source carried here
 * verbatim) against the one fenced `assignment` block of the item's text or of the
 * batch's shared context; a misfit refuses the whole call before any agent runs,
 * naming the agent and each missing or ill-typed field. A dispatch whose
 * assignment briefs a cut (`cut`, `concepts`, `examples`, `decisions`: a lead)
 * also needs the cut's record and its branch checked out; one that names a
 * `workPackage` (a builder) needs that package ready, every concept of the cut
 * served and every visible example owned (ruling 0083) — each answered by
 * `<bin> workPackage state|inventory`. An item whose agent declares an `output`
 * runs with `schemaMode: "strict"`, so a return omitting a required field does not
 * pass. A main session launched as an agent with an assignment schema checks the
 * launch prompt the same way: a misfit given on the command line ends startup, one
 * typed later is refused, and, until one fits, every turn whose prompt misfits is
 * refused before the agent starts it (`before_agent_start`), whatever route the
 * prompt came by.
 *
 * LIFECYCLE CAPTURE. The harness's own events are written to the cut's ledger by
 * `<bin> lifecycle`, each with a transition derived from the harness's ids (the
 * task call id, the item, the kind), so one event delivered twice is refused:
 * `dispatched` for each item whose assignment names a cut, `returned` when it
 * returns (with its tokens when reported), `verdict` from an assayer's returned
 * deliverable (`verdicts`) and `reported` from a lead's (`outcomes`).
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
 * Every turn's system prompt carries the declaration as prose — its name and
 * description in a sentence, then its body, never the raw front matter — then the
 * full instructions of each skill its `autoload-skills` names, found among the
 * skills omp discovered for the session (an unknown name skipped, as dispatch skips
 * it) and rendered by omp's own `buildSkillPromptMessage` in the autoload form a
 * dispatched child receives; all appended in `before_agent_start`, so a rebuilt
 * base prompt never drops them. The status line reads `<mark> <name>`, or `<name>`
 * without a mark (install lists omp's `status` segment so it renders).
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
 * `--prewalk` / `--no-prewalk` / `--prewalk-into` win their own dimension. Whom the
 * session may dispatch is the declaration's `spawns`, read by omp's
 * `resolveSpawnPolicy`: `*` anyone, a list exactly those, absent as omp's discovery
 * reads it (`*` with `task` among the `tools`, else no one), and an explicitly empty
 * one — an empty list or a blank string, read raw from the declaration's file with
 * omp's front-matter parser, as the mark is — no one, even with `task` among the
 * `tools`; a bundled declaration, having no file, gets discovery's value. It is
 * enforced on the launched session's own dispatches in `before_subagent_spawn` with
 * omp's own refusal (`Cannot spawn '<x>'. Allowed: …`) — never through
 * `task.disabledAgents`, which every child inherits.
 *
 * TWO KNOWN omp LIMITATIONS, where launch holds what the declaration says and omp's
 * own dispatch does not: an explicitly empty `spawns` with `task` among the `tools`
 * (omp's discovery reads it as absent, then infers `*`, so a dispatched child may
 * spawn anyone), and `read-summarize: true` (omp's dispatch applies only `false`, so
 * a dispatched child keeps the session's setting). For every other value, launch
 * holds what omp's dispatch gives a child.
 *
 * The active tools are never touched: the session holds exactly what omp grants for
 * the operator's selection, so without `task` it cannot dispatch at all, and a
 * declaration's `tools` are dispatch's alone. An unknown name ends startup with a
 * non-zero exit before any turn. A subagent session, or a session without the
 * flag, gets nothing of this.
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
        '// holds it: its text, model, effort, skills loaded at start, dispatch targets, read',
        "// summarisation, advisor and pre-planning, and no default personality; the operator's own",
        "// flags win. Two values omp's own dispatch drops are held as declared: an empty `spawns`",
        '// with `task` among the tools (no one), and `read-summarize: true` (on).',
        '//',
        '// Nothing here describes a capability: its name, purpose, verbs and parameters are the',
        "// installed command's own explanation, so a newer installed package changes the tools in",
        '// the next session and this file not at all. Nothing here names an agent either: the',
        "// declaration is the one omp's own discovery finds, read afresh for each session.",
        '',
        'import { execFile } from "node:child_process";',
        'import { existsSync, readFileSync } from "node:fs";',
        'import { isAbsolute } from "node:path";',
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
        'import { resolveAgentPrewalkDefault } from "@oh-my-pi/pi-coding-agent/task/prewalk";',
        'import {',
        '  cfgTaskAgentAdvisor,',
        '  cfgTaskAgentModelOverrides,',
        '  cfgTaskAgentPrewalk,',
        '  cfgTaskPrewalk,',
        '} from "@oh-my-pi/pi-coding-agent/task/settings";',
        'import { type ResolvedSpawnPolicy, resolveSpawnPolicy } from "@oh-my-pi/pi-coding-agent/task/spawn-policy";',
        'import type { AgentDefinition } from "@oh-my-pi/pi-coding-agent/task/types";',
        'import { cfgReadSummarizeEnabled } from "@oh-my-pi/pi-coding-agent/tools/settings";',
        'import { parseFrontmatter } from "@oh-my-pi/pi-utils";',
        '',
        `const COMMAND = ${JSON.stringify(CLI_BIN)};`,
        `const CAPABILITIES: readonly string[] = ${JSON.stringify(OMP_CAPABILITY_TOOLS)};`,
        `const ASSIGNMENT_KEY = ${JSON.stringify(OMP_ASSIGNMENT_KEY)};`,
        "// The schema package's own `assignmentIn` and `checkAssignment`, carried verbatim: the one",
        '// check every handoff runs, here, at a launch and in an evaluation alike.',
        `const assignmentIn: (text: string) => unknown = (${String(assignmentIn)});`,
        `const checkAssignment: (agent: string, schema: unknown, value: unknown) => { reason?: string } = (${String(checkAssignment)});`,
        `const AGENT_FLAG = ${JSON.stringify(OMP_AGENT_FLAG)};`,
        `const AGENT_STATUS = ${JSON.stringify(OMP_AGENT_STATUS_KEY)};`,
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
        'function execOf(file: string, args: string[], cwd?: string, signal?: AbortSignal): Promise<string> {',
        '  const { promise, resolve, reject } = Promise.withResolvers<string>();',
        '  execFile(file, args, { cwd, signal, maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {',
        '    if (error) reject(new Error(String(stderr).trim() || String(stdout).trim() || error.message));',
        '    else resolve(String(stdout));',
        '  });',
        '  return promise;',
        '}',
        "// The installed command's output; its own message, when it refuses.",
        'const run = (args: string[], cwd?: string, signal?: AbortSignal): Promise<string> => execOf(COMMAND, args, cwd, signal);',
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
        '// A required `verb`, then each parameter once, with what each verb says of it and its',
        '// schema: the one schema every verb declares, or each distinct one under `anyOf`.',
        'function parameters(e: Explanation): Record<string, unknown> {',
        '  const properties: Record<string, Record<string, unknown>> = {',
        '    verb: {',
        '      type: "string",',
        '      enum: e.verbs.map((v) => v.name),',
        '      description: e.verbs.map((v) => `${v.name} (${v.effect})`).join("; "),',
        '    },',
        '  };',
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
        '  return { type: "object", properties, required: ["verb"] };',
        '}',
        '',
        '// The command line of one call: the verb, its positional, then each flag given as one',
        '// `--flag=value` token, so a value led by `-` is never read as a flag. A positional led by',
        '// `-` is one the command cannot take literally; it goes as a flag-shaped token of its own',
        '// (`=` appended where it has none), which the command refuses in its own words and never',
        '// reads as a request for its help or its explanation.',
        'function argv(capability: string, verb: Verb | undefined, args: Record<string, unknown>): string[] {',
        '  const positional = verb?.parameters.find((p) => p.positional === true)?.name;',
        '  const words = [capability, String(args.verb)];',
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
        "  // Whom the session may dispatch: omp's spawn policy of the declaration's `spawns`.",
        '  spawns: ResolvedSpawnPolicy;',
        '  // The schema its assignment must fit, when the declaration carries one.',
        '  assignment?: Schema;',
        '}',
        '// What of a session the launch reads or sets.',
        'interface Session {',
        '  cwd: string;',
        '  agent?: { kind: string; name?: string };',
        '  model?: { provider: string; id: string };',
        '  modelRegistry: Parameters<typeof resolveModelOverrideWithAuthFallback>[2];',
        '  ui: {',
        '    setStatus(key: string, text: string | undefined): void;',
        '    notify(message: string, type?: "info" | "warning" | "error"): void;',
        '  };',
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
        '// plugins and bundled agents; first name wins), with the mark its front matter declares and',
        '// whom it may dispatch. A bundled declaration has no file (`embedded:<name>.md`): omp declares',
        '// no mark on one, and its `spawns` is the one discovery gives.',
        'async function discover(name: string, cwd: string): Promise<{ found?: Launched; names: string[] }> {',
        '  const agents: AgentDefinition[] = (await discoverAgents(cwd)).agents;',
        '  const names = agents.map((a) => a.name);',
        '  const declaration = agents.find((a) => a.name === name);',
        '  if (declaration === undefined) return { names };',
        '  const said = frontmatterOf(declaration);',
        '  const mark = typeof said.mark === "string" && said.mark.trim() !== "" ? said.mark.trim() : undefined;',
        '  // Whom it may dispatch, as dispatch passes `spawns` to a child: `*` anyone, a list exactly',
        "  // those, absent as omp's discovery reads it (`*` with `task` among the tools, else no one).",
        '  // An explicitly empty `spawns` (an empty list or a blank string) is no one, even with `task`:',
        "  // omp's discovery reads it as absent and so as `*`, which omp's own dispatch then honours.",
        '  const raw = said.spawns;',
        '  const none = Array.isArray(raw) ? raw.length === 0 : typeof raw === "string" && raw.trim() === "";',
        '  const spawns = none ? undefined : declaration.spawns;',
        '  const policy = resolveSpawnPolicy(',
        '    spawns === undefined ? "" : Array.isArray(spawns) ? spawns.join(",") : spawns,',
        '  );',
        '  return { found: { declaration, mark, spawns: policy, assignment: schemaOf(said) }, names };',
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
        '// What a cut brief requires: a dispatch whose agent takes one opens the cut (a lead).',
        'const CUT_BRIEF: readonly string[] = ["cut", "concepts", "examples", "decisions"];',
        'const requires = (schema: Schema | undefined, fields: readonly string[]): boolean =>',
        '  schema !== undefined && fields.every((f) => (schema.required ?? []).includes(f));',
        '',
        '// One item of a `task` call: the agent it runs as and its own id (its name, else its',
        '// position), with its assignment once checked.',
        'interface Handoff {',
        '  item: Record<string, unknown>;',
        '  agent: string;',
        '  id: string;',
        '  index: number;',
        '  schema?: Schema;',
        '  assignment?: Record<string, unknown>;',
        '  strict: boolean;',
        '}',
        '',
        '// The items of a `task` call, batch (`tasks[]`) or flat, each with the agent it names.',
        'function itemsOf(input: Record<string, unknown>): Handoff[] {',
        '  const items: unknown[] = Array.isArray(input.tasks) ? input.tasks : [input];',
        '  return items.flatMap((raw, index) => {',
        '    if (typeof raw !== "object" || raw === null) return [];',
        '    const item = raw as Record<string, unknown>;',
        '    const agent = typeof item.agent === "string" ? item.agent : typeof input.agent === "string" ? input.agent : "task";',
        '    const named = [item.name, item.id].find((v): v is string => typeof v === "string" && v !== "");',
        '    return [{ item, agent, id: named ?? String(index), index, strict: false }];',
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
        "// The cut's state and reading, as the work package capability computes them now.",
        'interface CutState {',
        '  branch: string | null;',
        '  workPackages: { name: string; status: string }[];',
        '  ready: string[];',
        '}',
        'interface CutInventory {',
        '  unserved: string[];',
        '  unowned: string[];',
        '}',
        'const cutRead = async <T>(verb: string, cut: string, cwd: string): Promise<T> =>',
        '  JSON.parse(await run(["workPackage", verb, "--cut", cut], cwd)) as T;',
        'const messageOf = (error: unknown): string => (error instanceof Error ? error.message : String(error));',
        '',
        "// A lead's dispatch opens the cut's work, so the cut must be recorded with its branch, and",
        '// that branch checked out.',
        'async function leadRefusal(cut: string, cwd: string): Promise<string | undefined> {',
        '  const open = `${COMMAND} workPackage open --cut ${cut} --branch <branch> --meaning-holder <context>=<holder>`;',
        '  let state: CutState;',
        '  try {',
        '    state = await cutRead<CutState>("state", cut, cwd);',
        '  } catch (error) {',
        '    return `lead dispatch of cut ${cut} refused: ${messageOf(error)}; record the cut with its branch first (${open})`;',
        '  }',
        '  if (typeof state.branch !== "string")',
        '    return `lead dispatch of cut ${cut} refused: the cut has no record naming its branch; record it first (${open})`;',
        '  let head: string;',
        '  try {',
        '    head = (await execOf("git", ["rev-parse", "--abbrev-ref", "HEAD"], cwd)).trim();',
        '  } catch (error) {',
        '    head = `no branch (${messageOf(error)})`;',
        '  }',
        '  return head === state.branch',
        '    ? undefined',
        '    : `lead dispatch of cut ${cut} refused: its branch ${state.branch} is not checked out (${head} is); check it out first`;',
        '}',
        '',
        "// A builder's dispatch is the act (ruling 0083): its package must be ready, every concept",
        '// of the cut served and every visible example owned.',
        'async function builderRefusal(cut: string, packages: readonly string[], cwd: string): Promise<string | undefined> {',
        '  let state: CutState;',
        '  let inventory: CutInventory;',
        '  try {',
        '    [state, inventory] = await Promise.all([',
        '      cutRead<CutState>("state", cut, cwd),',
        '      cutRead<CutInventory>("inventory", cut, cwd),',
        '    ]);',
        '  } catch (error) {',
        '    return `builder dispatch of cut ${cut} refused: ${messageOf(error)}`;',
        '  }',
        '  const reasons: string[] = [];',
        '  if (inventory.unserved.length > 0)',
        '    reasons.push(`concepts no work package serves: ${inventory.unserved.join(", ")}`);',
        '  if (inventory.unowned.length > 0)',
        '    reasons.push(`visible examples no work package owns: ${inventory.unowned.join(", ")}`);',
        '  for (const name of packages) {',
        '    const known = state.workPackages.find((p) => p.name === name);',
        '    if (known === undefined) reasons.push(`${name} is no work package of the cut`);',
        '    else if (!state.ready.includes(name))',
        '      reasons.push(`work package ${name} is not ready (it is ${known.status}; a package is ready once dispatched by no one and every package it depends on has returned)`);',
        '  }',
        '  return reasons.length === 0 ? undefined : `builder dispatch of cut ${cut} refused: ${reasons.join("; ")}`;',
        '}',
        '',
        "// What a returned deliverable records: a lead's report (`outcomes`) or an assayer's",
        '// verdicts (`verdicts`, each on a work package).',
        'function deliverableEntry(',
        '  deliverable: unknown,',
        '  at: { cut: string; run: string; assayer: string },',
        '): Record<string, unknown> | undefined {',
        '  if (typeof deliverable !== "object" || deliverable === null) return undefined;',
        '  const d = deliverable as Record<string, unknown>;',
        '  if (Array.isArray(d.outcomes))',
        '    return { kind: "reported", transition: `${at.run}/reported`, cut: at.cut, run: at.run, report: d };',
        '  if (Array.isArray(d.verdicts) && d.verdicts.every((v) => typeof v === "object" && v !== null && "workPackage" in v))',
        '    return {',
        '      kind: "verdict",',
        '      transition: `${at.run}/verdict`,',
        '      cut: at.cut,',
        '      assayer: at.assayer,',
        '      run: at.run,',
        '      verdicts: d.verdicts,',
        '      hardeningNotes: Array.isArray(d.hardeningNotes) ? d.hardeningNotes : [],',
        '    };',
        '  return undefined;',
        '}',
        '',
        "// A returned text's JSON, when it is JSON.",
        'function jsonIn(text: unknown): unknown {',
        '  if (typeof text !== "string") return undefined;',
        '  try {',
        '    return JSON.parse(text);',
        '  } catch {',
        '    return undefined;',
        '  }',
        '}',
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
        '  pi.registerFlag(AGENT_FLAG, {',
        '    description: "Start the session as the agent declaration omp discovers by this name",',
        '    type: "string",',
        '  });',
        '  let launched: Launched | undefined;',
        '  // The launch whose typed assignment no prompt has carried yet.',
        '  let awaiting: { name: string; schema: Schema } | undefined;',
        '  // What puts back each setting the current launch holds, in the order it took them.',
        '  const undo: (() => void)[] = [];',
        '',
        '  // A launch ends: its prompt, its dispatch policy and every setting it holds go with it.',
        '  function end(): void {',
        '    launched = undefined;',
        '    awaiting = undefined;',
        '    for (const restore of undo.splice(0).reverse()) restore();',
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
        '    // A launch as an agent taking a typed assignment is checked as a dispatch of it is: a',
        '    // prompt given on the command line must carry a fitting block, or startup ends; with',
        '    // none, each prompt typed is checked until one fits.',
        '    if (found.assignment !== undefined) {',
        '      const given = (operator as { messages?: unknown }).messages;',
        '      const prompts = Array.isArray(given) ? given.filter((m): m is string => typeof m === "string") : [];',
        '      if (startup && prompts.length > 0) {',
        '        const { reason } = checkAssignment(name, found.assignment, assignmentIn(prompts.join("\\n\\n")));',
        '        if (reason !== undefined) {',
        '          process.stderr.write(`${COMMAND}: launch refused: ${reason}\\n`);',
        '          process.exit(1);',
        '        }',
        '      } else awaiting = { name, schema: found.assignment };',
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
        '  }',
        '  pi.on("session_start", (_event, ctx) => launch(ctx as unknown as Session, true));',
        '  pi.on("session_switch", (_event, ctx) => launch(ctx as unknown as Session, false));',
        '  // A launch whose assignment is still to come: each prompt is checked until one fits, and a',
        '  // misfit is refused before the agent reads it, naming the missing or ill-typed fields.',
        '  pi.on("input", (event, ctx) => {',
        '    const waiting = awaiting;',
        '    if (waiting === undefined || (ctx as unknown as Session).agent?.kind !== "main") return undefined;',
        '    const { reason } = checkAssignment(waiting.name, waiting.schema, assignmentIn(String(event.text ?? "")));',
        '    if (reason === undefined) {',
        '      awaiting = undefined;',
        '      return undefined;',
        '    }',
        '    (ctx as unknown as Session).ui.notify(`launch refused: ${reason}`, "error");',
        '    return { handled: true };',
        '  });',
        "  // Every turn's prompt carries the declaration and the full instructions of the skills it",
        '  // loads at start, so a rebuilt base prompt drops neither. It is also the last point before',
        '  // the launched agent takes a turn, whatever route its prompt came by: while the launch',
        '  // still awaits its assignment, a turn whose prompt does not carry a fitting one is refused.',
        '  pi.on("before_agent_start", async (event, ctx) => {',
        '    const now = launched;',
        '    if (now === undefined || (ctx as unknown as Session).agent?.kind !== "main") return undefined;',
        '    const waiting = awaiting;',
        '    if (waiting !== undefined) {',
        '      const { reason } = checkAssignment(waiting.name, waiting.schema, assignmentIn(String(event.prompt ?? "")));',
        '      if (reason !== undefined) throw new Error(`launch refused: ${reason}`);',
        '      awaiting = undefined;',
        '    }',
        '    return {',
        '      systemPrompt: [...event.systemPrompt, instructions(now.declaration), ...(await skills(now.declaration))],',
        '    };',
        '  });',
        "  // The launched session dispatches only whom its declaration's `spawns` names, refused in",
        "  // omp's own words; the `task` tool itself stays the operator's grant.",
        '  pi.on("before_subagent_spawn", (event, ctx) => {',
        '    const policy = launched?.spawns;',
        '    if (policy === undefined || (ctx as unknown as Session).agent?.kind !== "main") return undefined;',
        '    if (policy.enabled && (policy.allowedAgents === null || policy.allowedAgents.includes(event.agent)))',
        '      return undefined;',
        "    return { block: true, reason: `Cannot spawn '${event.agent}'. Allowed: ${policy.allowedErrorText}` };",
        '  });',
        '',
        '  // The harness event appended to the ledger of the repository holding `cwd`. A refusal of a',
        '  // transition already written is the same event delivered twice, and nothing more.',
        '  async function capture(event: Record<string, unknown>, cwd: string, ctx?: Session): Promise<void> {',
        '    try {',
        '      await run(["lifecycle", JSON.stringify(event)], cwd);',
        '    } catch (error) {',
        '      const message = messageOf(error);',
        '      if (!message.includes(String(event.transition))) ctx?.ui.notify(`${COMMAND} lifecycle: ${message}`, "warning");',
        '    }',
        '  }',
        '  // Each item dispatched for a cut, by its task call and position: what its return records.',
        '  interface Dispatch {',
        '    cut: string;',
        '    role: string;',
        '    run: string;',
        '    workPackage?: string;',
        '    cwd: string;',
        '  }',
        '  const dispatches = new Map<string, Dispatch>();',
        '  async function returned(at: Dispatch, assayer: string, deliverable: unknown, tokens: unknown, ctx?: Session): Promise<void> {',
        '    const { cut, role, run: runId, workPackage, cwd } = at;',
        '    await capture(',
        '      {',
        '        kind: "returned",',
        '        transition: `${runId}/returned`,',
        '        cut,',
        '        role,',
        '        run: runId,',
        '        ...(workPackage === undefined ? {} : { workPackage }),',
        '        ...(typeof tokens === "number" ? { tokens } : {}),',
        '      },',
        '      cwd,',
        '      ctx,',
        '    );',
        '    const entry = deliverableEntry(deliverable, { cut, run: runId, assayer });',
        '    if (entry !== undefined) await capture(entry, cwd, ctx);',
        '  }',
        '',
        "  // EVERY `task` call, in any session: each item's assignment checked against its agent's",
        '  // contract, then the cut it serves, before any agent runs; a misfit refuses the whole call.',
        '  pi.on("tool_call", async (event, ctx) => {',
        '    if (event.toolName !== "task") return undefined;',
        '    const session = ctx as unknown as Session;',
        '    const input = (event.input ?? {}) as Record<string, unknown>;',
        '    const agents: AgentDefinition[] = (await discoverAgents(session.cwd)).agents;',
        '    const handoffs = itemsOf(input);',
        '    const reasons: string[] = [];',
        '    for (const h of handoffs) {',
        '      const declaration = agents.find((a) => a.name === h.agent);',
        '      const said = frontmatterOf(declaration);',
        '      h.strict = (said.output ?? declaration?.output) !== undefined;',
        '      h.schema = schemaOf(said);',
        '      if (h.schema === undefined) continue;',
        '      const value = assignmentOf(h.item, input);',
        '      const { reason } = checkAssignment(h.agent, h.schema, value);',
        '      if (reason !== undefined) reasons.push(reason);',
        '      else h.assignment = value as Record<string, unknown>;',
        '    }',
        '    if (reasons.length > 0) return { block: true, reason: reasons.join("\\n") };',
        '    const leads = new Set<string>();',
        '    const builders = new Map<string, string[]>();',
        '    for (const { schema, assignment } of handoffs) {',
        '      const cut = assignment?.cut;',
        '      if (typeof cut !== "string") continue;',
        '      if (requires(schema, CUT_BRIEF)) leads.add(cut);',
        '      if (requires(schema, ["workPackage"]) && typeof assignment?.workPackage === "string")',
        '        builders.set(cut, [...(builders.get(cut) ?? []), assignment.workPackage]);',
        '    }',
        '    for (const cut of leads) {',
        '      const reason = await leadRefusal(cut, session.cwd);',
        '      if (reason !== undefined) reasons.push(reason);',
        '    }',
        '    for (const [cut, packages] of builders) {',
        '      const reason = await builderRefusal(cut, packages, session.cwd);',
        '      if (reason !== undefined) reasons.push(reason);',
        '    }',
        '    if (reasons.length > 0) return { block: true, reason: reasons.join("\\n") };',
        '    for (const h of handoffs) {',
        '      const cut = h.assignment?.cut;',
        '      if (typeof cut !== "string") continue;',
        '      const workPackage = typeof h.assignment?.workPackage === "string" ? h.assignment.workPackage : undefined;',
        '      const at: Dispatch = { cut, role: h.agent, run: `${event.toolCallId}/${h.id}`, workPackage, cwd: session.cwd };',
        '      dispatches.set(`${event.toolCallId}#${h.index}`, at);',
        '      await capture(',
        '        {',
        '          kind: "dispatched",',
        '          transition: `${at.run}/dispatched`,',
        '          cut,',
        '          role: h.agent,',
        '          run: at.run,',
        '          ...(workPackage === undefined ? {} : { workPackage }),',
        '        },',
        '        session.cwd,',
        '        session,',
        '      );',
        '    }',
        '    // A return checked strictly against its output schema: one omitting a required field fails.',
        '    if (!handoffs.some((h) => h.strict && h.item.schemaMode === undefined)) return undefined;',
        '    const strict = (h: Handoff) => (h.strict && h.item.schemaMode === undefined ? { ...h.item, schemaMode: "strict" } : h.item);',
        '    return {',
        '      input: Array.isArray(input.tasks) ? { ...input, tasks: handoffs.map(strict) } : strict(handoffs[0] as Handoff),',
        '    };',
        '  });',
        '',
        '  // A settled `task` call returns each item it ran: its return, tokens and deliverable.',
        '  pi.on("tool_result", async (event, ctx) => {',
        '    if (event.toolName !== "task") return undefined;',
        '    const details = (event as { details?: { results?: unknown } }).details;',
        '    const results = Array.isArray(details?.results) ? details.results : [];',
        '    for (const raw of results) {',
        '      const r = (raw ?? {}) as Record<string, unknown>;',
        '      const at = dispatches.get(`${event.toolCallId}#${String(r.index)}`);',
        '      if (at === undefined) continue;',
        '      const structured = r.structuredOutput as { data?: unknown } | undefined;',
        '      const deliverable = structured?.data ?? jsonIn(r.output);',
        '      await returned(at, typeof r.id === "string" ? r.id : at.run, deliverable, r.tokens, ctx as unknown as Session);',
        '    }',
        '    return undefined;',
        '  });',
        "  // A background item settles outside its call: omp's own lifecycle event says so, and its",
        '  // structured deliverable sits beside its session file.',
        '  const bus = (pi as unknown as { events?: { on?(channel: string, fn: (data: unknown) => void): unknown } }).events;',
        '  bus?.on?.("task:subagent:lifecycle", (data) => {',
        '    const e = (data ?? {}) as Record<string, unknown>;',
        '    if (e.detached !== true || !["completed", "failed", "aborted"].includes(String(e.status))) return;',
        '    const at = dispatches.get(`${String(e.parentToolCallId)}#${String(e.index)}`);',
        '    if (at === undefined) return;',
        '    const file = typeof e.sessionFile === "string" ? e.sessionFile.replace(/\\.jsonl$/, ".json") : undefined;',
        '    const deliverable = file !== undefined && existsSync(file) ? jsonIn(readFileSync(file, "utf8")) : undefined;',
        '    void returned(at, typeof e.id === "string" ? e.id : at.run, deliverable, undefined);',
        '  });',
        '',
        '  // Each capability as its installed command explains it, asked once, at load, and offered',
        '  // as one tool with every verb it explains, to every agent.',
        '  for (const capability of CAPABILITIES) {',
        '    const explanation: Explanation = JSON.parse(await run([capability, "--explain"]));',
        '    const verbs = new Map(explanation.verbs.map((v) => [v.name, v]));',
        '    pi.registerTool({',
        '      name: explanation.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),',
        '      label: explanation.name,',
        '      description: description(explanation),',
        '      parameters: pi.typebox.Type.Unsafe(parameters(explanation)),',
        '      approval: (args: Record<string, unknown>) =>',
        '        verbs.get(String(args.verb))?.effect === "reads" ? "read" : "write",',
        '      async execute(_id: string, args: Record<string, unknown>, signal: AbortSignal | undefined, _update: unknown, ctx: { cwd: string }) {',
        '        const text = await run(argv(capability, verbs.get(String(args.verb)), args), ctx.cwd, signal);',
        '        return { content: [{ type: "text" as const, text }] };',
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
 * projection reports it as a guard omp cannot scope per agent.
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
  // The model roles: a definition names the role named for its agent, install seeds
  // the host's `modelRoles` entries for it and for its tier.
  roleRouting: ompRoleRouting,
  // The handoffs omp supplies an agent for itself.
  nativeAgents: OMP_NATIVE_AGENTS,
  // The isolated task a declared worktree becomes, and the host settings it needs.
  dispatchIsolation: ompDispatchIsolation,
  statusSegment: ompStatusSegment,
  agentRel: ompAgentRel,
  nativeEvents: canonicalToOmp,
  realizes: (event) => ompBindingOf(event) !== undefined,
  // NOTHING IS SCOPABLE: omp loads extension modules for every session, and no
  // agent declaration names one of its own, so no event can be narrowed to one
  // agent. A guard an agent composes is reported, never widened to every session.
  scopes: () => false,
  // `$HOME` and not a resolved path: the emitted module is read at RUN time on
  // whatever host it lands on, so it must not bake in the projecting machine's home.
  hookCommand: (anchor, workerFilename) =>
    `sh "$HOME/.omp/hooks/${anchor}/${workerFilename}"`,
  agentDef: (a, ctx) => ({
    filename: `${a.name}.md`,
    content: agentToOmpMd(a, ctx),
  }),
  skillDef: (s) => ({ filename: 'SKILL.md', content: skillToOmpMd(s) }),
  skillRel: ompSkillRel,
  // The session module: the cells no agent composes, and the guards the agents do.
  scopeActivatedSurface: (hooks, _agents, guards) =>
    ompScopeActivatedExtensions(hooks, guards),
  // The dispatch isolation module: what this harness composes from the agents
  // beyond their definitions. Starting a session as one goes through `omp --agent`,
  // which the capability module below registers, so nothing here launches anything.
  launchSurface: (agents) => ompIsolationExtensions(agents),
  // The capabilities a plain session is offered as tools, each composed at load
  // from the installed command's own explanation, and `--agent`.
  capabilitySurface: ompCapabilityExtensions,
  // Every scoped artifact is an extension module at the SESSION scope, which reads as
  // itself OR as omission, so a caller may pass a projection's `scope` field straight
  // through: it lands in `agent/extensions/`, which omp scans natively. Nothing is
  // placed per agent, so an agent's scope is refused rather than widened.
  scopedRel: (filename, agent) => {
    if (agent !== undefined && agent !== SESSION_SCOPE) {
      throw new Error(
        `omp places nothing for one agent alone, but '${filename}' is staged for '${agent}'; project the tree again`,
      );
    }
    return `${OMP_SESSION_DIR}/extensions/${filename}`;
  },
};
