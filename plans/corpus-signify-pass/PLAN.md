# corpus-signify-pass

**State: RE-SCOPED — ground-up re-derivation, not a prose trim** (see Session findings below). Nico is
corpus lead; Mav owns tooling + drives elicitation. Needs a Nico + Operator re-charter before execution.

## Session findings — 2026-06-20 (the γ2-B reckoning)

An Operator review established the γ2-B restructure was wrong on **three axes**, enlarging what σ\*\_R must fix:

1. **Storage is anti-modular.** Primitives were packed into 7 giant `lexicon/<kind>.md` files (principle.md
   = 76 fragments / 1386 lines), violating the corpus's own thesis ([[sharded-work-layout]],
   [[shard-by-orthogonal-concern]]) and **killing 1044 bare `[[anchor]]` wikilinks** — no `palimpsest.md`
   file exists, so every wikilink is dead navigation. The `[[lexicon#^anchor]]` block-form that supposedly
   justified blocks-not-files is used **once**; μ (its resolver) has **zero** consumers. → one-fragment-one-file.

2. **The kind taxonomy is fake.** `concept · principle · process · structure · utility · classification ·
gloss` are not real anchors — they classify _content_, not the _runtime_. The **real kinds** are the
   agent-runtime ontology: **agents · organ-genus · organs · suborgans · skills · rules · output-styles ·
   schema** (hooks fold into rules-as-enforcement; tools → a competence organ; slash-commands/MCP-prompts →
   skills). The corpus must be re-derived on THESE kinds.

3. **σ\*\_LLM was never applied.** γ2-B carried bodies VERBATIM (proven: `palimpsest`'s body is byte-identical
   to its pre-thesis version). σ\*\_LLM is **collapse, not preserve** — for a strong-LLM reader most fragment
   prose is redundant with the model's priors, so σ\*\_LLM deletes it to the anchor + a minimal disambiguator,
   leaving a small novel core (σ\*\_R, the pipeline verbs, polis/oikos/koine, archetypes, memory model, toolkit
   contracts) defined compositionally + the reference graph. It is a **global** op on the concept set, NOT a
   per-file rewrite, and **byte-identity is its literal inverse** — so this plan's old "byte-identity except
   scoped changes" acceptance bar is wrong for the σ\*\_LLM pass.

**Brittleness correction:** the corpus is brittle _now_, from the fake anchors — not as a _cost_ of σ\*\_LLM.
Real anchors grounded in the runtime ontology fire stable priors; σ\*\_R **manufactures** robustness.

**Source vs render:** the σ\*\_LLM source is human-opaque by design; `GLOSSARY.md` "isn't a gloss" because the
human gloss is the σ\*\_human **render** at the boundary, never the source. `GLOSSARY.md` is also wrongly
committed (a generated artifact) and stale (its header cites the retired `ideas/`).

**Net:** no longer a prose-trim — a ground-up re-derivation of the corpus on the real kind taxonomy at σ\*\_LLM.
The `mind-structure-flatten` sequencing note below is obsolete.

## Ready frontier

| Task                            | Concern | Owner |
| ------------------------------- | ------- | ----- |
| `harvest/harvest-reference-set` | harvest | Mav   |

## Pending

| Task                                     | Concern    | Dep        | Owner          |
| ---------------------------------------- | ---------- | ---------- | -------------- |
| `clustering/cluster-redundant-fragments` | clustering | harvest    | Nico + Mav     |
| `elicit/elicit-candidates`               | elicit     | clustering | Mav + Operator |
| `signify/signify-star-r-pass`            | signify    | elicit     | Nico           |
| `verify/reconstruction-gate`             | verify     | signify    | Mav            |

## See also

- `../mind-structure-flatten/` — run this **after** it (content pass on the final structure).
- [[signifier-star-r]] · [[signify]] · [[elicit]] · [[precise-circumscription]] — the method.
