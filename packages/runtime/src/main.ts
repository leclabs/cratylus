// ─────────────────────────────────────────────────────────────────────────────
// The runtime MAIN — the Commander commands for the capabilities the runtime ships.
//
// This module EXPORTS the commands; it neither builds a program nor runs one. The
// program lives in the installable CLI package, which adds these commands to its
// own tree beside the projector's, so `--help` lists every command and capability
// there is, and one refusal answers a word that is neither.
//
// ONE COMMANDER COMMAND PER CAPABILITY, its verbs rendered into its help, all of it
// built from the declarations beside the verbs: the capability's summary from
// `CAPABILITY_SUMMARIES`, a verb's summary, positional, and each flag's description
// and whether it takes a value from the capability's `VERBS`. Nothing is retyped
// here, so help cannot say what a verb does not take.
//
// COMMANDER DOES NOT PARSE A VERB'S FLAGS. It owns the structure and the help; the
// tokens after the verb reach that verb's dispatcher exactly as given, and
// `readArgv` stays their one reader, so every `verb flags` refusal is the
// dispatcher's own. The one thing read here is whether the tokens ask for help:
// `--help` or `-h` as a token of its own, never as the value of a flag that
// takes one — `note capture t --body -h` keeps `-h` as the body. A verb the
// capability does not declare is refused by `verbOf`, the one home of that refusal.
//
// `eventTap` prints its JSON result; `design`, `plan` and `note` print their
// view. A refusal is a loud code-1 failure, printed as `cratylus: <message>`.
// Help goes to stdout when asked for and to stderr when it is the answer to a
// call that named no verb, where it is a failure.
//
// The BIN NAME is a PLACEHOLDER pending the brand derivation, and it is IMPORTED,
// not written here: its one home is `./bin-name.ts`. See that module for why the
// single home is load-bearing (three of its four consumers speak it from inside a
// compiler-invisible emitted string).
// ─────────────────────────────────────────────────────────────────────────────

import { Command, Option } from 'commander';
import { CLI_BIN } from './bin-name.js';
import { VERBS as DESIGN } from './capabilities/design/dispatch.js';
import { dispatchDesign } from './capabilities/design/index.js';
import { VERBS as EVENT_TAP } from './capabilities/event-tap/dispatch.js';
import { dispatchEventTap } from './capabilities/event-tap/index.js';
import { VERBS as NOTE } from './capabilities/note/dispatch.js';
import { dispatchNote } from './capabilities/note/index.js';
import { verbOf } from './capabilities/plan/argv.js';
import { VERBS as PLAN } from './capabilities/plan/dispatch.js';
import { dispatchPlan } from './capabilities/plan/index.js';
import {
  CAPABILITIES,
  CAPABILITY_SUMMARIES,
  type Capability,
} from './capability.js';
import type { Verb, VerbFlags } from './verb-flags.js';

/**
 * Each capability's verb surface: the verbs it declares, and its verb and
 * arguments in, the text it prints out. A refusal throws.
 *
 * ONE WORD ROUTES EACH, and it is the capability's own member of `CAPABILITIES` —
 * `eventTap`, never the kebab dir name nor an abbreviation. That is the word the
 * grammar `<capability> <verb>` speaks, and therefore the word a PROJECTED THIN
 * SHIM spawns (the emitter is `f(capability)`, so an `eventTap` cell yields
 * `spawnSync(CLI_BIN, ['eventTap', …])`).
 */
const SURFACES: {
  readonly [C in Capability]: {
    readonly verbs: VerbFlags;
    readonly run: (argv: string[]) => string;
  };
} = {
  eventTap: {
    verbs: EVENT_TAP,
    run: (argv) => JSON.stringify(dispatchEventTap(argv), null, 2),
  },
  design: { verbs: DESIGN, run: dispatchDesign },
  plan: { verbs: PLAN, run: dispatchPlan },
  note: { verbs: NOTE, run: dispatchNote },
};

/** Help is never wrapped: a line holds one fact whatever the terminal's width. */
const UNWRAPPED = { helpWidth: Number.MAX_SAFE_INTEGER } as const;

/** One verb's command, held for its help alone: its summary, its positional and
 *  its flags, declared so they print. It is never registered and never parses. */
function verbCommand(
  capability: Capability,
  name: string,
  verb: Verb,
): Command {
  const command = new Command(name)
    .description(verb.summary)
    .helpCommand(false)
    .configureHelp({
      ...UNWRAPPED,
      // Held by no parent, the command would name only itself in its usage line.
      commandUsage: (self) =>
        `${CLI_BIN} ${capability} ${self.name()} ${self.usage()}`,
    });
  if (verb.positional !== null) command.argument(verb.positional);
  for (const [flag, spec] of Object.entries(verb.flags))
    command.addOption(
      new Option(
        spec.takes === 'value' ? `--${flag} <value>` : `--${flag}`,
        spec.description,
      ),
    );
  return command;
}

/** A token read as an attempted flag even after a flag the verb does not take
 *  — `readArgv`'s own rule, which decides what a flag leaves for the next token. */
const FLAG_SHAPED = /^(?:--|-[A-Za-z][A-Za-z0-9-]*(?:=|$))/;

/**
 * Whether `tokens`, the tail of a verb, ask for help: `--help` or `-h` as a
 * token of its own, and not as the value of a flag that takes one. The walk
 * spends each token as `readArgv` does, so a token that reader gives to a flag
 * as its value is never read as the request.
 */
function asksForHelp(tokens: readonly string[], verb: Verb): boolean {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i] as string;
    if (token === '--help' || token === '-h') return true;
    if (!token.startsWith('-') || token === '-') continue;
    const eq = token.indexOf('=');
    if (eq !== -1) continue;
    const name = token.startsWith('--') ? token.slice(2) : undefined;
    const kind =
      name !== undefined && Object.hasOwn(verb.flags, name)
        ? verb.flags[name]?.takes
        : undefined;
    if (kind === 'switch') continue;
    const next = tokens[i + 1] ?? '--';
    if (kind === 'value' ? !next.startsWith('--') : !FLAG_SHAPED.test(next))
      i++;
  }
  return false;
}

function refuse(message: string): void {
  process.stderr.write(`${CLI_BIN}: ${message}\n`);
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

/** A capability's help: its verbs, and where to ask for what a verb takes. */
function helpOf(command: Command, error: boolean): string {
  return `${command.helpInformation({ error })}Run ${CLI_BIN} ${command.name()} <verb> --help for what a verb takes.\n`;
}

/** One capability's command: its verbs in its help, its action routing the verb
 *  and the tokens after it, exactly as given, to the capability's verb surface. */
function capabilityCommand(capability: Capability): Command {
  const { verbs, run } = SURFACES[capability];
  const verbCommands = new Map(
    Object.entries(verbs).map(([name, verb]) => [
      name,
      verbCommand(capability, name, verb),
    ]),
  );
  return (
    new Command(capability)
      .description(CAPABILITY_SUMMARIES[capability])
      .usage('<verb> [args]')
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
            printHelp(self, helpOf(self, true), false);
            return;
          }
          if (verb === '--help' || verb === '-h') {
            printHelp(self, helpOf(self, false), true);
            return;
          }
          try {
            verbOf([verb], capability, verbs);
            if (asksForHelp(tokens, verbs[verb] as Verb)) {
              printHelp(
                self,
                (verbCommands.get(verb) as Command).helpInformation(),
                true,
              );
              return;
            }
            process.stdout.write(`${run([verb, ...tokens])}\n`);
            process.exitCode = 0;
          } catch (err) {
            refuse(err instanceof Error ? err.message : String(err));
          }
        },
      )
  );
}

/**
 * The runtime's commands, one per capability in `CAPABILITIES` order. They stop
 * reading options at the verb, so the program that holds them enables positional
 * options.
 */
export function capabilityCommands(): Command[] {
  return CAPABILITIES.map(capabilityCommand);
}
