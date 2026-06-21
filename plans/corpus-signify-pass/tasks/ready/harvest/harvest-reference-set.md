# harvest-reference-set

**Objective.** Produce one analyzable dataset: every `[[anchor]]` in the corpus with its home cell,
kind, delineation/gloss, body length, and inbound-reference count — the substrate for finding
over-prose fragments and same-idea clusters.

**Preconditions.** Run after `mind-structure-flatten` lands (stable homes). `glossary.py` already
walks the cell graph; `verify.py` builds a `_home_index` + ref-graph.

**Operations.**

1. Build a harvest script (extend `glossary.py`/`verify.py` internals) emitting per-anchor records:
   `{anchor, kind, home, delineation, body_chars, prose_ratio, inbound_refs}`.
2. Flag outliers: fragments above a prose-length threshold and anchors with near-identical
   delineations (lexical + embedding similarity) as merge candidates.
3. Emit to `research/reference-set.jsonl` + a ranked `research/over-prose-and-dupes.md`.

**Artifacts.** harvest script in `packages/mind/toolkit/`, `plans/corpus-signify-pass/research/*`.

**Acceptance (blind test).** A reader opens `over-prose-and-dupes.md` and sees the top over-prose
fragments and the candidate same-idea clusters ranked — enough to drive clustering without re-deriving.
