// Scope resolvers — each returns the `.claude/` root an artifact lands in, with
// the explicit input that scope requires. The artifact is identical across
// scopes; scope is the accident (`scope-grant`).
//
//   user     home resolver    -> <home>/.claude    (no home: the harness's own
//                                environment variable when it has one and it is
//                                set, else $HOME/.claude)
//   project  project resolver -> <project>/.claude  (project defaults to cwd)
//
// The bare-home guard: `--home` is the user's HOME dir, so a bare home
// self-corrects — `.claude` appended, LOUDLY — while a path already ending in
// `.claude` is used verbatim (back-compat). This mirrors the remote placer's
// `resolveClaudeDir`. The footgun it fixes: before, LOCAL took an explicit
// `--home` verbatim, so `--home /Users/lex` littered `/Users/lex/{agents,skills}`
// beside the real `~/.claude`.

import { homedir } from 'node:os';
import { basename, join, resolve as resolvePath } from 'node:path';
import type { HarnessAdapter } from '../core/harness-adapter.js';

export interface ScopeNote {
  message: string;
}

export interface ScopeResult {
  harnessDir: string;
  // The warning the caller prints once when the bare-home guard fired.
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
 * The directory a harness reads when no home was named: the directory its
 * environment variable names, whole, when the adapter declares one and it is set and
 * non-empty; else `<$HOME>/<harnessHome>`. The variable's NAME is the adapter's
 * (`HarnessAdapter.homeEnv`) and is never spelled here.
 */
function unnamedHomeDir(harnessHome: string, homeEnv?: string): string {
  const named = homeEnv === undefined ? undefined : process.env[homeEnv];
  return named
    ? resolvePath(expanduser(named))
    : resolvePath(homedir(), harnessHome);
}

/**
 * The directory a harness's files are in: `<home>/<harnessHome>` for a named home,
 * and for none what {@link unnamedHomeDir} says. A named home is verbatim here —
 * install and uninstall name a real home and no guard corrects it.
 */
export function harnessDirIn(
  adapter: Pick<HarnessAdapter, 'home' | 'homeEnv'>,
  home?: string | null,
): string {
  return home
    ? join(home, adapter.home)
    : unnamedHomeDir(adapter.home, adapter.homeEnv);
}

/**
 * User scope: `<home>/<harnessHome>`. No `--home` → the harness's own directory
 * (`unnamedHomeDir`). A bare home self-corrects (the dot-dir is appended, with a
 * loud NOTE); a path already ending in it is used verbatim.
 *
 * `harnessHome` and `homeEnv` are the ADAPTER's (`HarnessAdapter.home`,
 * `HarnessAdapter.homeEnv`), never a literal. `harnessHome` defaults to `.claude`
 * for callers that predate the parameter — a default, not an assumption: pass the
 * adapter's and a second harness lands where it belongs.
 */
export function userScope(
  home?: string | null,
  harnessHome = '.claude',
  homeEnv?: string,
): ScopeResult {
  if (!home) {
    return { harnessDir: unnamedHomeDir(harnessHome, homeEnv), note: null };
  }
  const p = resolvePath(expanduser(home));
  if (basename(p) === harnessHome) {
    return { harnessDir: p, note: null };
  }
  const harnessDir = resolvePath(p, harnessHome);
  return {
    harnessDir,
    note: {
      message: `--home '${home}' is a home dir; deploying to ${harnessDir}`,
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
