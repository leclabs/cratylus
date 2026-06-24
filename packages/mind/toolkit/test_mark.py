#!/usr/bin/env python3
"""gate_mark regression guard (emblem-never-silently-drops) -- the MARK contract:
every new-form `kind: agent` cell must compose a NON-EMPTY emblem (glyph·color
mark), because the mark is decoration's SOURCE for the def's `color` front-matter
+ H1 glyph (`decorate/agent.py`, gated `if composed.mark:`). gate_agent_organ_refs
only checks that each organ value RESOLVES to a live cell -- a provenance value
whose body lacks a `glyph·color` token still resolves yet yields mark="", which the
2026-06 fleet-wide color/mark drop proved ships silently with no gate to catch it.
This test bites that class: an agent selecting a TOKEN-LESS provenance value must
FAIL gate_mark, and the live corpus must PASS (every real agent carries a token).

Run: python3 toolkit/test_mark.py   (exit non-zero on any failure)
"""
from __future__ import annotations

import os
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
VERIFY = ROOT / "toolkit" / "verify.py"
PROV_FIXTURE = ROOT / "provenance" / "zz-mark-fixture.md"
AGENT_FIXTURE = ROOT / "agent" / "zz-mark-fixture.md"

# A provenance VALUE cell whose body carries NO `glyph·color` token -- it resolves
# (gate_agent_organ_refs is satisfied), but composes an EMPTY emblem.
PROV_TOKENLESS = """\
zz-mark-fixture ≜ the zz-mark fixture provenance -- temporary, written and removed
by test_mark.py; deliberately carries no glyph·color token.
"""

# A provenance VALUE cell WITH a tight `glyph·color` token -> non-empty emblem.
PROV_TOKENED = """\
zz-mark-fixture ≜ the zz-mark fixture provenance · 🧪·green · temporary, written
and removed by test_mark.py.
"""

# A minimal new-form (organ-SELECTION-vector) agent selecting the fixture
# provenance value. Selecting persona too so the persona-fallback path is also
# exercised when provenance carries no token (the fallback persona is a real,
# token-less value, so the empty-mark failure still bites).
AGENT_CELL = """\
---
kind: agent
---

# zz-mark-fixture

zz-mark-fixture ≜ ⊕{organ ↦ value ∈ {organ}-catalog}

persona hero
provenance zz-mark-fixture
"""


def run_verify() -> subprocess.CompletedProcess:
    # Point POLIS_RENDER at an empty dir so the ROUNDTRIP drift-check skips visibly
    # (the transient fixture agent was never rendered) -> isolate the MARK gate.
    env = {**os.environ, "POLIS_RENDER": tempfile.gettempdir() + "/_polis_no_render"}
    return subprocess.run(
        [sys.executable, str(VERIFY)], capture_output=True, text=True, env=env
    )


def main() -> int:
    fails: list[str] = []
    want = f"MARK {AGENT_FIXTURE.name}:"
    try:
        # FAIL: token-less provenance -> empty emblem -> gate_mark FAILs (exit 1).
        PROV_FIXTURE.write_text(PROV_TOKENLESS, encoding="utf-8")
        AGENT_FIXTURE.write_text(AGENT_CELL, encoding="utf-8")
        r = run_verify()
        if r.returncode == 0:
            fails.append(
                "MARK-FAIL: a token-less provenance value must FAIL gate_mark, "
                f"but verify exited 0:\n{r.stdout}\n{r.stderr}"
            )
        if want not in r.stderr:
            fails.append(
                f"MARK-FAIL: expected FAIL {want!r} in stderr, got:\n{r.stderr}"
            )

        # PASS: same agent, provenance NOW carrying a glyph·color token -> no MARK
        # failure (the MARK gate is satisfied; any other gate must stay green too).
        PROV_FIXTURE.write_text(PROV_TOKENED, encoding="utf-8")
        r = run_verify()
        if want in r.stderr:
            fails.append(
                f"MARK-PASS: a tokened provenance value wrongly failed gate_mark:\n{r.stderr}"
            )
        if r.returncode != 0:
            fails.append(
                f"MARK-PASS: tokened fixture should verify green, exited "
                f"{r.returncode}:\n{r.stderr}"
            )
    finally:
        PROV_FIXTURE.unlink(missing_ok=True)
        AGENT_FIXTURE.unlink(missing_ok=True)

    # FULL CORPUS: verify is green and NO real agent fails MARK (every live agent
    # composes a non-empty emblem). The PASS line ends `… + mark`.
    r = run_verify()
    if r.returncode != 0:
        fails.append(f"CORPUS: verify fails on the clean corpus:\n{r.stderr}")
    if "MARK " in r.stderr:
        fails.append(f"CORPUS: a real agent failed gate_mark:\n{r.stderr}")
    if "+ mark" not in r.stdout:
        fails.append(f"CORPUS: PASS line must end `… + mark`, got:\n{r.stdout}")

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS mark: token-less provenance FAILs + tokened passes + corpus green (+ mark)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
