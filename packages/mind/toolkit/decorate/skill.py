"""Skill decorator -- the front-matter a claude-code SKILL.md carries: `name`,
`description` (the delineation -- what triggers the skill), and `trigger` (the
slash command, from the cell's `trigger:` field, defaulting to `/<name>`).
`allowed-tools` is emitted only if the cell declares it.
"""
from __future__ import annotations

from core import cells
from core.ir import ComposedDoc, DecoratedDoc


def decorate(composed: ComposedDoc) -> DecoratedDoc:
    fm = cells.parse_cell(composed.name)["fm"]
    front = {
        "name": composed.name,
        "description": composed.delineation,
        "trigger": fm.get("trigger", f"/{composed.name}"),
    }
    if fm.get("allowed-tools"):
        front["allowed-tools"] = fm["allowed-tools"]
    return DecoratedDoc(composed=composed, frontmatter=front)
