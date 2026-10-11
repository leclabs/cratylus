// `cratylus install [--harness <name>]` — the zero-config path, for an operator who
// is not in a project at all.
//
// WHY THIS IS A DIFFERENT VERB FROM `deploy`. `project`/`deploy` serve a repository:
// a corpus is named in a config, rendered into a tree the repo owns, and placed. That
// is the right shape for a team pinning a corpus to a codebase, and the wrong shape
// for the far more common case — someone who wants their agents on this machine and
// has no repository in hand at all. Asking them to `npm init`, write a config, and
// learn a two-stage pipeline to obtain the DEFAULT answer is the friction this verb
// removes.
//
// WHAT MAKES IT SAFE TO DEFAULT A CORPUS HERE, when `project` must not. The corpus is
// not INVENTED by the projector — it is handed in by the hub package that mounts this
// verb. `forge` still knows no corpus: it installs what it was told to and refuses
// when it was told nothing. The hub package supplies the default because it is the
// only package permitted to know both halves. Another corpus is installed by naming
// it in a `cratylus.config.ts`, which is the one way to choose.
//
// A CONFIG STILL WINS. If the cwd has one, `install` uses it — otherwise the operator
// who wrote a config would be silently ignored by the friendliest command on the
// surface, which is the sharpest way to lose their trust. A config that cannot be
// loaded (its packages are not installed yet, it does not parse) ends the run with
// the loader's own one-line message, writing nothing: falling back to the default
// corpus there would install something other than what the config names.
//
// WHERE IT PLACES: THE OWNED ROOT. Everything install places for the user on the
// harness lives under one root it owns (`~/.cratylus/<harness>`, `deploy/owned-root.ts`):
// the corpus's agents and skills, the harness's adapters, and the version of cratylus
// that projected them. The harness's own surfaces only refer into it — for omp, the
// owned root linked into omp's plugin directory as an extension package, as `omp plugin
// link` would — so every project of the user is offered it and no host file is
// overwritten. Installing again REPLACES THE ROOT WHOLE: an upgrade leaves exactly what
// the new version places, and with the same version changes nothing. An EARLIER
// INSTALLATION (the layout before the owned root, on the harness's own surfaces) is
// taken back by its own record as part of the run, leaving what the host placed or
// changed.
//
// THE RUN IS GUIDED, and it is the operator's decisions that it guides. There are three:
// which harness, which of the corpus's practices, and which model each agent's model
// role falls back to. Each has a flag; a decision given by flag is never asked. The
// practices are the one decision no run takes for the operator: with neither
// `--practices` nor `--all`, a terminal is asked (or, under `--yes`, given the practices
// already installed here, or on a fresh host the corpus's preselected ones) and a run
// with no terminal refuses, writing nothing. Of the rest a run with no terminal (or
// `--yes`) takes the default. Before anything is written the run shows what it would
// place, and on a terminal that is not fully decided it asks once to go ahead:
// declining writes nothing. What it places is then summarised in a few lines; the
// per-file detail is `--verbose`'s.
//
// THE PREVIEW IS THE RUN, DRY. The same steps run once with `dry` set, and what they
// report is what is shown — so the preview cannot describe something the placement
// then does differently.
//
// WHAT THE HOST HAS ALREADY SET IS NEVER ASKED AND NEVER CHANGED. An agent declaration
// names its own model role first (decision 0111), so a role the host binds wins, and
// install writes no role into the host's settings; it asks nothing about a role the
// host already binds. The host's status line is edited only where the host has hidden
// the row an extension's status shows in, and that edit is recorded under the root.

import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative } from 'node:path';
import { mergeManifest } from '@cratylus/schema';
import {
  HARNESS_NAMES,
  type HarnessAdapter,
  adapterByName,
} from '../../adapters/registry/index.js';
import { CLI_BIN } from '../../bin-name.js';
import {
  ConfigLoadError,
  ConfigShapeError,
  type CratylusConfig,
  EmptyExtendsError,
  MissingPackageError,
  loadConfig,
  requirePlugins,
} from '../../config/index.js';
import { CONFIG_FILE } from '../../config/scaffold.js';
import {
  type HostEdit,
  addModelRoles,
  capabilityConfiguration,
  ensureStatusSegment,
  hidesExtensionStatus,
  linkOwnedRoot,
  mergeHostEdit,
  ownedRootIn,
  placeOwnedRoot,
  readInstallationRecord,
  readManifest,
  recordedLines,
  rootFiles,
} from '../../deploy/index.js';
import { harnessDirIn } from '../../deploy/scope.js';
import {
  type ProjectedTree,
  discoverFragments,
  projectPluginSet,
  resolveFragmentBodies,
} from '../../project/index.js';
import { resolveSkills } from '../../project/resolve-skills.js';
import type { AgentPlugin } from '../../resolve/index.js';
import { fail as failLine, say, warn as warnLine } from '../style.js';
import {
  type InstallPrompts,
  type RoleQuestion,
  hasTerminal,
  terminalPrompts,
} from './install-prompts.js';
import { removeEarlierInstallation } from './uninstall.js';

export interface InstallCmdOpts {
  /** Harness adapter name (`--harness`). Absent: the one the host has, or asked. */
  harness?: string;
  /** The corpus this CLI was composed with, imported statically by its owner. */
  corpus?: AgentPlugin;
  /** The declared version of the build doing the install, recorded in the owned root
   *  as the version that projected it. */
  version?: string;
  /** Show what would be placed and stop; write nothing. */
  dryRun?: boolean;
  cwd?: string;
  /** `--practices <name,…>`: the declared practices to install. Naming none is
   *  refused, as is a name the corpus does not declare. Given with neither this nor
   *  `all`, a terminal is asked and a run without one is refused. */
  practices?: string;
  /** `--all`: install every declared practice. Refused beside `practices`. */
  all?: boolean;
  /** `--model-roles <name=model,…|default>`: the model each named agent's declaration
   *  falls back to after its own model role, keyed by agent name; `default` leaves
   *  every agent on the tier and effort it holds. Given at all, it settles the
   *  decision: an agent it does not name takes the default. Absent: asked. */
  modelRoles?: string;
  /** `--yes`: on a terminal, take the default of every decision not given (the
   *  practices already installed here, or on a fresh host the corpus's preselected
   *  ones), ask nothing, and place without asking to go ahead. It is no answer to the
   *  practices decision where there is no terminal. */
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
 *  DETECTION IS OFFERED, NEVER ASSUMED. `project` may not guess a harness — a render
 *  tree that depends on which harness happens to be installed is not `REGENERABLE`,
 *  and that is a property about ARTIFACTS. `install` writes no artifact a build
 *  reproduces; it acts on THIS machine, where "which harnesses are here" is the
 *  question being asked rather than a variable leaking into an output. */
export function detectHarnesses(home?: string): string[] {
  return HARNESS_NAMES.filter((name) =>
    existsSync(harnessDirIn(adapterByName(name), home)),
  );
}

/** A run that stops before writing, for a reason the operator can act on. */
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
  /** The models the operator chose for agents' declarations, as `name → model`. */
  routes: string[];
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

/** `--model-roles`, parsed: the models by agent name, or `default` for none. */
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

/**
 * The cwd's config, or a refusal carrying the loader's message. `cratylus init` writes
 * a config whose packages are not yet installed, so an unloadable config is an
 * ordinary state of the directory: the loader's errors each already say what is wrong
 * and what to do, and that line is the whole of the run's output. A config that loads
 * but names no usable corpus (it extends nothing, or no plugin it extends carries the
 * dimension manifest) is refused the same way, before the render that would otherwise
 * end in a stack trace.
 */
async function loadConfigOrRefuse(configPath: string): Promise<CratylusConfig> {
  let config: CratylusConfig;
  try {
    config = await loadConfig(configPath);
    requirePlugins(config, configPath);
  } catch (e) {
    if (
      e instanceof MissingPackageError ||
      e instanceof ConfigLoadError ||
      e instanceof ConfigShapeError ||
      e instanceof EmptyExtendsError
    ) {
      throw new Refusal(e.message);
    }
    throw e;
  }
  try {
    mergeManifest(config.extends);
  } catch (e) {
    throw new Refusal(`${configPath}: ${(e as Error).message}`);
  }
  return config;
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
  // into a harness the operator was not thinking about.
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
  const harnessDir = harnessDirIn(adapter, opts.home);
  const root = ownedRootIn(adapter, opts.home);
  // The installation this one replaces: its record, under the owned root.
  const prior = readInstallationRecord(root);

  // ── WHICH CORPUS ─────────────────────────────────────────────────────────────
  const configPath = join(cwd, CONFIG_FILE);
  let plugins: readonly AgentPlugin[];
  let source: string;

  if (existsSync(configPath)) {
    const config = await loadConfigOrRefuse(configPath);
    plugins = config.extends;
    source = configPath;
  } else if (opts.corpus !== undefined) {
    plugins = [opts.corpus];
    source = 'the corpus this command was built with';
  } else {
    // The refusal a LIBRARY owes: no corpus was named, and inventing one is the one
    // thing this package may never do.
    throw new Refusal(
      `no corpus; write a ${CONFIG_FILE} that names one, or mount this CLI from a package that names one`,
    );
  }

  // ── RENDER ───────────────────────────────────────────────────────────────────
  // What the corpus renders depends on which practices are chosen, and which practices
  // the corpus declares is only known from a render: so render the whole corpus once
  // to learn them, and again with the ones chosen.
  const resolvedBodies = resolveFragmentBodies(
    await discoverFragments(plugins),
    [],
  );
  const render = async (
    practices: readonly string[] | undefined,
    models: Readonly<Record<string, string>> = {},
  ) => {
    const warnings: string[] = [];
    const report = await projectPluginSet({
      plugins,
      adapter,
      resolvedBodies,
      log: () => {},
      warn: (line) => warnings.push(line),
      // The hooks print each skill's directory, so what fits the harness's output cap
      // depends on this path; the projection cannot know it, install does.
      hostHome: opts.home ?? homedir(),
      ...(practices !== undefined ? { practices } : {}),
      models,
    });
    return { report, warnings };
  };
  let rendered = await render(undefined);

  // ── WHICH PRACTICES ──────────────────────────────────────────────────────────
  // The one decision about WHAT is placed. It is never guessed: a flag names the
  // practices, or a terminal is asked, and a run with neither refuses before anything
  // is written — under `--yes` and over an existing install alike, since what an
  // install placed last time is the default of a question, never an answer to one.
  // A corpus that declares no practices has nothing to decide and places all it has.
  const declared = rendered.report.practices;
  const declaredNames = declared.map((p) => p.name);
  const declaredList =
    declaredNames.length === 0 ? 'none' : list(declaredNames);
  // What is installed here: the practices the last install recorded (in its owned
  // root, or an earlier installation's deploy record) that this corpus still declares.
  // A host with none recorded is a fresh one.
  const recorded =
    prior !== null
      ? (prior.practices ?? null)
      : readManifest(harnessDir).practices;
  const installed =
    recorded === null ? [] : declaredNames.filter((n) => recorded.includes(n));
  const preselection =
    installed.length > 0
      ? installed
      : declared.filter((p) => p.preselected).map((p) => p.name);
  const nothingChosen = (): Refusal =>
    new Refusal(
      `no practice was chosen (declared: ${declaredList}); installing none is not installing everything, so to take it all out run ${CLI_BIN} uninstall --harness ${adapter.name}`,
    );
  let open = opts.harness === undefined;
  let chosen: string[] | undefined;
  if (opts.all === true && opts.practices !== undefined) {
    throw new Refusal(
      '--practices and --all were both given; name the practices to install, or take every one with --all, not both',
    );
  }
  if (opts.practices !== undefined) {
    const named = parseNames(opts.practices);
    if (named.length === 0) throw nothingChosen();
    const unknown = named.filter((n) => !declaredNames.includes(n));
    if (unknown.length > 0) {
      throw new Refusal(
        `--practices: ${list(unknown.map((n) => `'${n}'`))} ${unknown.length === 1 ? 'is' : 'are'} no practice of this corpus (declared: ${declaredList}); name only declared practices`,
      );
    }
    chosen = named;
  } else if (declaredNames.length === 0) {
    chosen = undefined;
  } else if (opts.all === true) {
    chosen = declaredNames;
  } else if (!terminal) {
    throw new Refusal(
      `no terminal to ask which practices to install; name them with --practices <${declaredNames.join(',')}> (comma-separated), or install every one with --all`,
    );
  } else if (opts.yes === true) {
    chosen = preselection;
  } else {
    open = true;
    chosen = await answered(prompts.practices(declared, preselection));
  }
  if (chosen !== undefined) {
    if (chosen.length === 0) throw nothingChosen();
    // Declaration order, each once: the order the corpus lists them in.
    chosen = declaredNames.filter((n) => (chosen as string[]).includes(n));
    try {
      rendered = await render(chosen);
    } catch (e) {
      // A choice the corpus cannot place whole (a practice not closed under dispatch,
      // say) is a refusal with nothing written, not a crash.
      throw new Refusal(e instanceof Error ? e.message : String(e));
    }
  }
  const removed = installed.filter(
    (n) => !(chosen ?? declaredNames).includes(n),
  );
  const decided = chosen === undefined ? undefined : { chosen, removed };
  const tree: ProjectedTree = rendered.report;

  // ── WHICH MODELS ─────────────────────────────────────────────────────────────
  // Each agent's declaration names its own model role first, then the tier and effort
  // it holds, or the model the operator chooses here (decision 0111). A role the host
  // binds itself wins at run time, so it is never asked about, and a `--model-roles`
  // entry for it is said to be left as the host set it. A role an earlier install
  // seeded into the host's config is install's own, which that installation's removal
  // takes back, and so is asked about like any other.
  const routing = adapter.roleRouting;
  const agentModels = tree.agentModels;
  const agentRoles = Object.keys(agentModels).sort();
  const hostRouted = new Set<string>();
  if (routing !== undefined) {
    const path = hostConfigPath(routing.configRels, harnessDir);
    const probe = addModelRoles(
      path,
      agentRoles.map((role) => ({ role, value: '' })),
      { dry: true },
    );
    const earlier = readManifest(harnessDir);
    const written = recordedLines(harnessDir, path);
    for (const [role, value] of probe.host) {
      if (!agentRoles.includes(role)) continue;
      const line = probe.current[role];
      const seeded =
        !earlier.hostRoutes.includes(role) &&
        (earlier.modelRoleSeeds[role] === value ||
          (line !== undefined && written.has(line)));
      if (!seeded) hostRouted.add(role);
    }
  }
  const askable = agentRoles.filter((r) => !hostRouted.has(r));

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
      const unknown = Object.keys(given).filter((r) => !agentRoles.includes(r));
      if (unknown.length > 0) {
        throw new Refusal(
          `--model-roles: ${list(unknown.map((r) => `'${r}'`))} ${unknown.length === 1 ? 'is' : 'are'} no agent this install places (agents: ${list(agentRoles)}); name one of those agents`,
        );
      }
      for (const [role, model] of Object.entries(given)) {
        if (hostRouted.has(role)) {
          left.push(
            `--model-roles ${role}=${model}: the host already binds the model role ${role}, so it is left as the host set it`,
          );
        } else {
          choices[role] = model;
        }
      }
    }
  } else if (routing !== undefined && askable.length > 0) {
    open = true;
    if (interactive) {
      const seeds = Object.values(agentModels).map((m) => routing.agentRole(m));
      const questions: RoleQuestion[] = askable.map((role) => ({
        role,
        options: [...new Set(seeds)].sort(),
        initial: routing.agentRole(
          agentModels[role] as ProjectedTree['agentModels'][string],
        ),
      }));
      const picked = await answered(prompts.routes(questions));
      for (const q of questions) {
        const model = picked[q.role];
        if (model === undefined || model === q.initial) continue;
        if (!OMP_MODEL.test(model)) {
          throw new Refusal(
            `'${model}' is not a usable model name; pass a name the harness accepts`,
          );
        }
        choices[q.role] = model;
      }
    }
  }
  if (Object.keys(choices).length > 0) {
    rendered = await render(chosen, choices);
  }
  const placedTree: ProjectedTree = rendered.report;
  // Each capability's configuration, as the corpus's skills declare it.
  const configuration = capabilityConfiguration(
    (await resolveSkills(plugins)).map((s) => s.skill),
  );

  const apply = (dry: boolean): Findings => {
    const found = emptyFindings();
    found.warnings.push(...rendered.warnings);
    found.left.push(...left);
    found.detail.push(`corpus: ${source}`, `harness: ${harness} → ${root}`);
    for (const [role, model] of Object.entries(choices))
      found.routes.push(`${role} → ${model}`);
    // An earlier installation first: what it placed on the harness's own surfaces is
    // taken back by its record, so what follows meets the host's own files.
    const earlier = removeEarlierInstallation(adapter, {
      ...(opts.home === undefined ? {} : { home: opts.home }),
      dryRun: dry,
    });
    if (earlier !== undefined) {
      found.earlier = earlier.removed.length;
      for (const r of earlier.removed)
        found.detail.push(`  earlier: ${r.what}`);
      for (const l of earlier.left) found.left.push(`${l.what} — ${l.why}`);
    }
    // The host's status line, where the host has hidden an extension's status.
    const hostEdits: Record<string, HostEdit> = { ...prior?.hostEdits };
    const status = showAgentStatus(found, adapter, { harnessDir, dry });
    if (status !== undefined) {
      const key = relative(harnessDir, status.path);
      const merged = mergeHostEdit(hostEdits[key], status.edit);
      if (merged !== undefined) hostEdits[key] = merged;
    }
    const linked = linkOwnedRoot({ adapter, harnessDir, root, prior, dry });
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
        ...(chosen === undefined ? {} : { practices: chosen }),
        references: linked.references,
        hostEdits,
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
      root,
      tree: placedTree,
      practices: decided,
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
 * What a run shows an operator, before it places (`dry`) and after: the root and the
 * harness; the practices; the counts; the references into the root; an earlier
 * installation taken back; each host file edited and what changed in it; the models
 * chosen; what the host had set and was left alone — and, once placed, what to do next.
 */
function describe(
  found: Findings,
  ctx: {
    adapter: HarnessAdapter;
    root: string;
    tree: ProjectedTree;
    /** The practices installed and those taken out, or `undefined` where the corpus
     *  declares none. */
    practices:
      | { chosen: readonly string[]; removed: readonly string[] }
      | undefined;
    dry: boolean;
  },
): string[] {
  const { adapter, tree, dry } = ctx;
  const lines = [
    dry
      ? `${CLI_BIN} would install into ${adapter.name}, under ${ctx.root}:`
      : `${CLI_BIN} is installed in ${adapter.name}, under ${ctx.root}:`,
    `  ${plural(tree.agents, 'agent')}, ${plural(tree.skills, 'skill')}, ${plural(tree.hooks, 'hook')}`,
  ];
  if (ctx.practices !== undefined) {
    const removed =
      ctx.practices.removed.length > 0
        ? `; ${dry ? 'would remove' : 'removed'} ${list(ctx.practices.removed)}`
        : '';
    lines.push(`  practices: ${list(ctx.practices.chosen)}${removed}`);
  }
  // Each guard the agents compose: the tell it holds and whom it judges, or that the
  // harness carries it as a declaration alone.
  for (const guard of tree.guards) {
    lines.push(
      `  guard ${guard.guard} (${guard.tell}): ${guard.realized ? 'judges' : 'not realized on this harness, a declaration alone for'} ${list(guard.agents)}`,
    );
  }
  if (found.references.length > 0) {
    lines.push(
      `  ${adapter.name} ${dry ? 'would load' : 'loads'} it in every project, by ${list(found.references)}`,
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
      `  models you chose: ${list(found.routes)}; every other agent runs on the tier and effort it holds`,
    );
  }
  // A LOSS THE HARNESS CANNOT MAKE GOOD is said where the operator reads what the run
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
        ? `so ${one ? 'it builds' : 'they build'} in the checkout that dispatches ${one ? 'it' : 'them'}, and the land gate refuses work built in the main checkout`
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
    `to remove it all: ${CLI_BIN} uninstall --harness ${adapter.name}`,
  ];
  lines.push('  next:', ...next.map((item) => `    ${item}`));
  return lines;
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
 * Make the host's status line show which agent a session is, where the host has hidden
 * it, and say what was done; the edit, for the record under the root.
 *
 * omp's status line is a list of segments (`adapter.statusSegment`). An extension's
 * status — where the cratylus extension puts the name and mark of the agent a session
 * was started as — renders in the row beneath the editor unless the host set
 * `statusLine.showHookStatus: false`, and inside the line only where the layout lists
 * `status`. A host that hid that row is the one host that would see a session's agent
 * nowhere, so it alone is edited: `status` listed in its own layout, or, where that
 * layout is not one install can extend, the row shown again. Every other host's
 * settings are left as they are. A failure to edit is reported, and the install itself
 * still succeeds.
 */
function showAgentStatus(
  found: Findings,
  adapter: HarnessAdapter,
  run: { harnessDir: string; dry: boolean },
): { path: string; edit: HostEdit } | undefined {
  const host = adapter.statusSegment;
  if (host === undefined || adapter.capabilitySurface === undefined)
    return undefined;
  const { dry } = run;
  const path = hostConfigPath(host.configRels, run.harnessDir);
  if (!existsSync(path) || !hidesExtensionStatus(readFileSync(path, 'utf8')))
    return undefined;
  const result = ensureStatusSegment(path, host, { dry });
  const edit =
    result.edit === undefined ? undefined : { path, edit: result.edit };
  const rowShown = result.hookRowShown
    ? ` Its \`showHookStatus\` was false, which hid the only place there for the name and mark of the agent a session was started as, so ${dry ? 'it would be' : 'it is'} now true.`
    : '';
  switch (result.state) {
    case 'refused':
      found.warnings.push(
        `did not edit ${path} — ${result.refused}. A session's agent shows nowhere while \`statusLine.showHookStatus\` is false; set it true, or list the \`${host.segment}\` segment in a \`custom\` layout, to see it.`,
      );
      return edit;
    case 'present':
      found.detail.push(
        `  statusLine: ${path} — \`${host.segment}\` already listed in leftSegments`,
      );
      return edit;
    case 'other-preset':
    case 'own-layout':
      found.detail.push(
        `  statusLine: ${path} — the host's own layout is left as it is.${rowShown}`,
      );
      for (const line of result.advice ?? []) found.detail.push(`    ${line}`);
      if (result.hookRowShown)
        found.edits.push({
          path,
          what: "the row beneath the editor shows again, where a session's agent renders",
        });
      return edit;
    case 'added':
      found.detail.push(
        `  statusLine${dry ? ' (dry-run)' : ''}: ${path} — ${dry ? 'would add' : 'added'} ${result.written.join('; ')}`,
      );
      found.edits.push({
        path,
        what: "the status line lists the segment that shows a session's agent",
      });
      return edit;
  }
}
