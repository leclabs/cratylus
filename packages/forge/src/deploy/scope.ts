// Where a harness's files are: under a named home, or, for none, the harness's own
// directory.

import { homedir } from 'node:os';
import { join, resolve as resolvePath } from 'node:path';
import type { HarnessAdapter } from '../core/harness-adapter.js';

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
 * install and uninstall name a real home and nothing corrects it.
 */
export function harnessDirIn(
  adapter: Pick<HarnessAdapter, 'home' | 'homeEnv'>,
  home?: string | null,
): string {
  return home
    ? join(home, adapter.home)
    : unnamedHomeDir(adapter.home, adapter.homeEnv);
}
