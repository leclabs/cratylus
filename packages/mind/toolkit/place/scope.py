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


def user_scope(home: str | None = None) -> pathlib.Path:
    """User scope claude dir: <home>/.claude. An explicit `home` is taken as the
    `.claude` dir verbatim (back-compat with deploy --home); else $HOME/.claude."""
    if home:
        return pathlib.Path(home).expanduser()
    return pathlib.Path.home() / ".claude"


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
