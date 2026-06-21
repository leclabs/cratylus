# mind-structure-flatten — charter

**What.** Undo the γ2-B `mind/<kind>/<organ>/<slug>` nesting. Composites live **flat** at
`packages/mind/agents/<slug>.md` and `packages/mind/skills/<slug>.md`. The agent anatomy
(the STANCE/CONATUS organ set, `docs/agent-conceptual-anatomy.md`) becomes the **named-section
structure inside an agent archetype** — each section composites its organ **by reference**
([[cite-dont-copy]]), never the directory taxonomy. Organ names enter the GLOSSARY (hover-legible).

**Why the nesting is wrong (the principal-ic articulation).** An agent/skill embodies **many**
organs at once, so filing it under **one** organ-directory is a category error — γ2-B forced
arbitrary single-organ verdicts (`materialize`→`enaction`, though equally `competence`). The
anatomy **decomposes each agent**; it does not **partition the set of agents**. It belongs as
section-structure inside the archetype. Origin: Operator, 2026-06-20, correcting a γ2-B call Mav
executed without challenging.

**Founder split.** **Mav — principal-ic LEAD:** owns the call, the toolkit/storage change, the
scripted migration, the skills flattening. **Nico:** the kind-taxonomy ruling (the organ gate),
the organ cells, the glossary entries, the conventions doc.

**Design gates (resolve before the build slices).**

- **G1 (Nico) — organ-as-kind vs organ-as-slot.** Mav recommends **organ-as-kind, scoped**: only
  design-time/persistent _composable_ organs (persona, mandate, memory, sensors, ledger, charter,
  heuristics, competence, …) become organ cells; per-turn/runtime organs (percept, deliberation,
  resolve, enaction, appraisal, substrate) stay **glossary-only concepts**. Flag re-kinding
  `memory` (`structure`→`organ`).
- **G2 (Mav + Operator) — primitive scope.** Do the lexicon-block primitives also flatten
  (`lexicon/<kind>.md` → `packages/mind/<kind>/<slug>.md`), or only composites? Mav recommends
  **composites-only first** (lexicon blocks work; flattening 150 primitives is churn for little gain).

**Acceptance discipline.** **Byte-identity gate** on the rendered fleet — this is the 3rd corpus
restructure; same safety license as γ2-B (`diff -rq` of `.render` pre/post = empty unless a delta
is deliberately scoped + enumerated) · CE ∧ ME on organ cells (Nico) · `verify.py` PASS · the
hardcoded `GENUS_ORGANS` composer list **removed** (anatomy sections drive composition).
