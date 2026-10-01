// `cratylus` — the command. One bin, one entry, one Commander program.
//
// THIS IS THE ONLY FILE IN THE REPOSITORY WITH AN EXECUTABLE SHAPE. The program is
// built here from what its dependencies export: `@cratylus/forge/cli` the projector's
// commands (`init` … `catalog`), `@cratylus/runtime/main` one command per capability
// (`eventTap`, `design`, `plan`, `note`), and `@cratylus/canon` the corpus `install`
// falls back to. All three are declared dependencies and all three are imported
// statically — there is nothing to defer, nothing to resolve at run time, and no side
// channel to configure anything through.
//
// ONE PROGRAM, so `--help` at every level lists everything it has, and one place
// answers a word it does not know. The surface used to be two programs — the
// capabilities' and the projector's — with the bin choosing between them on its first
// word, so `cratylus --help` listed the projector and none of the capabilities, and a
// mistyped flag died with a stack trace in one of them and exited 0 in the other.
//
// THE REGISTER IS KEPT HERE FOR EVERY COMMAND. A usage error — an unknown command or
// option, a value outside its choices, a missing required value or argument — is
// refused by Commander and rewritten to one stderr line, `cratylus <command>:
// <what went wrong>; <what to do>`, with exit code 1, and no stack trace. The refusal
// of a verb a capability does not declare is the capability's own, from `verbOf`.
//
// A READER THAT CLOSES STDOUT EARLY ends any command quietly. `cratylus project
// --verbose | head -1` has taken all it wants, which is not a failure: the handler is
// installed once, before any command runs.

import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import canon from '@cratylus/canon';
import { fail, projectorCommands, usageExitCode } from '@cratylus/forge/cli';
import { CLI_BIN } from '@cratylus/runtime/bin-name';
import { capabilityCommands } from '@cratylus/runtime/main';
import { Command, type CommanderError } from 'commander';

/**
 * THIS package's version — the claim `--version` makes about THIS artifact.
 *
 * Read by package self-reference, the form `bin-name.ts` already uses: tsup inlines
 * this module into `dist/cratylus.js`, so a relative `../package.json` would resolve
 * from the wrong depth once bundled. It is the manifest's, never forge's or the
 * runtime's, because the version a command reports is a claim about the artifact the
 * operator installed.
 */
const VERSION: string = createRequire(import.meta.url)(
  'cratylus/package.json',
).version;

/** Help is never wrapped: a line holds one fact whatever the terminal's width. */
const UNWRAPPED = { helpWidth: Number.MAX_SAFE_INTEGER } as const;

/** A usage error Commander refused with, and the command it refused it for. */
class UsageError extends Error {
  /** The command's name, `''` for the program itself. */
  readonly command: string;

  constructor(
    readonly source: Command,
    readonly refusal: CommanderError,
  ) {
    super(refusal.message);
    this.command = source.parent ? source.name() : '';
  }
}

/** A line holds one fact, so a help holds no blank spacer line. */
const withoutSpacers = (text: string): string => text.replace(/\n{2,}/g, '\n');

/**
 * Give `command`, and each command under it, the register: its help and its output
 * hold no spacer line and are never wrapped, and a usage error is raised as a
 * {@link UsageError} for {@link usageLine} to write, never printed by Commander.
 *
 * Applied to every command alike, because Commander's settings do not pass from a
 * program to a command added to it.
 */
function register(command: Command): void {
  command
    .helpCommand(false)
    .configureHelp({ ...command.configureHelp(), ...UNWRAPPED })
    .configureOutput({
      writeOut: (text) => process.stdout.write(withoutSpacers(text)),
      writeErr: (text) => process.stderr.write(withoutSpacers(text)),
      outputError: () => {},
    })
    .exitOverride((refusal) => {
      throw new UsageError(command, refusal);
    });
  for (const sub of command.commands) register(sub);
}

/**
 * The command line: the projector's commands and the capabilities under one
 * program, which stops reading options at its first command so each command's flags
 * are its own.
 */
export function commandLine(): Command {
  const program = new Command(CLI_BIN)
    .description(
      'Project a corpus of agent semantics onto Claude Code and omp, and run the capabilities it installs',
    )
    .version(VERSION, '-v, --version', 'Print the version and exit')
    .enablePositionalOptions();
  for (const command of projectorCommands({ defaultCorpus: canon }))
    program.addCommand(command.helpGroup('Commands:'));
  for (const command of capabilityCommands())
    program.addCommand(command.helpGroup('Capabilities:'));
  register(program);
  return program;
}

/**
 * The one stderr line a usage error is written as:
 * `cratylus <command>: <what went wrong>; <what to do>`. Commander's own words say
 * what went wrong and, where a word is close to one the command has, which; what
 * to do is the help of the command that refused it.
 */
function usageLine(error: UsageError): string {
  const [said = '', ...rest] = (
    error.refusal.code === 'commander.excessArguments'
      ? `unexpected argument ${error.source.args
          .slice(error.source.registeredArguments.length)
          .map((word) => `'${word}'`)
          .join(', ')}`
      : error.refusal.message.replace(/^error: /, '')
  ).split('\n');
  const close = rest.join(' ').match(/Did you mean (?:one of )?(.+?)\?/)?.[1];
  const help = `run ${CLI_BIN} ${error.command === '' ? '' : `${error.command} `}--help`;
  return `${said.replace(/\.$/, '')}; ${close === undefined ? '' : `did you mean ${close}? `}${help}`;
}

/**
 * A reader that closes stdout early has taken all it wants: the process ends quietly
 * with the exit code it already holds. Any other stdout error stays loud.
 */
function endOnClosedStdout(error: NodeJS.ErrnoException): void {
  if (error.code !== 'EPIPE') throw error;
  process.exit();
}

/** Run the command line on `argv`, the words after the program's name. A call that
 *  names no command prints the help on stderr and fails, as a capability with no
 *  verb does. */
export async function main(argv: readonly string[]): Promise<void> {
  if (!process.stdout.listeners('error').includes(endOnClosedStdout))
    process.stdout.on('error', endOnClosedStdout);
  const program = commandLine();
  if (argv.length === 0) {
    program.outputHelp({ error: true });
    process.exitCode = 1;
    return;
  }
  try {
    await program.parseAsync(argv, { from: 'user' });
  } catch (error) {
    // Help and version end a parse by the same route a usage error does, with 0.
    if (error instanceof UsageError && error.refusal.exitCode === 0) return;
    if (!(error instanceof UsageError)) throw error;
    fail(error.command, usageLine(error));
    process.exitCode = usageExitCode(error.command, argv);
  }
}

// RUN ONLY AS THE BIN. This module also exports the program, for the test that holds
// its help to the README, and importing it must not run it. The bin is the file the
// process was started on, compared by real path because the package manager puts a
// symlink on PATH and `import.meta.url` is already resolved.
const entry = process.argv[1];
if (
  entry !== undefined &&
  realpathSync(entry) === fileURLToPath(import.meta.url)
)
  await main(process.argv.slice(2));
