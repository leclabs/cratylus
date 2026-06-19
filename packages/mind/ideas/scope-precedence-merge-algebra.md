---
kind: concept
delineation: Layered scopes resolve closer-wins, but the merge is per-type, not a global hand-wave — each resource kind declares its own rule (concatenate, union-by-name, deny-overrides-allow, last-key-wins) so precedence is an algebra, not one blanket policy.
---

# Scope Precedence Merge Algebra

The rule per resource kind:

- **Concatenating** resources (rule/prose fragments) — append scope-by-scope; nothing is overwritten.
- **Name-keyed** resources (commands, agents, named servers) — union by name, closer-wins on a name collision.
- **Permission** sets — deny overrides allow (the safe direction wins regardless of scope).
- **Flat key maps** (env) — last-key-wins per key.

Per-file target gates (include/exclude this scope's resource for a given consumer) are an orthogonal filter applied after the merge, not part of precedence.

Subsidiarity made precise: authority sits at the narrowest competent scope, but _how_ layers combine is a property of what is combined.

## See also

- [[definitions-over-defaults]] — a closer/narrower stated convention outranks a broader default; this is the multi-scope generalization.
