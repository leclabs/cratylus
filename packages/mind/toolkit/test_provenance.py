#!/usr/bin/env python3
"""Fenced-≜ empty-provenance degrade-visibly tests (B9 gap 3) -- the PROVENANCE
contract: a `kind: skill` whose only early `≜` is FENCED math composes empty
provenance, and verify surfaces it as a NOTE (a warning, NOT a failure -- a skill
may legitimately compose from nothing). The recurring empty-provenance bug can no
longer regress silently. A skill with a PROSE `≜` formula raises no warning, and
the clean corpus warns ONLY for the known compose-nothing allowlist
{praxis, carry-on, build-agent} (both legitimately compose NO sibling skill) -- no OTHER
real skill warns, and verify stays green.

Run: python3 toolkit/test_provenance.py   (exit non-zero on any failure)
"""
from __future__ import annotations

import os
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
VERIFY = ROOT / "toolkit" / "verify.py"
FIXTURE = ROOT / "ideas" / "zz-provenance-fixture.md"

# FENCED-ONLY: the ONLY `≜` is inside a fence (formal math), so compose.skill
# reads no prose composition formula and composes EMPTY provenance. An operative
# bullet keeps the OPERATIVE gate satisfied so we isolate the provenance warning.
FENCED_ONLY = """---
kind: skill
delineation: provenance fixture -- temporary, written and removed by test_provenance.py
trigger: /zz-provenance-fixture
---

# Provenance Fixture Skill

intro prose, no prose formula.

```text
zz ≜ mece
```

## What it helps with

- **a real step** — substantive operative content so OPERATIVE passes.
"""
# the only ≜ is fenced -> empty provenance -> verify emits a PROVENANCE NOTE.

# PROSE-FORMULA: a real prose `≜` line -> non-empty provenance -> no warning.
PROSE_FORMULA = FENCED_ONLY.replace(
    "intro prose, no prose formula.",
    "zz-provenance-fixture ≜ references [[signify]]",
)

# Skills that legitimately compose NO sibling skill -> they warn empty provenance
# by design (not a regression). The CORPUS invariant exempts exactly these and
# asserts NO OTHER skill warns.
COMPOSE_NOTHING_ALLOWLIST = {"praxis", "carry-on", "build-agent"}


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
        # WARNING (not failure): fenced-only ≜ -> empty provenance surfaces as a NOTE,
        # and verify still exits 0 (a skill may compose from nothing).
        FIXTURE.write_text(FENCED_ONLY, encoding="utf-8")
        r = run_verify()
        if r.returncode != 0:
            fails.append(
                f"PROVENANCE-WARN: empty provenance must WARN not FAIL, but verify "
                f"exited {r.returncode}:\n{r.stderr}"
            )
        want = f"PROVENANCE {FIXTURE.name}:"
        if want not in r.stderr:
            fails.append(
                f"PROVENANCE-WARN: expected NOTE {want!r} in stderr, got:\n{r.stderr}"
            )

        # NO-WARN: a prose ≜ formula -> non-empty provenance -> no PROVENANCE note
        FIXTURE.write_text(PROSE_FORMULA, encoding="utf-8")
        r = run_verify()
        if r.returncode != 0:
            fails.append(f"PROVENANCE-PROSE: prose-formula fixture failed verify:\n{r.stderr}")
        if f"PROVENANCE {FIXTURE.name}:" in r.stderr:
            fails.append("PROVENANCE-PROSE: prose-formula skill wrongly warned empty provenance")
    finally:
        FIXTURE.unlink(missing_ok=True)

    # FULL CORPUS: verify is green, and the ONLY skills warning empty provenance
    # are the known compose-nothing allowlist {praxis, carry-on, build-agent}. Any OTHER
    # warning is a regression -- the assertion still bites, just exempts the two
    # skills that compose no sibling by design.
    r = run_verify()
    if r.returncode != 0:
        fails.append(f"CORPUS: verify fails on the clean corpus:\n{r.stderr}")
    warned = {
        line.split("PROVENANCE ", 1)[1].split(".md", 1)[0].strip()
        for line in r.stderr.splitlines()
        if "PROVENANCE " in line
    }
    unexpected = warned - COMPOSE_NOTHING_ALLOWLIST
    if unexpected:
        fails.append(
            f"CORPUS: a real skill (outside the compose-nothing allowlist "
            f"{sorted(COMPOSE_NOTHING_ALLOWLIST)}) warned empty provenance: "
            f"{sorted(unexpected)}\n{r.stderr}"
        )

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS provenance: fenced-≜ empty-provenance warning + prose-formula quiet + corpus")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
