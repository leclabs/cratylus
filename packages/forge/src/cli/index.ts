// THE PROJECTOR'S COMMANDS, as Commander commands — and nothing that runs them.
//
// This module builds `install` and `uninstall`; the program that owns the `bin` adds
// them to its own tree beside the capabilities, so there is ONE command, one help, one
// refusal of a mistyped word. It used to build its own `cac` program and parse
// `process.argv` itself, which is how a mistyped flag died with a stack trace and a
// mistyped top-level flag exited 0: two programs, each with its own idea of what an
// unknown word is.
//
// EVERY VALUE IS CHECKED WHERE IT IS PARSED. A flag that takes one of a set (`--scope`,
// `--harness`) declares the set, so Commander refuses a value outside it, names the
// choices, and runs nothing — `--scope porject` used to mean user scope. A required
// value (`uninstall`'s `--harness`) is declared required. Every default a flag has is
// declared with it, so the help prints the default the command runs with: where it is
// a fixed value it is the option's own default, and where it depends on another flag
// or on the directory the command runs in, the description says so.
//
// The commands print through `./style.ts` and return their exit code; an action sets
// it as the process's exit code, so a stream a command holds open is the command's to
// close, not a `process.exit` that ends it early.

import { Command, Option } from 'commander';
import { HARNESS_NAMES } from '../adapters/registry/index.js';
import type { ProjectablePlugin } from '../project/index.js';
import { runInstall } from './commands/install.js';
import { runUninstall } from './commands/uninstall.js';

export { fail } from './style.js';

/** What the commands are built with. */
export interface ProjectorOptions {
  /** The canon `install` installs — the PLUGIN ITSELF, not a specifier to resolve.
   *
   *  Passed by whoever composes the program, which imports it statically. `forge`
   *  names no canon of its own: it installs what it is handed and refuses when
   *  handed nothing. Taking the object rather than a string is what removes a
   *  run-time resolution — and therefore a run-time failure mode — from the path. */
  readonly canon?: ProjectablePlugin;
  /** The declared version of the build the commands are held in: what `install`
   *  records in the owned root as the version that projected it. */
  readonly version?: string;
}

/** The scopes `install` and `uninstall` act at. */
const SCOPES = ['user', 'project'] as const;

/** A `--harness` flag: one of the registered harnesses, said so in its help. */
const harnessOption = (description: string): Option =>
  new Option('--harness <name>', description).choices(HARNESS_NAMES);

/**
 * The projector's commands — installing the canon and taking it away again — in the
 * order its help lists them, so the program that owns the `bin` holds no list of
 * command names of its own.
 */
export function projectorCommands(options: ProjectorOptions = {}): Command[] {
  const install = new Command('install')
    .description(
      'Install the bundled canon, every one of its agents and skills, and the rules you choose, into an agent harness on this machine, asking what you have not said',
    )
    .addOption(
      harnessOption(
        'The agent harness to install into (default: the one this machine has, else asked)',
      ),
    )
    .addOption(
      new Option(
        '--scope <scope>',
        'Where to install: user, for you in every project, or project, inside the project of the current directory, committable, in place of your user installation there (default: asked on a terminal outside your home directory, user preselected; else user)',
      ).choices(SCOPES),
    )
    .addOption(
      new Option(
        '--rules <names>',
        "The rules your agents follow in every project, comma-separated: a ruleset's name takes all its rules, a rule's name that one; or 'none' (default: the rules chosen at the last install, else asked on a terminal; without one, none)",
      ),
    )
    .addOption(
      new Option(
        '--model-roles <roles>',
        "The model each tier the agents fall back to, or an agent's own role, runs on, as role=model comma-separated, bound in your own user settings; or 'default' to bind none; refused with --scope project, since a project installation binds no models (default: at user scope, each tier and persona role your settings do not bind is asked)",
      ),
    )
    .addOption(
      new Option(
        '--agent-status <choice>',
        "Whether the status line, where your settings hide it, shows the session's agent, written as your own user setting; refused with --scope project, since a project installation writes no operator's own setting (default: at user scope, asked where the status line hides it)",
      ).choices(['show', 'hide']),
    )
    .addOption(
      new Option(
        '-y, --yes',
        'Take the default of every decision not given, and place without asking to go ahead',
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
    .addOption(
      new Option(
        '--home <dir>',
        'The home directory to install under: the owned root is <home>/.cratylus/<harness> (default: your home directory)',
      ),
    )
    .action(
      async (opts: {
        harness?: string;
        scope?: (typeof SCOPES)[number];
        rules?: string;
        modelRoles?: string;
        agentStatus?: string;
        yes?: boolean;
        verbose?: boolean;
        dryRun?: boolean;
        home?: string;
      }) => {
        process.exitCode = await runInstall({
          harness: opts.harness,
          scope: opts.scope,
          canon: options.canon,
          version: options.version,
          rules: opts.rules,
          modelRoles: opts.modelRoles,
          agentStatus: opts.agentStatus,
          yes: opts.yes,
          verbose: opts.verbose,
          dryRun: opts.dryRun,
          home: opts.home,
        });
      },
    );

  const uninstall = new Command('uninstall')
    .description(
      'Remove from an agent harness what install placed there — its owned root and every reference into it — and leave what the host placed or changed',
    )
    .addOption(
      harnessOption(
        'The agent harness to remove from (required)',
      ).makeOptionMandatory(),
    )
    .addOption(
      new Option(
        '--scope <scope>',
        'The installation to remove: user, yours, or project, the one inside the project of the current directory',
      )
        .choices(SCOPES)
        .default('user'),
    )
    .addOption(
      new Option(
        '--dry-run',
        'Print what would be removed and left, writing nothing',
      ),
    )
    .addOption(new Option('--verbose', 'Also list every item removed'))
    .addOption(
      new Option(
        '--home <dir>',
        'The home directory the installation is under (default: your home directory)',
      ),
    )
    .action(
      (opts: {
        harness: string;
        scope: (typeof SCOPES)[number];
        dryRun?: boolean;
        verbose?: boolean;
        home?: string;
      }) => {
        process.exitCode = runUninstall({
          harness: opts.harness,
          scope: opts.scope,
          dryRun: opts.dryRun,
          verbose: opts.verbose,
          home: opts.home,
        });
      },
    );

  return [install, uninstall];
}
