import { stripVTControlCharacters } from 'node:util';
import { spawn } from 'node-pty';
import type { CommandResult } from './capability-port/fixture.js';

export interface TerminalRun {
  cwd: string;
  env: NodeJS.ProcessEnv;
  /** Shown everything the terminal has shown so far, its control sequences
   *  stripped, after each chunk; returns the keys to type, if any. */
  answer?: (shown: string) => string | undefined;
  timeout?: number;
}

/** `line` run by `sh` on a pseudo-terminal of its own, 200 columns by 50 rows.
 *  A terminal has one output, so `stdout` holds all of it and `stderr` is empty;
 *  `code` is null where the run outlived `timeout` and was killed. */
export function onTerminal(
  line: string,
  { cwd, env, answer, timeout = 30_000 }: TerminalRun,
): Promise<CommandResult> {
  const terminal = spawn('sh', ['-c', line], {
    cols: 200,
    rows: 50,
    cwd,
    env: Object.fromEntries(
      Object.entries(env).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    ),
  });
  let stdout = '';
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    terminal.kill();
  }, timeout);
  terminal.onData((chunk) => {
    stdout += chunk;
    const keys = answer?.(stripVTControlCharacters(stdout));
    if (keys) terminal.write(keys);
  });
  // The workspace's lib is ES2022, which types no Promise.withResolvers.
  return new Promise((resolve) => {
    terminal.onExit(({ exitCode }) => {
      clearTimeout(timer);
      resolve({ code: timedOut ? null : exitCode, stdout, stderr: '' });
    });
  });
}
