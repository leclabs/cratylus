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
  claudeDir: string;
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

/** User scope claude dir: <home>/.claude. No `--home` → $HOME/.claude. A bare
 *  home self-corrects (`.claude` appended, with a loud NOTE); a path already
 *  ending in `.claude` is used verbatim. */
export function userScope(home?: string | null): ScopeResult {
  if (!home) {
    return { claudeDir: resolvePath(homedir(), '.claude'), note: null };
  }
  const p = resolvePath(expanduser(home));
  if (basename(p) === '.claude') {
    return { claudeDir: p, note: null };
  }
  const claudeDir = resolvePath(p, '.claude');
  return {
    claudeDir,
    note: {
      message: `  NOTE --home '${home}' is a home dir -> deploying to ${claudeDir}`,
    },
  };
}

/** Project scope claude dir: <project>/.claude (project defaults to cwd). */
export function projectScope(project?: string | null): ScopeResult {
  const root = project ? resolvePath(expanduser(project)) : process.cwd();
  return { claudeDir: resolvePath(root, '.claude'), note: null };
}
