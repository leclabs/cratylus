---
kind: concept
delineation: Layered scopes resolve closer-wins, but the merge is per-type, not a global hand-wave — each resource kind declares its own rule (concatenate, union-by-name, deny-overrides-allow, last-key-wins) so precedence is an algebra, not one blanket policy.
---

# Scope Precedence Merge Algebra

Configuration that layers across scopes (broad → narrow, e.g. user < project < local) resolves with **closer wins** — the narrower scope overrides the broader on conflict. But "closer wins" is not one global rule; it is an **algebra with a rule per resource type**, because different kinds of resource compose differently:

- **Concatenating** resources (rule/prose fragments) append scope-by-scope.
- **Name-keyed** resources (commands, agents, named servers) **union by name**, closer-wins on a name collision.
- **Permission** sets merge with **deny overriding allow** (the safe direction wins regardless of scope).
- **Flat key maps** (env) resolve **last-key-wins per key**.

The teaching is to **declare the merge rule per type** rather than wave at a blanket "closer wins everywhere," which is wrong for permissions (where deny must win) and for concatenation (where nothing is overwritten). Per-file target gates (include/exclude this scope's resource for a given consumer) are an orthogonal filter applied after the merge, not part of precedence.

This is subsidiarity made precise: authority sits at the narrowest competent scope, but _how_ layers combine is a property of what is being combined.

## See also

- [[definitions-over-defaults]] — a closer/narrower stated convention outranks a broader default; this is the multi-scope generalization.
