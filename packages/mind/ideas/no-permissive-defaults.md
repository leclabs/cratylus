---
kind: principle
delineation: An optional parameter whose absence expands to the most destructive or expansive interpretation is a footgun — make it required, error clearly with the discovery path, and discriminate multi-contract operations explicitly in the parameter shape.
---

# No Permissive Defaults

The corruption of [[hoare]]: the **permissive default** — `copy(ids?)` where empty means _all_; `delete(filter?)` where empty means _every row_; a confirm flag defaulting to "yes".

The error names the **discovery path** ("pass `ids: [...]`; list them with `… --ids`") — it doubles as a tutor. Discriminate one / many / all as explicit cases with a precondition table; never fall back from "missing field" to "biggest interpretation". Convenience ("do all of them") lives at the higher-altitude skill that holds the context to choose safely ([[decision-at-the-locus-of-need]]).

The agentic form: a subagent **asserts its preconditions on entry and fails closed** — it does not silently degrade (create a missing dir, retry unauthenticated, guess a schema). Silent degradation is the same failure escalated to a process boundary: the subagent acts under an intent never authorized.

## See also

- [[hoare]] — the precondition prior this is the operational form of.
- [[prohibitions-to-prescriptions]] — name the forbidden state, prescribe the legitimate move.
- [[stamp-absence]] — ambiguity at the boundary is failure, not PASS.
- [[minimalism]] — a permissive default is a surface to defend; require it instead.
