"""Scope resolvers -- each returns the `.claude/` root an artifact lands in, with
the explicit input that scope requires. The artifact is identical across scopes;
scope is the accident ([[scope-grant]]).

  user     home resolver       -> <home>/.claude        (home defaults to $HOME)
  project  project resolver    -> <project>/.claude     (project defaults to cwd)
  fleet    hosts[]             -> remote user scope per host (see place.ssh)
  local    project, unversioned-> <project>/.claude     (SEAM: gitignored; deferred)

fleet composes the per-host remote placer; local composes project scope plus a
gitignore concern not yet needed by any kind (agents/skills are versioned).
"""
from __future__ import annotations

import pathlib
import sys


def user_scope(home: str | None = None) -> pathlib.Path:
    """User scope claude dir: <home>/.claude. `--home` is the user's HOME dir, so a
    bare home self-corrects -- `.claude` appended, LOUDLY -- while a path already
    ending in `.claude` is used verbatim (back-compat). This mirrors the remote
    placer's `_resolve_claude_dir`: before, LOCAL took an explicit `--home`
    verbatim, so `--home /Users/lex` littered `/Users/lex/{agents,skills}` beside
    the real `~/.claude` -- the same footgun fixed for ssh in f6197f8, here closed
    for the local path too. No `--home` -> $HOME/.claude."""
    if not home:
        return pathlib.Path.home() / ".claude"
    p = pathlib.Path(home).expanduser()
    if p.name == ".claude":
        return p
    print(f"  NOTE --home {home!r} is a home dir -> deploying to {p / '.claude'}",
          file=sys.stderr)
    return p / ".claude"


def project_scope(project: str | None = None) -> pathlib.Path:
    """Project scope claude dir: <project>/.claude (project defaults to cwd)."""
    root = pathlib.Path(project).expanduser() if project else pathlib.Path.cwd()
    return root / ".claude"


# fleet: the priority hosts deploy ships to (SSH user differs per host -- see
# the fleet topology). A list of (user, host); the CLI loops place.ssh over them.
def local_scope(project: str | None = None) -> pathlib.Path:
    """Local (unversioned) scope -- SEAM. Same dir as project scope today; the
    distinguishing gitignore concern is deferred until a kind needs it."""
    return project_scope(project)
