# organ-kind-ruling

**Objective.** Rule whether the agent organs become a first-class `kind: organ` (cells at
`packages/mind/organ/<slug>.md` or a `lexicon/organ.md` block) **or** remain a _slot/section role_
filled by cells of their natural kind. Fix the exact organ set that becomes cells.

**Preconditions.** `docs/agent-conceptual-anatomy.md` read (the STANCE/CONATUS organ set);
current kinds known (`grep '^kind:' lexicon mind`). Nico owns kind taxonomy.

**Operations.**

1. Decide organ-as-kind vs organ-as-slot. Mav's recommendation: **organ-as-kind, scoped** —
   only design-time/persistent _composable_ organs become cells.
2. Enumerate the composable-organ set that becomes cells (persona, mandate, memory, sensors,
   ledger, charter, heuristics, competence, telos, comportment, provenance — confirm/trim against
   the anatomy doc) vs the runtime organs that stay **glossary-only** (percept, construal,
   deliberation, resolve, enaction, appraisal, substrate, register-fit, address, disclosure, effectors).
3. Rule on re-kinding `memory` (`structure`→`organ`) and whether `render: verbatim`/`deploy:`
   front-matter survive the re-kind.
4. Record the ruling as `decisions/0001-organ-taxonomy.md` (CE ∧ ME).

**Artifacts.** `plans/mind-structure-flatten/decisions/0001-organ-taxonomy.md`.

**Acceptance (blind test).** A fresh reader can list, from the decision file alone, (a) the chosen
model, (b) the exact set of organ cells to be minted, (c) the organs that stay glossary-only, and
(d) the fate of `memory`'s kind + front-matter — with no open "TBD".
