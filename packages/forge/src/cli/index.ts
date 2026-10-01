// THE PROJECTOR'S COMMANDS, as Commander commands — and nothing that runs them.
//
// This module builds `init`, `add`, `compose`, `project`, `optimize`, `install`,
// `uninstall`, `deploy`, `explain` and `catalog`; the program that owns the `bin`
// adds them to its own tree beside the capabilities, so there is ONE command, one
// help, one refusal of a mistyped word. It used to build its own `cac` program and
// parse `process.argv` itself, which is how a mistyped flag died with a stack trace
// and a mistyped top-level flag exited 0: two programs, each with its own idea of
// what an unknown word is.
//
// EVERY VALUE IS CHECKED WHERE IT IS PARSED. A flag that takes one of a set (`--kind`,
// `--scope`, `--harness`) declares the set, so Commander refuses a value outside it,
// names the choices, and runs nothing — `--scope porject` used to mean user scope.
// A required value (`optimize`'s `<source>` and `--plan`, `uninstall`'s `--harness`)
// is declared required. Every default a flag has is declared with it, so the help
// prints the default the command runs with: where it is a fixed value it is the
// option's own default, and where it depends on another flag or on the directory the
// command runs in, the description says so.
//
// The commands print through `./style.ts` and return their exit code; an action sets
// it as the process's exit code, so a stream a command holds open is the command's to
// close, not a `process.exit` that cuts it off.

import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Command, Option } from 'commander';
import { HARNESS_NAMES } from '../adapters/registry/index.js';
import { CLI_BIN } from '../bin-name.js';
import { DEFAULT_PLUGIN_PACKAGE } from '../config/index.js';
import { CONFIG_FILE } from '../config/scaffold.js';
import {
  DEPLOY_CHECK_EXIT,
  type DeployKind,
  type SkillCompanions,
} from '../deploy/index.js';
import type { ProjectablePlugin } from '../project/index.js';
import { runAdd } from './commands/add.js';
import { runCatalog } from './commands/catalog.js';
import { runCompose } from './commands/compose.js';
import {
  ALL_KINDS,
  type DeployKindArg,
  parseCompanions,
  runDeploy,
} from './commands/deploy.js';
import { runExplain } from './commands/explain.js';
import { runInit } from './commands/init.js';
import { runInstall } from './commands/install.js';
import { runOptimize } from './commands/optimize.js';
import { runProject } from './commands/project.js';
import { runUninstall } from './commands/uninstall.js';
import { fail } from './style.js';

export { fail } from './style.js';

/** What the commands are built with. */
export interface ProjectorOptions {
  /** The corpus `install` falls back to when the cwd has no config — the PLUGIN
   *  ITSELF, not a specifier to resolve.
   *
   *  Passed by whoever composes the program, which imports it statically. `forge`
   *  names no corpus of its own: it installs what it is handed and refuses when
   *  handed nothing. Taking the object rather than a string is what removes a
   *  run-time resolution — and therefore a run-time failure mode — from the default
   *  path. */
  readonly defaultCorpus?: ProjectablePlugin;
}

/** The scopes `deploy` places into. */
const SCOPES = ['user', 'project'] as const;

/** A `--harness` flag: one of the registered harnesses, said so in its help. */
const harnessOption = (description: string): Option =>
  new Option('--harness <name>', description).choices(HARNESS_NAMES);

/** The `--config` flag every command that reads the config takes. */
const configOption = (description: string, fallback?: string): Option =>
  new Option(
    '--config <path>',
    `${description} (default: ${fallback ?? `${CONFIG_FILE} in the current directory`})`,
  );

/**
 * The exit code a usage error of `command` ends with, given the words it was run
 * with: `1`, except for `deploy --check`.
 *
 * A USAGE ERROR IS THE CHECK'S OWN FAILURE, NEVER THE HOST'S. Under `--check` this
 * process's exit code is a VERDICT that callers relay — the SessionStart advisory
 * turns it into a line an agent reads. Exiting `1` from an argument check would tell
 * that reader its deployment is stale on the strength of a mistyped flag. So a usage
 * error is `noVerdict` when a verdict was what was asked for.
 */
export function usageExitCode(
  command: string,
  words: readonly string[],
): number {
  return command === 'deploy' && words.includes('--check') ? CHECK_USAGE : 1;
}

/** What a usage error of `deploy --check` exits with: it has no verdict to give. */
const CHECK_USAGE = DEPLOY_CHECK_EXIT.noVerdict;

/** The render directories and companions each kind reads, and no others: a skill is
 *  placed under the agents' names, so it reads both, and only a skill has companions. */
const KIND_READS: Readonly<Record<DeployKind, readonly string[]>> = {
  agent: ['--agents-dir'],
  skill: ['--skills-dir', '--agents-dir', '--assets'],
  hooks: ['--hooks-dir'],
};

/** The directory and asset flags given that the one kind asked for never reads;
 *  none under `--kind all`, which reads every one. */
function unreadByKind(opts: {
  kind: DeployKindArg;
  assets?: string;
  agentsDir?: string;
  skillsDir?: string;
  hooksDir?: string;
}): string[] {
  if (opts.kind === 'all') return [];
  const given: Record<string, string | undefined> = {
    '--agents-dir': opts.agentsDir,
    '--skills-dir': opts.skillsDir,
    '--hooks-dir': opts.hooksDir,
    '--assets': opts.assets,
  };
  return Object.entries(given)
    .filter(
      ([flag, value]) =>
        value !== undefined &&
        !KIND_READS[opts.kind as DeployKind].includes(flag),
    )
    .map(([flag]) => flag);
}

/** The flags a `deploy` was given that none of its other flags let take effect, as
 *  the one line that names them and what to do, or `undefined` when each one does. */
function unusedFlag(opts: {
  kind: DeployKindArg;
  assets?: string;
  from?: string;
  agentsDir?: string;
  skillsDir?: string;
  hooksDir?: string;
  scope: string;
  home?: string;
  project?: string;
  config?: string;
  check?: boolean;
}): string | undefined {
  if (opts.scope === 'project' && opts.home !== undefined)
    return '--home is where --scope user finds the harness home, and --scope project places under --project; drop --home, or use --scope user';
  if (
    opts.from !== undefined &&
    opts.agentsDir !== undefined &&
    opts.skillsDir !== undefined &&
    opts.hooksDir !== undefined
  )
    return '--from only names the directories that --agents-dir, --skills-dir and --hooks-dir leave out, and all three are given; drop --from, or drop the directory flag you want it to name';
  const unread = unreadByKind(opts);
  if (unread.length > 0)
    return `--kind ${opts.kind} does not read ${unread.join(' or ')}; drop ${unread.length === 1 ? 'it' : 'them'}, or give a --kind that does`;
  if (
    opts.scope === 'user' &&
    opts.project !== undefined &&
    (opts.check || opts.config !== undefined)
  )
    return `--project is read for --scope project and to find the config, and ${opts.check ? '--check reads no config' : '--config names it'}, so with --scope user it changes nothing; drop --project, or use --scope project`;
  return undefined;
}

/**
 * The projector's commands, each under the audience it serves — the one place that is
 * said. The consumer installs a corpus and takes it away again (`install`,
 * `uninstall`); the corpus author writes and renders one (`init`, `add`, `compose`,
 * `project`, `optimize`, `deploy`, `explain`, `catalog`). Each list is in the order
 * its help lists it, and the program that owns the `bin` places the two groups from
 * this split, so it holds no list of command names of its own.
 */
export function projectorCommands(options: ProjectorOptions = {}): {
  readonly consumer: Command[];
  readonly author: Command[];
} {
  const init = new Command('init')
    .description(`Create ${CONFIG_FILE}, extending a plugin package`)
    .addOption(
      new Option(
        '--plugin <pkg>',
        'The plugin package the new config extends',
      ).default(DEFAULT_PLUGIN_PACKAGE),
    )
    .action(async (opts: { plugin: string }) => {
      process.exitCode = await runInit({ plugin: opts.plugin });
    });

  const add = new Command('add')
    .description(`Add a plugin package to the extends list of ${CONFIG_FILE}`)
    .argument('<plugin>', 'The plugin package to add')
    .action(async (plugin: string) => {
      process.exitCode = await runAdd({ plugin });
    });

  const compose = new Command('compose')
    .description('Print the fragments your config resolves to, one per line')
    .addOption(configOption('The config file to load'))
    .action(async (opts: { config?: string }) => {
      process.exitCode = await runCompose({ config: opts.config });
    });

  const project = new Command('project')
    .description(
      'Render the plugins your config extends into a tree of harness files',
    )
    .addOption(configOption('The config file to load'))
    .addOption(
      new Option(
        '--out <dir>',
        `The directory to render into (default: .${CLI_BIN}/<harness>, the tree \`${CLI_BIN} deploy\` reads)`,
      ),
    )
    .addOption(harnessOption('The harness to render for').default('claude'))
    .addOption(
      new Option(
        '--verbose',
        'Also print one line per file rendered or pruned',
      ),
    )
    .action(
      async (opts: {
        config?: string;
        out?: string;
        harness: string;
        verbose?: boolean;
      }) => {
        process.exitCode = await runProject({
          config: opts.config,
          out: opts.out,
          harness: opts.harness,
          verbose: opts.verbose,
        });
      },
    );

  const optimize = new Command('optimize')
    .description(
      'Check a rewrite plan for a source you wrote, and write the artifacts and routing manifest it passes',
    )
    .argument('<source>', 'The source file or directory the plan rewrites')
    .addOption(
      new Option(
        '--plan <file>',
        'The JSON plan: its register, concepts and artifacts, which an agent writes (required)',
      ).makeOptionMandatory(),
    )
    .addOption(
      new Option(
        '--out <dir>',
        'The directory the artifacts are written to',
      ).default('optimized'),
    )
    .addOption(
      new Option(
        '--manifest <path>',
        'Where the routing manifest is written (default: .manifests/<source>.json)',
      ),
    )
    .addOption(
      new Option(
        '--prior <path>',
        'A manifest accepted earlier; artifacts whose digests match it are reused',
      ),
    )
    .addOption(new Option('--verbose', 'Also list every file written'))
    .action(
      async (
        source: string,
        opts: {
          plan: string;
          out: string;
          manifest?: string;
          prior?: string;
          verbose?: boolean;
        },
      ) => {
        process.exitCode = await runOptimize({
          source,
          plan: opts.plan,
          out: opts.out,
          manifest: opts.manifest,
          prior: opts.prior,
          verbose: opts.verbose,
        });
      },
    );

  const install = new Command('install')
    .description(
      'Install the bundled corpus into a harness on this machine, asking what you have not said',
    )
    .addOption(
      harnessOption(
        'The harness to install into (default: the one this machine has, else asked)',
      ),
    )
    .addOption(
      new Option(
        '--plugin <pkg>',
        'The corpus package to install (default: the bundled corpus)',
      ),
    )
    .addOption(
      new Option(
        '--practices <names>',
        'The practices to install, comma-separated (default: asked on a terminal, the ones already installed here preselected; without a terminal, required unless --all)',
      ),
    )
    .addOption(new Option('--all', 'Install every practice, without asking'))
    .addOption(
      new Option(
        '--link-persona-commands',
        'Link a command named after each installed persona into ~/.local/bin (default: asked; else none)',
      ),
    )
    .addOption(
      new Option(
        '--no-link-persona-commands',
        'Link no persona commands, without asking',
      ),
    )
    .addOption(
      new Option(
        '--model-roles <roles>',
        "The model each role routes to, as role=model comma-separated, or 'default' (default: asked; a role the host already routes is left as it is)",
      ),
    )
    .addOption(
      new Option(
        '-y, --yes',
        'Take the default of every decision not given, and place without asking to go ahead (the practices already installed here, else the preselected ones; not an answer where there is no terminal)',
      ),
    )
    .addOption(
      new Option('--verbose', 'Also print the per-file detail of the run'),
    )
    .addOption(
      new Option(
        '--dry-run',
        'Print what would be placed and stop, writing nothing',
      ),
    )
    .action(
      async (opts: {
        harness?: string;
        plugin?: string;
        practices?: string;
        all?: boolean;
        linkPersonaCommands?: boolean;
        modelRoles?: string;
        yes?: boolean;
        verbose?: boolean;
        dryRun?: boolean;
      }) => {
        process.exitCode = await runInstall({
          harness: opts.harness,
          plugin: opts.plugin,
          corpus: options.defaultCorpus,
          practices: opts.practices,
          all: opts.all,
          linkPersonaCommands: opts.linkPersonaCommands,
          modelRoles: opts.modelRoles,
          yes: opts.yes,
          verbose: opts.verbose,
          dryRun: opts.dryRun,
          home: homedir(),
        });
      },
    );

  const uninstall = new Command('uninstall')
    .description(
      'Remove from a harness what install placed there, and leave what the host placed or changed',
    )
    .addOption(
      harnessOption(
        'The harness to remove from (required)',
      ).makeOptionMandatory(),
    )
    .addOption(
      new Option(
        '--dry-run',
        'Print what would be removed and left, writing nothing',
      ),
    )
    .addOption(new Option('--verbose', 'Also list every item removed'))
    .action(
      (opts: { harness: string; dryRun?: boolean; verbose?: boolean }) => {
        process.exitCode = runUninstall({
          harness: opts.harness,
          dryRun: opts.dryRun,
          verbose: opts.verbose,
          home: homedir(),
        });
      },
    );

  const deploy = new Command('deploy')
    .description(
      "Place a rendered tree's agents, skills and hooks into a harness",
    )
    .addOption(
      new Option(
        '--from <dir>',
        `The render tree to deploy (default: .${CLI_BIN}/<harness>, what \`${CLI_BIN} project\` writes)`,
      ),
    )
    .addOption(
      new Option(
        '--agents-dir <dir>',
        'The agents directory, where it is not agents/ in the render tree',
      ),
    )
    .addOption(
      new Option(
        '--skills-dir <dir>',
        'The skills directory, where it is not skills/ in the render tree',
      ),
    )
    .addOption(
      new Option(
        '--hooks-dir <dir>',
        'The hooks root, where it is not the render tree itself',
      ),
    )
    .addOption(
      new Option(
        '--assets <decls>',
        'Files to ship with a skill, as <skill>=<file>[,…]; one that is absent is a warning',
      ),
    )
    .addOption(
      new Option('--kind <kind>', 'What to place')
        .choices([...ALL_KINDS, 'all'])
        .default('all'),
    )
    .addOption(
      new Option(
        '--scope <scope>',
        'Where to place it: your home, or a project',
      )
        .choices(SCOPES)
        .default('user'),
    )
    .addOption(harnessOption('The harness to place into').default('claude'))
    .addOption(
      new Option(
        '--home <dir>',
        "The directory the harness's home is under, for --scope user (default: your home directory)",
      ),
    )
    .addOption(
      new Option(
        '--project <dir>',
        'The project root, for --scope project (default: the current directory)',
      ),
    )
    .addOption(
      configOption(
        "The config file the corpus's lifecycle events are read from",
        `${CONFIG_FILE} in the project root`,
      ),
    )
    .addOption(
      new Option('--only <names>', 'Place only these names, comma-separated'),
    )
    .addOption(new Option('--dry-run', 'Print the actions and change nothing'))
    .addOption(
      new Option('--verbose', 'Also print the per-file detail of the run'),
    )
    .addOption(
      new Option(
        '--check',
        'Report where the deployed tree differs from the rendered one (stale, absent or foreign), changing nothing; exits 0 in sync, 1 on drift, 2 when the check could not run; it reads no config and writes nothing to narrate, so --config, --verbose and --dry-run are refused with it',
      ).conflicts(['config', 'verbose', 'dryRun']),
    )
    .action(
      async (opts: {
        from?: string;
        agentsDir?: string;
        skillsDir?: string;
        hooksDir?: string;
        assets?: string;
        kind: DeployKindArg;
        scope: (typeof SCOPES)[number];
        harness: string;
        home?: string;
        project?: string;
        config?: string;
        only?: string;
        dryRun?: boolean;
        verbose?: boolean;
        check?: boolean;
      }) => {
        const usage = opts.check ? CHECK_USAGE : 1;
        // A FLAG THAT WOULD CHANGE NOTHING IS REFUSED, never accepted and dropped.
        // Each of these is a value the command would otherwise read past: `--home`
        // is where the USER scope's harness home lives, `--from` only names the
        // directories no flag already names, and `--project` is read for the place
        // `--scope project` deploys to and for the config the runtime config comes
        // from, which `--check` never reads.
        const refusal = unusedFlag(opts);
        if (refusal !== undefined) {
          fail('deploy', refusal);
          process.exitCode = usage;
          return;
        }
        // THE RENDER ROOT IS THE DEFAULT INPUT, so the ordinary invocation is
        // `cratylus deploy` and nothing else. Three required path flags were a
        // default this CLI owed its users and did not pay: every caller — including
        // this repository's own package.json, four times over — had to spell the
        // same three paths, which is a private reimplementation of the command's
        // own defaults. `project` writes `.cratylus/<harness>`; `deploy` reads it.
        // The flags remain, now as overrides rather than as the way in.
        //
        // THE RENDER DIR IS NAMED AFTER THE TOOL, so it is DERIVED from the bin rather
        // than spelled — one authored home, which the bin-name census enforces.
        const from = opts.from ?? join(`.${CLI_BIN}`, opts.harness);
        const agentsDir = opts.agentsDir ?? join(from, 'agents');
        const skillsDir = opts.skillsDir ?? join(from, 'skills');
        const hooksDir = opts.hooksDir ?? from;
        // A MISSING RENDER TREE IS THE ONE REFUSAL LEFT, and it names its own cure.
        // Absent dirs used to surface as "--agents-dir is required", which told the
        // user to supply a flag when what they actually needed was to run `project`.
        //
        // IT GUARDS THE DEFAULTED PATH ONLY. A caller that named its dirs outright —
        // the drift comparator does, against a temp fixture — has no stake in whether
        // `.cratylus/<harness>` exists under ITS cwd, and refusing there broke ten
        // tests: the guard reported a missing tree at a path that caller never asked
        // about. A default may only be validated where it was actually used.
        const defaulted =
          !opts.from && !opts.agentsDir && !opts.skillsDir && !opts.hooksDir;
        if (defaulted && !existsSync(from)) {
          fail(
            'deploy',
            `no render tree at ${from}; run \`${CLI_BIN} project\` first, or pass --from <dir>`,
          );
          process.exitCode = usage;
          return;
        }
        let companions: Record<string, SkillCompanions> | undefined;
        try {
          companions = parseCompanions(opts.assets ?? null);
        } catch (e) {
          fail(
            'deploy',
            `${(e as Error).message}; fix the --assets declaration and run it again`,
          );
          process.exitCode = usage;
          return;
        }
        process.exitCode = await runDeploy({
          agentsDir,
          skillsDir,
          hooksDir,
          companions,
          kind: opts.kind,
          scope: opts.scope,
          harness: opts.harness,
          home: opts.home ?? null,
          project: opts.project ?? null,
          config: opts.config ?? null,
          only: opts.only ?? null,
          dryRun: opts.dryRun,
          verbose: opts.verbose,
          check: opts.check,
        });
      },
    );

  const explain = new Command('explain')
    .description('Show where each resolved fragment got its value')
    .argument(
      '[agent]',
      'Only the fragments whose id contains this text, ignoring case',
    )
    .addOption(configOption('The config file to load'))
    .addOption(
      new Option('--json', 'Print the machine-readable report instead of text'),
    )
    .action(
      async (
        agent: string | undefined,
        opts: { config?: string; json?: boolean },
      ) => {
        process.exitCode = await runExplain({
          agent,
          config: opts.config,
          json: opts.json,
        });
      },
    );

  const catalog = new Command('catalog')
    .description(
      'List the fragment ids your plugins let you extend, or count what the corpus holds',
    )
    .argument(
      '[agent]',
      'Only the fragments whose id contains this text, ignoring case',
    )
    .addOption(configOption('The config file to load'))
    .addOption(
      new Option(
        '--corpus <dir>',
        "Count the fragments of each dimension in this corpus instead (default with no config: canon's src/dimensions)",
      ),
    )
    .addOption(
      new Option(
        '--json',
        'Print the machine-readable report instead of a table',
      ),
    )
    .action(
      async (
        agent: string | undefined,
        opts: { config?: string; corpus?: string; json?: boolean },
      ) => {
        process.exitCode = await runCatalog({
          agent,
          config: opts.config,
          corpus: opts.corpus,
          json: opts.json,
        });
      },
    );

  return {
    consumer: [install, uninstall],
    author: [init, add, compose, project, optimize, deploy, explain, catalog],
  };
}
