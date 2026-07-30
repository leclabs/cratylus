// Scope resolvers — each returns the `.claude/` root an artifact lands in, with
// the explicit input that scope requires. The artifact is identical across
// scopes; scope is the accident (`scope-grant`).
//
//   user     home resolver    -> <home>/.claude    (home defaults to $HOME)
//   project  project resolver -> <project>/.claude  (project defaults to cwd)
//
// The bare-home guard: `--home` is the user's HOME dir, so a bare home
// self-corrects — `.claude` appended, LOUDLY — while a path already ending in
// `.claude` is used verbatim (back-compat). This mirrors the remote placer's
// `resolveClaudeDir`. The footgun it fixes: before, LOCAL took an explicit
// `--home` verbatim, so `--home /Users/lex` littered `/Users/lex/{agents,skills}`
// beside the real `~/.claude`.

import { homedir } from 'node:os';
import { basename, resolve as resolvePath } from 'node:path';

export interface ScopeNote {
  message: string;
}

export interface ScopeResult {
  harnessDir: string;
  // A loud NOTE the caller prints to stderr when the bare-home guard fired.
  note: ScopeNote | null;
}

/** Expand a leading `~` to the user's home dir (POSIX tilde convenience). */
function expanduser(p: string): string {
  if (p === '~') {
    return homedir();
  }
  if (p.startsWith('~/')) {
    return resolvePath(homedir(), p.slice(2));
  }
  return p;
}

/**
 * User scope: `<home>/<harnessHome>`. No `--home` → `$HOME/<harnessHome>`. A bare
 * home self-corrects (the dot-dir is appended, with a loud NOTE); a path already
 * ending in it is used verbatim.
 *
 * `harnessHome` is the ADAPTER's (`HarnessAdapter.home`), never a literal. It
 * defaults to `.claude` for callers that predate the parameter — a default, not an
 * assumption: pass the adapter's and a second harness lands where it belongs.
 */
export function userScope(
  home?: string | null,
  harnessHome = '.claude',
): ScopeResult {
  if (!home) {
    return { harnessDir: resolvePath(homedir(), harnessHome), note: null };
  }
  const p = resolvePath(expanduser(home));
  if (basename(p) === harnessHome) {
    return { harnessDir: p, note: null };
  }
  const harnessDir = resolvePath(p, harnessHome);
  return {
    harnessDir,
    note: {
      message: `  NOTE --home '${home}' is a home dir -> deploying to ${harnessDir}`,
    },
  };
}

/** Project scope: `<project>/<harnessHome>` (project defaults to cwd). */
export function projectScope(
  project?: string | null,
  harnessHome = '.claude',
): ScopeResult {
  const root = project ? resolvePath(expanduser(project)) : process.cwd();
  return { harnessDir: resolvePath(root, harnessHome), note: null };
}
