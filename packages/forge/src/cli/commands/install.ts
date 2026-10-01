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
// THE RUN IS GUIDED, and it is the operator's decisions that it guides. There are four:
// which harness, which of the corpus's practices, whether to link their launch
// commands, and which model each held role routes to. Each has a flag; a decision
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
// WHAT THE HOST HAS ALREADY SET IS NEVER ASKED AND NEVER CHANGED. A role the host
// routes itself is left as it is, named as the host's, and a `--model-roles` entry for
// it is left as the host set it and said so.

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { mergeManifest } from '@cratylus/schema';
import {
  CLAUDE_MODEL_TIERS,
  CLAUDE_ROLE_TIERS,
} from '../../adapters/claude/render.js';
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
import { keepsHostModel } from '../../deploy/deploy.js';
import {
  MANIFEST_REL,
  type ModelRoleEntry,
  type PersonaCommandsOpts,
  addModelRoles,
  describePersonaCommands,
  ensureBadgeStatusLine,
  ensureHostSettings,
  ensureStatusSegment,
  hasManifest,
  hostModelClaim,
  markMigratedConfig,
  modelRoleLine,
  noteHostEdit,
  noteHostRoutes,
  personaLauncherOf,
  placePersonaCommands,
  planPersonaCommands,
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
  /** Link a command named after each installed persona into `~/.local/bin`
   *  (`--link-persona-commands`), or link none (`--no-link-persona-commands`). Absent:
   *  asked, or — where nothing is asked — none. */
  linkPersonaCommands?: boolean;
  /** `--model-roles <role=model,…|default>`: the model each named held role routes
   *  to; `default` leaves every role on cratylus's routing. Given at all, it settles
   *  the decision: a role it does not name takes the default. Absent: asked. */
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
  /** `PATH`, for the on-PATH report. Default: the process's. */
  pathEnv?: string;
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

/** A model value as it may be written on a claude def's `model:` line. */
const CLAUDE_MODEL = /^[A-Za-z0-9][A-Za-z0-9._:/[\]-]*$/;
/** A model value as it may be written in omp's `modelRoles`: an alias (`@slow`) or a
 *  selector (`provider/model:high`), quoted when written. */
const OMP_MODEL = /^\S+$/;

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
  /** The models the operator chose for roles, as `role → model`. */
  routes: string[];
  /** What the host had set and was left alone. */
  left: string[];
  /** The persona commands. */
  commands: {
    binDir: string | undefined;
    linked: string[];
    adopted: string[];
    /** Names that could be linked and were not asked to be. */
    offered: string[];
    /** The personas whose commands were taken out again, their practice dropped. */
    unlinked: string[];
  };
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
    commands: {
      binDir: undefined,
      linked: [],
      adopted: [],
      offered: [],
      unlinked: [],
    },
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
        `--model-roles: '${entry}' must be <role>=<model>; pass <role>=<model>,… or the single word 'default'`,
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

  // ── WHAT TO ROUTE ────────────────────────────────────────────────────────────
  // A role the host already routes is the host's: never asked, never changed.
  const routing = adapter.roleRouting;
  const routesDefs = routing === undefined && keepsHostModel(adapter.home);
  const validModel = routesDefs ? CLAUDE_MODEL : OMP_MODEL;
  const hostRouted = new Set<string>();
  // omp: the roles whose entry is install's own seed, still as it wrote it.
  const seeded = new Set<string>();
  let routable = tree.heldRoles;
  let configRefused = false;
  if (routing !== undefined) {
    const path = hostConfigPath(routing.configRels, harnessDir);
    const probe = addModelRoles(
      path,
      tree.heldRoles.map((role) => ({ role, value: '' })),
      { dry: true },
    );
    configRefused = probe.refused !== undefined;
    const missing = new Set(probe.added.map((e) => e.role));
    // An entry is install's own seed while it stands as install wrote it and no
    // operator chose it: a later run may move it to the model chosen now. Any other
    // entry is the host's, an operator's choice included.
    const written = recordedLines(harnessDir, path);
    const chosen = readManifest(harnessDir).hostRoutes;
    // A host installed before edits were recorded has no such record; its seeds are
    // the lines this install would write itself, which it adopts.
    const legacy = hasManifest(harnessDir) && !recordsHostEdits(harnessDir);
    for (const role of tree.heldRoles) {
      if (configRefused || missing.has(role)) continue;
      const line = probe.current[role] as string;
      const seed = `${modelRoleLine(
        { role, value: `@${routing.nearest(role)}` },
        '',
      )}${/\r?\n$/.exec(line)?.[0] ?? ''}`;
      const own =
        !chosen.includes(role) &&
        (written.has(line) || (legacy && line.trimStart() === seed));
      if (own) seeded.add(role);
      else hostRouted.add(role);
    }
  } else if (routesDefs) {
    const prior = readManifest(harnessDir);
    for (const [role, holders] of Object.entries(tree.roleHolders)) {
      const routed = holders.some((name) => {
        const path = join(harnessDir, adapter.agentRel(name));
        return (
          existsSync(path) &&
          hostModelClaim(prior, name, readFileSync(path, 'utf-8'))?.line !==
            undefined
        );
      });
      if (routed) hostRouted.add(role);
    }
  } else {
    routable = [];
  }
  const askable = routable.filter((r) => !hostRouted.has(r));

  const choices: Record<string, string> = {};
  const left: string[] = [];
  if (opts.modelRoles !== undefined) {
    if (routing === undefined && !routesDefs) {
      throw new Refusal(
        `--model-roles: the '${adapter.name}' harness routes no roles; drop --model-roles`,
      );
    }
    const given = parseModelRoles(opts.modelRoles, validModel);
    if (given !== 'default') {
      const unknown = Object.keys(given).filter(
        (r) => !tree.heldRoles.includes(r),
      );
      if (unknown.length > 0) {
        throw new Refusal(
          `--model-roles: ${list(unknown.map((r) => `'${r}'`))} ${unknown.length === 1 ? 'is' : 'are'} no role the installed agents hold (roles: ${list(tree.heldRoles)}); name one of those roles`,
        );
      }
      for (const [role, model] of Object.entries(given)) {
        if (hostRouted.has(role)) {
          left.push(
            `--model-roles ${role}=${model}: the host already routes ${role}, so it is left as the host set it`,
          );
        } else {
          choices[role] = model;
        }
      }
    }
  } else if (askable.length > 0 && !configRefused) {
    open = true;
    if (interactive) {
      const questions: RoleQuestion[] = askable.map((role) => ({
        role,
        holders: tree.roleHolders[role] ?? [],
        options: routing
          ? routing.offered.map((r) => `@${r}`)
          : CLAUDE_MODEL_TIERS,
        initial: routing
          ? `@${routing.nearest(role)}`
          : Object.hasOwn(CLAUDE_ROLE_TIERS, role)
            ? CLAUDE_ROLE_TIERS[role]
            : undefined,
      }));
      const picked = await answered(prompts.routes(questions));
      for (const q of questions) {
        const model = picked[q.role];
        if (model === undefined || model === q.initial) continue;
        if (!validModel.test(model)) {
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
    // The agents an earlier install placed that this one does not: their practice is
    // dropped, and so are their launch commands.
    const droppedAgents = Object.keys(
      readManifest(harnessDir).kinds.agent ?? {},
    ).filter((n) => !agentNames.includes(n));

    const commandsCtx = personaCommandsOf(adapter, agentNames, opts);
    const placeable =
      commandsCtx === undefined
        ? []
        : planPersonaCommands(commandsCtx).links.filter(
            (l) => l.state === 'place' || l.state === 'adopt',
          );
    let link = false;
    if (opts.linkPersonaCommands !== undefined) {
      link = opts.linkPersonaCommands;
    } else if (placeable.length > 0) {
      open = true;
      if (interactive && commandsCtx !== undefined) {
        link = await answered(
          prompts.linkCommands(linkQuestion(commandsCtx, placeable)),
        );
      }
    }

    // A host this ran on before edits were recorded has the lines its install put in
    // the host's config files with nothing saying so. Read BEFORE the deploy rewrites
    // the record: what this install finds there, byte for byte what it would write,
    // it adopts.
    const migrating = hasManifest(harnessDir) && !recordsHostEdits(harnessDir);

    // Claude's route is the `model:` line of each agent holding the role.
    const models: Record<string, string> = routesDefs
      ? Object.fromEntries(
          Object.entries(choices).flatMap(([role, model]) =>
            (tree.roleHolders[role] ?? []).map((name) => [name, model]),
          ),
        )
      : {};

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
        ...(Object.keys(models).length > 0 ? { models } : {}),
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
      // The routes the definitions just placed name roles; the host maps a role to a
      // model. Deploy is unchanged — this is install's own step, and a deploy that
      // failed places no routes to back.
      seedModelRoles(found, adapter, tree.heldRoles, choices, seeded, {
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
      if (routesDefs) {
        describeClaudeRoles(found, adapter, tree.heldRoles);
        for (const [role, model] of Object.entries(choices)) {
          found.routes.push(`${role} → ${model}`);
        }
        for (const role of hostRouted) {
          found.left.push(`the model of ${role}, which the host set`);
        }
      }
      // Then the badge, which is what the operator sees of those personas: the host's
      // own status line, made to show it.
      showPersonaBadge(found, adapter, agentNames, {
        harnessDir,
        dry,
        adopt: migrating,
      });
      // Then the persona commands: install's own step too, after the launcher they
      // link to has been placed.
      if (commandsCtx !== undefined) {
        linkPersonaCommands(found, commandsCtx, { link, dry });
        if (droppedAgents.length > 0) {
          const removal = removePersonaCommands({
            ...commandsCtx,
            personas: droppedAgents,
            only: true,
            dry,
          });
          for (const l of removal.links) {
            if (l.state === 'removed' || l.state === 'remove') {
              found.commands.unlinked.push(basename(l.link));
            }
          }
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
 * the models chosen; the launch commands; what the host had set and was left alone —
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
      `  models you chose: ${list(found.routes)}; every other role follows the default routing`,
    );
  }
  const { commands } = found;
  const named = (verb: string, names: readonly string[]): string =>
    `  ${verb} ${plural(names.length, 'launch command')} in ${commands.binDir}: ${list(names)}`;
  if (commands.linked.length > 0) {
    lines.push(named(dry ? 'would link' : 'linked', commands.linked));
  }
  if (commands.adopted.length > 0) {
    lines.push(named(dry ? 'would adopt' : 'adopted', commands.adopted));
  }
  if (commands.unlinked.length > 0) {
    lines.push(
      `  ${dry ? 'would unlink' : 'unlinked'} the command${commands.unlinked.length === 1 ? '' : 's'} of ${list(commands.unlinked)}`,
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

  const next = [`start or restart ${adapter.name}`];
  if (commands.linked.length + commands.adopted.length > 0) {
    next.push(
      `launch a persona by its name: ${list([...commands.linked, ...commands.adopted])}`,
    );
  } else if (commands.offered.length > 0) {
    next.push(
      `to launch personas by name, run again with --link-persona-commands (${plural(commands.offered.length, 'command')} into ${commands.binDir})`,
    );
  }
  next.push(`to remove it all: ${CLI_BIN} uninstall --harness ${adapter.name}`);
  lines.push('  next:', ...next.map((item) => `    ${item}`));
  return lines;
}

/** The persona commands' shared inputs, or `undefined` where the harness has no
 *  launcher to link to. No agent to name a command after is still a context: the
 *  commands of the personas an install drops are removed through it. The launcher a
 *  command links to is the harness's, and every OTHER harness's is passed along so a
 *  name already taken by one is reported as held by it. */
function personaCommandsOf(
  adapter: HarnessAdapter,
  personas: readonly string[],
  opts: InstallCmdOpts,
): PersonaCommandsOpts | undefined {
  const harnessDir = harnessDirIn(adapter, opts.home);
  const self = personaLauncherOf(harnessDir, adapter);
  if (self === undefined) return undefined;
  return {
    home: opts.home ?? homedir(),
    harnessDir,
    self,
    personas,
    peers: HARNESS_NAMES.filter((n) => n !== adapter.name).flatMap((n) => {
      const peer = personaLauncherOf(
        harnessDirIn(adapterByName(n), opts.home),
        adapterByName(n),
      );
      return peer ? [peer] : [];
    }),
    ...(opts.pathEnv !== undefined ? { pathEnv: opts.pathEnv } : {}),
  };
}

/** What a yes to linking does, in the two ways it acts: a free name is linked, and a
 *  hand-made link to this launcher is only recorded — so the two are counted apart. */
function linkQuestion(
  ctx: PersonaCommandsOpts,
  placeable: readonly { state: string }[],
): string {
  const count = (state: string) =>
    placeable.filter((l) => l.state === state).length;
  const link = count('place');
  const adopt = count('adopt');
  const binDir = planPersonaCommands(ctx).binDir;
  return link === 0
    ? `Adopt ${plural(adopt, 'persona command')} already linked in ${binDir}?`
    : `Link ${plural(link, 'persona command')} into ${binDir}${adopt > 0 ? `, and adopt ${adopt} already linked there` : ''}?`;
}

/**
 * Say what commands named after the installed personas would be placed in the user's
 * bin dir, and place them when `link` says to. Anywhere else nothing is placed and the
 * report says how to.
 */
function linkPersonaCommands(
  found: Findings,
  ctx: PersonaCommandsOpts,
  run: { link: boolean; dry: boolean },
): void {
  const say = (lines: readonly string[]): void => {
    found.detail.push(...lines);
  };
  if (run.link) {
    const report = placePersonaCommands({ ...ctx, dry: run.dry });
    say(describePersonaCommands(report, run.dry));
    found.commands.binDir = report.binDir;
    for (const l of report.links) {
      if (l.state === 'place' || l.state === 'placed') {
        found.commands.linked.push(l.persona);
      } else if (l.state === 'adopt' || l.state === 'adopted') {
        found.commands.adopted.push(l.persona);
      } else if (l.state === 'blocked') {
        found.warnings.push(
          `persona command ${l.persona} was not linked: ${l.link} is ${l.heldBy ? `linked to the ${l.heldBy} launcher` : l.current} and is left alone`,
        );
      }
    }
    if (!report.onPath && found.commands.linked.length > 0) {
      found.warnings.push(
        `${report.binDir} is not on PATH — add it to PATH to run the persona commands by name`,
      );
    }
    return;
  }
  const plan = planPersonaCommands(ctx);
  say(describePersonaCommands(plan, true));
  found.commands.binDir = plan.binDir;
  const offered = plan.links.filter(
    (l) => l.state === 'place' || l.state === 'adopt',
  );
  if (offered.length === 0) return;
  found.commands.offered.push(...offered.map((l) => l.persona));
  say(['  none placed — pass --link-persona-commands to link them']);
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
 * Make the host's status line show the persona badge the projection just placed, and
 * say what was done. Nothing is placed when no persona was installed, so there is no
 * badge to show.
 *
 * The two harnesses' status lines differ in kind, and each declares its own on the
 * port. Claude Code's is ONE command (`adapter.statusLine` names the worker that
 * fills it): set where the host has none, and WRAPPED where it has one — the worker
 * runs the host's command and prints the badge in front of its first line, and prints
 * that command's output byte for byte in a session that runs no persona, so the badge
 * is never left off and nothing the host shows is taken away. The host's command is
 * recorded in the deploy manifest for an uninstall to restore. omp's is a list of
 * segments (`adapter.statusSegment`), which shows an extension's status only where it
 * lists `status`: install adds it to the layout in the config file the harness reads,
 * moving a host on the default preset to the `custom` one that reads a list at all,
 * and leaving a host on any other named preset as it is. Either failure to edit is
 * reported and the install itself still succeeds.
 */
function showPersonaBadge(
  found: Findings,
  adapter: HarnessAdapter,
  personas: readonly string[],
  run: { harnessDir: string; dry: boolean; adopt: boolean },
): void {
  if (personas.length === 0) return;
  const { dry, adopt } = run;
  const say = (line: string): void => {
    found.detail.push(line);
  };
  const refused = (path: string, why: string, leftAs: string): void => {
    found.warnings.push(`did not edit ${path} — ${why}. ${leftAs}`);
  };

  const worker = adapter.statusLine;
  if (worker !== undefined) {
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

  // A harness whose status line is a list of segments: list the one the badge renders
  // in, in the file the harness reads its layout from.
  const host = adapter.statusSegment;
  if (host !== undefined) {
    const path = hostConfigPath(host.configRels, run.harnessDir);
    const result = ensureStatusSegment(path, host, { dry, adopt });
    if (result.edit !== undefined) {
      noteHostEdit(run.harnessDir, path, result.edit);
    }
    if (adopt && !dry && existsSync(path)) {
      markMigratedConfig(run.harnessDir, path);
    }
    // The row beneath the editor is the badge's place wherever the layout has none of
    // its own; a host that had hidden it is told it is shown now, and why.
    const rowShown = result.hookRowShown
      ? ` Save one value: its \`showHookStatus\` was false, which hid the persona badge's only place there, so ${dry ? 'it would be' : 'it is'} now true.`
      : '';
    switch (result.state) {
      case 'refused':
        if (result.hookRowShown) {
          found.warnings.push(
            `could not list \`${host.segment}\` in ${path} — ${result.refused}. The persona badge renders beneath the status line, not in it.${rowShown}`,
          );
          return;
        }
        refused(
          path,
          result.refused as string,
          'The persona badge renders beneath the status line, not in it, unless the host set `statusLine.showHookStatus: false`, which hides it there; set it true, or list the `status` segment in a `custom` layout, to see the badge.',
        );
        return;
      case 'present':
        say(
          `  statusLine: ${path} — \`${host.segment}\` already listed in leftSegments`,
        );
        return;
      case 'other-preset':
        say(
          `  statusLine: ${path} — preset \`${result.preset}\` is the host's own choice and its layout has no \`${host.segment}\` segment, so the persona badge renders beneath the status line; left as it is.${rowShown}`,
        );
        for (const line of result.advice ?? []) say(`    ${line}`);
        found.left.push(
          `the status line preset \`${result.preset}\` in ${path}; the persona badge renders beneath it`,
        );
        return;
      case 'own-layout':
        say(
          `  statusLine: ${path} — the host set ${(result.keys ?? []).map((k) => `\`${k}\``).join(', ')} with no preset, and \`preset: custom\` would change the line it sees; left as it is, so the persona badge renders beneath the status line.${rowShown}`,
        );
        for (const line of result.advice ?? []) say(`    ${line}`);
        found.left.push(
          `the status line layout in ${path}; the persona badge renders beneath it`,
        );
        return;
      case 'added':
        say(
          `  statusLine${dry ? ' (dry-run)' : ''}: ${path} — ${dry ? 'would add' : 'added'} ${result.written.join('; ')}`,
        );
        found.edits.push({
          path,
          what: 'the status line lists the persona badge segment',
        });
        return;
    }
  }
}

/**
 * Give every held role the host has not mapped an entry — the operator's choice for
 * it, or else an alias of the harness's nearest built-in role — and say what was
 * added. An entry that is install's own seed (`seeded`) moves to the operator's choice
 * for it, and otherwise stands; an entry the host has is never changed; a `modelRoles`
 * that cannot be safely extended is reported and left as it is — the install itself
 * still succeeds. What the operator chose is recorded as the host's from then on.
 */
function seedModelRoles(
  found: Findings,
  adapter: HarnessAdapter,
  heldRoles: readonly string[],
  choices: Readonly<Record<string, string>>,
  seeded: ReadonlySet<string>,
  run: { harnessDir: string; dry: boolean; adopt: boolean },
): void {
  const routing = adapter.roleRouting;
  if (routing === undefined || heldRoles.length === 0) return;
  const { harnessDir, dry, adopt } = run;
  const path = hostConfigPath(routing.configRels, harnessDir);
  const wanted: ModelRoleEntry[] = heldRoles.map((role) => ({
    role,
    value: choices[role] ?? `@${routing.nearest(role)}`,
  }));
  const result = addModelRoles(path, wanted, {
    dry,
    adopt,
    retarget: wanted.filter((e) => seeded.has(e.role) && e.role in choices),
  });
  // What an uninstall takes out again: the lines just put in, and nothing of the host's.
  if (result.edit !== undefined) noteHostEdit(harnessDir, path, result.edit);
  if (!dry) {
    for (const m of result.retargeted) {
      retargetHostEdit(harnessDir, path, m.from, m.to, m.hunk);
    }
  }
  if (adopt && !dry && existsSync(path)) {
    markMigratedConfig(harnessDir, path);
  }
  if (result.refused !== undefined) {
    found.warnings.push(
      `did not edit ${path} — ${result.refused}. Held roles ${list(heldRoles)} fall back to \`${routing.defaultRole}\`.`,
    );
    return;
  }
  const moved = wanted.filter((e) =>
    result.retargeted.some((m) => m.role === e.role),
  );
  // A seed the operator chose the very value of is already what they chose: nothing
  // moves, and the entry is still theirs from now on, as a moved one is.
  const kept = wanted.filter(
    (e) =>
      seeded.has(e.role) &&
      Object.hasOwn(choices, e.role) &&
      !moved.some((m) => m.role === e.role),
  );
  if (!dry) {
    noteHostRoutes(
      harnessDir,
      [...result.added, ...moved, ...kept]
        .filter((e) => e.role in choices)
        .map((e) => e.role),
      result.added.filter((e) => !(e.role in choices)).map((e) => e.role),
    );
  }
  // Only the host's own entries are the host's to be credited with; install's seeds,
  // standing as it wrote them, are not.
  const routed = wanted.filter(
    (e) => !result.added.some((a) => a.role === e.role) && !seeded.has(e.role),
  );
  if (routed.length > 0) {
    found.left.push(
      `the model of ${list(routed.map((e) => e.role))}, which ${path} already routes`,
    );
  }
  for (const entry of kept) found.routes.push(`${entry.role} → ${entry.value}`);
  if (result.added.length === 0 && moved.length === 0) {
    found.detail.push(`  modelRoles: ${path} — no entry was missing`);
    return;
  }
  if (result.added.length > 0) {
    found.detail.push(
      `  modelRoles${result.wrote ? '' : ' (dry-run)'}: ${path} — ${result.wrote ? 'added' : 'would add'}`,
    );
  }
  for (const entry of result.added) {
    found.detail.push(`    ${modelRoleLine(entry, '')}`);
  }
  if (moved.length > 0) {
    found.detail.push(
      `  modelRoles${dry ? ' (dry-run)' : ''}: ${path} — ${dry ? 'would move' : 'moved'} the entries install seeded to the models you chose`,
    );
    for (const entry of moved)
      found.detail.push(`    ${modelRoleLine(entry, '')}`);
  }
  for (const entry of [...result.added, ...moved]) {
    if (Object.hasOwn(choices, entry.role)) {
      found.routes.push(`${entry.role} → ${entry.value}`);
    }
  }
  found.edits.push({
    path,
    what: [
      ...(result.added.length > 0
        ? [`modelRoles gains ${list(result.added.map((e) => e.role))}`]
        : []),
      ...(moved.length > 0
        ? [`modelRoles moves ${list(moved.map((e) => e.role))} to your choice`]
        : []),
    ].join('; '),
  });
}

/**
 * Show the host the roles it can set, on the harness with no role map of its own.
 * Claude Code names a subagent's model in one place — the `model:` line of its
 * definition — so each held role is listed with the tier the definitions holding it
 * carry, and how the host changes it: edit that line (a deploy keeps it), or override
 * every subagent at once with the documented environment pair.
 */
function describeClaudeRoles(
  found: Findings,
  adapter: HarnessAdapter,
  heldRoles: readonly string[],
): void {
  if (adapter.name !== 'claude' || heldRoles.length === 0) return;
  found.detail.push(
    `  roles (${heldRoles.length}): each agent runs on its role's tier until the host sets its model`,
  );
  for (const role of heldRoles) {
    const tier = Object.hasOwn(CLAUDE_ROLE_TIERS, role)
      ? CLAUDE_ROLE_TIERS[role]
      : undefined;
    found.detail.push(
      tier === undefined
        ? `    ${role}: no tier — runs on the session's model; set it with the \`model:\` line of each agent holding it (kept across installs)`
        : `    ${role}: tier ${tier} (\`model: ${tier}\`) — set it with the \`model:\` line of each agent holding it (kept across installs)`,
    );
  }
  found.detail.push(
    '  every subagent at once: CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1 with CLAUDE_CODE_SUBAGENT_MODEL=<model>',
  );
}
