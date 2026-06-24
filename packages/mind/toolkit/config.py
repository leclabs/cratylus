"""`.polis.config` loader + resolution contract (docs/polis-config-schema.md).

The deterministic, per-host deployment-parameter source for `deploy.py`. It exists
so deploy resolves *who* (ssh user) and *where* (hostname / home / locality)
without per-host tribal knowledge or `--user` silently defaulting to the current
shell user -- the failure that made `upmav` look "unreachable" when the real fault
was a wrong SSH user (`lex` vs `lcaraccioli`).

Contract (firm, owned by nico's schema; this module is the consumer that enforces
it):

- JSON, repo root, `.polis.config` (gitignored; `.polis.config.example` committed).
- Resolution precedence per parameter, first-present wins:
    1. CLI flag (--user/--home/--host) -- an explicit override always trumps config.
    2. `.polis.config` host.<name> -- the deterministic per-host value.
    3. Built-in default -- only where the schema names one (hostname->key,
       home->omit, local->false). `user` has NO default (non-local host lacking
       user is a hard error).
- Hard errors ([[degrade-visibly]] / [[no-permissive-defaults]]) -- never silent:
  unknown --host, fleet<->host drift, non-local host missing user, missing/unknown
  schema, malformed JSON. An ABSENT file is NOT an error (legacy flag-only mode);
  a PRESENT file is authoritative.

This module decides nothing about *how* to ship bytes (that is the place/ backends)
-- it only resolves the deployment TOPOLOGY into concrete `(local, user, hostname,
home)` params and enumerates the fleet.
"""
from __future__ import annotations

import json
import os
import pathlib
from dataclasses import dataclass

SCHEMA_VERSION = 1
CONFIG_NAME = ".polis.config"
# Explicit config-path override (an alternate topology file). Honored before the
# repo-root search -- lets an operator (or a hermetic test) point deploy.py at a
# config other than the one beside `.git`. An absent override falls through to the
# repo-root `.polis.config`.
CONFIG_ENV = "POLIS_CONFIG"


class ConfigError(Exception):
    """A malformed / drift / unknown-host fault in `.polis.config`. Raised loudly
    so deploy.py exits non-zero with the cause -- never a silent permissive path."""


@dataclass(frozen=True)
class HostParams:
    """The resolved deployment parameters for one host -- the concrete answer the
    place backends consume. `local` ⇒ in-place (no ssh); otherwise ship to
    `user@hostname:<home>/.claude`."""
    name: str
    local: bool
    user: str | None
    hostname: str
    home: str | None  # None ⇒ deploy.py's ~/.claude server-side default


def repo_root(start: pathlib.Path | None = None) -> pathlib.Path:
    """The repo root holding `.polis.config` -- the nearest ancestor of `start`
    (default: this file) containing a `.git` dir. Falls back to the cwd so a
    detached checkout still resolves a config beside it."""
    here = (start or pathlib.Path(__file__)).resolve()
    for d in (here, *here.parents):
        if (d / ".git").exists():
            return d
    return pathlib.Path.cwd()


def config_path(root: pathlib.Path | None = None) -> pathlib.Path:
    """The `.polis.config` path to read (whether or not it exists). The
    `POLIS_CONFIG` env override wins when set (an explicit alternate topology
    file); else the `.polis.config` beside the repo root. An explicit `root`
    argument (test/internal) still takes precedence over the env override."""
    if root is not None:
        return root / CONFIG_NAME
    override = os.environ.get(CONFIG_ENV)
    if override:
        return pathlib.Path(override)
    return repo_root() / CONFIG_NAME


def load_config(root: pathlib.Path | None = None) -> dict | None:
    """Parse `.polis.config` at the repo root. Returns the validated dict, or
    None if the file is ABSENT (legacy flag-only mode -- a missing config is not an
    error). A PRESENT but malformed / wrong-schema / drifted file is a hard error
    ([[degrade-visibly]]): the topology source must never silently mis-resolve."""
    p = config_path(root)
    if not p.exists():
        return None
    try:
        cfg = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise ConfigError(f"{p}: malformed JSON ({e})") from e
    if not isinstance(cfg, dict):
        raise ConfigError(f"{p}: top-level must be a JSON object")
    schema = cfg.get("schema")
    if schema is None:
        raise ConfigError(f"{p}: missing required `schema`")
    if schema != SCHEMA_VERSION:
        raise ConfigError(
            f"{p}: unrecognized schema {schema!r} (this consumer speaks "
            f"schema {SCHEMA_VERSION}) -- refusing to guess"
        )
    hosts = cfg.get("host")
    if not isinstance(hosts, dict):
        raise ConfigError(f"{p}: `host` must be an object of host entries")
    fleet = cfg.get("fleet", {})
    if not isinstance(fleet, dict):
        raise ConfigError(f"{p}: `fleet` must be an object")
    fleet_hosts = fleet.get("hosts", [])
    if not isinstance(fleet_hosts, list):
        raise ConfigError(f"{p}: `fleet.hosts` must be an array")
    # Drift: every fleet.hosts entry needs a host.<name>, and vice-versa -- a
    # one-sided entry is a topology mistake, surfaced not absorbed.
    missing_host = [h for h in fleet_hosts if h not in hosts]
    if missing_host:
        raise ConfigError(
            f"{p}: fleet.hosts entries with no host.<name> object: {missing_host}"
        )
    orphan_host = [h for h in hosts if h not in fleet_hosts]
    if orphan_host:
        raise ConfigError(
            f"{p}: host.<name> entries absent from fleet.hosts: {orphan_host}"
        )
    return cfg


def resolve_host(name: str, *, cli_user: str | None = None,
                 cli_home: str | None = None,
                 cfg: dict | None = None,
                 root: pathlib.Path | None = None) -> HostParams:
    """Resolve one host's deployment params under the precedence contract
    (CLI flag › config host.<name> › built-in default). `cfg` may be passed to
    avoid re-reading; else loaded from the repo root.

    Hard-errors when a present config does not name `name` in host.{} (the
    upmav-class failure -- no silent current-user fallback), or when a non-local
    host resolves no user."""
    if cfg is None:
        cfg = load_config(root)
    # No config at all: legacy flag-only mode. Non-local unless the host LOOKS
    # local by the historical convenience (handled in deploy.py); here we resolve
    # purely from flags, no per-host record to consult.
    if cfg is None:
        return HostParams(
            name=name, local=False, user=cli_user,
            hostname=name, home=cli_home,
        )
    host_entry = cfg["host"].get(name)
    if host_entry is None:
        raise ConfigError(
            f"--host {name!r} is absent from `.polis.config` host.{{}} "
            f"(known: {sorted(cfg['host'])}) -- refusing a current-user fallback"
        )
    if not isinstance(host_entry, dict):
        raise ConfigError(f"host.{name} must be an object, got {type(host_entry).__name__}")
    local = bool(host_entry.get("local", False))
    # precedence: CLI flag › config › default
    user = cli_user if cli_user is not None else host_entry.get("user")
    hostname = host_entry.get("hostname", name)
    home = cli_home if cli_home is not None else host_entry.get("home")
    if not local and not user:
        raise ConfigError(
            f"host.{name} is non-local and resolves no `user` "
            f"(set host.{name}.user or pass --user) -- no default-to-current-user"
        )
    return HostParams(name=name, local=local, user=user, hostname=hostname, home=home)


def fleet_targets(cfg: dict, *, only: list[str] | None = None,
                  extra_exclude: list[str] | None = None) -> list[str]:
    """The ordered host names `--fleet` deploys: `fleet.hosts` minus
    `fleet.exclude` (∪ `extra_exclude` for a single run), optionally restricted to
    `only`. An excluded host is NEVER returned -- the exclude is honored before any
    `only` subset so `--only upgoose` can never re-include an excluded host."""
    fleet = cfg.get("fleet", {})
    hosts: list[str] = list(fleet.get("hosts", []))
    exclude = set(fleet.get("exclude", []) or [])
    if extra_exclude:
        exclude |= set(extra_exclude)
    targets = [h for h in hosts if h not in exclude]
    if only is not None:
        want = set(only)
        unknown = want - set(hosts)
        if unknown:
            raise ConfigError(
                f"--only names host(s) not in fleet.hosts: {sorted(unknown)}"
            )
        targets = [h for h in targets if h in want]
    return targets
