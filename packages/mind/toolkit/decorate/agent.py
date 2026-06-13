"""Agent decorator -- the front-matter an agent def carries: `name` (the handle,
the join key to its ./<name>/ layers) and `description` (the cell's delineation,
what a router matches on). Ordered dict -> the renderer serializes it verbatim."""
from __future__ import annotations

from core.ir import ComposedDoc, DecoratedDoc


def decorate(composed: ComposedDoc) -> DecoratedDoc:
    fm = {
        "name": composed.name,
        "description": composed.delineation,
    }
    if composed.mark:  # mark facet -> this harness's affordances (emoji chip + color)
        emoji, _, hue = composed.mark.partition("·")
        emoji, hue = emoji.strip(), hue.strip()
        if emoji:
            fm["description"] = f"{emoji} {composed.delineation}"
        if hue:
            fm["color"] = hue
    return DecoratedDoc(composed=composed, frontmatter=fm)
