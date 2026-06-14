#!/usr/bin/env python3
"""Symbol-coverage gate tests (B9 gap 1) -- the SYMBOLS lint contract: a glyph
inside a fence interior that is NOT in (declared symbol table ∪ definienda-class
∪ exemptions) FAILs loudly, named cell:line + codepoint; the same cell with the
glyph removed PASSes; the calibrated exemptions (Greek, subscripts, box-drawing
diagram art, em-dash/ellipsis) do NOT false-positive. Reject, never transform.

Run: python3 toolkit/test_symbols.py   (exit non-zero on any failure)
"""
from __future__ import annotations

import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
VERIFY = ROOT / "toolkit" / "verify.py"
FIXTURE = ROOT / "ideas" / "zz-symbol-lint-fixture.md"

# A planted undeclared glyph: ∮ (U+222E CONTOUR INTEGRAL) -- not in the symbol
# table, not Greek/subscript/box-drawing/prose-punct, so the gate must flag it.
DIRTY = """---
kind: concept
delineation: symbol-lint fixture -- temporary, written and removed by test_symbols.py
---

# Symbol Lint Fixture

prose citing the register rule.

```text
x ≜ ∮ y
```
"""
# the undeclared glyph on file line 11 is inside the fence -> SYMBOL names :11
DIRTY_LINE = 11
DIRTY_GLYPH = "U+222E"

# Removing the bad glyph leaves only declared/exempt glyphs (≜ is declared).
CLEAN = DIRTY.replace("x ≜ ∮ y", "x ≜ y")

# An exemption-class fixture: Greek + subscript + box-drawing + em-dash inside a
# fence must PASS (these are the calibrated false-positives the gate must NOT hit).
EXEMPT = """---
kind: concept
delineation: symbol-exempt fixture -- temporary, written and removed by test_symbols.py
---

# Symbol Exempt Fixture

prose intro.

```text
Φ(C₀) ≜ σ · cᵢ — a definienda-class line
├ tree art
└ more
```
"""


def run_verify() -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(VERIFY)], capture_output=True, text=True
    )


def main() -> int:
    fails: list[str] = []
    try:
        # REJECT: an undeclared fenced glyph fails loudly, named cell:line + codepoint
        FIXTURE.write_text(DIRTY, encoding="utf-8")
        r = run_verify()
        if r.returncode == 0:
            fails.append("SYMBOL-REJECT: fenced ∮ passed verify (must fail)")
        want = f"SYMBOL {FIXTURE.name}:{DIRTY_LINE}:"
        if want not in r.stderr or DIRTY_GLYPH not in r.stderr:
            fails.append(
                f"SYMBOL-REJECT: expected {want!r} + {DIRTY_GLYPH} in stderr, got:\n{r.stderr}"
            )

        # NEVER-TRANSFORM: the cell on disk is untouched by the failing run
        if FIXTURE.read_text(encoding="utf-8") != DIRTY:
            fails.append("SYMBOL-REJECT: verify mutated the cell (must only reject)")

        # PASS: the glyph removed, only declared/exempt glyphs remain
        FIXTURE.write_text(CLEAN, encoding="utf-8")
        r = run_verify()
        if r.returncode != 0:
            fails.append(f"SYMBOL-CLEAN: glyph-free fixture failed verify:\n{r.stderr}")

        # PASS: the calibrated exemption classes do NOT false-positive
        FIXTURE.write_text(EXEMPT, encoding="utf-8")
        r = run_verify()
        if r.returncode != 0:
            fails.append(
                f"SYMBOL-EXEMPT: Greek/subscript/box-drawing/em-dash false-flagged:\n{r.stderr}"
            )
    finally:
        FIXTURE.unlink(missing_ok=True)

    # FULL CORPUS: with the fixture gone, the real corpus passes the gate
    r = run_verify()
    if r.returncode != 0:
        fails.append(f"CORPUS: verify fails on the clean corpus:\n{r.stderr}")

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS symbols: undeclared-glyph reject + clean + exemption-classes + corpus")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
