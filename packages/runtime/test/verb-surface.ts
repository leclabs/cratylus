// What the capability-command tests share: a temporary git repository to run in,
// the host runtime config they run under, and what the concept journal holds.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll } from 'vitest';
import { JOURNAL_DIR } from '../src/capabilities/concepts/journal.js';

// Every temp dir made here is removed when the importing test file ends: vitest
// evaluates this module once per file, so the hook lands on that file's suite.
const scratch: string[] = [];
function tmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  scratch.push(d);
  return d;
}
afterAll(() => {
  for (const d of scratch) rmSync(d, { recursive: true, force: true });
});

const configDir = tmp('verb-surface-config-');
/** The host runtime config every test runs under. */
export const CONFIG = join(configDir, 'runtime.json');

function git(cwd: string, ...args: string[]): string {
  return execFileSync(
    'git',
    [
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

/** A fresh repository with one commit, one level inside its temp dir so a line
 *  cut next to it (`<repo>.plan-<plan>`) is removed with it. */
export function repository(): string {
  const dir = join(tmp('verb-surface-'), 'repo');
  mkdirSync(dir);
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'commit', '-q', '--allow-empty', '-m', 'root');
  return dir;
}

/** Every file of the concept journal of `repo`. */
export function everyEntry(repo: string): string[] {
  try {
    return readdirSync(join(repo, JOURNAL_DIR)).sort();
  } catch {
    return [];
  }
}
