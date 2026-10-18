---
"@cratylus/canon": minor
"@cratylus/forge": minor
"@cratylus/schema": minor
"cratylus": minor
---

Agents are judged in real use, so the mechanisms that policed an agent's act or text are removed, with nothing in their place.

- The omp extension no longer strips omp's own system prompt for a session launched with `omp --agent <name>`: the declaration follows omp's prompt whole, and no notice of removed sections is shown. A dispatch from `eval` code is no longer warned of, and neither is a dispatch or launch whose assignment misfits its agent's form. Every turn still shows the assignment form of each agent that takes one, and every session start still reports version skew.
- The omp extension no longer says, at session start, that its process runs a module an install has since replaced.
- `@cratylus/schema` no longer exports `checkAssignment`, `assignmentIn` or `ContractCheck`; `JsonSchema` and `AgentContract` stay.
- Canon no longer ships the `deploy-drift-notice` hook, its committed target or the `project:targets` script that regenerated it, and declares no plumbing. `cratylus deploy --check` is unchanged.
- Canon no longer ships the `introspect` skill; the `corpus-authoring` practice carries the rest.
- `cratylus optimize`, which checked the accept laws on a plan an agent wrote, is removed, with the exemplify pipeline behind it (`exemplify`, `optimize`, `elevateAgent`, `renderAgentVector`, `renderSkillCell`, the register classifier and their types).
- `@cratylus/forge/validate` keeps only the cold-decode oracle's driver (`decodeCold`, `nonceControl`): the static accept legs, the residue grammar, the formal-block lint and the `Policy` shape are removed.
- Canon's corpus-text gates are removed: reader density and reach, symbols, the symbol probe gate and symbol altitude with their tooling, formal-block self-sufficiency, skill shape, cratylism file naming, boundary binding, the cell gloss census, the hook boundary gate with its byte-lock, structural parsimony, the meta-gate that classified every test, and the source lints `authored-source-is-text` and `positional-path`. Forge's signification-marker scan and its story coverage suites go too, as do the simplification checks, the catalog re-cut's sign-off-gates and example checks, and the reply-discipline examples.
