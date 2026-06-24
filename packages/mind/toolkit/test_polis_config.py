#!/usr/bin/env python3
"""`.polis.config` consumer tests (docs/polis-config-schema.md) -- the resolution
contract `deploy.py` enforces: precedence (CLI flag › config host.<name> › default),
every HARD-ERROR case (degrade-visibly / no-permissive-defaults), `--fleet` exclude
honored, and the absent-file legacy path. Plus the committed fixtures
(`.polis.config.example` valid; the real `.polis.config` resolves the upmav-class
user correctly).

Run: python3 toolkit/test_polis_config.py   (exit non-zero on any failure)
"""
from __future__ import annotations

import json
import pathlib
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import config as pc  # noqa: E402

REPO_ROOT = HERE.parents[2]  # packages/mind/toolkit -> repo root


def _write(root: pathlib.Path, obj) -> pathlib.Path:
    p = root / pc.CONFIG_NAME
    p.write_text(obj if isinstance(obj, str) else json.dumps(obj), encoding="utf-8")
    return p


GOOD = {
    "schema": 1,
    "reader": "strong-llm-lean",
    "fleet": {"hosts": ["fire", "forge", "upmav", "upgoose"], "exclude": ["upgoose"]},
    "host": {
        "fire": {"local": True},
        "forge": {"user": "lex"},
        "upmav": {"user": "lcaraccioli", "hostname": "upmav.lan", "home": "~/.claude"},
        "upgoose": {"user": "lcaraccioli"},
    },
}


def expect_error(fn, needle: str, label: str, fails: list[str]) -> None:
    try:
        fn()
    except pc.ConfigError as e:
        if needle.lower() not in str(e).lower():
            fails.append(f"{label}: error raised but message lacks {needle!r}: {e}")
        return
    except SystemExit as e:  # some paths exit; still a loud refusal
        if needle.lower() not in str(e).lower():
            fails.append(f"{label}: SystemExit but message lacks {needle!r}: {e}")
        return
    fails.append(f"{label}: expected ConfigError containing {needle!r}, none raised")


def main() -> int:
    fails: list[str] = []

    with tempfile.TemporaryDirectory() as td:
        root = pathlib.Path(td)
        _write(root, GOOD)
        cfg = pc.load_config(root)

        # --- PRECEDENCE -------------------------------------------------------
        # config value used when no CLI override
        hp = pc.resolve_host("upmav", cfg=cfg)
        if hp.user != "lcaraccioli":
            fails.append(f"PRECEDENCE/config: upmav user = {hp.user!r}, want 'lcaraccioli'")
        if hp.hostname != "upmav.lan":
            fails.append(f"PRECEDENCE/config: upmav hostname = {hp.hostname!r}, want 'upmav.lan'")
        # CLI flag trumps config
        hp = pc.resolve_host("upmav", cli_user="override", cli_home="/tmp/x/.claude", cfg=cfg)
        if hp.user != "override":
            fails.append(f"PRECEDENCE/cli: --user did not trump config (got {hp.user!r})")
        if hp.home != "/tmp/x/.claude":
            fails.append(f"PRECEDENCE/cli: --home did not trump config (got {hp.home!r})")
        # built-in default: hostname -> key when unset; home -> None (server-side default)
        hp = pc.resolve_host("forge", cfg=cfg)
        if hp.hostname != "forge":
            fails.append(f"PRECEDENCE/default: forge hostname = {hp.hostname!r}, want 'forge'")
        if hp.home is not None:
            fails.append(f"PRECEDENCE/default: forge home = {hp.home!r}, want None")
        # local host: no user required
        hp = pc.resolve_host("fire", cfg=cfg)
        if not hp.local or hp.user is not None:
            fails.append(f"PRECEDENCE/local: fire local={hp.local} user={hp.user!r}, want local/None")

        # --- HARD ERRORS ------------------------------------------------------
        # unknown --host (the upmav-class fault: no current-user fallback)
        expect_error(lambda: pc.resolve_host("ghost", cfg=cfg),
                     "absent", "ERR/unknown-host", fails)
        # non-local host missing user
        bad = json.loads(json.dumps(GOOD))
        bad["host"]["forge"] = {}  # no user, not local
        expect_error(lambda: pc.resolve_host("forge", cfg=pc.load_config(_mk(bad))),
                     "user", "ERR/missing-user", fails)

    # the rest need their own temp roots (each writes a distinct config)
    # fleet<->host drift: fleet.hosts entry with no host.<name>
    drift = json.loads(json.dumps(GOOD))
    drift["fleet"]["hosts"].append("phantom")
    expect_error(lambda: pc.load_config(_mk(drift)),
                 "no host", "ERR/drift-fleet-orphan", fails)
    # drift the other way: host.<name> absent from fleet.hosts
    drift2 = json.loads(json.dumps(GOOD))
    drift2["host"]["extra"] = {"user": "x"}
    expect_error(lambda: pc.load_config(_mk(drift2)),
                 "absent from fleet", "ERR/drift-host-orphan", fails)
    # missing schema
    nosch = json.loads(json.dumps(GOOD)); del nosch["schema"]
    expect_error(lambda: pc.load_config(_mk(nosch)),
                 "schema", "ERR/missing-schema", fails)
    # unknown schema version
    badsch = json.loads(json.dumps(GOOD)); badsch["schema"] = 99
    expect_error(lambda: pc.load_config(_mk(badsch)),
                 "schema", "ERR/unknown-schema", fails)
    # malformed JSON
    badjson = pathlib.Path(tempfile.mkdtemp())
    _write(badjson, "{ this is not json ")
    expect_error(lambda: pc.load_config(badjson),
                 "malformed", "ERR/malformed-json", fails)

    # --- ABSENT FILE = legacy flag-only mode (NOT an error) -------------------
    empty = pathlib.Path(tempfile.mkdtemp())  # no .polis.config written
    if pc.load_config(empty) is not None:
        fails.append("LEGACY: absent config must load as None")
    hp = pc.resolve_host("anyhost", cli_user="lex", root=empty)
    if hp.user != "lex" or hp.local or hp.hostname != "anyhost":
        fails.append(f"LEGACY: flag-only resolve wrong: {hp}")

    # --- FLEET targets: exclude honored, --only restricts, --only can't re-include
    cfg = pc.load_config(_mk(GOOD))
    targets = pc.fleet_targets(cfg)
    if "upgoose" in targets:
        fails.append(f"FLEET: excluded upgoose leaked into targets: {targets}")
    if targets != ["fire", "forge", "upmav"]:
        fails.append(f"FLEET: targets = {targets}, want [fire, forge, upmav]")
    # --only subset
    if pc.fleet_targets(cfg, only=["forge"]) != ["forge"]:
        fails.append("FLEET/only: subset restriction failed")
    # --only an excluded host -> still excluded (exclude wins over only)
    if pc.fleet_targets(cfg, only=["upgoose"]) != []:
        fails.append("FLEET/only: --only could not re-include an excluded host")
    # extra_exclude adds for one run
    if "forge" in pc.fleet_targets(cfg, extra_exclude=["forge"]):
        fails.append("FLEET/exclude: --exclude did not drop the host")

    # --- COMMITTED FIXTURES ----------------------------------------------------
    # .polis.config.example is valid schema-1 (placeholder users, but well-formed)
    expath = REPO_ROOT / ".polis.config.example"
    if expath.exists():
        try:
            cfg_ex = json.loads(expath.read_text(encoding="utf-8"))
            if cfg_ex.get("schema") != pc.SCHEMA_VERSION:
                fails.append(".polis.config.example: schema != 1")
        except json.JSONDecodeError as e:
            fails.append(f".polis.config.example: not valid JSON: {e}")
    # the REAL .polis.config (gitignored) resolves the upmav-class user, if present
    real = pc.load_config(REPO_ROOT)
    if real is not None:
        hp = pc.resolve_host("upmav", cfg=real, root=REPO_ROOT)
        if hp.user != "lcaraccioli":
            fails.append(f"REAL: upmav user = {hp.user!r}, want 'lcaraccioli' "
                         "(the bug this feature fixes)")
        if "upgoose" in pc.fleet_targets(real):
            fails.append("REAL: upgoose not excluded from fleet targets")

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS polis-config: precedence + hard-errors + absent-legacy + fleet-exclude "
          "+ committed fixtures")
    return 0


# _mk is referenced inside the first `with` block via closure; define a module-level
# alias so that scope can reach it (the in-block lambda binds late).
def _mk(obj) -> pathlib.Path:
    d = pathlib.Path(tempfile.mkdtemp())
    p = d / pc.CONFIG_NAME
    p.write_text(obj if isinstance(obj, str) else json.dumps(obj), encoding="utf-8")
    return d


if __name__ == "__main__":
    raise SystemExit(main())
