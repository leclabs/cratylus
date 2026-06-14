#!/usr/bin/env python3
"""Reconstruction-oracle tests -- B2's done-when (plans/polis-machinery/B2):
a deliberately-corrupted projection FAILS the gate; the clean corpus PASSES.

The oracle (verify.gate_reconstruct) is a battery of NECESSARY conditions, each
a proof of not-accept(F) when violated ([[self-application-is-mandatory]]):

  R1  one-home totality over the transitive [[ ]] closure -- a dropped
      dependency (dangling ref reachable from a composition root) FAILS.
  R2  cite-don't-copy -- a cell that restates another's definiens WITHOUT
      citing it FAILS.
  R3  completeness-vs-Delta -- NOT mechanized; asserted to surface as a visible
      audit-line NOTE, never a faked green.

Each corruption is written to a temporary fixture cell, verify is run as a
subprocess, the matching Rn failure is asserted, and the fixture is removed --
the pristine corpus PASSES with the fixture gone (REJECT, never mutate, mirrors
test_verify.py). Run: python3 toolkit/test_reconstruct.py (non-zero on failure).
"""
from __future__ import annotations

import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
VERIFY = ROOT / "toolkit" / "verify.py"
IDEAS = ROOT / "ideas"

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


def run_verify() -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, str(VERIFY)], capture_output=True, text=True)


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

    # --- R3: surfaces as a visible audit-line NOTE (degrade-visibly, not faked) ---
    r = run_verify()
    if "R3 (reconstruction-completeness vs Delta): MANUAL audit" not in r.stderr:
        fails.append(f"R3: audit-line NOTE missing -- must degrade visibly:\n{r.stderr}")

    # --- CLEAN: with both fixtures gone, the real corpus PASSES the oracle ---
    if r.returncode != 0:
        fails.append(f"CLEAN: oracle fails on the clean corpus:\n{r.stderr}")

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS reconstruct: R1 dropped-dep + R2 uncited-restatement + R3 audit-line + clean corpus")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
