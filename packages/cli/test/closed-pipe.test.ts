// A READER THAT CLOSES THE PIPE EARLY ENDS THE COMMAND QUIETLY — with success.
//
// `cratylus project --verbose | head -1` is how a person reads the head of a long
// listing, and every Unix tool ends without a word when its reader has taken what it
// wanted. The command line does so by ending on the EPIPE its stdout raises
// (`endOnClosedStdout` in src/cratylus.ts). That is a fact about the process, not
// about the in-process program command-tree.test.ts builds, so it is held here on the
// BUILT bin, spawned with its stdout on a pipe this test reads one line of and closes.
//
// The bin is `dist/cratylus.js`; the cli package's test task depends on its own build
// (turbo.json), so it is there on a cold tree.

import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const bin = join(packageRoot, 'dist', 'cratylus.js');
/** The repository root, where a cratylus.config.ts resolves for `project`. */
const repoRoot = join(packageRoot, '..', '..');

interface Ended {
  readonly code: number | null;
  readonly stderr: string;
}

/** Run the bin on `words` in `cwd` with stdout on a pipe, read the first line off it
 *  and close it, and wait for the process to end. (The executor form of a promise:
 *  this package's `lib` predates `Promise.withResolvers`.) */
function endedByReader(words: string[], cwd: string): Promise<Ended> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bin, ...words], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stderr: Buffer[] = [];
    let seen = '';
    child.stdout.on('data', (chunk: Buffer) => {
      seen += chunk.toString('utf8');
      if (seen.includes('\n')) child.stdout.destroy();
    });
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (code) =>
      resolve({ code, stderr: Buffer.concat(stderr).toString('utf8') }),
    );
  });
}

let scratch: string;
beforeAll(() => {
  expect(existsSync(bin), `${bin} is built by the test task`).toBe(true);
  scratch = mkdtempSync(join(tmpdir(), 'cratylus-closed-pipe-'));
});
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

describe('a reader that closes the pipe after the first line ends the command quietly', () => {
  it.each([
    [
      'project --verbose --out <temp dir>',
      () => ['project', '--verbose', '--out', scratch],
    ],
    ['--help', () => ['--help']],
    ['plan --help', () => ['plan', '--help']],
  ] as const)(
    '%s',
    async (_name, words) => {
      const { code, stderr } = await endedByReader(words(), repoRoot);
      expect(code).toBe(0);
      const loud = stderr
        .split('\n')
        .filter((line) => line.includes('EPIPE') || line.startsWith(' at '));
      expect(loud, stderr).toEqual([]);
    },
    30_000,
  );
});
