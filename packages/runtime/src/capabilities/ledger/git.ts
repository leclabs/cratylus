// ─────────────────────────────────────────────────────────────────────────────
// The GIT the ledger speaks: the top of the repository it runs in, where the
// ledger is kept, and the common directory every worktree of it shares, where
// the ledger's append lock is held.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';

/** Run git in `cwd`; its stdout, trimmed. Throws git's own words, on one line. */
function git(cwd: string, args: readonly string[]): string {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const stderr =
      typeof error === 'object' && error !== null && 'stderr' in error
        ? String(error.stderr)
        : '';
    const said = stderr
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
      .join(' ');
    throw new Error(said === '' ? `git ${args[0]} failed` : said);
  }
}

/** The top of the git working tree holding `from`, or `undefined` outside one. */
export function topOf(from: string): string | undefined {
  try {
    const top = git(from, ['rev-parse', '--show-toplevel']);
    return top === '' ? undefined : top;
  } catch {
    return undefined;
  }
}

/** The directory every worktree of the repository at `top` shares. */
export function commonDirOf(top: string): string {
  return git(top, ['rev-parse', '--path-format=absolute', '--git-common-dir']);
}
