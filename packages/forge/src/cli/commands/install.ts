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
// THE RUN IS GUIDED, and it is the operator's decisions that it guides. There are three:
// which harness, which of the corpus's practices, and which model each agent's model
// role routes to. Each has a flag; a decision
// given by flag is never asked. The practices are the one decision no run takes for
// the operator: with neither `--practices` nor `--all`, a terminal is asked (or, under
// `--yes`, given the practices already installed here, or on a fresh host the corpus's
// preselected ones) and a run with no terminal refuses, writing nothing. Of the rest a
// run with no terminal (or `--yes`) takes the default. Before anything is written the
// run shows what it would place, and on a terminal that is not fully decided it asks
// once to go ahead: declining writes nothing. What it places is then summarised in a
// few lines; the per-file detail is `--verbose`'s.
//
// THE PREVIEW IS THE RUN, DRY. The same steps run once with `dry` set, and what they
// report is what is shown — so the preview cannot describe something the placement
// then does differently.
//
// WHAT THE HOST HAS ALREADY SET IS NEVER ASKED AND NEVER CHANGED. A model role the host
// set itself is left as it is, named as the host's, and a `--model-roles` entry for it
// is left as the host set it and said so.

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
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
  MANIFEST_REL,
  type ModelRoleEntry,
  addModelRoles,
  ensureBadgeStatusLine,
  ensureHostSettings,
  ensureStatusSegment,
  hasManifest,
  markMigratedConfig,
  modelRoleLine,
  noteHostEdit,
  noteHostRoutes,
  readManifest,
  recordedLines,
  recordsHostEdits,
  removePersonaCommands,
  retargetHostEdit,
  treeNames,
  writeManifest,
} from '../../deploy/index.js';
import { harnessDirIn } from '../../deploy/scope.js';
import {
  type ProjectedTree,
  discoverFragments,
  projectPluginSet,
  resolveFragmentBodies,
  writeRenderTree,
} from '../../project/index.js';
import type { AgentPlugin } from '../../resolve/index.js';
import { fail as failLine, say, warn as warnLine } from '../style.js';
import { deployTree } from './deploy.js';
import {
  type InstallPrompts,
  type RoleQuestion,
  hasTerminal,
  terminalPrompts,
} from './install-prompts.js';

export interface InstallCmdOpts {
  /** Harness adapter name (`--harness`). Absent: the one the host has, or asked. */
  harness?: string;
  /** The corpus this CLI was composed with, imported statically by its owner. */
  corpus?: AgentPlugin;
  /** Show what would be placed and stop; write nothing. */
  dryRun?: boolean;
  cwd?: string;
  /** `--practices <name,…>`: the declared practices to install. Naming none is
   *  refused, as is a name the corpus does not declare. Given with neither this nor
   *  `all`, a terminal is asked and a run without one is refused. */
  practices?: string;
  /** `--all`: install every declared practice. Refused beside `practices`. */
  all?: boolean;
  /** `--model-roles <name=model,…|default>`: the model each named agent's model role
   *  routes to, keyed by agent name; `default` leaves every agent on the tier and
   *  effort it holds. Given at all, it settles the decision: an agent it does not name
   *  takes the default. Absent: asked. */
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
  /** The user's HOME, when the run is for another: the harness's files go in
   *  `<home>/<its dot-directory>`. Absent, each harness's own directory — its
   *  environment variable's where it has one and that is set, else under the
   *  process's HOME. */
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

/** The tier and effort one agent's model role binds. */
type AgentModel = ProjectedTree['agentModels'][string];

/** What the steps of one run did (or, under `dry`, would do). */
interface Findings {
  /** The per-file detail, in the order a verbose run prints it. */
  detail: string[];
  /** Each on its own line, always shown. */
  warnings: string[];
  /** What a deploy that failed said, as its own lines, always shown. */
  failures: string[];
  /** The runtime config the deploy wrote (or would), which lives outside the
   *  harness directory. */
  runtimeConfig: string | undefined;
  /** Directories outside the harness directory the deploy placed files in, with
   *  how many. */
  outside: Record<string, number>;
  /** Host files edited: the path and what changed in it. */
  edits: { path: string; what: string }[];
  /** The models the operator chose for agents' model roles, as `name → model`. */
  routes: string[];
  /** What the host had set and was left alone. */
  left: string[];
  /** The persona commands an earlier install linked, removed by this one: starting
   *  as an agent goes through the harness itself now. */
  unlinked: string[];
}

function emptyFindings(): Findings {
  return {
    detail: [],
    warnings: [],
    failures: [],
    runtimeConfig: undefined,
    outside: {},
    edits: [],
    routes: [],
    left: [],
    unlinked: [],
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
  const render = async (practices: readonly string[] | undefined) => {
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
  const recorded = readManifest(harnessDir).practices;
  // What is installed here: the practices the last install recorded that this corpus
  // still declares. A host with none recorded is a fresh one.
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
  // Each agent's model role binds the tier and effort it holds. An entry the host set
  // itself is the host's: never asked, never changed. An entry install seeded and
  // nobody chose since is install's own, which this run moves to what it seeds now.
  const routing = adapter.roleRouting;
  const agentModels = tree.agentModels;
  const agentRoles = Object.keys(agentModels).sort();
  const tiers = [
    ...new Set(Object.values(agentModels).map((m) => m.tier)),
  ].sort();
  const hostRouted = new Set<string>();
  const seeded = new Set<string>();
  let configRefused = false;
  if (routing !== undefined) {
    const path = hostConfigPath(routing.configRels, harnessDir);
    const roles = [...tiers, ...agentRoles];
    const probe = addModelRoles(
      path,
      roles.map((role) => ({ role, value: '' })),
      { dry: true },
    );
    configRefused = probe.refused !== undefined;
    const record = readManifest(harnessDir);
    // A host installed before seeds were recorded by value: its seeds are the lines
    // recorded as install's insertions, standing as they were written.
    const written = recordedLines(harnessDir, path);
    for (const [role, value] of probe.host) {
      if (!roles.includes(role)) continue;
      const line = probe.current[role];
      const own =
        !record.hostRoutes.includes(role) &&
        (record.modelRoleSeeds[role] === value ||
          (line !== undefined && written.has(line)));
      (own ? seeded : hostRouted).add(role);
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
            `--model-roles ${role}=${model}: the host already set the model role ${role}, so it is left as the host set it`,
          );
        } else {
          choices[role] = model;
        }
      }
    }
  } else if (routing !== undefined && askable.length > 0 && !configRefused) {
    open = true;
    if (interactive) {
      const seeds = Object.values(agentModels).map((m) => routing.agentRole(m));
      const questions: RoleQuestion[] = askable.map((role) => ({
        role,
        options: [...new Set(seeds)].sort(),
        initial: routing.agentRole(agentModels[role] as AgentModel),
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

  // ── STAGE, THEN THE COMMANDS ─────────────────────────────────────────────────
  // The tree is a TEMP artifact and is removed. `install` is not `project`: the
  // operator asked for agents on their machine, not for a render tree to keep, and
  // leaving one in their cwd would be this command inventing a project for someone
  // who told us they have none.
  const stage = mkdtempSync(join(tmpdir(), `${CLI_BIN}-install-`));
  try {
    writeRenderTree(stage, tree.files);
    const stageTree = {
      agentsDir: resolve(stage, 'agents'),
      skillsDir: resolve(stage, 'skills'),
    };
    // A corpus with no skills (or no agents) renders no such dir. This is install's own
    // scratch tree, so an empty one is the truth about it; deploy refuses a render dir
    // that is absent, as it must for one an operator named.
    mkdirSync(stageTree.agentsDir, { recursive: true });
    mkdirSync(stageTree.skillsDir, { recursive: true });
    const agentNames = treeNames('agent', stageTree, adapter.agentExt);

    // A host this ran on before edits were recorded has the lines its install put in
    // the host's config files with nothing saying so. Read BEFORE the deploy rewrites
    // the record: what this install finds there, byte for byte what it would write,
    // it adopts.
    const migrating = hasManifest(harnessDir) && !recordsHostEdits(harnessDir);

    const apply = async (
      dry: boolean,
    ): Promise<{ rc: number; found: Findings }> => {
      const found = emptyFindings();
      found.warnings.push(...rendered.warnings);
      found.left.push(...left);
      found.detail.push(
        `corpus: ${source}`,
        `harness: ${harness} → ${harnessDir}`,
      );
      const deployed = await deployTree({
        agentsDir: stageTree.agentsDir,
        skillsDir: stageTree.skillsDir,
        hooksDir: stage,
        companions: {},
        kind: 'all',
        scope: 'user',
        harness,
        // The harness's own directory, which deploy takes verbatim when this run was
        // given a home (a bare home dir would make it print its self-correcting NOTE
        // on every run of every kind), and resolves as this run did when it was not.
        home: opts.home === undefined ? null : harnessDir,
        command: 'install',
        project: null,
        config: existsSync(configPath) ? configPath : null,
        only: null,
        // THE PLUGIN SET TRAVELS WITH THE CALL. `install` has no config file by
        // definition, so deploy must be handed the plugin set rather than sent to read
        // it back off disk — otherwise the zero-config path deploys agents and skills
        // onto a host whose runtime cannot validate an event name or read the
        // configuration its capabilities need.
        plugins,
        dryRun: dry,
        check: false,
        log: (line) => found.detail.push(line),
        warn: (message) => found.warnings.push(message),
        fail: (message) => found.failures.push(message),
      });
      const rc = deployed.rc;
      if (rc !== 0) return { rc, found };
      found.runtimeConfig = deployed.runtimeConfig?.path;
      found.outside = deployed.outside;
      // What this install chose, for the next to preselect from and for the record to
      // say what is installed here.
      if (!dry && chosen !== undefined) {
        writeManifest(harnessDir, {
          ...readManifest(harnessDir),
          practices: chosen,
        });
      }
      // The definitions just placed name their agents' model roles; the host maps a
      // role to a model. Deploy is unchanged — this is install's own step, and a deploy
      // that failed places no roles to back.
      seedModelRoles(found, adapter, tree.agentModels, choices, seeded, {
        harnessDir,
        dry,
        adopt: migrating,
      });
      // The settings a dispatched agent's isolation needs: install's own step, for the
      // agents the projection could not start in a worktree.
      seedDispatchIsolation(found, adapter, tree.unisolated, {
        harnessDir,
        dry,
      });
      // Then where a session's agent shows: the host's own status line, made to show it.
      showAgentStatus(found, adapter, agentNames, {
        harnessDir,
        dry,
        adopt: migrating,
      });
      // Then the persona commands an earlier install linked, which nothing links now.
      for (const l of removePersonaCommands({
        home: opts.home ?? homedir(),
        harnessDir,
        dry,
      }).links) {
        if (l.state === 'removed' || l.state === 'remove') {
          found.unlinked.push(l.link);
        } else if (l.state === 'kept') {
          found.left.push(`${l.link}: ${l.reason} (${l.current})`);
        }
      }
      return { rc, found };
    };

    const confirming = interactive && open && opts.dryRun !== true;
    if (opts.dryRun === true || confirming) {
      const planned = await apply(true);
      if (planned.rc !== 0) return failed(planned.found, planned.rc, opts);
      for (const line of describe(planned.found, {
        adapter,
        harnessDir,
        tree,
        practices: decided,
        dry: true,
      })) {
        say(line);
      }
      if (opts.verbose) for (const line of planned.found.detail) say(line);
      warnAll(planned.found);
      if (opts.dryRun === true) return 0;
      const go = await answered(prompts.confirm('Install this?'));
      if (!go) {
        say('Nothing was written.');
        return 0;
      }
    }

    const placed = await apply(false);
    if (placed.rc !== 0) return failed(placed.found, placed.rc, opts);
    if (opts.verbose) for (const line of placed.found.detail) say(line);
    for (const line of describe(placed.found, {
      adapter,
      harnessDir,
      tree,
      practices: decided,
      dry: false,
    })) {
      say(line);
    }
    warnAll(placed.found);
    return 0;
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

/** A run that failed: what the deploy said, its detail under `--verbose`, and its
 *  code. */
function failed(
  found: Findings,
  rc: number,
  opts: Pick<InstallCmdOpts, 'verbose'>,
): number {
  for (const message of found.failures) failLine('install', message);
  if (opts.verbose) {
    for (const line of found.detail) process.stderr.write(`${line}\n`);
  }
  warnAll(found);
  return rc;
}

/** Every warning, one line each, after the rest: a warning is never verbose's. */
function warnAll(found: Findings): void {
  for (const message of new Set(found.warnings)) warnLine('install', message);
}

/**
 * What a run shows an operator, before it places (`dry`) and after: the harness and
 * its home; the practices; the counts; each host file edited and what changed in it;
 * the models chosen; the persona commands an earlier install linked and this one
 * removed; what the host had set and was left alone —
 * and, once placed, what to do next.
 */
function describe(
  found: Findings,
  ctx: {
    adapter: HarnessAdapter;
    harnessDir: string;
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
      ? `${CLI_BIN} would install into ${adapter.name} (${ctx.harnessDir}):`
      : `${CLI_BIN} is installed in ${adapter.name} (${ctx.harnessDir}):`,
    `  ${plural(tree.agents, 'agent')}, ${plural(tree.skills, 'skill')}, ${plural(tree.hooks, 'hook')}`,
  ];
  if (ctx.practices !== undefined) {
    const removed =
      ctx.practices.removed.length > 0
        ? `; ${dry ? 'would remove' : 'removed'} ${list(ctx.practices.removed)}`
        : '';
    lines.push(`  practices: ${list(ctx.practices.chosen)}${removed}`);
  }
  for (const edit of found.edits) {
    lines.push(`  ${dry ? 'would edit' : 'edited'} ${edit.path}: ${edit.what}`);
  }
  // EVERY FILE WRITTEN OUTSIDE THE HARNESS DIRECTORY IS NAMED, the runtime config
  // included: the operator reads this to learn what the run touches.
  for (const [root, count] of Object.entries(found.outside)) {
    lines.push(
      `  ${dry ? 'would write' : 'wrote'} ${plural(count, 'file')} in ${root}`,
    );
  }
  if (found.runtimeConfig !== undefined) {
    lines.push(
      `  ${dry ? 'would write' : 'wrote'} the runtime config ${found.runtimeConfig}`,
    );
  }
  if (found.routes.length > 0) {
    lines.push(
      `  models you chose: ${list(found.routes)}; every other agent runs on the tier and effort it holds`,
    );
  }
  if (found.unlinked.length > 0) {
    lines.push(
      `  ${dry ? 'would remove' : 'removed'} ${plural(found.unlinked.length, 'persona command')} an earlier install linked (start an agent with ${adapter.name} itself now): ${list(found.unlinked)}`,
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

/** The host config file a harness reads its settings from, and so the one to edit: the
 *  FIRST that exists, because the harness ignores the rest; a host with none gets the
 *  first, and never a file that would shadow one it already has. */
function hostConfigPath(
  configRels: readonly string[],
  harnessDir: string,
): string {
  const candidates = configRels.map((rel) => join(harnessDir, rel));
  return candidates.find((p) => existsSync(p)) ?? (candidates[0] as string);
}

/**
 * Make the host hold the settings its isolation of a dispatched agent needs, for the
 * agents the projection could not start in a worktree of their own, and say what was
 * done. A harness without such an isolation, or an install that places no such agent,
 * touches no host config.
 *
 * The file is the host's, so the settings are written as the lines they are, a value
 * the host held is replaced in place, and the edit is recorded in the deploy manifest
 * for an uninstall to take back: an inserted line goes, a replaced one is the host's
 * original again. A file this cannot edit safely is left as it is and reported, with the
 * lines to write by hand, and the install itself still succeeds.
 */
function seedDispatchIsolation(
  found: Findings,
  adapter: HarnessAdapter,
  isolated: readonly string[],
  run: { harnessDir: string; dry: boolean },
): void {
  const isolation = adapter.dispatchIsolation;
  if (isolation === undefined || isolated.length === 0) return;
  const { harnessDir, dry } = run;
  const path = hostConfigPath(isolation.configRels, harnessDir);
  const result = ensureHostSettings(path, isolation.settings, { dry });
  if (result.edit !== undefined) noteHostEdit(harnessDir, path, result.edit);
  const parent = isolation.settings.parent.join('.');
  if (result.refused !== undefined) {
    const wanted = Object.entries(isolation.settings.entries).map(
      ([key, value]) => `${parent}.${key}: ${value}`,
    );
    found.warnings.push(
      `did not edit ${path} — ${result.refused}. Set ${list(wanted)} there yourself, or ${adapter.name} refuses a dispatch of ${list(isolated)}.`,
    );
    return;
  }
  if (result.changed.length === 0) {
    found.detail.push(`  ${parent}: ${path} — already holds the settings`);
    return;
  }
  const said = result.changed.map(
    (c) =>
      `${c.setting.slice(parent.length + 1)}: ${c.to}${c.from === undefined ? '' : ` (was ${c.from})`}`,
  );
  found.detail.push(
    `  ${parent}${result.wrote ? '' : ' (dry-run)'}: ${path} — ${result.wrote ? 'set' : 'would set'}`,
  );
  for (const line of said) found.detail.push(`    ${line}`);
  found.edits.push({ path, what: `${parent} sets ${list(said)}` });
}

/**
 * Make the host's status line show which agent a session is, and say what was done.
 *
 * The two harnesses' status lines differ in kind, and each declares its own on the
 * port. Claude Code's is ONE command (`adapter.statusLine` names the worker that
 * fills it with the persona badge the projection placed): set where the host has none,
 * and WRAPPED where it has one — the worker
 * runs the host's command and prints the badge in front of its first line, and prints
 * that command's output byte for byte in a session that runs no persona, so the badge
 * is never left off and nothing the host shows is taken away. The host's command is
 * recorded in the deploy manifest for an uninstall to restore. Nothing is set there
 * when no persona was installed, so there is no badge to show.
 *
 * omp's is a list of segments (`adapter.statusSegment`), which shows an extension's
 * status only where it lists `status`, and the cratylus extension
 * (`adapter.capabilitySurface`) puts there the name and mark of the agent a session
 * was started as (`omp --agent <name>`). ANY session may be started as an agent —
 * any declaration omp discovers, not only the corpus's — so wherever install places
 * that extension it also adds `status` to the layout in the config file the harness
 * reads, moving a host on the default preset to the `custom` one that reads a list at
 * all, and leaving a host on any other named preset as it is (where its hidden status
 * row is shown again instead). Either failure to edit is reported and the install
 * itself still succeeds.
 */
function showAgentStatus(
  found: Findings,
  adapter: HarnessAdapter,
  personas: readonly string[],
  run: { harnessDir: string; dry: boolean; adopt: boolean },
): void {
  const { dry, adopt } = run;
  const say = (line: string): void => {
    found.detail.push(line);
  };
  const refused = (path: string, why: string, leftAs: string): void => {
    found.warnings.push(`did not edit ${path} — ${why}. ${leftAs}`);
  };

  const worker = adapter.statusLine;
  if (worker !== undefined && personas.length > 0) {
    const { harnessDir } = run;
    const path = join(harnessDir, adapter.hooksFile);
    const recorded = readManifest(harnessDir).statusLine;
    const result = ensureBadgeStatusLine(path, worker.command, {
      dry,
      ...(recorded !== null ? { recorded } : {}),
    });
    const tag = `statusLine${dry ? ' (dry-run)' : ''}: ${path}`;
    if (result.state === 'refused') {
      refused(
        path,
        result.refused as string,
        'The persona badge is not on the status line.',
      );
      return;
    }
    // What an uninstall restores the host's line from. A line this run found already
    // wrapped is recorded too where no record stands, so a host installed before the
    // record began still has one; a host command that cannot be read back out of it
    // leaves the record as it was.
    if (!dry && result.host !== undefined) {
      const manifest = readManifest(harnessDir);
      if (result.state !== 'kept' || manifest.statusLine === null) {
        writeManifest(harnessDir, {
          ...manifest,
          statusLine: {
            placed: result.placed as string,
            host: result.host,
          },
        });
      }
    }
    switch (result.state) {
      case 'set':
        say(
          `  ${tag} — ${dry ? 'would set' : 'set'} to the persona badge (${worker.command})`,
        );
        found.edits.push({
          path,
          what: 'the status line shows the persona badge',
        });
        return;
      case 'wrapped':
        say(
          `  ${tag} — ${dry ? 'would wrap' : 'wrapped'} the host's status line command in the persona badge: the badge is printed before the first line of its output, and its output is passed through byte for byte in a session with no persona; the original command (${result.host}) ${dry ? 'would be' : 'is'} recorded in ${join(harnessDir, MANIFEST_REL)}`,
        );
        found.edits.push({
          path,
          what: 'your status line command is wrapped in the persona badge (its output is unchanged in a session with no persona)',
        });
        return;
      case 'kept':
        say(`  statusLine: ${path} — already shows the persona badge`);
        return;
    }
  }

  // A harness whose status line is a list of segments: list the one an extension's
  // status renders in, in the file the harness reads its layout from, wherever the
  // extension that shows the session's agent there is placed.
  const host = adapter.statusSegment;
  if (host !== undefined && adapter.capabilitySurface !== undefined) {
    const path = hostConfigPath(host.configRels, run.harnessDir);
    const result = ensureStatusSegment(path, host, { dry, adopt });
    if (result.edit !== undefined) {
      noteHostEdit(run.harnessDir, path, result.edit);
    }
    if (adopt && !dry && existsSync(path)) {
      markMigratedConfig(run.harnessDir, path);
    }
    // The row beneath the editor is the agent's place wherever the layout has none of
    // its own; a host that had hidden it is told it is shown now, and why.
    const rowShown = result.hookRowShown
      ? ` Save one value: its \`showHookStatus\` was false, which hid the only place there for the name and mark of the agent a session was started as, so ${dry ? 'it would be' : 'it is'} now true.`
      : '';
    switch (result.state) {
      case 'refused':
        if (result.hookRowShown) {
          found.warnings.push(
            `could not list \`${host.segment}\` in ${path} — ${result.refused}. A session's agent renders beneath the status line, not in it.${rowShown}`,
          );
          return;
        }
        refused(
          path,
          result.refused as string,
          "A session's agent renders beneath the status line, not in it, unless the host set `statusLine.showHookStatus: false`, which hides it there; set it true, or list the `status` segment in a `custom` layout, to see it.",
        );
        return;
      case 'present':
        say(
          `  statusLine: ${path} — \`${host.segment}\` already listed in leftSegments`,
        );
        return;
      case 'other-preset':
        say(
          `  statusLine: ${path} — preset \`${result.preset}\` is the host's own choice and its layout has no \`${host.segment}\` segment, so a session's agent renders beneath the status line; left as it is.${rowShown}`,
        );
        for (const line of result.advice ?? []) say(`    ${line}`);
        found.left.push(
          `the status line preset \`${result.preset}\` in ${path}; a session's agent renders beneath it`,
        );
        return;
      case 'own-layout':
        say(
          `  statusLine: ${path} — the host set ${(result.keys ?? []).map((k) => `\`${k}\``).join(', ')} with no preset, and \`preset: custom\` would change the line it sees; left as it is, so a session's agent renders beneath the status line.${rowShown}`,
        );
        for (const line of result.advice ?? []) say(`    ${line}`);
        found.left.push(
          `the status line layout in ${path}; a session's agent renders beneath it`,
        );
        return;
      case 'added':
        say(
          `  statusLine${dry ? ' (dry-run)' : ''}: ${path} — ${dry ? 'would add' : 'added'} ${result.written.join('; ')}`,
        );
        found.edits.push({
          path,
          what: "the status line lists the segment that shows a session's agent",
        });
        return;
    }
  }
}

/**
 * Make the host's model roles bind each agent's model, and say what was placed, kept,
 * or could not be seeded. Two kinds of entry are wanted: each tier an agent uses, as a
 * role named for the tier and seeded from the roles the host already has (the adapter
 * says how: `RoleRouting.seedTier`); and each agent's own role, the operator's choice
 * for it or else the alias of its tier and effort. An entry that is install's own seed
 * (`seeded`) moves to the value wanted now; an entry the host set is never changed; a
 * tier with nothing to seed it from is left unseeded and reported; a `modelRoles` that
 * cannot be safely extended is reported and left as it is — the install itself still
 * succeeds. What the operator chose is recorded as the host's from then on, and what
 * install seeded as its own.
 */
function seedModelRoles(
  found: Findings,
  adapter: HarnessAdapter,
  agentModels: ProjectedTree['agentModels'],
  choices: Readonly<Record<string, string>>,
  seeded: ReadonlySet<string>,
  run: { harnessDir: string; dry: boolean; adopt: boolean },
): void {
  const routing = adapter.roleRouting;
  const agents = Object.keys(agentModels).sort();
  if (routing === undefined || agents.length === 0) return;
  const { harnessDir, dry, adopt } = run;
  const path = hostConfigPath(routing.configRels, harnessDir);
  // The host's roles as they stand: what each tier is seeded from.
  const host = addModelRoles(path, [], { dry: true }).host;
  const tiers = [
    ...new Set(Object.values(agentModels).map((m) => m.tier)),
  ].sort();
  const wanted: ModelRoleEntry[] = [];
  const unseeded: string[] = [];
  for (const tier of tiers) {
    const value = routing.seedTier(tier, host);
    if (value !== undefined) wanted.push({ role: tier, value });
    else if (!host.some(([role]) => role === tier)) unseeded.push(tier);
  }
  for (const name of agents) {
    wanted.push({
      role: name,
      value:
        choices[name] ?? routing.agentRole(agentModels[name] as AgentModel),
    });
  }
  const result = addModelRoles(path, wanted, {
    dry,
    adopt,
    retarget: wanted.filter((e) => seeded.has(e.role)),
  });
  // What an uninstall takes out again: what was just put in, and nothing of the host's.
  if (result.edit !== undefined) noteHostEdit(harnessDir, path, result.edit);
  if (!dry) {
    for (const m of result.retargeted) {
      if (m.line !== undefined) {
        retargetHostEdit(harnessDir, path, m.line.from, m.line.to, m.line.hunk);
      }
    }
  }
  if (adopt && !dry && existsSync(path)) {
    markMigratedConfig(harnessDir, path);
  }
  if (result.refused !== undefined) {
    found.warnings.push(
      `did not edit ${path} — ${result.refused}. Set the model roles ${list(wanted.map((e) => `${e.role}: ${e.value}`))} there yourself.`,
    );
    return;
  }
  for (const tier of unseeded) {
    const holders = agents.filter((n) => agentModels[n]?.tier === tier);
    found.warnings.push(
      `could not seed the model role ${tier} in ${path}: the host's model roles hold no model to seed it from. Set ${tier} there to a model; ${list(holders)} ${holders.length === 1 ? 'runs' : 'run'} on it.`,
    );
  }
  const moved = wanted.filter((e) =>
    result.retargeted.some((m) => m.role === e.role),
  );
  const placed = [...result.added, ...moved];
  // An own seed standing at the value wanted now: install's still, or the operator's
  // where they chose that very value.
  const standing = wanted.filter(
    (e) => seeded.has(e.role) && !moved.some((m) => m.role === e.role),
  );
  if (!dry) {
    const own = [...placed, ...standing];
    noteHostRoutes(
      harnessDir,
      own.filter((e) => Object.hasOwn(choices, e.role)).map((e) => e.role),
      Object.fromEntries(
        own
          .filter((e) => !Object.hasOwn(choices, e.role))
          .map((e) => [e.role, e.value]),
      ),
    );
  }
  // Only the host's own entries are the host's to be credited with; install's seeds,
  // standing as it wrote them, are not.
  const kept = wanted.filter(
    (e) => !result.added.some((a) => a.role === e.role) && !seeded.has(e.role),
  );
  if (kept.length > 0) {
    found.left.push(
      `the model roles ${list(kept.map((e) => e.role))}, which ${path} already sets`,
    );
  }
  for (const entry of [...placed, ...standing]) {
    if (Object.hasOwn(choices, entry.role)) {
      found.routes.push(`${entry.role} → ${entry.value}`);
    }
  }
  if (placed.length === 0) {
    found.detail.push(`  modelRoles: ${path} — no entry was missing`);
    return;
  }
  if (result.added.length > 0) {
    found.detail.push(
      `  modelRoles${result.wrote ? '' : ' (dry-run)'}: ${path} — ${result.wrote ? 'added' : 'would add'}`,
    );
    for (const entry of result.added) {
      found.detail.push(`    ${modelRoleLine(entry, '')}`);
    }
  }
  if (moved.length > 0) {
    found.detail.push(
      `  modelRoles${dry ? ' (dry-run)' : ''}: ${path} — ${dry ? 'would move' : 'moved'} the entries install seeded`,
    );
    for (const entry of moved) {
      found.detail.push(`    ${modelRoleLine(entry, '')}`);
    }
  }
  found.edits.push({
    path,
    what: [
      ...(result.added.length > 0
        ? [`modelRoles gains ${list(result.added.map((e) => e.role))}`]
        : []),
      ...(moved.length > 0
        ? [`modelRoles moves ${list(moved.map((e) => e.role))}`]
        : []),
    ].join('; '),
  });
}
