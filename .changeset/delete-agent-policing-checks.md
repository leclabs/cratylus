---
"@cratylus/canon": patch
"@cratylus/forge": minor
"@cratylus/schema": patch
"cratylus": minor
---

Agents are judged in real use, so the mechanisms that policed an agent's act or text are removed, with nothing in their place.

- The omp extension no longer strips omp's own system prompt for a session launched with `omp --agent <name>`: the declaration follows omp's prompt whole, and no notice of removed sections is shown. A dispatch from `eval` code is no longer warned of. A dispatch or launch whose assignment misfits its agent's form is still warned of and goes ahead.
- `cratylus optimize`, which checked the accept laws on a plan an agent wrote, is removed, with the exemplify pipeline behind it (`exemplify`, `optimize`, `elevateAgent`, `renderAgentVector`, `renderSkillCell`, the register classifier and their types).
- `@cratylus/forge/validate` keeps only the cold-decode oracle's driver (`decodeCold`, `nonceControl`): the static accept legs, the residue grammar, the formal-block lint and the `Policy` shape are removed.
- Canon's corpus-text gates are removed: reader density and reach, symbols, the symbol probe gate and symbol altitude with their tooling, formal-block self-sufficiency, skill shape, cratylism file naming, boundary binding, the cell gloss census, the hook boundary gate with its byte-lock (`project:targets` only regenerates), structural parsimony and the meta-gate that classified every test. Forge's signification-marker scan and its story coverage suites go too.
