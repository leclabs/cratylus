"""Reader-prior density axis ([[reader-prior-projection]]).

One resolved-anchor line, rendered at the density that closes THIS reader's
prior-gap -- orthogonal to which composer (agent/skill/glossary) is running, so
it lives once here and every composer calls it:

  strong-llm        name + delineation                  (safe default)
  weak-llm          + an explicit kind/verb cue          (max scaffold)
  strong-llm-lean   name only -- delineation dropped     (density -> 0)
"""
from __future__ import annotations

from core import cells
from compose.harness import ref_text

READERS = {"weak-llm", "strong-llm", "strong-llm-lean"}

# Composition verbs by kind -> the section header the emitted def groups under.
VERB = {
    "principle": "Embodies",
    "concept": "References",
    "process": "Invokes",
    "utility": "Invokes",
    "structure": "References",
    "classification": "References",
}

# Weak-llm scaffolding: a strong reader infers "invoke/embody/reference" from the
# section header; a weak reader (bigger prior-gap) gets it inline per anchor.
# Derived from VERB so the cue can never desync from the section grouping.
VERB_WORD = {"Invokes": "invoke", "Embodies": "embody", "References": "reference"}


def cue_for(slug: str) -> str | None:
    """The weak-llm composition cue for a constituent: '<kind>, <verb>' (or
    'gloss, reference' for a kind-less influence anchor)."""
    fm = cells.parse_cell(slug)["fm"]
    kind = fm.get("kind")
    if kind:
        return f"{kind}, {VERB_WORD[VERB.get(kind, 'References')]}"
    if fm.get("gloss") == "true":
        return "gloss, reference"
    return None


def render_ref(slug: str, reader: str, harness: str) -> str:
    """One resolved-anchor line; density keyed on the reader's prior-gap
    ([[anchor-to-the-readers-priors]]), the name form keyed on the harness
    (compose.harness: a skill ref prints as its invocation affordance).
    strong-llm: name + bound (the reader holds the prior). weak-llm: + an
    explicit kind/verb cue as scaffolding."""
    name = ref_text(slug, harness)
    if reader == "strong-llm-lean":
        return f"- {name}"  # density -> 0: the name is the pointer
    d = cells.delineation(slug)
    if reader == "weak-llm":
        cue = cue_for(slug)
        if cue:
            return f"- {name} _({cue})_ -- {d}"
    return f"- {name} -- {d}"
