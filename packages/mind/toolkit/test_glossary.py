#!/usr/bin/env python3
"""Glossary projection tests (DESIGN.md §3.4). A projection of the whole corpus
must be COMPLETE (every exemplar appears exactly once -- nothing silently
dropped), correctly GROUPED by kind, and the committed artifact must be FRESH.
"""
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import glossary  # noqa: E402


def main() -> int:
    fails: list[str] = []
    cells = glossary.load()
    doc = glossary.render(cells)
    listed = re.findall(r"^- \*\*([a-z0-9-]+)\*\*", doc, re.M)
    corpus = set(cells)

    # COMPLETENESS: every cell appears exactly once
    missing = corpus - set(listed)
    if missing:
        fails.append(f"COMPLETENESS: {len(missing)} cells dropped: {sorted(missing)[:5]}")
    dupes = sorted({s for s in listed if listed.count(s) > 1})
    if dupes:
        fails.append(f"COMPLETENESS: duplicated entries: {dupes[:5]}")
    if len(listed) != len(corpus):
        fails.append(f"COMPLETENESS: {len(listed)} listed != {len(corpus)} cells")

    # GROUPING: a known anchor of each family lands in the right section
    for slug, head in [("reductio", "## Processes"),
                       ("bona", "## Agents"),
                       ("confusio", "## Glosses")]:
        hidx, sidx = doc.find(head), doc.find(f"- **{slug}**")
        if hidx == -1 or sidx == -1 or hidx >= sidx or "\n## " in doc[hidx + len(head):sidx]:
            fails.append(f"GROUPING: {slug} not in the {head} section")

    # FRESHNESS: the committed artifact matches a fresh render
    committed = glossary.OUT.read_text(encoding="utf-8") if glossary.OUT.exists() else ""
    if committed != doc:
        fails.append("FRESHNESS: GLOSSARY.md is stale -- run `python3 toolkit/glossary.py`")

    if fails:
        for f in fails:
            print("FAIL", f, file=sys.stderr)
        return 1
    print(f"PASS glossary: completeness ({len(corpus)} exemplars) + grouping + freshness")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
