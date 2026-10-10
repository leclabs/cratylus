// What the capability-command tests share: a temporary git repository to run in,
// the host runtime config they run under, and what the concept journal holds.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JOURNAL_DIR } from '../src/capabilities/concepts/journal.js';

const configDir = mkdtempSync(join(tmpdir(), 'verb-surface-config-'));
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

/** A fresh repository with one commit. */
export function repository(): string {
  const dir = mkdtempSync(join(tmpdir(), 'verb-surface-'));
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
