// ─────────────────────────────────────────────────────────────────────────────
// The runtime MAIN — the thin Commander CLI over the capabilities the runtime ships.
//
// This module EXPORTS runCli; it does not invoke it. The invoking bin lives in
// the installable CLI package, which hands the runtime every argv whose first
// word is a member of `CAPABILITIES`.
//
// ONE COMMANDER COMMAND PER CAPABILITY, one subcommand per verb, all of it built
// from the declarations beside the verbs: the capability's summary from
// `CAPABILITY_SUMMARIES`, a verb's summary, positional, and each flag's
// description and whether it takes a value from the capability's `VERBS`. Nothing
// is retyped here, so help cannot say what a verb does not take.
//
// COMMANDER DOES NOT PARSE A VERB'S FLAGS. It owns the structure and the help;
// the tokens after the verb reach that verb's dispatcher exactly as given, and
// `readArgv` stays their one reader, so every `verb flags` refusal is the
// dispatcher's own. The one thing read here is whether the tokens ask for help:
// `--help` or `-h` as a token of its own, never as the value of a flag that
// takes one — `note capture t --body -h` keeps `-h` as the body.
//
// `eventTap` prints its JSON result; `design`, `plan` and `note` print their
// view. A refusal is a loud code-1 failure, printed as `cratylus: <message>`.
// Help goes to stdout when asked for and to stderr when it is the answer to a
// call that named no verb, where it is a failure. It holds no blank spacer line.
//
// The BIN NAME is a PLACEHOLDER pending the brand derivation, and it is IMPORTED,
// not written here: its one home is `./bin-name.ts`. See that module for why the
// single home is load-bearing (three of its four consumers speak it from inside a
// compiler-invisible emitted string).
// ─────────────────────────────────────────────────────────────────────────────

import { createRequire } from 'node:module';
import { Command, Option } from 'commander';
import { CLI_BIN } from './bin-name.js';
import { VERBS as DESIGN } from './capabilities/design/dispatch.js';
import { dispatchDesign } from './capabilities/design/index.js';
import { VERBS as EVENT_TAP } from './capabilities/event-tap/dispatch.js';
import { dispatchEventTap } from './capabilities/event-tap/index.js';
import { VERBS as NOTE } from './capabilities/note/dispatch.js';
import { dispatchNote } from './capabilities/note/index.js';
import { VERBS as PLAN } from './capabilities/plan/dispatch.js';
import { dispatchPlan } from './capabilities/plan/index.js';
import {
  CAPABILITIES,
  CAPABILITY_SUMMARIES,
  type Capability,
} from './capability.js';
import type { Verb, VerbFlags } from './verb-flags.js';

/**
 * This package's version, read from the manifest that DEFINES it.
 *
 * It was the literal `'0.0.0'`, and `0.1.0` shipped to npm with every CLI still reporting
 * `0.0.0` — confirmed by installing the published tarball on another host. A version is a
 * CLAIM ABOUT THE ARTIFACT, and it had no home: `changeset version` rewrites the manifest
 * and cannot rewrite a string in TypeScript, so the two were guaranteed to diverge at the
 * first release and to stay diverged forever.
 *
 * Read by package SELF-REFERENCE rather than a relative path, which is the form
 * `bin-name.ts` already uses and for the same reason: tsup inlines this module into
 * `dist/<entry>/index.js`, so `../package.json` would resolve from the wrong depth once
 * bundled. Node resolves a self-reference through the package's own `exports`.
 */
export const VERSION: string = createRequire(import.meta.url)(
  '@cratylus/runtime/package.json',
).version;

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

/** One verb's command: its summary, its positional and its flags, rendered
 *  into its help. The flags are declared so they print; they are never parsed. */
function verbCommand(name: string, verb: Verb): Command {
  const command = new Command(name)
    .description(verb.summary)
    .helpCommand(false)
    .configureHelp(UNWRAPPED);
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

/** The command line: one command per capability, one subcommand per verb. */
function commandLine(): Command {
  const program = new Command(CLI_BIN)
    .description(`Run a verb of a capability: ${CAPABILITIES.join(', ')}`)
    .helpCommand(false)
    .configureHelp(UNWRAPPED);
  for (const capability of CAPABILITIES) {
    const command = new Command(capability)
      .description(CAPABILITY_SUMMARIES[capability])
      .helpCommand(false)
      .configureHelp(UNWRAPPED);
    for (const [verb, declared] of Object.entries(SURFACES[capability].verbs))
      command.addCommand(verbCommand(verb, declared));
    program.addCommand(command);
  }
  return program;
}

function isCapability(word: string): word is Capability {
  return (CAPABILITIES as readonly string[]).includes(word);
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

/**
 * A reader that closes stdout early — `cratylus design show | head -1` — has
 * taken all it wants, which is not a failure: the process ends quietly with the
 * exit code it already holds. Any other stdout error stays loud.
 */
function endOnClosedStdout(error: NodeJS.ErrnoException): void {
  if (error.code !== 'EPIPE') throw error;
  process.exit();
}

function refuse(message: string): void {
  process.stderr.write(`${CLI_BIN}: ${message}\n`);
  process.exitCode = 1;
}

/** `command`'s help, a line holding one fact: Commander's spacer lines go. */
function helpOf(command: Command, error: boolean): string {
  return command.helpInformation({ error }).replace(/\n{2,}/g, '\n');
}

/** Print `command`'s help: to stdout and a success when asked for, to stderr
 *  and a failure when it is the answer to a call that named no verb. */
function printHelp(command: Command, asked: boolean): void {
  if (asked) {
    process.stdout.write(helpOf(command, false));
    process.exitCode = 0;
  } else {
    process.stderr.write(helpOf(command, true));
    process.exitCode = 1;
  }
}

/** Bin entrypoint: help and version, else route → stdio + exit code. */
export async function runCli(argv: readonly string[]): Promise<void> {
  if (!process.stdout.listeners('error').includes(endOnClosedStdout))
    process.stdout.on('error', endOnClosedStdout);
  const program = commandLine();

  const first = argv[0];
  if (first === undefined || first === '--help' || first === '-h') {
    printHelp(program, true);
    return;
  }
  if (first === '--version' || first === '-v') {
    process.stdout.write(`${VERSION}\n`);
    process.exitCode = 0;
    return;
  }
  if (!isCapability(first)) {
    refuse(
      `unknown capability '${first}' — the capabilities are ${CAPABILITIES.join(', ')}`,
    );
    return;
  }
  const capability = program.commands.find(
    (command) => command.name() === first,
  ) as Command;
  const { verbs, run } = SURFACES[first];
  const verb = argv[1];
  if (verb === undefined) {
    printHelp(capability, false);
    return;
  }
  if (verb === '--help' || verb === '-h') {
    printHelp(capability, true);
    return;
  }
  if (!Object.hasOwn(verbs, verb)) {
    refuse(
      `${first}: unknown verb '${verb}'; the verbs are ${Object.keys(verbs).join(', ')}; run ${CLI_BIN} ${first} --help`,
    );
    return;
  }
  if (asksForHelp(argv.slice(2), verbs[verb] as Verb)) {
    printHelp(
      capability.commands.find((command) => command.name() === verb) as Command,
      true,
    );
    return;
  }
  try {
    process.stdout.write(`${run(argv.slice(1))}\n`);
    process.exitCode = 0;
  } catch (err) {
    refuse(err instanceof Error ? err.message : String(err));
  }
}
