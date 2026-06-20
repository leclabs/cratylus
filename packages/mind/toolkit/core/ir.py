"""The canonical-superset IR ([[canonical-superset-ir]]).

Three immutable carriers flow through the pipeline; each stage is a pure
function from one to the next:

    cells  --compose-->  ComposedDoc  --decorate-->  DecoratedDoc
           --render-->  RenderedArtifact  --place-->  on disk

The IR holds the union of what any reader/kind/harness needs; a given strategy
reads only the slice it carries ([[declare-capability-dont-discover]]). A
projection of the IR is never the IR ([[projection-is-not-the-source]]).
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class ComposedDoc:
    """Output of the compose stage: the assembled body, before any
    kind-specific metadata or harness framing. `body` is the exact text that
    gets hashed for drift detection."""
    name: str           # artifact name == cell slug ([[named-marker-as-index-key]])
    kind: str           # agent / skill / ... -- selects the decorator
    heading: str        # human title (cell's first `# ` heading)
    body: str           # assembled body text (no front-matter, no provenance header)
    delineation: str    # the cell's one-line bound (decorator may lift to frontmatter)
    reader: str         # density profile the body was composed at
    harness: str        # target harness -- selects the renderer
    mark: str = ""      # recognition token "emoji · hue" (agent-identity-facets mark facet)


@dataclass(frozen=True)
class DecoratedDoc:
    """Output of the decorate stage: the composed body plus the ordered,
    kind-specific front-matter fields the renderer will serialize."""
    composed: ComposedDoc
    frontmatter: dict = field(default_factory=dict)  # ordered: name, description, trigger, ...


@dataclass(frozen=True)
class RenderedArtifact:
    """Output of the render stage: concrete bytes + the harness-relative path
    the placer writes them to (e.g. 'agents/bona.md', 'skills/praxis/SKILL.md')."""
    rel_path: str       # path relative to a scope root (.claude/ or a skills home)
    text: str           # full file contents, including front-matter + provenance
    body_hash: str      # content-hash of the hashed body slice ([[regenerate-without-clobbering]])
