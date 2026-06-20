# A0 — Charter: objectives, user stories, blind-validation (impl spec)

**Slice.** A0 · gate-0 · standalone — gates β execution. **Owner.** Nico (+ operator sign-off).

**Objective.** Ground the plan so success is defined and falsifiable, **in σ\*\_R terms**, before any
machine slice runs.

**Preconditions.**

- σ\*\_R thesis landed: [[prompt-engineering]] · [[signifier-star-r]] · [[llm-native-source-human-render-at-boundary]].
- Operator sign-off is the acceptance gate (this is the one slice that requires it).

**Operations.**

1. **Objectives → delivery.** Restate polis's objective in σ*\_R terms: polis self-extends on a layman's
   behalf by computing the \*\*σ*\_LLM** substrate (canonical cells) and projecting **σ*\_R** renders; the
   layman door is `elicit` (**σ*\_human → CSF → recompose domain skills → agents-as-persons\*\*). Map each
   slice (α/β/γ/δ) to exactly how it delivers this.
2. **User stories = success criteria.** Write the story set for **both readers** — (i) polis-developer /
   context-engineer (R=LLM internals), (ii) layman-operator (R=human door) — each
   "As a `<role>`, I want `<capability>`, so that `<outcome>`," concrete enough to test. These ARE the
   acceptance criteria for the plan.
3. **Blind-validation strategy.** For each story, success = a blind test: lock-answer-first → fresh
   `general-purpose` subagent on the identical prompt; the canonical-anchor test
   (**blind-signify ≟ filename**, i.e. σ\*\_LLM ≟ stored anchor); round-trip + reconstruct equivalence
   (L1 / `≅_R`). Map each criterion → its blind test.
4. **Lock the target structure.** Decide + record: **primitives home in the glossary** as
   block-referenceable entries (`[[glossary#^anchor]]`, not files); **composites** land in
   `mind/{kind}/{organ}/{fragment}` (organs = agent-anatomy MECE parts per `docs/agent-conceptual-anatomy.md`; koine-IR-typed) and compose
   primitives by block-ref. **Reconcile** with `structure-by-anchor-only` / one-cell-one-file
   ([[projection-is-not-the-source]]) — supersede or recast as scope-accident — and with the existing
   human-facing `gloss` cells (canonical primitive home is R=LLM; human gloss is a boundary render).
   Note the **projector requirement** (slice **μ**: koine resolves block-refs). γ2 re-home + μ depend on
   this decision.

**Artifacts.** `plans/csf-canonicalization/charter.md` carrying all four.
**Acceptance.** Charter reviewed + agreed by the operator before β executes; no machine work starts
until the criteria are locked.
