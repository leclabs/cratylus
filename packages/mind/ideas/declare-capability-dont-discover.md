---
kind: principle
delineation: An extension declares its capabilities and lossiness as machine-readable data, never buried in imperative code — so the system can report, lint, and explain what each target can and cannot carry before running it.
---

# Declare Capability, Don't Discover

The contract lives in the type system: a per-feature tri-state (`full | partial | none`), a supported-event set, a payload flavor — which slice of the canonical form a target carries ([[canonical-superset-ir]]). Declared lossiness is a floor you can read off the type ([[lossless-floor]]); buried lossiness no one can audit.

Because the declared contract is a tiny interface over shared primitives, a complete implementation stays small ([[minimalism]]) — which is what makes an open ecosystem of implementations realistic.

## See also

- [[canonical-superset-ir]] — the capability declaration says which slice of the IR a target carries.
- [[minimalism]] — a small declared contract is the surface that lets implementations stay tiny.
