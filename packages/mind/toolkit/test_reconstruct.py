#!/usr/bin/env python3
"""Reconstruction-oracle tests -- B2's done-when (plans/polis-machinery/B2):
a deliberately-corrupted projection FAILS the gate; the clean corpus PASSES.

The oracle (verify.gate_reconstruct) is a battery of NECESSARY conditions, each
a proof of not-accept(F) when violated ([[self-application-is-mandatory]]):

  R1  one-home totality over the transitive [[ ]] closure -- a dropped
      dependency (dangling ref reachable from a composition root) FAILS.
  R2  cite-don't-copy -- a cell that restates another's definiens WITHOUT
      citing it FAILS.
  R3  completeness-vs-Delta -- mechanized over the routing manifest (B8): a
      full-coverage manifest PASSES; a route to a non-existent home (the dropped
      idea) FAILS; a malformed manifest is a hard error; with NO manifest present
      R3 degrades visibly to the audit-line NOTE (never a faked green).

Each corruption is written to a temporary fixture cell, verify is run as a
subprocess, the matching Rn failure is asserted, and the fixture is removed --
the pristine corpus PASSES with the fixture gone (REJECT, never mutate, mirrors
test_verify.py). Run: python3 toolkit/test_reconstruct.py (non-zero on failure).
"""
from __future__ import annotations

import json
import os
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
VERIFY = ROOT / "toolkit" / "verify.py"
IDEAS = ROOT / "ideas"
MANIFESTS = ROOT / ".manifests"  # B8: where the R3 consumer scans for manifests

# R3 fixtures: routing manifests written to .manifests/, verify run as a
# subprocess, the matching outcome asserted, the manifest removed in finally
# (mirrors the R1/R2 cell-fixture discipline -- REJECT, never mutate; the clean
# corpus PASSES with the fixtures gone). home_slug 'semantic-partition' is a
# confirmed-live cell (the empirical rank-1 intake winner); 'zz-no-such-cell'
# resolves to no home -> the dropped idea R3 catches.
R3_OK = MANIFESTS / "zz-r3-fixture-ok.json"
R3_DROPPED = MANIFESTS / "zz-r3-fixture-dropped.json"
R3_MALFORMED = MANIFESTS / "zz-r3-fixture-malformed.json"
R3_LIVE_HOME = "semantic-partition"
R3_DEAD_HOME = "zz-no-such-cell"
R3_ORGAN = MANIFESTS / "zz-r3-fixture-organ.json"
# organ-SCOPED routes (new-form agent): `<organ>/<value>` resolves by the
# (organ, value) PAIR -- a value token recurs across organs, so the pair is the
# unique home (re-individuate-organ-anatomy). A live pair + a dead pair:
R3_LIVE_ORGAN = "persona/guarino-formal-ontologist"  # nico's persona value cell
R3_DEAD_ORGAN = "persona/zz-no-such-organ-value"


def _manifest(routes: list[dict], delta: list[dict]) -> str:
    return json.dumps({
        "source": "playground/zz-r3-fixture-source.md",
        "exemplified_at": "2026-06-14T00:00:00Z",
        "reader": "strong-llm-lean",
        "routes": routes,
        "delta": delta,
    }, indent=2)


def _route(digest: str, home: str, disp: str = "reuse", rank: float = 29.0) -> dict:
    return {"fragment_digest": digest, "idea_gloss": f"gloss {digest}",
            "home_slug": home, "disposition": disp, "rank": rank}


def _delta(digest: str) -> dict:
    return {"fragment_digest": digest, "idea_gloss": f"delta gloss {digest}"}

# R1 fixture: a `kind: agent` cell IS a composition root, so its refs are walked
# by the oracle. It cites a slug that has no home cell -> a dropped dependency,
# reachable directly from the root. (The dangling token is also caught by the
# REFERENCES gate; the oracle's added value is the reachability PATH it reports.)
R1_DANGLING = "zz-no-such-home-anchor"
R1_FIXTURE = IDEAS / "zz-reconstruct-r1-fixture.md"
R1_CELL = f"""---
kind: agent
delineation: r1 reconstruction-oracle fixture -- temporary, written by test_reconstruct.py
---

# R1 Fixture Agent

fixture ≜ composes [[{R1_DANGLING}]]
"""

# R2 fixture: a cell that reproduces a contiguous run of the `mece` cell's
# definiens (its delineation) WITHOUT citing [[mece]] -- an uncited restatement.
# We read mece's delineation at runtime so the run is genuinely its definiens.
R2_HOME = "mece"
R2_FIXTURE = IDEAS / "zz-reconstruct-r2-fixture.md"


def run_verify(manifests_dir=None) -> subprocess.CompletedProcess:
    # manifests_dir overrides where the R3 consumer scans (POLIS_MANIFESTS) -- lets
    # the no-manifest case isolate against an empty dir even when committed run
    # manifests live in the real .manifests/.
    env = dict(os.environ)
    if manifests_dir is not None:
        env["POLIS_MANIFESTS"] = str(manifests_dir)
    return subprocess.run([sys.executable, str(VERIFY)], capture_output=True, text=True, env=env)


def _mece_definiens_run() -> str:
    """A >= R2_RUN-word contiguous prefix of mece's delineation -- enough to trip
    R2 when reproduced uncited. Imported from the cell layer, not hardcoded."""
    sys.path.insert(0, str(ROOT / "toolkit"))
    from core import cells  # noqa: E402

    return cells.delineation(R2_HOME)


def main() -> int:
    fails: list[str] = []

    # --- R1: dropped dependency reachable from a root FAILS ---
    try:
        R1_FIXTURE.write_text(R1_CELL, encoding="utf-8")
        r = run_verify()
        if r.returncode == 0:
            fails.append("R1: corpus with a dropped dependency PASSED (must fail)")
        want = f"R1 zz-reconstruct-r1-fixture: dropped dependency [[{R1_DANGLING}]]"
        if want not in r.stderr:
            fails.append(f"R1: expected {want!r} in stderr, got:\n{r.stderr}")
        if R1_FIXTURE.read_text(encoding="utf-8") != R1_CELL:
            fails.append("R1: verify mutated the fixture (must only reject)")
    finally:
        R1_FIXTURE.unlink(missing_ok=True)

    # --- R2: uncited restatement of another cell's definiens FAILS ---
    definiens = _mece_definiens_run()
    r2_cell = (
        "---\n"
        "kind: concept\n"
        "delineation: r2 reconstruction-oracle fixture -- temporary, written by test_reconstruct.py\n"
        "---\n\n"
        "# R2 Fixture\n\n"
        # reproduce mece's definiens verbatim, citing NObody -- the palimpsest.
        f"{definiens}\n"
    )
    try:
        R2_FIXTURE.write_text(r2_cell, encoding="utf-8")
        r = run_verify()
        if r.returncode == 0:
            fails.append("R2: corpus with an uncited restatement PASSED (must fail)")
        want = f"R2 zz-reconstruct-r2-fixture: restates [[{R2_HOME}]]'s definiens"
        if want not in r.stderr:
            fails.append(f"R2: expected {want!r} in stderr, got:\n{r.stderr}")
        # control: the SAME body but citing [[mece]] is legitimate (cite-and-echo
        # is exempt) -- it must NOT trip R2.
        cited = r2_cell.replace(f"{definiens}\n", f"cf. [[{R2_HOME}]].\n\n{definiens}\n")
        R2_FIXTURE.write_text(cited, encoding="utf-8")
        r = run_verify()
        if f"R2 zz-reconstruct-r2-fixture" in r.stderr:
            fails.append(f"R2: cite-and-echo wrongly tripped R2 (cite must exempt):\n{r.stderr}")
    finally:
        R2_FIXTURE.unlink(missing_ok=True)

    # --- R3 (no manifest): degrade-visibly to the audit-line NOTE, not faked ---
    # Isolate against an EMPTY manifests dir (POLIS_MANIFESTS) -- the corpus may
    # carry committed run manifests (e.g. .manifests/dream.json), and once any
    # real manifest exists R3 is always live; "no-manifest -> NOTE" is only
    # observable in isolation. (An empty temp dir, not the real .manifests/.)
    with tempfile.TemporaryDirectory() as empty:
        r = run_verify(manifests_dir=empty)
    if "R3 (reconstruction-completeness vs Delta): MANUAL audit" not in r.stderr:
        fails.append(f"R3 no-manifest: audit-line NOTE missing -- must degrade visibly:\n{r.stderr}")
    if "reconstruct (R1+R2; R3 manual)" not in r.stdout:
        fails.append(f"R3 no-manifest: PASS line must read 'R3 manual':\n{r.stdout}")
    if r.returncode != 0:
        fails.append(f"R3 no-manifest: must stay PASS (no-op):\n{r.stderr}")

    # --- R3 (full coverage): a well-formed manifest, every home live -> PASS ---
    # Two reuse routes to a live cell + one declared-delta fragment. Coverage is
    # total (every fragment carries a routing decision), every home_slug resolves
    # -> R3 mechanizes and PASSES; the PASS line flips to "R1+R2+R3".
    try:
        R3_OK.write_text(_manifest(
            routes=[_route("sha256:aaa1", R3_LIVE_HOME),
                    _route("sha256:bbb2", R3_LIVE_HOME, disp="mint")],
            delta=[_delta("sha256:ccc3")],
        ), encoding="utf-8")
        r = run_verify()
        if r.returncode != 0:
            fails.append(f"R3 coverage: full-coverage manifest must PASS:\n{r.stderr}")
        if "reconstruct (R1+R2+R3)" not in r.stdout:
            fails.append(f"R3 coverage: PASS line must read 'R1+R2+R3' with a manifest present:\n{r.stdout}")
        if "R3 (reconstruction-completeness vs Delta): MANUAL audit" in r.stderr:
            fails.append(f"R3 coverage: must NOT emit the manual NOTE when a manifest is consumed:\n{r.stderr}")
    finally:
        R3_OK.unlink(missing_ok=True)

    # --- R3 (dropped idea): a route to a non-existent home cell -> FAIL ---
    # The idea is claimed-homed (it carries a home_slug + disposition) but the
    # home resolves to no live cell -> the idea is effectively homeless: the
    # dropped idea R3 exists to catch.
    try:
        R3_DROPPED.write_text(_manifest(
            routes=[_route("sha256:aaa1", R3_LIVE_HOME),
                    _route("sha256:ddd4", R3_DEAD_HOME)],  # <- dropped idea
            delta=[],
        ), encoding="utf-8")
        r = run_verify()
        if r.returncode == 0:
            fails.append("R3 dropped: manifest with an unrouted/dropped fragment PASSED (must fail)")
        want = f"R3 {R3_DROPPED.name}: routes[1]"
        if want not in r.stderr or f"[[{R3_DEAD_HOME}]]" not in r.stderr:
            fails.append(f"R3 dropped: expected dropped-home FAIL naming [[{R3_DEAD_HOME}]], got:\n{r.stderr}")
        if R3_DROPPED.read_text(encoding="utf-8") == "" or not R3_DROPPED.exists():
            fails.append("R3 dropped: verify mutated/removed the fixture (must only reject)")
    finally:
        R3_DROPPED.unlink(missing_ok=True)

    # --- R3 (malformed): a manifest violating the firm schema is a HARD ERROR ---
    # Not a silent skip ([[no-permissive-defaults]]). Here: a route
    # with an out-of-vocab disposition.
    try:
        R3_MALFORMED.write_text(json.dumps({
            "source": "playground/zz-bad.md",
            "exemplified_at": "2026-06-14T00:00:00Z",
            "reader": "strong-llm-lean",
            "routes": [{"fragment_digest": "sha256:eee5", "idea_gloss": "g",
                        "home_slug": R3_LIVE_HOME, "disposition": "teleport", "rank": 1.0}],
            "delta": [],
        }), encoding="utf-8")
        r = run_verify()
        if r.returncode == 0:
            fails.append("R3 malformed: out-of-vocab disposition PASSED (must be a hard error)")
        if "R3 MANIFEST" not in r.stderr or "disposition" not in r.stderr:
            fails.append(f"R3 malformed: expected a 'R3 MANIFEST ... disposition' hard error, got:\n{r.stderr}")
    finally:
        R3_MALFORMED.unlink(missing_ok=True)

    # --- R3 (organ-scoped route): `<organ>/<value>` resolves by the (organ,value)
    # PAIR, not the global home-index. A live pair PASSES; a dead pair is the
    # dropped-idea FAIL (mirrors gate_agent_organ_refs' resolution). ---
    try:
        R3_ORGAN.write_text(_manifest(
            routes=[_route("sha256:org1", R3_LIVE_ORGAN)], delta=[],
        ), encoding="utf-8")
        r = run_verify()
        if r.returncode != 0:
            fails.append(f"R3 organ-scoped: live (organ,value) route must PASS:\n{r.stderr}")
        R3_ORGAN.write_text(_manifest(
            routes=[_route("sha256:org2", R3_DEAD_ORGAN)], delta=[],  # <- dead pair
        ), encoding="utf-8")
        r = run_verify()
        if r.returncode == 0:
            fails.append("R3 organ-scoped: dead (organ,value) route PASSED (must fail as dropped idea)")
        if f"[[{R3_DEAD_ORGAN}]]" not in r.stderr:
            fails.append(f"R3 organ-scoped: expected dropped-home FAIL naming [[{R3_DEAD_ORGAN}]], got:\n{r.stderr}")
    finally:
        R3_ORGAN.unlink(missing_ok=True)

    # --- CLEAN: with every fixture gone, the real corpus PASSES the oracle ---
    for stale in MANIFESTS.glob("zz-r3-fixture-*.json"):
        stale.unlink()
    r = run_verify()
    if r.returncode != 0:
        fails.append(f"CLEAN: oracle fails on the clean corpus:\n{r.stderr}")

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS reconstruct: R1 dropped-dep + R2 uncited-restatement + R3 "
          "(no-manifest NOTE / full-coverage PASS / dropped-fragment FAIL / "
          "malformed hard-error) + clean corpus")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
