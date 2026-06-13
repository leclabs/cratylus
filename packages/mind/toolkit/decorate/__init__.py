"""Decorate stage -- attach kind-specific front-matter to a composed body.

The `kind` IS the decoration rule: an agent carries name+description; a skill
adds a trigger; future kinds register their own decorator here. One decorator
per kind, keyed in DECORATORS ([[one-cell-one-type]] at the projection grain).
"""
from __future__ import annotations

from core.ir import ComposedDoc, DecoratedDoc
from decorate import agent as _agent
from decorate import skill as _skill

# kind -> decorator(ComposedDoc) -> DecoratedDoc
DECORATORS = {
    "agent": _agent.decorate,
    "skill": _skill.decorate,
}


def decorate(composed: ComposedDoc) -> DecoratedDoc:
    """Dispatch to the decorator registered for this cell's kind."""
    fn = DECORATORS.get(composed.kind)
    if fn is None:
        raise ValueError(
            f"no decorator for kind {composed.kind!r} "
            f"(registered: {sorted(DECORATORS)})"
        )
    return fn(composed)
