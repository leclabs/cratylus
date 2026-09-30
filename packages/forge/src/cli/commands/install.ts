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
// not INVENTED by the projector — it arrives as `--plugin`, an ordinary flag. `forge`
// still knows no corpus: it installs what it was told to and refuses when it was told
// nothing. The hub package supplies the default because it is the only package
// permitted to know both halves.
//
// A CONFIG STILL WINS. If the cwd has one, `install` uses it — otherwise the operator
// who wrote a config would be silently ignored by the friendliest command on the
// surface, which is the sharpest way to lose their trust.
//
// THE RUN IS GUIDED, and it is the operator's decisions that it guides. There are four:
// which harness, which of the corpus's optional personas, whether to link their launch
// commands, and which model each held role routes to. Each has a flag; a decision
// given by flag is never asked, and a run with no terminal (or `--yes`) asks nothing
// and takes the default of every decision not given. Before anything is written the
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

import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import pc from 'picocolors';
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
import { loadConfig } from '../../config/index.js';
import { CONFIG_FILE } from '../../config/scaffold.js';
import { keepsHostModel } from '../../deploy/deploy.js';
import {
  MANIFEST_REL,
  type ModelRoleEntry,
  type PersonaCommandsOpts,
  addModelRoles,
  describePersonaCommands,
  ensureBadgeStatusLine,
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
import {
  type ProjectedTree,
  discoverFragments,
  projectPluginSet,
  resolveFragmentBodies,
  writeRenderTree,
} from '../../project/index.js';
import type { AgentPlugin } from '../../resolve/index.js';
import { runDeploy } from './deploy.js';
import {
  type InstallPrompts,
  type RoleQuestion,
  hasTerminal,
  terminalPrompts,
} from './install-prompts.js';

export interface InstallCmdOpts {
  /** Harness adapter name (`--harness`). Absent: the one the host has, or asked. */
  harness?: string;
  /** A corpus package to resolve at run time — the operator's explicit `--plugin`.
   *  Naming a foreign package by string is the one case that genuinely requires a
   *  dynamic import; the DEFAULT never takes this path. */
  plugin?: string;
  /** The corpus this CLI was composed with, imported statically by its owner. */
  corpus?: AgentPlugin;
  /** Show what would be placed and stop; write nothing. */
  dryRun?: boolean;
  cwd?: string;
  /** `--personas <name,…|none>`: the corpus's optional personas to install. Absent:
   *  asked, or — where nothing is asked — the ones already installed here. */
  personas?: string;
  /** Link a command named after each installed persona into `~/.local/bin`
   *  (`--link-persona-commands`), or link none (`--no-link-persona-commands`). Absent:
   *  asked, or — where nothing is asked — none. */
  linkPersonaCommands?: boolean;
  /** `--model-roles <role=model,…|default>`: the model each named held role routes
   *  to; `default` leaves every role on cratylus's routing. Given at all, it settles
   *  the decision: a role it does not name takes the default. Absent: asked. */
  modelRoles?: string;
  /** `--yes`: take the default of every decision not given, ask nothing, and place
   *  without asking to go ahead. */
  yes?: boolean;
  /** `--verbose`: also print the per-file detail of the run. */
  verbose?: boolean;
  /** Where the questions go. Default: the terminal. */
  prompts?: InstallPrompts;
  /** Whether questions may be asked at all. Default: stdin and stdout are a terminal. */
  interactive?: boolean;
  /** `PATH`, for the on-PATH report. Default: the process's. */
  pathEnv?: string;
}

/** Which harnesses this host actually has, by the home each adapter declares.
 *
 *  DETECTION IS OFFERED, NEVER ASSUMED. `project` may not guess a harness — a render
 *  tree that depends on which harness happens to be installed is not `REGENERABLE`,
 *  and that is a property about ARTIFACTS. `install` writes no artifact a build
 *  reproduces; it acts on THIS machine, where "which harnesses are here" is the
 *  question being asked rather than a variable leaking into an output. */
export function detectHarnesses(home: string): string[] {
  return HARNESS_NAMES.filter((name) =>
    existsSync(join(home, adapterByName(name).home)),
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
    /** Dropped personas' commands taken out again. */
    unlinked: string[];
  };
}

function emptyFindings(): Findings {
  return {
    detail: [],
    warnings: [],
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
        `--model-roles: '${entry}' must be <role>=<model> (or the single word 'default').`,
      );
    }
    if (!valid.test(model)) {
      throw new Refusal(
        `--model-roles: '${model}' is not a usable model name.`,
      );
    }
    chosen[role] = model;
  }
  return chosen;
}

export async function runInstall(
  opts: InstallCmdOpts & { home: string },
): Promise<number> {
  try {
    return await install(opts);
  } catch (e) {
    if (!(e instanceof Refusal)) throw e;
    process.stderr.write(`${pc.red('✗')} ${CLI_BIN} install: ${e.message}\n`);
    return 1;
  }
}

async function install(
  opts: InstallCmdOpts & { home: string },
): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  const say = (line: string): void => {
    process.stdout.write(`${line}\n`);
  };
  const interactive = opts.yes !== true && (opts.interactive ?? hasTerminal());
  const prompts = opts.prompts ?? terminalPrompts;
  /** An answer, or the run ends: nothing has been written yet. */
  const answered = async <T>(pending: Promise<T | undefined>): Promise<T> => {
    const value = await pending;
    if (value === undefined) {
      throw new Refusal('cancelled — nothing was written.');
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
        `no harness found under ${opts.home} — looked for ${HARNESS_NAMES.map((n) => adapterByName(n).home).join(', ')}. Name one with --harness <${HARNESS_NAMES.join('|')}>.`,
      );
    } else {
      throw new Refusal(
        `found ${found.join(' and ')} — name one with --harness <${found.join('|')}>.`,
      );
    }
  }
  const adapter = adapterByName(harness);
  const harnessDir = join(opts.home, adapter.home);

  // ── WHICH CORPUS ─────────────────────────────────────────────────────────────
  const configPath = join(cwd, CONFIG_FILE);
  const specifier = opts.plugin;
  let plugins: readonly AgentPlugin[];
  let source: string;

  if (existsSync(configPath)) {
    const config = await loadConfig(configPath);
    plugins = config.extends;
    source = configPath;
  } else if (opts.corpus !== undefined) {
    plugins = [opts.corpus];
    source = 'the corpus this command was built with';
  } else if (specifier !== undefined && specifier !== '') {
    const mod = (await import(specifier)) as { default?: AgentPlugin };
    if (mod.default === undefined) {
      throw new Refusal(
        `'${specifier}' has no default export — a corpus package default-exports its plugin.`,
      );
    }
    plugins = [mod.default];
    source = specifier;
  } else {
    // The refusal a LIBRARY owes: no corpus was named, and inventing one is the one
    // thing this package may never do.
    throw new Refusal(
      `no corpus — write a ${CONFIG_FILE}, pass --plugin <package>, or mount this CLI from a package that names one.`,
    );
  }

  // ── RENDER ───────────────────────────────────────────────────────────────────
  // What the corpus renders depends on which optional personas are left out, and the
  // list of optional personas is only known from a render: so render once with all of
  // them, and again only if some are dropped.
  const resolvedBodies = resolveFragmentBodies(
    await discoverFragments(plugins),
    [],
  );
  const render = async (omitAgents: readonly string[]) => {
    const warnings: string[] = [];
    const report = await projectPluginSet({
      plugins,
      adapter,
      resolvedBodies,
      log: () => {},
      warn: (line) => warnings.push(line),
      // The hooks print each skill's directory, so what fits the harness's output cap
      // depends on this path; the projection cannot know it, install does.
      hostHome: opts.home,
      omitAgents,
    });
    return { report, warnings };
  };
  let rendered = await render([]);

  // ── WHICH PERSONAS ───────────────────────────────────────────────────────────
  // Only the corpus's optional personas are a decision; every other agent is always
  // installed, since the personas dispatch them.
  const optional = rendered.report.optionalAgents;
  const before = optional.filter((n) =>
    Object.hasOwn(readManifest(harnessDir).kinds.agent ?? {}, n),
  );
  let open = opts.harness === undefined;
  let personas: string[];
  if (opts.personas !== undefined) {
    personas = opts.personas.trim() === 'none' ? [] : parseNames(opts.personas);
    const unknown = personas.filter((n) => !optional.includes(n));
    if (unknown.length > 0) {
      throw new Refusal(
        `--personas: ${list(unknown.map((n) => `'${n}'`))} ${unknown.length === 1 ? 'is' : 'are'} no optional persona of this corpus (optional: ${optional.length === 0 ? 'none' : list(optional)}). Every other agent is always installed.`,
      );
    }
  } else if (optional.length === 0) {
    personas = [];
  } else if (interactive) {
    open = true;
    personas = await answered(prompts.personas(optional, before));
  } else {
    personas = before;
  }
  personas = optional.filter((n) => personas.includes(n));
  const dropped = before.filter((n) => !personas.includes(n));
  const omitted = optional.filter((n) => !personas.includes(n));
  if (omitted.length > 0) rendered = await render(omitted);
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
    const path = hostConfigPath(adapter, routing.configRels, opts.home);
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
        `--model-roles: the '${adapter.name}' harness routes no roles.`,
      );
    }
    const given = parseModelRoles(opts.modelRoles, validModel);
    if (given !== 'default') {
      const unknown = Object.keys(given).filter(
        (r) => !tree.heldRoles.includes(r),
      );
      if (unknown.length > 0) {
        throw new Refusal(
          `--model-roles: ${list(unknown.map((r) => `'${r}'`))} ${unknown.length === 1 ? 'is' : 'are'} no role the installed agents hold (roles: ${list(tree.heldRoles)}).`,
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
          throw new Refusal(`'${model}' is not a usable model name.`);
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
    const agentNames = treeNames('agent', stageTree, adapter.agentExt);

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
        pc.gray(`corpus: ${source}`),
        pc.gray(`harness: ${harness} → ${harnessDir}`),
      );
      const rc = await runDeploy({
        agentsDir: stageTree.agentsDir,
        skillsDir: stageTree.skillsDir,
        hooksDir: stage,
        companions: {},
        kind: 'all',
        scope: 'user',
        harness,
        // The harness's home itself, which deploy takes verbatim: a bare home dir would
        // make it print its self-correcting NOTE on every run of every kind.
        home: harnessDir,
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
        warn: (line) => found.warnings.push(line),
        ...(Object.keys(models).length > 0 ? { models } : {}),
      });
      if (rc !== 0) return { rc, found };
      // The routes the definitions just placed name roles; the host maps a role to a
      // model. Deploy is unchanged — this is install's own step, and a deploy that
      // failed places no routes to back.
      seedModelRoles(found, adapter, tree.heldRoles, choices, seeded, {
        home: opts.home,
        dry,
        adopt: migrating,
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
        home: opts.home,
        dry,
        adopt: migrating,
      });
      // Then the persona commands: install's own step too, after the launcher they
      // link to has been placed.
      if (commandsCtx !== undefined) {
        linkPersonaCommands(found, commandsCtx, { link, dry });
        if (dropped.length > 0) {
          const removal = removePersonaCommands({
            ...commandsCtx,
            personas: dropped,
            only: true,
            dry,
          });
          for (const l of removal.links) {
            if (l.state === 'removed' || l.state === 'remove') {
              found.commands.unlinked.push(l.link);
            }
          }
        }
      }
      return { rc, found };
    };

    const confirming = interactive && open && opts.dryRun !== true;
    if (opts.dryRun === true || confirming) {
      const planned = await apply(true);
      if (planned.rc !== 0) return fail(planned.found, planned.rc);
      for (const line of describe(planned.found, {
        adapter,
        harnessDir,
        tree,
        optional,
        personas,
        dropped,
        dry: true,
      })) {
        say(line);
      }
      if (opts.verbose) for (const line of planned.found.detail) say(line);
      warn(planned.found);
      if (opts.dryRun === true) return 0;
      const go = await answered(prompts.confirm('Install this?'));
      if (!go) {
        say('Nothing was written.');
        return 0;
      }
    }

    const placed = await apply(false);
    if (placed.rc !== 0) return fail(placed.found, placed.rc);
    if (opts.verbose) for (const line of placed.found.detail) say(line);
    for (const line of describe(placed.found, {
      adapter,
      harnessDir,
      tree,
      optional,
      personas,
      dropped,
      dry: false,
    })) {
      say(line);
    }
    warn(placed.found);
    return 0;
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

/** A run that failed: what the deploy said, and its code. */
function fail(found: Findings, rc: number): number {
  for (const line of found.detail) process.stderr.write(`${line}\n`);
  warn(found);
  return rc;
}

/** Every warning, one line each, after the rest: a warning is never verbose's. */
function warn(found: Findings): void {
  for (const line of new Set(found.warnings)) {
    process.stderr.write(
      `${pc.yellow('!')} ${line.replace(/\s*\n\s*/g, ' ').trim()}\n`,
    );
  }
}

/**
 * What a run shows an operator, before it places (`dry`) and after: the harness and
 * its home; the personas; the counts; each host file edited and what changed in it;
 * the models chosen; the launch commands; what the host had set and was left alone —
 * and, once placed, what to do next.
 */
function describe(
  found: Findings,
  ctx: {
    adapter: HarnessAdapter;
    harnessDir: string;
    tree: ProjectedTree;
    optional: readonly string[];
    personas: readonly string[];
    dropped: readonly string[];
    dry: boolean;
  },
): string[] {
  const { adapter, tree, dry } = ctx;
  const lines = [
    dry
      ? `${pc.bold(`${CLI_BIN} would install`)} into ${adapter.name} (${ctx.harnessDir}):`
      : `${pc.green('✓')} ${pc.bold(`${CLI_BIN} is installed`)} in ${adapter.name} (${ctx.harnessDir}):`,
    `  ${plural(tree.agents, 'agent')}, ${plural(tree.skills, 'skill')}, ${plural(tree.hooks, 'hook')}`,
  ];
  if (ctx.optional.length > 0) {
    const chosen = ctx.personas.length === 0 ? 'none' : list(ctx.personas);
    const removed =
      ctx.dropped.length > 0
        ? `; ${dry ? 'would remove' : 'removed'} ${list(ctx.dropped)}`
        : '';
    lines.push(`  optional personas: ${chosen}${removed}`);
  }
  for (const edit of found.edits) {
    lines.push(`  ${dry ? 'would edit' : 'edited'} ${edit.path}: ${edit.what}`);
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
      `  ${dry ? 'would unlink' : 'unlinked'} the command${commands.unlinked.length === 1 ? '' : 's'} of ${list(ctx.dropped)}`,
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
 *  launcher to link to or no agent to name a command after. The launcher a command
 *  links to is the harness's, and every OTHER harness's is passed along so a name
 *  already taken by one is reported as held by it. */
function personaCommandsOf(
  adapter: HarnessAdapter,
  personas: readonly string[],
  opts: InstallCmdOpts & { home: string },
): PersonaCommandsOpts | undefined {
  const self = personaLauncherOf(opts.home, adapter);
  if (self === undefined || personas.length === 0) return undefined;
  return {
    home: opts.home,
    harnessDir: join(opts.home, adapter.home),
    self,
    personas,
    peers: HARNESS_NAMES.filter((n) => n !== adapter.name).flatMap((n) => {
      const peer = personaLauncherOf(opts.home, adapterByName(n));
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
  adapter: HarnessAdapter,
  configRels: readonly string[],
  home: string,
): string {
  const candidates = configRels.map((rel) => join(home, adapter.home, rel));
  return candidates.find((p) => existsSync(p)) ?? (candidates[0] as string);
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
  run: { home: string; dry: boolean; adopt: boolean },
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
    const harnessDir = join(run.home, adapter.home);
    const path = join(harnessDir, adapter.hooksFile);
    const result = ensureBadgeStatusLine(path, worker.command, { dry });
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
    const path = hostConfigPath(adapter, host.configRels, run.home);
    const result = ensureStatusSegment(path, host, { dry, adopt });
    if (result.edit !== undefined) {
      noteHostEdit(join(run.home, adapter.home), path, result.edit);
    }
    if (adopt && !dry && existsSync(path)) {
      markMigratedConfig(join(run.home, adapter.home), path);
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
  run: { home: string; dry: boolean; adopt: boolean },
): void {
  const routing = adapter.roleRouting;
  if (routing === undefined || heldRoles.length === 0) return;
  const { home, dry, adopt } = run;
  const harnessDir = join(home, adapter.home);
  const path = hostConfigPath(adapter, routing.configRels, home);
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
  if (!dry) {
    noteHostRoutes(
      harnessDir,
      [...result.added, ...moved]
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
