// ─────────────────────────────────────────────────────────────────────────────
// The GIT the work package capability speaks: the top of the repository it runs
// in, the common directory every worktree of it shares, and a builder's commit.
//
// A commit stages exactly its paths (`git add -A -- <paths>`) and commits only
// them (`git commit --only`), leaving whatever else is staged where it was. When
// git refuses either step, the index is put back as it was, so a refused commit
// stages nothing and commits nothing.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

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

/** Commit `paths` of the repository at `top` with `message`; the new commit's
 *  sha. Throws git's words when it refuses, with the index as it was. */
export function commitPaths(
  top: string,
  message: string,
  paths: readonly string[],
): string {
  const index = git(top, [
    'rev-parse',
    '--path-format=absolute',
    '--git-path',
    'index',
  ]);
  const before = existsSync(index) ? readFileSync(index) : undefined;
  try {
    git(top, ['add', '-A', '--', ...paths]);
    git(top, ['commit', '--only', '-m', message, '--', ...paths]);
  } catch (error) {
    if (before === undefined) rmSync(index, { force: true });
    else writeFileSync(index, before);
    throw error;
  }
  return git(top, ['rev-parse', 'HEAD']);
}
