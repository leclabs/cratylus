#!/usr/bin/env python3
"""Deploy CLI (TOOLKIT.md "Self-binding (render <-> deploy)" -- deploy half).

Thin wrapper over the place stage: resolve a SCOPE to a `.claude/` root, then run
a placer backend (local fs or ssh) that ships the generated defs (the SOUL) and
seeds each agent's `{SELF,MEMORY,EPISODIC}.md` sidecars ONLY IF ABSENT
([[memory]]). Governed oppositely to the def
([[substance-over-accident]]): the def is regenerated substance (overwritten
freely); the sidecars are the self-authored individual (never clobbered).

Join key is the agent NAME ([[named-marker-as-index-key]]):
  ideas/<name>.md -> .claude/agents/<name>.md (def) <-> <name>/SELF.md (self).

Per-host topology comes from `.polis.config` (docs/polis-config-schema.md) when
present -- a deterministic source for ssh user / hostname / home / locality, so
`--user` no longer silently defaults to the current shell user (the upmav-class
fault). Resolution precedence per param: CLI flag › config host.<name> › built-in
default. An ABSENT config keeps legacy flag-only mode working.

Usage:
  deploy.py [--scope user|project] [--host HOST] [--user USER] [--home DIR]
            [--project DIR] [--only NAME,...] [--dry-run]
  deploy.py --fleet [--only H,...] [--exclude H,...] [--dry-run]   # whole fleet

  --scope   user (default; <home>/.claude) or project (<project>/.claude).
  --host    host key in `.polis.config`; omit (or "local") to deploy in place.
  --user    ssh user override (else config host.<name>.user; no current-user default).
  --home    user-scope claude dir override (else config home, else ~/.claude on target).
  --project project root for --scope project (default: cwd).
  --fleet   deploy to every fleet.hosts minus fleet.exclude (config required).
  --exclude add host(s) to the fleet exclude for this run (with --fleet).
  --only    restrict to a subset of names (single-host) or hosts (--fleet).
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
import config as polis_config  # noqa: E402
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


def _resolve_names(kind: str, only: str | None) -> list[str]:
    """The set of def/skill names to deploy for `kind`, optionally narrowed by a
    comma-separated `--only` allowlist (hard-errors on an unknown name)."""
    names = (cells.slugs_deploying_as_skill() if kind == "skill"
             else cells.slugs_of_kind(kind))
    if only:
        want = [n.strip() for n in only.split(",") if n.strip()]
        unknown = [n for n in want if n not in names]
        if unknown:
            sys.exit(f"--only: unknown {kind}(s) {unknown}; known: {names}")
        names = [n for n in names if n in want]
    return names


def _deploy_local(kind: str, names: list[str], scope: str, home: str | None,
                  project: str | None, dry: bool) -> int:
    """Deploy in-place to a local `.claude/` root resolved from the scope."""
    if scope == "project":
        claude_dir = place_scope.project_scope(project)
    else:
        claude_dir = place_scope.user_scope(home)
    print(f"=== LOCAL deploy -> {claude_dir} ===")
    if kind == "skill":
        return place_local.place_skills(claude_dir, SKILLS_SRC, names, dry)
    return place_local.place_agents(claude_dir, DEFS, names, dry)


def _deploy_remote(kind: str, names: list[str], hp: polis_config.HostParams,
                   dry: bool) -> int:
    """Deploy over ssh to a resolved non-local host (user@hostname:<home>)."""
    home = hp.home or "~/.claude"
    print(f"=== REMOTE deploy -> {hp.user}@{hp.hostname}:{home} "
          f"(host key '{hp.name}') ===")
    if kind == "skill":
        return place_ssh.place_skills(hp.user, hp.hostname, home, SKILLS_SRC, names, dry)
    return place_ssh.place_agents(hp.user, hp.hostname, home, DEFS, names, dry)


def _deploy_host(hp: polis_config.HostParams, kind: str, names: list[str],
                 scope: str, project: str | None, dry: bool) -> int:
    """Deploy to one resolved host -- locality from its params, not a magic name."""
    if hp.local:
        return _deploy_local(kind, names, scope, hp.home, project, dry)
    return _deploy_remote(kind, names, hp, dry)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kind", choices=["agent", "skill"], default="agent")
    ap.add_argument("--scope", choices=["user", "project"], default="user")
    ap.add_argument("--host", default=None)
    ap.add_argument("--user", default=None)
    ap.add_argument("--home", default=None)
    ap.add_argument("--project", default=None)
    ap.add_argument("--fleet", action="store_true",
                    help="deploy every fleet.hosts minus fleet.exclude (needs config)")
    ap.add_argument("--exclude", default=None,
                    help="comma-separated host(s) to add to the fleet exclude for this run")
    ap.add_argument("--only", default=None,
                    help="single-host: names to deploy; --fleet: hosts to restrict to")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    try:
        cfg = polis_config.load_config()
    except polis_config.ConfigError as e:
        sys.exit(f"config error: {e}")

    # --kind skill deploys the full skill-dir set: kind:skill cells PLUS any
    # `deploy: skill-dir` organ (e.g. memory, which carries the bundled episodic
    # tool). --kind agent stays the kind:agent species.
    if args.fleet:
        return _run_fleet(cfg, args)

    names = _resolve_names(args.kind, args.only)
    print(f"{args.kind}s ({len(names)}): {', '.join(names)}")

    # Locality comes from the config (host.<name>.local), NOT a magic name list.
    # `--host` omitted / "local" stays the local convenience. With a config
    # present, a named host MUST resolve through it (no current-user fallback).
    if args.host in (None, "local"):
        hp = polis_config.HostParams(
            name="local", local=True, user=None, hostname="local", home=args.home,
        )
    else:
        try:
            hp = polis_config.resolve_host(
                args.host, cli_user=args.user, cli_home=args.home, cfg=cfg,
            )
        except polis_config.ConfigError as e:
            sys.exit(f"config error: {e}")
        if cfg is None:  # legacy flag-only mode: no config to drive locality
            print(f"  NOTE no .polis.config -- legacy flag-only mode for host "
                  f"'{args.host}' (user={args.user or '(current)'})", file=sys.stderr)
    return _deploy_host(hp, args.kind, names, args.scope, args.project, args.dry_run)


def _run_fleet(cfg: dict | None, args) -> int:
    """`--fleet`: iterate fleet.hosts minus fleet.exclude (∪ --exclude), deploy each
    with config-resolved params, report a per-host result. A host in exclude is
    NEVER touched. Needs a config (fleet topology has no flag-only fallback)."""
    if cfg is None:
        sys.exit("--fleet needs a .polis.config (fleet topology) -- none found at repo root")
    extra_exclude = ([h.strip() for h in args.exclude.split(",") if h.strip()]
                     if args.exclude else None)
    only = ([h.strip() for h in args.only.split(",") if h.strip()]
            if args.only else None)
    try:
        targets = polis_config.fleet_targets(cfg, only=only, extra_exclude=extra_exclude)
        resolved = [polis_config.resolve_host(h, cli_user=args.user,
                                              cli_home=args.home, cfg=cfg)
                    for h in targets]
    except polis_config.ConfigError as e:
        sys.exit(f"config error: {e}")

    excluded = sorted(set(cfg.get("fleet", {}).get("exclude", []) or [])
                      | set(extra_exclude or []))
    names = _resolve_names(args.kind, None)  # --only restricts HOSTS in fleet mode
    print(f"=== FLEET deploy ({args.kind}) -> {len(resolved)} host(s): "
          f"{', '.join(h.name for h in resolved)} ===")
    if excluded:
        print(f"    excluded (never touched): {', '.join(excluded)}")
    print(f"    {args.kind}s ({len(names)}): {', '.join(names)}")

    results: list[tuple[str, str]] = []
    for hp in resolved:
        where = (f"local {hp.home or '~/.claude'}" if hp.local
                 else f"{hp.user}@{hp.hostname}:{hp.home or '~/.claude'}")
        print(f"\n--- host '{hp.name}' -> {where} ---")
        rc = _deploy_host(hp, args.kind, names, args.scope, args.project, args.dry_run)
        # ssh placer returns 2 on unreachable (deferred), 0 on landed/dry-run.
        status = ("dry-run" if args.dry_run else
                  "landed" if rc == 0 else
                  "unreachable-deferred" if rc == 2 else f"failed (rc={rc})")
        results.append((hp.name, status))

    print("\n=== FLEET summary ===")
    for name, status in results:
        print(f"  {name}: {status}")
    if excluded:
        print(f"  (excluded: {', '.join(excluded)})")
    failed = [n for n, s in results if s.startswith("failed")]
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
