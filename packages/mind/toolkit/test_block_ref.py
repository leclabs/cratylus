#!/usr/bin/env python3
"""Slice μ — block-ref resolution during projection.

The signed-off target structure (csf-canonicalization §4.1) homes primitives as
*blocks* in a shared `lexicon`, addressed `[[lexicon#^anchor]]`, and composites
reference them by block-ref. This test proves the composer RESOLVES a block-ref
end-to-end: parse → extract the block → recognize it as a composed ref → render
it at the reader profile → validate it (file + block exist; dangling FAILs).

Unit legs call the resolvers directly; the projection leg composes a fixture
agent; the validation legs run verify as a subprocess over fixture cells (idiom
from test_reconstruct.py — REJECT, never mutate; clean corpus PASSES with the
fixtures gone). Run: python3 toolkit/test_block_ref.py (non-zero on failure).
"""
import os
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
VERIFY = ROOT / "toolkit" / "verify.py"
IDEAS = ROOT / "ideas"
sys.path.insert(0, str(ROOT / "toolkit"))

LEXICON = IDEAS / "zz-lexicon-fixture.md"
LEX_CELL = """---
kind: concept
delineation: block-ref fixture lexicon -- temporary, written by test_block_ref.py
---

# Lexicon Fixture

The dense gloss of the first primitive, a self-contained definiens. ^alpha

The gloss of the second primitive, spanning
two physical lines of one block. ^beta
"""

AGENT = IDEAS / "zz-blockref-agent-fixture.md"
AGENT_CELL = """---
kind: agent
delineation: block-ref agent fixture -- temporary, written by test_block_ref.py
---

# Block-ref Fixture Agent

fixture ≜ embodies [[zz-lexicon-fixture#^alpha]].
"""


def run_verify(extra_env=None) -> subprocess.CompletedProcess:
    env = {**os.environ, "POLIS_RENDER": tempfile.gettempdir() + "/_polis_no_render_mu"}
    if extra_env:
        env.update(extra_env)
    return subprocess.run([sys.executable, str(VERIFY)], capture_output=True, text=True, env=env)


def main() -> int:
    from core import cells
    from compose.agent import compose_agent

    fails: list[str] = []

    # ---------- unit: parse / extract / display ----------
    assert cells.parse_block_ref("lexicon#^foo") == ("lexicon", "foo")
    assert cells.parse_block_ref("plain-anchor") is None
    assert cells.ref_display("lexicon#^foo") == "foo"
    assert cells.ref_display("plain-anchor") == "plain-anchor"

    try:
        LEXICON.write_text(LEX_CELL, encoding="utf-8")

        alpha = cells.block_body("zz-lexicon-fixture", "alpha")
        if alpha != "The dense gloss of the first primitive, a self-contained definiens.":
            fails.append(f"block_body(alpha) wrong: {alpha!r}")
        beta = cells.block_body("zz-lexicon-fixture", "beta")
        if beta != "The gloss of the second primitive, spanning\ntwo physical lines of one block.":
            fails.append(f"block_body(beta) wrong (multi-line): {beta!r}")
        if cells.block_body("zz-lexicon-fixture", "nonexist") is not None:
            fails.append("block_body returned non-None for a missing block")
        if cells.block_body("zz-no-such-lexicon", "alpha") is not None:
            fails.append("block_body returned non-None for a missing file")

        # delineation is block-ref aware (the block IS the primitive's gloss)
        if cells.delineation("zz-lexicon-fixture#^alpha") != alpha:
            fails.append("delineation(block-ref) != block body")

        # ---------- projection: a composed block-ref renders ----------
        AGENT.write_text(AGENT_CELL, encoding="utf-8")
        from compose import agent as agent_mod
        refs = agent_mod.composition_refs(cells.parse_cell("zz-blockref-agent-fixture"))
        if "zz-lexicon-fixture#^alpha" not in refs:
            fails.append(f"composition_refs missed the block-ref: {refs}")

        lean = compose_agent("zz-blockref-agent-fixture", "strong-llm-lean", "claude-code").body
        if "**alpha**" not in lean:
            fails.append("lean projection did not render the block-ref as its anchor **alpha**")
        if "[[zz-lexicon-fixture#^alpha]]" in lean:
            fails.append("lean projection left the raw [[block-ref]] unresolved")

        weak = compose_agent("zz-blockref-agent-fixture", "weak-llm", "claude-code").body
        if alpha not in weak:
            fails.append("weak projection did not carry the resolved block body as delineation")

        # ---------- validation: good block-ref PASSES the REF gate ----------
        r_ok = run_verify()
        if "block-ref" in r_ok.stderr and "zz-lexicon-fixture#^alpha" in r_ok.stderr:
            fails.append(f"good block-ref flagged by verify:\n{r_ok.stderr}")

        # ---------- validation: dangling block (bad block id) FAILS ----------
        AGENT.write_text(AGENT_CELL.replace("#^alpha", "#^nonexist"), encoding="utf-8")
        r_bad_block = run_verify()
        if "no ^nonexist block" not in r_bad_block.stderr:
            fails.append(f"dangling block id not caught:\n{r_bad_block.stderr}")

        # ---------- validation: dangling file (bad lexicon) FAILS ----------
        AGENT.write_text(AGENT_CELL.replace("zz-lexicon-fixture#^alpha", "zz-no-such-lexicon#^alpha"), encoding="utf-8")
        r_bad_file = run_verify()
        if "no zz-no-such-lexicon.md" not in r_bad_file.stderr:
            fails.append(f"dangling block-ref file not caught:\n{r_bad_file.stderr}")
    finally:
        LEXICON.unlink(missing_ok=True)
        AGENT.unlink(missing_ok=True)

    if fails:
        for x in fails:
            print("FAIL", x, file=sys.stderr)
        print(f"\n{len(fails)} failure(s)", file=sys.stderr)
        return 1
    print("PASS block-ref: parse + extract + compose + render + validate (dangling caught)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
