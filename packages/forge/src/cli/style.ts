// THE ONE MODULE THAT DECIDES COLOUR, and the only one in forge that imports chalk.
//
// THE REGISTER every command writes to, so the CLI reads as one tool:
//
//   - a RESULT goes to stdout (`say`);
//   - everything that is not the result — a failure, a warning — goes to stderr, one
//     line each, as `cratylus <command>: <what went wrong>; <what to do>` (`fail`) or
//     `cratylus <command>: warning: <message>` (`warn`);
//   - no glyphs, no banners, no spacer lines; one fact to a line;
//   - colour marks the prefix of a diagnostic and nothing else.
//
// COLOUR IS DECIDED PER STREAM. A line's colour is a property of where THAT line goes:
// the stream is a terminal and `NO_COLOR` is unset. chalk's own default instance
// decides from stdout alone and lets `CI` and `FORCE_COLOR` turn colour on for a pipe
// or a file, which put escape bytes into a redirected stderr — so no default instance
// is used here: a `Chalk` is built per stream with its level set from that stream.

import { Chalk } from 'chalk';
import { CLI_BIN } from '../bin-name.js';

type Colour = 'red' | 'yellow';

/** Whether colour may be written to `stream`: it is a terminal, `NO_COLOR` is unset
 *  (an empty value counts as unset, as no-color.org has it) and the terminal is not
 *  `dumb`. Neither `CI` nor `FORCE_COLOR` is consulted: they say nothing about where
 *  a given line goes. */
function colourOn(stream: NodeJS.WriteStream): boolean {
  const noColour = process.env.NO_COLOR;
  if (noColour !== undefined && noColour !== '') return false;
  return stream.isTTY === true && process.env.TERM !== 'dumb';
}

function paint(
  stream: NodeJS.WriteStream,
  colour: Colour,
  text: string,
): string {
  return new Chalk({ level: colourOn(stream) ? 1 : 0 })[colour](text);
}

/** One line: a diagnostic is never wrapped, so a message that carries its own line
 *  breaks is joined into the one fact it states. */
function oneLine(message: string): string {
  return message.replace(/\s*\n\s*/g, ' ').trim();
}

/** A result line, to stdout. */
export function say(line: string): void {
  process.stdout.write(`${line}\n`);
}

/** The line a warning is written as, without writing it. */
function warning(command: string, message: string): string {
  const prefix = paint(
    process.stderr,
    'yellow',
    `${CLI_BIN} ${command}: warning:`,
  );
  return `${prefix} ${oneLine(message)}`;
}

/** The line a failure is written as, without writing it. */
function failure(command: string, message: string): string {
  const prefix = paint(process.stderr, 'red', `${CLI_BIN} ${command}:`);
  return `${prefix} ${oneLine(message)}`;
}

/** A warning, to stderr: `cratylus <command>: warning: <message>`. */
export function warn(command: string, message: string): void {
  process.stderr.write(`${warning(command, message)}\n`);
}

/** A failure, to stderr: `cratylus <command>: <what went wrong>; <what to do>`. The
 *  caller supplies both halves in `message`; the exit code is the caller's. */
export function fail(command: string, message: string): void {
  process.stderr.write(`${failure(command, message)}\n`);
}

/** The three sinks a command that runs `runDeploy` hands it, bound to the command's
 *  name: result lines to stdout, warnings and the failure it ends with to stderr. */
export function sinks(command: string): {
  log: (line: string) => void;
  warn: (message: string) => void;
  fail: (message: string) => void;
} {
  return {
    log: say,
    warn: (message) => warn(command, message),
    fail: (message) => fail(command, message),
  };
}
