---
kind: principle
delineation: An extension declares its capabilities and lossiness as machine-readable data, never buried in imperative code — so the system can report, lint, and explain what each target can and cannot carry before running it.
---

# Declare Capability, Don't Discover

What a component can and cannot do — its capability surface, its lossiness, the slice of the canonical form it carries — must be **declared as machine-readable data**, not discovered by running its code or reading its body. A per-feature tri-state (`full | partial | none`), a supported-event set, a payload flavor: the contract lives in the type system where the host can **report, lint, and explain** it ahead of execution.

Why declaration beats discovery:

- **The host can answer "what will I lose?" before acting** — `explain` / `lint` / capability-matrix commands read the declaration, so loss is visible up front, not a surprise after a destructive write.
- **The contract is small enough to fan out.** When the contract is a tiny declared interface plus shared primitives, a _complete_ implementation is small (a minimal adapter is dozens of lines, not hundreds) — which is what makes an open ecosystem of implementations realistic.

Lossiness buried in code is lossiness no one can audit; declared lossiness is a floor you can read off the type ([[lossless-floor]]).

## See also

- [[canonical-superset-ir]] — the capability declaration says which slice of the IR a target carries.
- [[minimalism]] — a small declared contract is the surface that lets implementations stay tiny.
