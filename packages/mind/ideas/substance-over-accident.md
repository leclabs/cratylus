---
kind: principle
delineation: Keep the archetype (an agent's substantial form, invariant across device/scope/project) free of scope accidents; grants layer per-scope and never mutate the kernel, and no scope fact is lost into the kernel.
---

# Substance Over Accident

An agent's **archetype is its substantial form** — the invariant kernel that survives every device, scope, and project. Scope-specific authority is an **accident**, granted per-deployment ([[scope-grant]]). The discipline holds the two apart, both directions:

- **Don't write an accident into the substance.** A scope grant (e.g. principal authority over one package) never enters the archetype cell; baking it in falsely asserts the agent holds it _everywhere_.
- **Don't lose an accident into the kernel.** A real scope fact belongs in that scope's binding ([[scope-grant]] in its `AGENTS.md`), not dissolved into prose that travels nowhere.
- **The archetype carries only the universal** — the dispositions, method, and references true of the agent in every particular ([[agent-identity-portability]]).

The failure mode this excludes: **scope-leak** — an instance accident hardening into the shared archetype, or a durable substance scattered as per-scope prose. The recurring tell is an agent that claims everywhere what it was granted only here.

## See also

- [[agent-identity-portability]] — the facet model whose intrinsic/extrinsic split this rule governs.
- [[scope-grant]] — the mechanism by which accidents layer onto the kernel.
- [[densest-faithful-point]] — substance restated per-scope is the bloat this forbids.
