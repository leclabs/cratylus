#!/usr/bin/env python3
"""Verify-gate tests -- the FENCE lint contract (task 03 of
plans/markdown-ast-compose): a cell with [[x]] inside a fenced block FAILS
loudly, named per cell:line; the same cell with the anchor bound in prose
PASSES. Reject, never transform ([[no-permissive-defaults]]).

Run: python3 toolkit/test_verify.py   (exit non-zero on any failure)
"""
from __future__ import annotations

import os
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
VERIFY = ROOT / "toolkit" / "verify.py"
FIXTURE = ROOT / "ideas" / "zz-fence-lint-fixture.md"

DIRTY = """---
kind: concept
delineation: fence-lint fixture -- temporary, written and removed by test_verify.py
---

# Fence Lint Fixture

prose citing [[signify]].

```text
x ≜ [[signify]]
```
"""
# the anchor on file line 11 is inside the fence -> FENCE must name :11
DIRTY_LINE = 11

CLEAN = DIRTY.replace("x ≜ [[signify]]", "x ≜ signify")

# VERBATIM-REF gate: a `render: verbatim` cell's `## Protocol` (and a
# `deploy: skill-dir` cell's `## Tool`) ships verbatim where `[[ ]]` cannot
# resolve, so a ref -- even to a LIVE cell (REFERENCES would PASS it) -- must FAIL.
VERBATIM_FIXTURE = ROOT / "ideas" / "zz-verbatim-ref-fixture.md"
VERBATIM_DIRTY = """---
kind: concept
render: verbatim
delineation: verbatim-ref fixture -- temporary, written and removed by test_verify.py
---

# Verbatim Ref Fixture

## Protocol

an organ shipped verbatim must not cite [[signify]] -- it lands where refs cannot resolve.
"""
VERBATIM_CLEAN = VERBATIM_DIRTY.replace("cite [[signify]] -- it", "cite anything -- it")


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
        # REJECT: fenced anchor fails loudly, named per cell:line
        FIXTURE.write_text(DIRTY, encoding="utf-8")
        r = run_verify()
        if r.returncode == 0:
            fails.append("FENCE-REJECT: fenced [[signify]] passed verify (must fail)")
        want = f"FENCE {FIXTURE.name}:{DIRTY_LINE}: [[signify]]"
        if want not in r.stderr:
            fails.append(f"FENCE-REJECT: expected {want!r} in stderr, got:\n{r.stderr}")

        # NEVER-TRANSFORM: the cell on disk is untouched by the failing run
        if FIXTURE.read_text(encoding="utf-8") != DIRTY:
            fails.append("FENCE-REJECT: verify mutated the cell (must only reject)")

        # PASS: same cell with the anchor bound in prose, bare symbol in fence
        FIXTURE.write_text(CLEAN, encoding="utf-8")
        r = run_verify()
        if r.returncode != 0:
            fails.append(f"FENCE-CLEAN: prose-bound fixture failed verify:\n{r.stderr}")
    finally:
        FIXTURE.unlink(missing_ok=True)

    # VERBATIM-REF: a ref in a `render: verbatim` `## Protocol` FAILs (even though
    # [[signify]] is a LIVE cell -> REFERENCES alone would PASS it); a ref-free
    # Protocol PASSes. The contract the verbatim-ship paths now enforce.
    try:
        VERBATIM_FIXTURE.write_text(VERBATIM_DIRTY, encoding="utf-8")
        r = run_verify()
        if r.returncode == 0:
            fails.append("VERBATIM-REJECT: [[signify]] in a verbatim `## Protocol` passed verify (must fail)")
        for want in (f"VERBATIM-REF {VERBATIM_FIXTURE.name}", "[[signify]]", "## Protocol"):
            if want not in r.stderr:
                fails.append(f"VERBATIM-REJECT: expected {want!r} in stderr, got:\n{r.stderr}")
        # ref-free Protocol passes the gate
        VERBATIM_FIXTURE.write_text(VERBATIM_CLEAN, encoding="utf-8")
        r = run_verify()
        if r.returncode != 0:
            fails.append(f"VERBATIM-CLEAN: ref-free verbatim Protocol failed verify:\n{r.stderr}")
    finally:
        VERBATIM_FIXTURE.unlink(missing_ok=True)

    # FULL CORPUS: with the fixture gone, the real corpus passes the gate
    r = run_verify()
    if r.returncode != 0:
        fails.append(f"CORPUS: verify fails on the clean corpus:\n{r.stderr}")

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS verify: fence-lint reject + clean + verbatim-ref reject + clean + corpus")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
