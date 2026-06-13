"""Compose stage -- walk a cell's `[[ ]]` graph and assemble its body at a given
reader density ([[exemplar-resolution]] inverse). One composer per projection
shape (agent def, glossary index, skill); the reader axis ([[reader-prior-projection]])
is orthogonal and shared. Output: a core.ir.ComposedDoc."""
from __future__ import annotations

from core import cells
from core.ir import ComposedDoc
from compose import agent as _agent
from compose import skill as _skill

# kind -> composer(slug, reader, harness) -> ComposedDoc. The glossary is a
# whole-corpus shape (not one-cell), so it is composed via compose.glossary, not
# dispatched here.
COMPOSERS = {
    "agent": _agent.compose_agent,
    "skill": _skill.compose_skill,
}

# kinds this stage can project to a per-cell artifact (the deployable composites).
PROJECTABLE_KINDS = tuple(COMPOSERS)


def compose(slug: str, reader: str, harness: str) -> ComposedDoc:
    """Dispatch to the composer for this cell's kind."""
    kind = cells.parse_cell(slug)["fm"].get("kind")
    fn = COMPOSERS.get(kind)
    if fn is None:
        raise ValueError(
            f"no composer for kind {kind!r} (slug {slug!r}); "
            f"projectable: {sorted(COMPOSERS)}"
        )
    return fn(slug, reader, harness)
