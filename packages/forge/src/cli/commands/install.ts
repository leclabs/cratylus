// `cratylus install [--harness <name>]` — placing the canon on this machine, for a
// product owner who wants their agents here and has no repository in hand at all.
//
// IT INSTALLS THE CANON IT IS HANDED. The canon is not INVENTED by the projector — it
// is handed in by the hub package that mounts this verb, the canon the command is
// built with. `forge` still knows no canon: it installs what it was told to and
// refuses when it was told nothing. The hub package supplies it because it is the only
// package permitted to know both halves. Nothing in the working directory chooses
// another.
//
// WHERE IT PLACES: THE OWNED ROOT. Everything install places for the user on the
// harness lives under one root it owns (`~/.cratylus/<harness>`, `deploy/owned-root.ts`):
// the canon's agents and skills, the harness's adapters, and the version of cratylus
// that projected them. The harness's own surfaces only refer into it — for omp, the
// owned root linked into omp's plugin directory as an extension package, as `omp plugin
// link` would — so every project of the user is offered it and no host file is
// overwritten. Installing again REPLACES THE ROOT WHOLE: an upgrade leaves exactly what
// the new version places, and with the same version changes nothing. An EARLIER
// INSTALLATION (the layout before the owned root, on the harness's own surfaces) is
// taken back by its own record as part of the run, leaving what the host placed or
// changed.
//
// AT ONE OF TWO SCOPES (design/decisions/a-project-installation.md). For the user, by
// default, as above. For a project (`--scope project`), the root is
// `<project>/.cratylus/<harness>` and the
// references are the project's own (omp: `<project>/.omp/plugins`), each relative, so
// the project commits them for its team, and in that project omp loads the project's
// installation in place of the user's. A project install writes nothing under the
// home: no earlier installation is taken back, and the product owner's choices are read
// from and written to the project's settings (omp: `<project>/.omp/config.yml`). On a
// terminal the scope is asked where it was not told and the project is not the home,
// the user's preselected; `--yes`, or no terminal, takes the user's.
//
// THE RUN IS GUIDED, and it is the product owner's decisions that it guides. There are three:
// which harness, which of the rules the canon offers, and which model each tier the agents
// fall back to, and each persona's own role, runs on. What is placed is no decision: every
// agent and skill of the canon is installed. Each decision has a flag; a decision given by
// flag is never asked, and a run with no terminal (or `--yes`) takes the default. The
// rules default to none, and the choice, once made, is recorded by name and kept by every
// later install that is not told otherwise. Before anything is written the run
// shows what it would place, and on a terminal that is not fully decided it asks once to
// go ahead: declining writes nothing. What it places is then summarised in a few lines;
// the per-file detail is `--verbose`'s.
//
// THE PREVIEW IS THE RUN, DRY. The same steps run once with `dry` set, and what they
// report is what is shown — so the preview cannot describe something the placement
// then does differently.
//
// WHICH MODEL RUNS A ROLE IS THE HOST'S OWN SETTING
// (design/decisions/install-keeps-each-tiers-model-as-the-hosts-setting.md). An agent
// declaration names its own model role first, then the tier and effort it holds,
// and is never re-rendered with a model. The model a tier or a
// persona's role runs on is the product owner's to choose: install asks for it where the host
// binds none and writes the answer into the host's own model roles, recording nothing of
// it as cratylus's, so upgrade and uninstall keep it. A role the host already binds is
// never asked and never changed. Where install is neither told nor can ask, it places
// everything else and names, as the next step, each tier the agents fall back to that
// the host does not bind.
//
// SO IS WHETHER THE STATUS LINE SHOWS THE SESSION'S AGENT. It is asked
// only where the host hides the row an extension's status shows in, and was neither
// told (`--agent-status`) nor answered at an earlier install of this root. The answer
// is written as the host's own setting — shown, or left hidden as it is — and the record
// says only that it was answered, never what, so no later install asks for it or applies
// it again, and upgrade and uninstall leave the setting as the host has it. Where it can
// neither be told nor asked, it is named as a next step beside the unbound tiers.

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { START } from '@cratylus/runtime';
import {
  INSTALLATION_RECORD_FILE,
  type InstallScope,
} from '@cratylus/runtime/runtime-config';
import type { AgentPlugin } from '@cratylus/schema';
import {
  HARNESS_NAMES,
  type HarnessAdapter,
  adapterByName,
} from '../../adapters/registry/index.js';
import { CLI_BIN } from '../../bin-name.js';
import {
  addModelRoles,
  capabilityConfiguration,
  ensureStatusSegment,
  hidesExtensionStatus,
  holdsRenderTree,
  linkOwnedRoot,
  ownedRootIn,
  placeOwnedRoot,
  placementOf,
  projectOf,
  readInstallationRecord,
  rootFiles,
} from '../../deploy/index.js';
import {
  readModelRoles,
  sessionAgentHiding,
} from '../../deploy/read-settings.js';
import { harnessDirIn } from '../../deploy/scope.js';
import {
  type OfferedRuleset,
  type ProjectedTree,
  discoverValues,
  projectPluginSet,
} from '../../project/index.js';
import { resolveSkills } from '../../project/resolve-skills.js';
import { fail as failLine, say, warn as warnLine } from '../style.js';
import {
  type InstallPrompts,
  type RoleQuestion,
  hasTerminal,
  terminalPrompts,
} from './install-prompts.js';
import { removeEarlierInstallation } from './uninstall.js';

/** The product owner's answer to whether the status line shows the session's agent. */
type AgentStatus = 'show' | 'hide';

export interface InstallCmdOpts {
  /** Harness adapter name (`--harness`). Absent: the one the host has, or asked. */
  harness?: string;
  /** `--scope`: where the installation is, the user's or the project's of `cwd`.
   *  Absent: asked on a terminal where the project is not the home, the user's
   *  preselected; else the user's. */
  scope?: InstallScope;
  /** The canon this CLI was composed with, imported statically by its owner. */
  canon?: AgentPlugin;
  /** The declared version of the build doing the install, recorded in the owned root
   *  as the version that projected it. */
  version?: string;
  /** Show what would be placed and stop; write nothing. */
  dryRun?: boolean;
  cwd?: string;
  /** `--rules <name,…|none>`: the rules to place, each name a ruleset (taken whole)
   *  or one of its rules; `none` places none. Given at all, it settles the decision.
   *  Absent: the choice an earlier install recorded, else asked; told nothing and
   *  unable to ask, none. */
  rules?: string;
  /** `--model-roles <role=model,…|default>`: the model each named role runs on,
   *  bound in the host's own settings: a tier the agents fall back to, or the role
   *  named for an agent. `default` binds none. Given at all, it settles the decision.
   *  Absent: each tier and persona role the host does not bind is asked. */
  modelRoles?: string;
  /** `--agent-status <show|hide>`: whether the host's status line, where the host
   *  hides it, shows the session's agent. Given at all, it settles the decision.
   *  Absent: asked where the host hides it and no earlier install was answered. */
  agentStatus?: string;
  /** `--yes`: on a terminal, take the default of every decision not given, ask
   *  nothing, and place without asking to go ahead. */
  yes?: boolean;
  /** `--verbose`: also print the per-file detail of the run. */
  verbose?: boolean;
  /** Where the questions go. Default: the terminal. */
  prompts?: InstallPrompts;
  /** Whether questions may be asked at all. Default: stdin and stdout are a terminal. */
  interactive?: boolean;
  /** The user's HOME, when the run is for another: the owned root goes in
   *  `<home>/.cratylus/<harness>` and the references in that home's harness directory.
   *  Absent, the process's HOME, and each harness's own directory — its environment
   *  variable's where it has one and that is set. */
  home?: string;
}

/** Which harnesses this host actually has, by the directory each adapter reads (`home`
 *  names the home they are looked for in; absent, each harness's own default).
 *
 *  DETECTION IS OFFERED, NEVER ASSUMED. `install` writes no artifact a build
 *  reproduces; it acts on THIS machine, where "which harnesses are here" is the
 *  question being asked rather than a variable leaking into an output. */
export function detectHarnesses(home?: string): string[] {
  return HARNESS_NAMES.filter((name) =>
    existsSync(harnessDirIn(adapterByName(name), home)),
  );
}

/** A run that stops before writing, for a reason the product owner can act on. */
class Refusal extends Error {}

/** A model value as omp writes in its `modelRoles`: an alias or selector. */
const OMP_MODEL = /^\S+$/;

/** What the steps of one run did (or, under `dry`, would do). */
interface Findings {
  /** The per-file detail, in the order a verbose run prints it. */
  detail: string[];
  /** Each on its own line, always shown. */
  warnings: string[];
  /** Host files edited: the path and what changed in it. */
  edits: { path: string; what: string }[];
  /** The references the harness's own surfaces hold into the root, placed or kept. */
  references: string[];
  /** How many items of an earlier installation were taken back. */
  earlier: number;
  /** The model roles bound for the product owner in the host's settings, as `role → model`. */
  routes: string[];
  /** The tiers the agents fall back to that the host binds no model to. */
  unbound: string[];
  /** Whether the host hides the session's agent and was neither told nor asked
   *  whether to show it. */
  displayOpen: boolean;
  /** What the host had set and was left alone. */
  left: string[];
}

function emptyFindings(): Findings {
  return {
    detail: [],
    warnings: [],
    edits: [],
    references: [],
    earlier: 0,
    routes: [],
    unbound: [],
    displayOpen: false,
    left: [],
  };
}

const list = (names: readonly string[]): string => names.join(', ');
const plural = (n: number, noun: string): string =>
  `${n} ${noun}${n === 1 ? '' : 's'}`;

function parseNames(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** `--rules`, parsed against the rulesets offered: the rules named, each ruleset
 *  named standing for all its rules; `none` for none. */
function parseRules(raw: string, offered: readonly OfferedRuleset[]): string[] {
  if (raw.trim() === 'none') return [];
  const named = parseNames(raw);
  if (named.length === 0) {
    throw new Refusal(
      "--rules: no rule was named; pass rulesets or rules, comma-separated, or the single word 'none'",
    );
  }
  const rules: string[] = [];
  const unknown: string[] = [];
  for (const name of named) {
    const set = offered.find((s) => s.name === name);
    const rule = offered.some((s) => s.rules.some((r) => r.name === name));
    if (set !== undefined) rules.push(...set.rules.map((r) => r.name));
    else if (rule) rules.push(name);
    else unknown.push(name);
  }
  if (unknown.length > 0) {
    const offers =
      offered.length === 0
        ? 'this canon offers no rulesets'
        : offered
            .map((s) => `${s.name}: ${list(s.rules.map((r) => r.name))}`)
            .join('; ');
    throw new Refusal(
      `--rules: ${list(unknown.map((n) => `'${n}'`))} ${unknown.length === 1 ? 'is' : 'are'} no ruleset or rule of this canon (${offers}); name only those, or 'none'`,
    );
  }
  return rules;
}

/** `--model-roles`, parsed: the models by role, or `default` for none. */
function parseModelRoles(
  raw: string,
  valid: RegExp,
): Record<string, string> | 'default' {
  if (raw.trim() === 'default') return 'default';
  const chosen: Record<string, string> = {};
  for (const entry of parseNames(raw)) {
    const eq = entry.indexOf('=');
    const role = eq < 0 ? '' : entry.slice(0, eq).trim();
    const model = eq < 0 ? '' : entry.slice(eq + 1).trim();
    if (role === '' || model === '') {
      throw new Refusal(
        `--model-roles: '${entry}' must be <name>=<model>; pass <name>=<model>,… or the single word 'default'`,
      );
    }
    if (!valid.test(model)) {
      throw new Refusal(
        `--model-roles: '${model}' is not a usable model name; pass a model name the harness accepts`,
      );
    }
    chosen[role] = model;
  }
  return chosen;
}

export async function runInstall(opts: InstallCmdOpts): Promise<number> {
  try {
    return await install(opts);
  } catch (e) {
    if (!(e instanceof Refusal)) throw e;
    failLine('install', e.message);
    return 1;
  }
}

async function install(opts: InstallCmdOpts): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  // Whether anyone is there to ask, and whether this run asks: `--yes` is a terminal
  // that is told to take the defaults, which is not a run without one.
  const terminal = opts.interactive ?? hasTerminal();
  const interactive = opts.yes !== true && terminal;
  const prompts = opts.prompts ?? terminalPrompts;
  /** An answer, or the run ends: nothing has been written yet. */
  const answered = async <T>(pending: Promise<T | undefined>): Promise<T> => {
    const value = await pending;
    if (value === undefined) {
      throw new Refusal(
        'cancelled; nothing was written, so run it again to install',
      );
    }
    return value;
  };

  // ── WHICH HARNESS ────────────────────────────────────────────────────────────
  // Decided by flag, or by the host having exactly one, or asked; a host with none or
  // two and no terminal to ask on is refused, because picking silently would install
  // into a harness the product owner was not thinking about.
  let harness = opts.harness;
  if (harness === undefined) {
    const found = detectHarnesses(opts.home);
    if (found.length === 1) {
      harness = found[0] as string;
    } else if (interactive) {
      harness = await answered(prompts.harness(found, HARNESS_NAMES));
    } else if (found.length === 0) {
      throw new Refusal(
        `no harness found (looked for ${HARNESS_NAMES.map((n) => harnessDirIn(adapterByName(n), opts.home)).join(', ')}); name one with --harness <${HARNESS_NAMES.join('|')}>`,
      );
    } else {
      throw new Refusal(
        `found ${found.join(' and ')}; name one with --harness <${found.join('|')}>`,
      );
    }
  }
  if (!(HARNESS_NAMES as readonly string[]).includes(harness)) {
    throw new Refusal(
      `unknown harness '${harness}'; pass one of --harness <${HARNESS_NAMES.join('|')}>`,
    );
  }
  const adapter = adapterByName(harness);

  // ── WHICH SCOPE ──────────────────────────────────────────────────────────────
  // Told by flag; else asked on a terminal where the project of the working directory
  // is not the home, the user's preselected; else the user's
  // (design/decisions/a-project-installation.md).
  const home = resolve(opts.home ?? homedir());
  const project = projectOf(cwd, home);
  let scopeAsked = false;
  let scope: InstallScope = opts.scope ?? 'user';
  if (opts.scope === undefined && interactive && project !== home) {
    scope = await answered(prompts.scope(project));
    scopeAsked = true;
  }
  const placement = placementOf(adapter, scope, {
    cwd,
    ...(opts.home === undefined ? {} : { home: opts.home }),
  });
  if ('refused' in placement) throw new Refusal(placement.refused);
  const { harnessDir, root, base } = placement;
  // A project installation writes no product owner's own setting: a tier's model and how
  // the session shows its agent are each product owner's, and the project is shared with
  // every product owner in it (design/decisions/a-project-installation.md).
  if (scope === 'project' && opts.modelRoles !== undefined) {
    throw new Refusal(
      `--model-roles: a project installation binds no models, a model being each product owner's own setting; drop --model-roles, and bind them for yourself with \`${CLI_BIN} install --scope user --model-roles <role=model,…>\``,
    );
  }
  if (scope === 'project' && opts.agentStatus !== undefined) {
    throw new Refusal(
      `--agent-status: a project installation writes no status line choice, how the session shows its agent being each product owner's own setting; drop --agent-status, and settle it for yourself with \`${CLI_BIN} install --scope user --agent-status <show|hide>\``,
    );
  }
  // A project's `.cratylus/<harness>` that holds files and no installation record is
  // an earlier render tree, which no installation takes over
  // (design/decisions/a-project-installation.md).
  if (scope === 'project' && holdsRenderTree(root)) {
    throw new Refusal(
      `${root} holds files but no ${INSTALLATION_RECORD_FILE}, so it is an earlier render tree, not an installation; move it away, and install again`,
    );
  }
  // The installation this one replaces: its record, under the owned root.
  const prior = readInstallationRecord(root);

  // ── WHICH CANON ──────────────────────────────────────────────────────────────
  if (opts.canon === undefined) {
    // The refusal a LIBRARY owes: no canon was handed in, and inventing one is the
    // one thing this package may never do.
    throw new Refusal('no canon; mount this CLI from a package that names one');
  }
  const plugins: readonly AgentPlugin[] = [opts.canon];
  const source = 'the canon this command was built with';

  // ── RENDER ───────────────────────────────────────────────────────────────────
  // Which rulesets the canon offers is only known from a render: so render the whole
  // canon once to learn them, and again with the rules chosen.
  // Discovery refuses a canon whose values share a namespace or whose
  // reference graph dangles or cycles, before anything is rendered.
  await discoverValues(plugins);
  const render = async (rules: readonly string[]) => {
    const warnings: string[] = [];
    const report = await projectPluginSet({
      plugins,
      adapter,
      log: () => {},
      warn: (line) => warnings.push(line),
      // The hooks print each skill's directory, so what fits the harness's output cap
      // depends on this path; the projection cannot know it, install does.
      hostHome: base,
      rules,
    });
    return { report, warnings };
  };
  let rendered = await render([]);
  let open = opts.harness === undefined || scopeAsked;

  // ── WHICH RULES ──────────────────────────────────────────────────────────────
  // The rulesets the canon offers, each taken whole, rule by rule, or not at all. Told
  // by flag; else the choice an earlier install recorded, kept without asking (a rule
  // no longer offered is dropped from it, and named); else asked. A run that can
  // neither places none of them, and leaves the choice open: no offered rule is placed
  // unless chosen.
  const offered = rendered.report.rulesets;
  const offeredRules = offered.flatMap((s) => s.rules.map((r) => r.name));
  const recordedRules = Array.isArray(prior?.rules) ? prior.rules : undefined;
  let rules: string[] = [];
  let droppedRules: string[] = [];
  let rulesDecided = true;
  if (opts.rules !== undefined) {
    rules = parseRules(opts.rules, offered);
  } else if (recordedRules !== undefined) {
    rules = recordedRules.filter((n) => offeredRules.includes(n));
    droppedRules = recordedRules.filter((n) => !offeredRules.includes(n));
  } else if (offered.length === 0) {
    rulesDecided = false;
  } else if (interactive) {
    open = true;
    rules = await answered(prompts.rules(offered));
  } else {
    rulesDecided = false;
  }
  // Declaration order, each once.
  rules = offeredRules.filter((n) => rules.includes(n));
  const rulesOpen = !rulesDecided && offered.length > 0;

  if (rules.length > 0) {
    try {
      rendered = await render(rules);
    } catch (e) {
      // A choice the canon cannot place is a refusal with nothing written, not a crash.
      throw new Refusal(e instanceof Error ? e.message : String(e));
    }
  }
  const tree: ProjectedTree = rendered.report;

  // ── WHICH MODELS ─────────────────────────────────────────────────────────────
  // The model each tier the agents fall back to, and each persona's own role, runs on
  // (design/decisions/install-keeps-each-tiers-model-as-the-hosts-setting.md): told by
  // flag, or asked where the host binds none, and bound as the host's own setting. A
  // role the host binds is its own: never asked, never changed. A project installation
  // binds none: it reads the project's settings and the user's, writing neither, and
  // names each tier neither binds (design/decisions/a-project-installation.md).
  const routing = adapter.roleRouting;
  const agentModels = tree.agentModels;
  const agentRoles = Object.keys(agentModels).sort();
  const tierAgents = new Map<string, string[]>();
  if (routing !== undefined) {
    for (const [agent, { tier }] of Object.entries(agentModels)) {
      const role = routing.tierRole(tier);
      tierAgents.set(role, [...(tierAgents.get(role) ?? []), agent]);
    }
  }
  const tierRoles = [...tierAgents.keys()].sort();
  // The user's settings, which a user installation binds models in.
  const configFile =
    routing === undefined
      ? undefined
      : hostConfigPath(routing.configRels, harnessDirIn(adapter, opts.home));
  // What the host binds: at user scope, as the writer finds it, since only what it
  // can extend is asked and bound; at project scope, nothing is written, so both
  // files are read whole, in whatever layout they bind in.
  const hostBound = new Map(
    routing === undefined || configFile === undefined
      ? []
      : scope === 'project'
        ? [
            ...readModelRoles(
              hostConfigPath(routing.projectConfigRels, harnessDir),
            ),
            ...readModelRoles(configFile),
          ]
        : addModelRoles(configFile, [], { dry: true }).host,
  );

  const choices: Record<string, string> = {};
  const left: string[] = [];
  if (opts.modelRoles !== undefined) {
    if (routing === undefined) {
      throw new Refusal(
        `--model-roles: the '${adapter.name}' harness routes no roles; drop --model-roles`,
      );
    }
    const given = parseModelRoles(opts.modelRoles, OMP_MODEL);
    if (given !== 'default') {
      const unknown = Object.keys(given).filter(
        (r) => !tierRoles.includes(r) && !agentRoles.includes(r),
      );
      if (unknown.length > 0) {
        throw new Refusal(
          `--model-roles: ${list(unknown.map((r) => `'${r}'`))} ${unknown.length === 1 ? 'is' : 'are'} no tier or agent of this install (tiers: ${list(tierRoles)}; agents: ${list(agentRoles)}); name one of those`,
        );
      }
      for (const [role, model] of Object.entries(given)) {
        if (hostBound.has(role)) {
          left.push(
            `--model-roles ${role}=${model}: the host already binds the model role ${role}, so it is left as the host set it`,
          );
        } else {
          choices[role] = model;
        }
      }
    }
  } else if (routing !== undefined && scope === 'user') {
    const options = [...new Set(hostBound.values())]
      .filter((m) => !m.startsWith('@'))
      .sort();
    const questions: RoleQuestion[] = [
      ...tierRoles.map((role) => ({
        role,
        roleOf: 'tier' as const,
        agents: tierAgents.get(role) ?? [],
        options,
      })),
      ...tree.personas.map((role) => ({
        role,
        roleOf: 'persona' as const,
        agents: [role],
        options,
      })),
    ].filter((q) => !hostBound.has(q.role));
    if (questions.length > 0) open = true;
    if (interactive && questions.length > 0) {
      const picked = await answered(prompts.routes(questions));
      for (const q of questions) {
        const model = picked[q.role];
        if (model === undefined) continue;
        if (!OMP_MODEL.test(model)) {
          throw new Refusal(
            `'${model}' is not a usable model name; pass a name the harness accepts`,
          );
        }
        choices[q.role] = model;
      }
    }
  }
  // ── WHETHER THE STATUS LINE SHOWS THE SESSION'S AGENT ───────────────────────
  // Asked only where the host hides it and it was neither told nor answered before;
  // the answer is the host's own setting from then on. A project
  // installation neither asks nor writes it: it reads the project's settings over the
  // user's, and where they hide the agent names showing it as a next step: in the
  // project's file, where its own keys hide it, else at user scope
  // (design/decisions/a-project-installation.md).
  const statusHost =
    adapter.capabilitySurface === undefined ? undefined : adapter.statusSegment;
  const statusFile =
    statusHost === undefined || scope === 'project'
      ? undefined
      : hostConfigPath(statusHost.configRels, harnessDir);
  // Hidden: the host turned the row beneath the editor off, and its layout does not
  // list the segment that shows the session's agent inside the line instead.
  const hidden =
    statusHost !== undefined &&
    statusFile !== undefined &&
    existsSync(statusFile) &&
    hidesExtensionStatus(readFileSync(statusFile, 'utf8')) &&
    ensureStatusSegment(statusFile, statusHost, { dry: true }).state !==
      'present';
  // At project scope: whether the user's settings, with the project's over them, hide
  // the session's agent, which keys of each file do, and whether a user installation
  // has recorded the answer, which a user install then never applies again.
  const userStatusFile =
    statusHost === undefined
      ? undefined
      : hostConfigPath(statusHost.configRels, harnessDirIn(adapter, opts.home));
  const projectStatusFile =
    statusHost === undefined || scope !== 'project'
      ? undefined
      : hostConfigPath(statusHost.projectConfigRels, harnessDir);
  const projectHiding =
    statusHost === undefined ||
    userStatusFile === undefined ||
    projectStatusFile === undefined
      ? undefined
      : sessionAgentHiding(userStatusFile, projectStatusFile, statusHost);
  const answeredBefore =
    scope === 'user' && prior?.answered?.includes('agentStatus') === true;
  let agentStatus: AgentStatus | undefined;
  let statusAnswered = answeredBefore;
  if (opts.agentStatus !== undefined) {
    const told = opts.agentStatus.trim();
    if (told !== 'show' && told !== 'hide') {
      throw new Refusal(
        `--agent-status: '${told}' is neither show nor hide; pass --agent-status show or --agent-status hide`,
      );
    }
    if (statusHost === undefined) {
      throw new Refusal(
        `--agent-status: the '${adapter.name}' harness has no status line install shows an agent on; drop --agent-status`,
      );
    }
    if (answeredBefore) {
      left.push(
        `--agent-status ${told}: answered at an earlier install, so whether the status line shows the session's agent is the host's own setting, left as it is`,
      );
    } else {
      statusAnswered = true;
      if (hidden) agentStatus = told;
      else if (told === 'hide')
        left.push(
          `--agent-status hide: the host's status line already shows the session's agent, as the host set it, so it is left as it is`,
        );
    }
  } else if (hidden && !answeredBefore && interactive) {
    open = true;
    agentStatus = (await answered(prompts.agentStatus())) ? 'show' : 'hide';
    statusAnswered = true;
  }
  const displayOpen = hidden && !statusAnswered;

  const placedTree: ProjectedTree = rendered.report;
  // Each capability's configuration, as the canon's skills declare it.
  const configuration = capabilityConfiguration(
    (await resolveSkills(plugins)).map((s) => s.skill),
  );

  // Whether this project installation made the project's harness directory, which its
  // uninstall then removes where it is left empty
  // (design/decisions/a-project-installation.md); an installation that replaces another
  // keeps what that one recorded.
  const createdHarnessDir =
    scope === 'project' &&
    (prior !== null
      ? prior.createdHarnessDir === true
      : !existsSync(harnessDir));

  const apply = (dry: boolean): Findings => {
    const found = emptyFindings();
    found.warnings.push(...rendered.warnings);
    found.left.push(...left);
    found.detail.push(`canon: ${source}`, `harness: ${harness} → ${root}`);
    // An earlier installation first: what it placed on the harness's own surfaces is
    // taken back by its record, so what follows meets the host's own files. It was
    // only ever the user's, and a project install writes nothing under the home.
    const earlier =
      scope === 'user'
        ? removeEarlierInstallation(adapter, {
            ...(opts.home === undefined ? {} : { home: opts.home }),
            dryRun: dry,
          })
        : undefined;
    if (earlier !== undefined) {
      found.earlier = earlier.removed.length;
      for (const r of earlier.removed)
        found.detail.push(`  earlier: ${r.what}`);
      for (const l of earlier.left) found.left.push(`${l.what} — ${l.why}`);
    }
    // Whether the status line shows the session's agent: the product owner's answer, written
    // as the host's own setting and recorded nowhere as cratylus's.
    if (agentStatus === 'show' && statusFile !== undefined)
      showAgentStatus(found, statusFile, adapter, dry);
    else if (agentStatus === 'hide')
      found.detail.push(
        `  statusLine: ${statusFile} — the session's agent stays hidden, as answered`,
      );
    found.displayOpen = displayOpen;
    // The models the product owner chose, bound in the host's own model roles and recorded
    // nowhere as cratylus's: upgrade and uninstall keep them
    // (design/decisions/install-keeps-each-tiers-model-as-the-hosts-setting.md).
    const bound = new Set<string>();
    const wanted = Object.entries(choices).map(([role, value]) => ({
      role,
      value,
    }));
    if (configFile !== undefined && wanted.length > 0) {
      const result = addModelRoles(configFile, wanted, { dry });
      if (result.refused !== undefined) {
        found.warnings.push(
          `did not bind ${list(wanted.map((e) => e.role))} in ${configFile}: ${result.refused}; bind ${wanted.length === 1 ? 'it' : 'them'} under modelRoles there yourself`,
        );
      }
      for (const e of result.added) {
        bound.add(e.role);
        found.routes.push(`${e.role} → ${e.value}`);
      }
    }
    found.unbound.push(
      ...tierRoles.filter((t) => !hostBound.has(t) && !bound.has(t)),
    );
    const linked = linkOwnedRoot({
      adapter,
      harnessDir,
      root,
      scope,
      prior,
      dry,
    });
    found.references.push(
      ...linked.references.map((r) => join(harnessDir, r.path)),
    );
    for (const l of linked.left)
      found.warnings.push(`did not refer ${l.what} to ${root}: ${l.why}`);
    const placed = placeOwnedRoot({
      adapter,
      root,
      files: rootFiles(adapter, placedTree.files),
      ...(opts.version === undefined ? {} : { version: opts.version }),
      configuration,
      record: {
        scope,
        ...(rulesDecided ? { rules } : {}),
        references: linked.references,
        ...(createdHarnessDir ? { createdHarnessDir: true as const } : {}),
        ...(statusAnswered ? { answered: ['agentStatus' as const] } : {}),
      },
      dry,
    });
    for (const file of placed.files) found.detail.push(`  ${root}/${file}`);
    return found;
  };

  const confirming = interactive && open && opts.dryRun !== true;
  const show = (found: Findings, dry: boolean): void => {
    for (const line of describe(found, {
      adapter,
      scope,
      base,
      root,
      tree: placedTree,
      rules: { chosen: rules, dropped: droppedRules, open: rulesOpen },
      config: configFile,
      ...(projectHiding === undefined ||
      userStatusFile === undefined ||
      projectStatusFile === undefined
        ? {}
        : {
            agentHidden: {
              projectFile: projectStatusFile,
              userFile: userStatusFile,
              ...projectHiding,
              userAnswered:
                readInstallationRecord(
                  ownedRootIn(adapter, opts.home),
                )?.answered?.includes('agentStatus') === true,
            },
          }),
      dry,
    })) {
      say(line);
    }
    if (opts.verbose) for (const line of found.detail) say(line);
    for (const message of new Set(found.warnings)) warnLine('install', message);
  };
  if (opts.dryRun === true || confirming) {
    show(apply(true), true);
    if (opts.dryRun === true) return 0;
    const go = await answered(prompts.confirm('Install this?'));
    if (!go) {
      say('Nothing was written.');
      return 0;
    }
  }
  show(apply(false), false);
  return 0;
}

/**
 * What a run shows the product owner, before it places (`dry`) and after: the root and the
 * harness; the rules; the counts; the references into the root; an
 * earlier installation taken back; each host file edited and what changed in it; the
 * models bound for the product owner; what the host had set and was left alone — and, once
 * placed, what to do next, the tiers no model is bound to among it.
 */
function describe(
  found: Findings,
  ctx: {
    adapter: HarnessAdapter;
    scope: InstallScope;
    /** The home, or the project, the root is in. */
    base: string;
    root: string;
    tree: ProjectedTree;
    /** The rules placed, those of an earlier choice no longer offered, and whether the
     *  choice is still open: offered, but neither told, recorded nor asked. */
    rules: {
      chosen: readonly string[];
      dropped: readonly string[];
      open: boolean;
    };
    /** The user's host config file holding model roles, where the harness has one:
     *  where a user installation binds them, and a project one names to bind them in. */
    config: string | undefined;
    /** At project scope, where the settings hide the session's agent: each settings
     *  file and the keys in it that hide it, and whether a user installation has
     *  recorded the answer, so a user install would not apply it again. */
    agentHidden?: {
      projectFile: string;
      userFile: string;
      projectKeys: readonly string[];
      userKeys: readonly string[];
      userAnswered: boolean;
    };
    dry: boolean;
  },
): string[] {
  const { adapter, tree, dry } = ctx;
  const project = ctx.scope === 'project';
  const lines = [
    dry
      ? `${CLI_BIN} would install into ${adapter.name} at ${ctx.scope} scope, under ${ctx.root}:`
      : `${CLI_BIN} is installed in ${adapter.name} at ${ctx.scope} scope, under ${ctx.root}:`,
    `  ${plural(tree.agents, 'agent')}, ${plural(tree.skills, 'skill')}, ${plural(tree.hooks, 'hook')}`,
  ];
  if (ctx.rules.chosen.length > 0 || ctx.rules.dropped.length > 0) {
    const dropped =
      ctx.rules.dropped.length > 0
        ? `; ${dry ? 'would drop' : 'dropped'} ${list(ctx.rules.dropped)}, no longer offered`
        : '';
    const placed =
      ctx.rules.chosen.length > 0 ? list(ctx.rules.chosen) : 'none';
    lines.push(`  rules: ${placed}${dropped}`);
  }
  if (found.references.length > 0) {
    lines.push(
      project
        ? `  ${adapter.name} ${dry ? 'would load' : 'loads'} it in the project ${ctx.base}, in place of your user installation, by ${list(found.references)}`
        : `  ${adapter.name} ${dry ? 'would load' : 'loads'} it in every project, by ${list(found.references)}`,
    );
  }
  if (found.earlier > 0) {
    lines.push(
      `  ${dry ? 'would take back' : 'took back'} the earlier installation (${plural(found.earlier, 'item')})`,
    );
  }
  for (const edit of found.edits) {
    lines.push(`  ${dry ? 'would edit' : 'edited'} ${edit.path}: ${edit.what}`);
  }
  if (found.routes.length > 0) {
    lines.push(
      `  ${dry ? 'would bind' : 'bound'} in ${ctx.config}, as your own setting (upgrade and uninstall keep it): ${list(found.routes)}`,
    );
  }
  // A LOSS THE HARNESS CANNOT MAKE GOOD is said where the product owner reads what the run
  // does, not only in the warning under it: an agent declaring a worktree of its own
  // that this harness cannot start builds in its dispatcher's checkout — or, where the
  // harness isolates a dispatched agent another way, in the copy that makes, which
  // keeps the main checkout unwritten and lacks only what the adapter says.
  if (tree.unisolated.length > 0) {
    const one = tree.unisolated.length === 1;
    const [only] = tree.unisolated;
    const subject = one
      ? `the ${only} is not started in a worktree of its own`
      : `${list(tree.unisolated)} are not started in a worktree of their own`;
    const { dispatchIsolation } = adapter;
    const rest =
      dispatchIsolation === undefined
        ? `so ${one ? 'it builds' : 'they build'} in the checkout that dispatches ${one ? 'it' : 'them'}`
        : `${one ? 'it runs' : 'they run'} in an isolated copy of ${one ? 'its' : 'their'} dispatcher's checkout, never writing the main checkout, ${dispatchIsolation.lacks}`;
    lines.push(
      `  not realized: ${subject} on ${adapter.name}${dispatchIsolation === undefined ? ', ' : '; '}${rest}`,
    );
  }
  for (const item of found.left) {
    lines.push(`  left alone: ${item}`);
  }
  if (dry) return lines;

  const next = [
    `start or restart ${adapter.name}`,
    ...(found.unbound.length > 0
      ? [
          project
            ? `bind a model to ${found.unbound.length === 1 ? 'the tier' : 'each tier'} ${list(found.unbound)} in your own settings, under modelRoles in ${ctx.config} or with ${CLI_BIN} install --scope user --model-roles <tier=model,…>: the installed agents fall back to ${found.unbound.length === 1 ? 'it' : 'them'}, neither the project's settings nor yours bind a model to ${found.unbound.length === 1 ? 'it' : 'them'}, and a project installation binds none`
            : `bind a model to ${found.unbound.length === 1 ? 'the tier' : 'each tier'} ${list(found.unbound)} under modelRoles in ${ctx.config}: the installed agents fall back to ${found.unbound.length === 1 ? 'it' : 'them'}, and the host binds no model to ${found.unbound.length === 1 ? 'it' : 'them'}`,
        ]
      : []),
    ...(found.displayOpen
      ? [
          `choose whether the status line should show the session's agent, which your ${adapter.name} settings hide: run install again on a terminal to be asked, or pass --agent-status show (or --agent-status hide to keep it hidden)`,
        ]
      : []),
    ...(ctx.agentHidden === undefined
      ? []
      : [
          ctx.agentHidden.projectKeys.length > 0
            ? `show the session's agent, which the project's settings hide by ${list(ctx.agentHidden.projectKeys)} in ${ctx.agentHidden.projectFile}: that is the project's setting, to change there, and a project installation writes no status line choice`
            : ctx.agentHidden.userAnswered
              ? `show the session's agent, which your own settings hide by ${list(ctx.agentHidden.userKeys)} in ${ctx.agentHidden.userFile}: that is your own setting, answered at an earlier user install, to change there, and a project installation writes no status line choice`
              : `show the session's agent, which your own settings hide: ${CLI_BIN} install --scope user --agent-status show, since a project installation writes no status line choice`,
        ]),
    ...(ctx.rules.open
      ? [
          `choose the rules your agents follow in every project (rulesets: ${list(tree.rulesets.map((s) => s.name))}): run install again on a terminal to be asked, or pass --rules <ruleset-or-rule,…> (or --rules none)`,
        ]
      : []),
    ...(project
      ? [
          `commit ${relative(ctx.base, ctx.root)} and ${adapter.home} to share it with everyone working in ${ctx.base}`,
        ]
      : []),
    `to remove it all: ${uninstallCommand(adapter, ctx.scope)}${project ? `, run in ${ctx.base}` : ''}`,
    // Where the business analyst is installed, the run ends with how using cratylus starts.
    ...(tree.agentNames.includes('business-analyst') ? [START] : []),
  ];
  lines.push('  next:', ...next.map((item) => `    ${item}`));
  return lines;
}

/** The command that takes back the installation of `adapter` at `scope`. */
function uninstallCommand(
  adapter: HarnessAdapter,
  scope: InstallScope,
): string {
  return `${CLI_BIN} uninstall --harness ${adapter.name}${scope === 'project' ? ' --scope project' : ''}`;
}

/** The host config file a harness reads its settings from: the FIRST that exists,
 *  because the harness ignores the rest; a host with none gets the first. */
function hostConfigPath(
  configRels: readonly string[],
  harnessDir: string,
): string {
  const candidates = configRels.map((rel) => join(harnessDir, rel));
  return candidates.find((p) => existsSync(p)) ?? (candidates[0] as string);
}

/**
 * Show the session's agent on the host's status line at `path`, which hides it, as the
 * product owner answered, and say what was done. The edit is the host's own setting from
 * then on: recorded nowhere as cratylus's.
 *
 * omp's status line is a list of segments (`adapter.statusSegment`). An extension's
 * status — where the cratylus extension puts the name and mark of the agent a session
 * was started as — renders in the row beneath the editor unless the host set
 * `statusLine.showHookStatus: false`, and inside the line only where the layout lists
 * `status`. So `status` is listed in the host's own layout, or, where that layout is not
 * one install can extend, the row is shown again. A failure to edit is reported, and the
 * install itself still succeeds.
 */
function showAgentStatus(
  found: Findings,
  path: string,
  adapter: HarnessAdapter,
  dry: boolean,
): void {
  const host = adapter.statusSegment;
  if (host === undefined) return;
  const result = ensureStatusSegment(path, host, { dry });
  const rowShown = result.hookRowShown
    ? ` Its \`showHookStatus\` was false, which hid the only place there for the name and mark of the agent a session was started as, so ${dry ? 'it would be' : 'it is'} now true.`
    : '';
  switch (result.state) {
    case 'refused':
      found.warnings.push(
        `did not edit ${path} — ${result.refused}. A session's agent shows nowhere while \`statusLine.showHookStatus\` is false; set it true, or list the \`${host.segment}\` segment in a \`custom\` layout, to see it.`,
      );
      return;
    case 'present':
      found.detail.push(
        `  statusLine: ${path} — \`${host.segment}\` already listed in leftSegments`,
      );
      return;
    case 'other-preset':
    case 'own-layout':
      found.detail.push(
        `  statusLine: ${path} — the host's own layout is left as it is.${rowShown}`,
      );
      for (const line of result.advice ?? []) found.detail.push(`    ${line}`);
      if (result.hookRowShown)
        found.edits.push({
          path,
          what: "the row beneath the editor shows again, where a session's agent renders, as you answered",
        });
      return;
    case 'added':
      found.detail.push(
        `  statusLine${dry ? ' (dry-run)' : ''}: ${path} — ${dry ? 'would add' : 'added'} ${result.written.join('; ')}`,
      );
      found.edits.push({
        path,
        what: "the status line lists the segment that shows a session's agent, as you answered",
      });
      return;
  }
}
