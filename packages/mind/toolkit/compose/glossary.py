"""Glossary composer -- the human-reader / doc-harness projection shape.

A SECOND composer over the SAME source-graph: where compose.agent resolves one
cell -> one def, this folds the WHOLE corpus -> one browsable index grouped by
the `kind` taxonomy at max density (every anchor + full delineation). Single
source, different projection ([[projection-is-not-the-source]]).

Returns the rendered text; the glossary CLI places it at packages/mind/GLOSSARY.md.
"""
from __future__ import annotations

from core import cells

# Display order + heading + one-line blurb for each kind (the taxonomy IS the
# structure -- [[one-cell-one-type]]). Primitives first, then composites.
KIND_ORDER = [
    ("principle", "Principles", "normative oughts — embodied as priors"),
    ("concept", "Concepts", "declarative what-is — referenced/known"),
    ("process", "Processes", "ordered operations — invoked"),
    ("utility", "Utilities", "reusable instruments a process invokes"),
    ("structure", "Structures", "relational arrangements — rosters, schemas, layouts"),
    ("classification", "Classifications", "a kind plus the test that decides membership"),
    ("agent", "Agents", "composites — primitives bound to a maker role"),
    ("persona", "Personas", "composite identities"),
    ("task", "Tasks", "composite work units"),
    ("pattern", "Patterns", "composite recurring shapes"),
    ("runbook", "Runbooks", "composite operational procedures"),
    ("skill", "Skills", "composite capabilities"),
    ("troubleshooting", "Troubleshooting", "composite diagnostic guides"),
]


def load() -> dict[str, dict]:
    out = {}
    for slug in cells.corpus_slugs():
        out[slug] = cells.parse_cell(slug)
    return out


def render(corpus: dict[str, dict]) -> str:
    by_kind: dict[str, list[str]] = {}
    glosses: list[str] = []
    for slug, cell in corpus.items():
        if cell["fm"].get("gloss") == "true":
            glosses.append(slug)
        else:
            by_kind.setdefault(cell["fm"].get("kind", "?"), []).append(slug)
    n = sum(len(v) for v in by_kind.values()) + len(glosses)

    out: list[str] = []
    out.append("# mind — exemplar glossary")
    out.append("")
    out.append("<!-- GENERATED from packages/mind/ideas/ by toolkit/glossary.py "
               "(human-reader / doc-harness projection). Do not hand-edit; regenerate. -->")
    out.append("")
    out.append(f"> {n} exemplars, one browsable index — a second projection of the same "
               "source-graph that `resolve.py` renders to agent defs. Single-source "
               "publishing: the projection is not the source.")
    out.append("")

    def section(heading: str, blurb: str, slugs: list[str]) -> None:
        if not slugs:
            return
        out.append(f"## {heading}")
        out.append("")  # blank after heading -> prettier-canonical (freshness-stable)
        out.append(f"_{blurb}._")
        out.append("")
        for slug in sorted(slugs):
            out.append(f"- **{slug}** — {cells.delineation(slug)}")
        out.append("")

    for kind, heading, blurb in KIND_ORDER:
        section(heading, blurb, by_kind.get(kind, []))
    known = {k for k, _, _ in KIND_ORDER}
    for kind in sorted(k for k in by_kind if k not in known):  # defensive: new kinds
        section(kind, "(kind not in the display order — add it to KIND_ORDER)", by_kind[kind])
    section("Glosses", "operator-facing explanations of dense anchors", glosses)

    return "\n".join(out).rstrip() + "\n"
