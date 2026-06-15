#!/usr/bin/env python3
"""Deploy CLI (TOOLKIT.md "Self-binding (render <-> deploy)" -- deploy half).

Thin wrapper over the place stage: resolve a SCOPE to a `.claude/` root, then run
a placer backend (local fs or ssh) that ships the generated defs (the SOUL) and
seeds each agent's `{SELF,MEMORY,EPISODIC}.md` sidecars ONLY IF ABSENT
([[identity-memory-stack]]). Governed oppositely to the def
([[substance-over-accident]]): the def is regenerated substance (overwritten
freely); the sidecars are the self-authored individual (never clobbered).

Join key is the agent NAME ([[named-marker-as-index-key]]):
  ideas/<name>.md -> .claude/agents/<name>.md (def) <-> <name>/SELF.md (self).

Usage:
  deploy.py [--scope user|project] [--host HOST] [--user USER] [--home DIR]
            [--project DIR] [--only NAME,...] [--dry-run]

  --scope   user (default; <home>/.claude) or project (<project>/.claude).
  --host    remote host (ssh); omit (or "local"/"fire") to deploy in place.
  --user    ssh user for the remote host (default: current user).
  --home    user-scope claude dir (default: ~/.claude on the target).
  --project project root for --scope project (default: cwd).
  --dry-run print actions, change nothing.

Defs are read from the resolver's staging dir (`packages/mind/.render/agents/`,
NOT a `.claude/` tree -- the render is a projection, not a deployment). Run
resolve.py first; deploy then applies the scope accident to a real `.claude/` root.
"""
from __future__ import annotations

import argparse
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from core import cells  # noqa: E402
from place import local as place_local  # noqa: E402
from place import ssh as place_ssh  # noqa: E402
from place import scope as place_scope  # noqa: E402

# Source = the resolver's neutral staging dir (`packages/mind/.render/`), NOT a
# `.claude/` tree: the render is a projection, deploy is what applies the scope
# accident ([[projection-is-not-the-source]] / [[scope-grant]]). Must track
# resolve.RENDER_OUT.
DEFS = cells.ROOT / ".render" / "agents"  # resolver output (agents)
SKILLS_SRC = cells.ROOT / ".render" / "skills"  # resolver output (skills)


def agent_names() -> list[str]:
    """Every kind:agent slug -- the deployable species, by name."""
    return cells.slugs_of_kind("agent")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kind", choices=["agent", "skill"], default="agent")
    ap.add_argument("--scope", choices=["user", "project"], default="user")
    ap.add_argument("--host", default=None)
    ap.add_argument("--user", default=None)
    ap.add_argument("--home", default=None)
    ap.add_argument("--project", default=None)
    ap.add_argument("--only", default=None,
                    help="comma-separated names to deploy (default: all of --kind)")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    names = cells.slugs_of_kind(args.kind)
    if args.only:
        want = [n.strip() for n in args.only.split(",") if n.strip()]
        unknown = [n for n in want if n not in names]
        if unknown:
            sys.exit(f"--only: unknown {args.kind}(s) {unknown}; known: {names}")
        names = [n for n in names if n in want]
    print(f"{args.kind}s ({len(names)}): {', '.join(names)}")

    is_local = args.host in (None, "local", "fire", "fire.lan")
    if is_local:
        if args.scope == "project":
            claude_dir = place_scope.project_scope(args.project)
        else:
            claude_dir = place_scope.user_scope(args.home)
        print(f"=== LOCAL deploy -> {claude_dir} ===")
        if args.kind == "skill":
            return place_local.place_skills(claude_dir, SKILLS_SRC, names, args.dry_run)
        return place_local.place_agents(claude_dir, DEFS, names, args.dry_run)

    user = args.user or pathlib.Path.home().name
    home = args.home or "~/.claude"
    print(f"=== REMOTE deploy -> {user}@{args.host}:{home} ===")
    if args.kind == "skill":
        return place_ssh.place_skills(user, args.host, home, SKILLS_SRC, names, args.dry_run)
    return place_ssh.place_agents(user, args.host, home, DEFS, names, args.dry_run)


if __name__ == "__main__":
    raise SystemExit(main())
