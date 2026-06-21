# primitive-flatten-decision

**Objective.** Decide whether this plan flattens **only composites** (agents/skills + organs) or
**also** re-homes the 150 lexicon-block primitives from `lexicon/<kind>.md` to
`packages/mind/<kind>/<slug>.md`.

**Preconditions.** Current storage known: primitives are `<!-- ^anchor -->` blocks in
`lexicon/<kind>.md`; composites are files under `mind/<kind>/<organ>/`. `cells.py` is
storage-polymorphic (parses flat · dir-form · composite · lexicon-block).

**Operations.**

1. Weigh: uniformity (every cell its own file) vs churn (150 primitives → 150 files) and the
   lexicon-block benefits (density, verbatim byte-storage, one-file-per-kind browsing).
2. Decide the scope. Mav's recommendation: **composites-only first**; primitive re-homing is a
   separate later plan if wanted.
3. Record in `decisions/0002-flatten-scope.md`.

**Artifacts.** `plans/mind-structure-flatten/decisions/0002-flatten-scope.md`.

**Acceptance (blind test).** The decision file states the scope unambiguously and the downstream
`toolkit`/`migration` tasks can be finalized against it with no remaining scope ambiguity.
