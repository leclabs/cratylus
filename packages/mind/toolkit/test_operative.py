#!/usr/bin/env python3
"""Empty-skill-body operative-content gate tests (B9 gap 2) -- the OPERATIVE
contract: a `kind: skill` cell whose body is only front-matter + H1 + the prose
`≜` composition formula projects a vacuous SKILL.md and round-trips on emptiness;
the gate FAILs it. A skill with >=1 operative element (a step / fenced block /
substantive prose) PASSes. The clean corpus (all 7 real skills are operative)
stays green.

Run: python3 toolkit/test_operative.py   (exit non-zero on any failure)
"""
from __future__ import annotations

import os
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
VERIFY = ROOT / "toolkit" / "verify.py"
FIXTURE = ROOT / "ideas" / "zz-operative-fixture.md"

# EMPTY: front-matter + H1 + the prose ≜ formula, and NOTHING operative after.
# (A trailing `## ` heading with no content is still non-operative scaffolding.)
EMPTY = """---
kind: skill
delineation: operative fixture -- temporary, written and removed by test_operative.py
trigger: /zz-operative-fixture
---

# Operative Fixture Skill

zz-operative-fixture ≜ references [[signify]]

## What it helps with
"""

# POPULATED: same shell, plus one operative bullet -- must PASS.
POPULATED = EMPTY + "\n- **a real step** — substantive operative content the agent reads.\n"


def run_verify() -> subprocess.CompletedProcess:
    # Isolate the ROUNDTRIP drift-check: this test injects a transient corpus cell
    # that was never rendered, so point POLIS_RENDER at an empty dir -> "no render
    # -> skip drift-check visibly", deterministic regardless of any real `.render/`.
    env = {**os.environ, "POLIS_RENDER": tempfile.gettempdir() + "/_polis_no_render"}
    return subprocess.run(
        [sys.executable, str(VERIFY)], capture_output=True, text=True, env=env
    )


def main() -> int:
    fails: list[str] = []
    try:
        # REJECT: an empty skill body fails, named per cell
        FIXTURE.write_text(EMPTY, encoding="utf-8")
        r = run_verify()
        if r.returncode == 0:
            fails.append("OPERATIVE-REJECT: empty skill body passed verify (must fail)")
        want = f"OPERATIVE {FIXTURE.name}:"
        if want not in r.stderr:
            fails.append(f"OPERATIVE-REJECT: expected {want!r} in stderr, got:\n{r.stderr}")

        # NEVER-TRANSFORM: the cell on disk is untouched by the failing run
        if FIXTURE.read_text(encoding="utf-8") != EMPTY:
            fails.append("OPERATIVE-REJECT: verify mutated the cell (must only reject)")

        # PASS: the same skill with one operative step
        FIXTURE.write_text(POPULATED, encoding="utf-8")
        r = run_verify()
        if r.returncode != 0:
            fails.append(f"OPERATIVE-POPULATED: populated skill failed verify:\n{r.stderr}")
    finally:
        FIXTURE.unlink(missing_ok=True)

    # FULL CORPUS: with the fixture gone, the 7 real skills pass the gate
    r = run_verify()
    if r.returncode != 0:
        fails.append(f"CORPUS: verify fails on the clean corpus:\n{r.stderr}")

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS operative: empty-skill reject + populated + corpus")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
