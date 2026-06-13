"""Render stage -- a DecoratedDoc -> concrete artifact bytes + the harness-relative
path. One renderer per harness ([[canonical-superset-ir]]: each harness is a
dialect the IR projects into). claude-code is implemented; pi is a deferred seam.
"""
from __future__ import annotations

from core.ir import DecoratedDoc, RenderedArtifact
from render import claude_code as _claude_code

# harness -> renderer(DecoratedDoc) -> RenderedArtifact
RENDERERS = {
    "claude-code": _claude_code.render,
}


def render(decorated: DecoratedDoc) -> RenderedArtifact:
    """Dispatch to the renderer registered for this doc's target harness."""
    harness = decorated.composed.harness
    fn = RENDERERS.get(harness)
    if fn is None:
        raise ValueError(
            f"no renderer for harness {harness!r} (registered: {sorted(RENDERERS)})"
        )
    return fn(decorated)
