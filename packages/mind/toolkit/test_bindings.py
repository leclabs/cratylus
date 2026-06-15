#!/usr/bin/env python3
"""Bindings-derived composition tests -- the [[self-sufficient-formalism]]
one-citation-per-anchor contract for `kind: skill`:

  - A skill with a `Bindings:` paragraph and NO `≜` formula composes from the
    bindings (the cite-once home): resolve.py's `Composed from ...` line is
    derived from the bindings, and verify.py PASSes with NO empty-provenance
    warning (its provenance IS the bindings).
  - A skill with BOTH a `≜` formula and a Bindings region triggers the CITE-TWICE
    NOTE (Bindings wins; the redundant `≜` re-cites bound anchors), and Bindings
    is the composition source -- not the `≜`.
  - Precedence + dedup: the binding verb is irrelevant; refs are first-seen,
    deduped, in Bindings order.

Composition assertions hit compose.skill directly (the composer's own walk);
the NOTE/PASS-gate assertions run verify.py as a subprocess (mirrors
test_provenance.py). A transient fixture cell is written into ideas/ and removed.

Run: python3 toolkit/test_bindings.py   (exit non-zero on any failure)
"""
from __future__ import annotations

import os
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "toolkit"))
from compose.skill import (  # noqa: E402
    _bindings_region,
    _formula_refs,
    composition_refs,
    compose_skill,
)
from core import cells  # noqa: E402

VERIFY = ROOT / "toolkit" / "verify.py"
FIXTURE = ROOT / "ideas" / "zz-bindings-fixture.md"

# BINDINGS-ONLY: a `Bindings:` paragraph, NO prose `≜` formula. Composition is
# harvested from the bindings; the binding verbs vary (realize/bind) and a ref is
# repeated (mece) to prove first-seen dedup. An operative bullet keeps OPERATIVE
# satisfied so we isolate the provenance behaviour.
BINDINGS_ONLY = """---
kind: skill
delineation: bindings fixture -- temporary, written and removed by test_bindings.py
trigger: /zz-bindings-fixture
---

# Bindings Fixture Skill

intro prose, no prose formula here.

## The operations, formally

Bindings: `s` (a symbol) realizes [[mece]]; `t` binds [[clean-slate]] · [[palimpsest]]; `u` re-cites [[mece]].

```text
s ≜ a fenced formal line : mece
```

## What it helps with

- **a real step** — substantive operative content so OPERATIVE passes.
"""
# bindings order, first-seen, deduped:
BINDINGS_ONLY_REFS = ["mece", "clean-slate", "palimpsest"]

# BOTH: a prose `≜` formula AND a Bindings region. Bindings WINS (composition is
# the bindings, not the formula); verify emits the CITE-TWICE NOTE. The `≜`
# formula cites only `mece`; the bindings cite all three -- so the composition
# source is observable (bindings != formula).
BOTH = BINDINGS_ONLY.replace(
    "intro prose, no prose formula here.",
    "zz-bindings-fixture ≜ references [[mece]]",
)


def run_verify() -> subprocess.CompletedProcess:
    # Isolate the ROUNDTRIP drift-check: this transient cell was never rendered,
    # so point POLIS_RENDER at an empty dir -> "no render -> skip drift-check
    # visibly", deterministic regardless of any real `.render/`.
    env = {**os.environ, "POLIS_RENDER": tempfile.gettempdir() + "/_polis_no_render"}
    return subprocess.run(
        [sys.executable, str(VERIFY)], capture_output=True, text=True, env=env
    )


def main() -> int:
    fails: list[str] = []
    try:
        # ---- BINDINGS-ONLY: composition derived from bindings ----
        FIXTURE.write_text(BINDINGS_ONLY, encoding="utf-8")
        cell = cells.parse_cell(FIXTURE.stem)
        body_lines = cell["body"].splitlines()
        mask = cells.fence_lines(cell["body"])

        if _bindings_region(body_lines, mask) is None:
            fails.append("BINDINGS-ONLY: Bindings region not recognized")
        # no PROSE ≜ (the only ≜ is fenced math) -> the formula path is empty
        if _formula_refs(FIXTURE.stem, body_lines, mask):
            fails.append("BINDINGS-ONLY: a fenced-only ≜ must yield NO prose formula")
        got = composition_refs(FIXTURE.stem, body_lines, mask)
        if got != BINDINGS_ONLY_REFS:
            fails.append(
                f"BINDINGS-ONLY: composition {got} != bindings {BINDINGS_ONLY_REFS}"
            )
        # the emitted SKILL body carries a `Composed from ...` line from bindings
        doc = compose_skill(FIXTURE.stem, "strong-llm-lean", "claude-code")
        want_line = "Composed from **mece** · **clean-slate** · **palimpsest**."
        if want_line not in doc.body:
            fails.append(
                f"BINDINGS-ONLY: expected {want_line!r} in composed body, got:\n{doc.body}"
            )

        # verify: PASS, NO empty-provenance warning, NO cite-twice (only bindings)
        r = run_verify()
        if r.returncode != 0:
            fails.append(f"BINDINGS-ONLY: verify FAILed (must PASS):\n{r.stderr}")
        if f"PROVENANCE {FIXTURE.name}" in r.stderr:
            fails.append(
                f"BINDINGS-ONLY: bindings provenance wrongly warned empty:\n{r.stderr}"
            )
        # REGRESSION (the mis-keyed `_formula_refs` NOTE): a bindings-homed skill
        # whose only `≜` is fenced math must NOT trip the "composes empty" log.
        # That NOTE was keyed on `≜`-absence (true here, correctly) instead of on
        # the FINAL composition (the bindings, non-empty) -- a log contradicting
        # reality. It must fire ONLY when ≜ and bindings are BOTH empty.
        if "provenance composes empty" in r.stderr:
            fails.append(
                f"BINDINGS-ONLY: a bindings-homed fenced-≜ skill wrongly logged "
                f"'provenance composes empty' (the mis-keyed NOTE):\n{r.stderr}"
            )
        if f"CITE-TWICE {FIXTURE.name}" in r.stderr:
            fails.append(
                f"BINDINGS-ONLY: no `≜` present, must not flag cite-twice:\n{r.stderr}"
            )

        # ---- BOTH: cite-twice NOTE, bindings is the source ----
        FIXTURE.write_text(BOTH, encoding="utf-8")
        cell = cells.parse_cell(FIXTURE.stem)
        body_lines = cell["body"].splitlines()
        mask = cells.fence_lines(cell["body"])
        # both signals present
        if _bindings_region(body_lines, mask) is None:
            fails.append("BOTH: Bindings region not recognized alongside ≜")
        if _formula_refs(FIXTURE.stem, body_lines, mask) != ["mece"]:
            fails.append("BOTH: prose `≜` formula refs should be [mece]")
        # Bindings WINS: composition is the bindings (3 refs), not the formula (1)
        got = composition_refs(FIXTURE.stem, body_lines, mask)
        if got != BINDINGS_ONLY_REFS:
            fails.append(
                f"BOTH: Bindings must win -- composition {got} != {BINDINGS_ONLY_REFS}"
            )
        r = run_verify()
        if r.returncode != 0:
            fails.append(f"BOTH: cite-twice must be a NOTE not FAIL, verify exited "
                         f"{r.returncode}:\n{r.stderr}")
        if f"CITE-TWICE {FIXTURE.name}" not in r.stderr:
            fails.append(f"BOTH: expected CITE-TWICE NOTE in stderr, got:\n{r.stderr}")
    finally:
        FIXTURE.unlink(missing_ok=True)

    # FULL CORPUS: with the fixture gone, the real corpus PASSes the gate
    r = run_verify()
    if r.returncode != 0:
        fails.append(f"CORPUS: verify fails on the clean corpus:\n{r.stderr}")

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS bindings: bindings-derived composition + cite-twice NOTE + corpus")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
