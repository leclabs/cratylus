# 0003 — lexicon-pile kind mapping

status: RULED (nico-principal, 2026-06-22, at exemplify-corpus-pile). R=LLM.

## problem

The corpus pile = `lexicon/*.md` (7 concatenated kind-files, ~144 `<!-- ^slug -->` blocks) ∪ the
generated `GLOSSARY.md`. 141 of 144 blocks are UNHOMED (live only in lexicon); 40 are DANGLERS referenced
by landed agent/skill/organ cells (load-bearing for zero-dangling-gate). These blocks are the corpus's
FOUNDATIONAL VOCABULARY (domain concepts, principles, influence glosses, pipeline operations, structures)
— NOT agent-organ fragments. The contract's K (agent/skill + 23 organs) has no home for them, but K is
explicitly extensible. Question: how do the 7 lexicon kinds map into K?

## ruling

**The 7 lexicon kinds become 7 kind-DIRECTORIES** — `concept/`, `principle/`, `gloss/`, `process/`,
`structure/`, `classification/`, `utility/` — one cell per block at `{kind}/{α}.md`. This extends K with
the corpus-meta kinds (the contract's "an exemplify pass that can't home a fragment has found another
missing kind — add it"). The lexicon FILES were always a physical accident (concatenation); the kind is
real and is preserved as the dir ("the dir IS the kind"). `gloss: true` blocks → `kind: gloss`.

Refinement of the task's "pure vocab → lexicon": instead of ONE generic `lexicon/` bucket, the 7 semantic
kinds are kept — strictly more MECE, and consistent with dir-is-kind. No generic `lexicon/` dir is created.

EXCEPTIONS (the dedup/fold overlay, not a 1:1 move):

- a block whose anchor already names a landed cell (e.g. `claims-cite-coordinates` ∈ `charter/`) →
  COALESCE into that home, never dual-write (R1 forbids two homes).
- a block that is SEMANTICALLY a landed organ value under a different name (e.g. `cite-dont-copy`
  principle vs `cite-once` charter value) → judged for coalescence (paraphrase-dup, caught by a blind
  gloss reader, not by R2's copied-run check).
- a block that is genuinely an agent-organ value (a principle that IS some agent's charter/heuristics) →
  fold into the organ dir if it has no independent corpus-level life; else keep the corpus-level
  `principle/` cell and let agents reference it.

## execution shape (honors "pile = one body, ¬fan-out per file")

The cross-file dedup is the conceptualize/signify step and is done at the GLOSS level over the WHOLE pile
at once (all ~141 one-line glosses + GLOSSARY fit one view) → a routing table. Realization (minting the
cells) then follows the table and is mechanizable + gate-checked: split blocks 1:1 into kind-dirs, then
verify R1 (dup home) / R2 (copied definiens) surface anchor/text duplicates, and a blind gloss reader
surfaces paraphrase-duplicates + fold candidates. Retire `lexicon/*` + `GLOSSARY.md` once subsumed.

blind check: a clean reader, given the vocabulary + the organ K with no placement hint, independently
endorsed own-kind-dirs over folding into organs (see session record).

## routing pass + fork rulings (nico-principal, post-routing)

Routing table: `research/lexicon-routing.md` (144 blocks: 141 mint, 3 rename, 0 coalesce/fold). The pass
surfaced design forks; my rulings:

- **Fork A — cross-kind SAME-anchor collisions (`claims-cite-coordinates`, `observed-vs-inferred` ∈
  principle ∧ landed `charter/`; `sharded-plan-layout` ∈ structure ∧ landed `ledger/`): RULE COEXIST.**
  Consistent with the existing TWO-NAMESPACE design — a corpus-vocabulary anchor is GLOBAL (referenced by
  bare `[[α]]`); an organ VALUE is ORGAN-SCOPED `(organ, value)` and absent from the global home-index (a
  value token recurs across organs). The corpus-principle and the agent's charter-instance are distinct
  (OntoClean: rigid corpus law vs anti-rigid role-adoption). `cite-dont-copy`(principle) vs
  `cite-once`(charter) already have DISTINCT anchors — mint both, not a collision.
  - **MACHINERY PREREQUISITE (in-domain, before densify passes verify):** the home-index
    (`cells.py` + `verify.py _home_index`) must register the 7 corpus-meta kind-dirs (concept/ principle/
    gloss/ process/ structure/ classification/ utility/) as GLOBAL-home dirs — so bare `[[α]]` danglers
    resolve and R1 enforces one-home AMONG the global kinds (organ dirs stay organ-scoped). Mirrors the
    ADR-0002 organ-scoped R3 extension.
- **Fork B — 8 organ-concept cells (`persona`…`disposition-memory`) → `concept/{organ}.md`:** mint (they
  DEFINE the organ kinds; distinct path from the organ value dirs). Whether organ READMEs should be
  GENERATED from these is a Mav projector decision → FLAGGED, not blocking.
- **Fork C — principle/utility sibling-split (`architecture-md-diagrams-only` vs `agent-index-doc-style`):**
  leave as-filed this pass; a signify refinement, not load-bearing.
- **Fork D — 3 person-gloss renames (minto/boswell/guarino → surname):** DEFER. `boswell` collides with
  `agent/boswell.md` (global composite home); keep full-name anchors. Renames are a separate signify pass.

## remaining execution (phases 2-3, not yet done)

machinery: register corpus-meta kinds as global homes (Fork A prereq). Then DENSIFY (R=LLM,
collapse-not-preserve) the 141 blocks per the routing table → mint `{kind}/{α}.md` (fan-out, seam-safe now
the routing is central). Then RETIRE `lexicon/*` + `GLOSSARY.md`; emit manifests; verify R1+R2+R3.
