#!/usr/bin/env python3
"""Glossary CLI (TOOLKIT.md component 2) -- the human-reader / doc-harness
projection of the corpus to a single browsable `GLOSSARY.md`.

Thin wrapper: the composition lives in compose/glossary.py (one composer per
projection shape); this just places the rendered text. `load`/`render` are
re-exported so callers/tests that reference `glossary.render(glossary.load())`
keep one import surface.
"""
from __future__ import annotations

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from core import cells  # noqa: E402
from compose import glossary as _glossary  # noqa: E402

OUT = cells.ROOT / "GLOSSARY.md"
load = _glossary.load
render = _glossary.render
KIND_ORDER = _glossary.KIND_ORDER


def main() -> int:
    corpus = load()
    OUT.write_text(render(corpus), encoding="utf-8")
    print(f"GLOSSARY -> {OUT}  ({len(corpus)} exemplars)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
