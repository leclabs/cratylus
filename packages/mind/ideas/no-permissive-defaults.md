---
kind: principle
delineation: An optional parameter whose absence expands to the most destructive or expansive interpretation is a footgun — make it required, error clearly with the discovery path, and discriminate multi-contract operations explicitly in the parameter shape.
---

# No Permissive Defaults

[[hoare]]'s discipline is the precondition: the call fails if what must be true before it is not. Its corruption is the **permissive default** — an optional parameter that, omitted, expands to the most destructive interpretation: `copy(ids?)` where empty means _all_; `delete(filter?)` where empty means _every row_; a confirm flag defaulting to "yes".

The rule: a parameter whose absence implies expansive action is **required**, not optional, and its error names the **discovery path** ("pass `ids: [...]`; list them with `… --ids`") — the error doubles as a tutor. Where an operation legitimately serves several contracts (one / many / all), discriminate them as explicit cases in the parameter shape with a precondition table; no implicit fallback from "missing field" to "biggest interpretation". Convenience ("do all of them") lives at the higher-altitude skill that holds the context to choose safely ([[decision-at-the-locus-of-need]]).

The agentic form: a subagent **asserts its preconditions on entry and fails closed** if any is unmet — it does not silently degrade (create a missing dir, retry unauthenticated, guess a schema). Silent degradation is the same failure escalated to a process boundary: the subagent acts under an intent never authorized.

## See also

- [[hoare]] — the precondition prior this is the operational form of.
- [[prohibitions-to-prescriptions]] — name the forbidden state, prescribe the legitimate move.
- [[false-positives-ship-bugs-stamped-absence]] — ambiguity at the boundary is failure, not PASS.
- [[minimalism]] — a permissive default is a surface to defend; require it instead.
