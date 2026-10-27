// ─────────────────────────────────────────────────────────────────────────────
// The runtime MAIN — the Commander commands for the capabilities the runtime ships.
//
// This module EXPORTS the commands; it neither builds a program nor runs one. The
// program lives in the installable CLI package, which adds these commands to its
// own tree beside the projector's, so `--help` lists every command and capability
// there is, and one refusal answers a word that is neither.
//
// ONE COMMANDER COMMAND PER CAPABILITY, its verbs rendered into its help, all of it
// built from the declarations beside the verbs: the capability's purpose from
// `CAPABILITY_SUMMARIES`, and a verb's purpose from the capability's `VERBS`.
// Nothing is retyped here, so help cannot say what a verb does not do.
//
// EVERY CAPABILITY EXPLAINS ITSELF: it answers `--explain` with its explanation as
// JSON, and `<verb> --explain` with one verb's: read out of those same
// declarations by `explain`, beside the help they also print. Its help adds when
// to reach for it, and each verb's the concept it acts on, when to reach for it,
// and that it only reads, so the help says what the explanation says.
//
// A VERB TAKES NO ARGUMENTS. Commander owns the structure and the help; the
// tokens after the verb reach that verb's dispatcher exactly as given, and
// `verbOf` refuses any of them, the one home of that refusal and of the refusal of
// a verb the capability does not declare. The one thing read here is whether the
// tokens ask for help or for the explanation: `--help`, `-h` or `--explain` as
// any token after the verb. Help wins over the explanation.
//
// Each capability prints its JSON result on stdout. A result that is a failure, a
// model check that fails, is still printed on stdout and exits 1. A refusal is a
// loud code-1 failure, printed on stderr as `cratylus <message>`, a message opening
// with the capability and the verb, so it reads as every other command's failure does.
// Help goes to stdout when asked for and to stderr when it is the answer to a
// call that named no verb, where it is a failure.
//
// The BIN NAME is a PLACEHOLDER pending the brand derivation, and it is IMPORTED,
// not written here: its one home is `./bin-name.ts`. See that module for why the
// single home is load-bearing (three of its four consumers speak it from inside a
// compiler-invisible emitted string).
// ─────────────────────────────────────────────────────────────────────────────

import { Command } from 'commander';
import { CLI_BIN } from './bin-name.js';
import { MODEL_CHECK, dispatchModel } from './capabilities/model/index.js';
import { verbOf } from './capabilities/plan/argv.js';
import {
  VERSION_SKEW,
  dispatchVersionSkew,
} from './capabilities/version-skew/index.js';
import {
  CAPABILITIES,
  CAPABILITY_SUMMARIES,
  type Capability,
} from './capability.js';
import {
  type CapabilityInterface,
  type ExplainedVerb,
  explain,
  explainVerb,
} from './explanation.js';

/**
 * Each capability's verb surface: its verb in, the result it prints out and
 * whether that result is a failure, and its interface, which declares its verbs.
 * A refusal throws.
 *
 * ONE WORD ROUTES EACH, and it is the capability's own member of `CAPABILITIES` —
 * `versionSkew`, never a kebab-case name nor an abbreviation. That is the word
 * the grammar `<capability> <verb>` speaks, and therefore the word a PROJECTED
 * THIN SHIM spawns (the emitter is `f(capability)`, so a `versionSkew` skill yields
 * `spawnSync(CLI_BIN, ['versionSkew', …])`).
 */
const SURFACES: {
  readonly [C in Capability]: {
    readonly run: (argv: string[], build: Build) => Outcome;
    readonly explained: CapabilityInterface;
  };
} = {
  model: {
    run: (argv) => {
      const report = dispatchModel(argv);
      return { result: report, failed: !report.passed };
    },
    explained: MODEL_CHECK,
  },
  versionSkew: {
    run: (argv, build) => ({
      result: dispatchVersionSkew(argv, build),
      failed: false,
    }),
    explained: VERSION_SKEW,
  },
};

/** What a verb gives: its result, printed as JSON, and whether it is a failure. */
interface Outcome {
  readonly result: unknown;
  readonly failed: boolean;
}

/** The build the commands are held in: the program's own declared version, which
 *  `versionSkew` reports as the command's. */
export interface Build {
  readonly version?: string;
}

/** Help is never wrapped: a line holds one fact whatever the terminal's width. */
const UNWRAPPED = { helpWidth: Number.MAX_SAFE_INTEGER } as const;

/** One verb's command, held for its help alone: its purpose, when to reach for
 *  it, its concept and its effect. It is never registered and never parses. */
function verbCommand(
  capability: Capability,
  name: string,
  verb: ExplainedVerb,
): Command {
  return new Command(name)
    .summary(verb.purpose)
    .description(
      [
        verb.purpose,
        `When: ${verb.when}`,
        `Concept: ${verb.concept}`,
        `Effect: ${verb.effect}`,
      ].join('\n'),
    )
    .helpCommand(false)
    .configureHelp({
      ...UNWRAPPED,
      // Held by no parent, the command would name only itself in its usage line.
      commandUsage: (self) =>
        `${CLI_BIN} ${capability} ${self.name()} ${self.usage()}`,
    });
}

/** The tokens that ask for help, and for the explanation. */
const HELP: readonly string[] = ['--help', '-h'];
const EXPLAIN: readonly string[] = ['--explain'];

function refuse(message: string): void {
  process.stderr.write(`${CLI_BIN} ${message}\n`);
  process.exitCode = 1;
}

/** Print `text`, a help, through `command`'s own output: to stdout and a success
 *  when asked for, to stderr and a failure when it is the answer to a call that
 *  named no verb. */
function printHelp(command: Command, text: string, asked: boolean): void {
  const output = command.configureOutput();
  if (asked) {
    (output.writeOut ?? process.stdout.write.bind(process.stdout))(text);
    process.exitCode = 0;
  } else {
    (output.writeErr ?? process.stderr.write.bind(process.stderr))(text);
    process.exitCode = 1;
  }
}

/** A capability's help: its verbs, when to reach for it, and where to ask for
 *  what a verb takes and for its explanation as JSON. */
function helpOf(
  command: Command,
  error: boolean,
  explained: CapabilityInterface,
): string {
  const name = `${CLI_BIN} ${command.name()}`;
  return [
    command.helpInformation({ error }),
    `When: ${explained.when}\n`,
    `Run ${name} <verb> --help for what a verb does.\n`,
    `Run ${name} --explain, or ${name} <verb> --explain, for this explanation as JSON.\n`,
  ].join('');
}

/** One capability's command: its verbs in its help, its action routing the verb
 *  and the tokens after it, exactly as given, to the capability's verb surface,
 *  or answering `--explain` with its explanation. */
function capabilityCommand(capability: Capability, build: Build): Command {
  const { run, explained } = SURFACES[capability];
  const verbCommands = new Map(
    Object.entries(explained.verbs).map(([name, verb]) => [
      name,
      verbCommand(capability, name, verb),
    ]),
  );
  return (
    new Command(capability)
      .description(CAPABILITY_SUMMARIES[capability])
      .usage('<verb>')
      .configureHelp({
        ...UNWRAPPED,
        visibleCommands: () => [...verbCommands.values()],
      })
      // The verb and everything after it reach the action untouched: the command
      // stops reading options at its first operand, and the help flag is the
      // action's to read, never Commander's.
      .helpOption(false)
      .passThroughOptions()
      .allowUnknownOption()
      .argument('[verb]')
      .argument('[args...]')
      .action(
        (
          verb: string | undefined,
          tokens: string[],
          _options: unknown,
          self: Command,
        ) => {
          if (verb === undefined) {
            printHelp(self, helpOf(self, true, explained), false);
            return;
          }
          if (HELP.includes(verb)) {
            printHelp(self, helpOf(self, false, explained), true);
            return;
          }
          if (EXPLAIN.includes(verb)) {
            process.stdout.write(
              `${JSON.stringify(explain(explained), null, 2)}\n`,
            );
            process.exitCode = 0;
            return;
          }
          try {
            verbOf([verb], capability, explained.verbs);
            if (tokens.some((token) => HELP.includes(token))) {
              const help = (
                verbCommands.get(verb) as Command
              ).helpInformation();
              printHelp(
                self,
                `${help}Run ${CLI_BIN} ${capability} ${verb} --explain for this explanation as JSON.\n`,
                true,
              );
              return;
            }
            if (tokens.some((token) => EXPLAIN.includes(token))) {
              const explanation = explainVerb(
                verb,
                explained.verbs[verb] as ExplainedVerb,
              );
              process.stdout.write(`${JSON.stringify(explanation, null, 2)}\n`);
              process.exitCode = 0;
              return;
            }
            const { result, failed } = run([verb, ...tokens], build);
            process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
            process.exitCode = failed ? 1 : 0;
          } catch (err) {
            refuse(err instanceof Error ? err.message : String(err));
          }
        },
      )
  );
}

/**
 * The runtime's commands, one per capability in `CAPABILITIES` order, held in the
 * build `build` names. They stop reading options at the verb, so the program that
 * holds them enables positional options.
 */
export function capabilityCommands(build: Build = {}): Command[] {
  return CAPABILITIES.map((capability) => capabilityCommand(capability, build));
}
