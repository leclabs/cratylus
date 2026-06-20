---
kind: principle
delineation: Agents coordinate through a closed set of state-mutating commands — each verb atomically validates, transitions, and persists — so the typed state, not free text, is the handoff token; the verb set is the agent's whole surface and the engine is the only legal mutator of the underlying substrate.
---

# State Transitions as Agent Protocol

Each role's authority becomes a precise statement: "may move state X→Y under condition Z." An agent picks any item in its in-state, transitions it, moves on — work that is inspectable, resumable, and stateless from the agent's point of view.

- **Closing the surface to the verb menu is information-hiding at the state boundary:** git porcelain over plumbing, REST over arbitrary DB writes.
- **The org chart and the state graph match** — one role owns each transition; a human-gated transition (a reviewer approving) is just one typed verb in the set.
- **The graph is implicit in the verb set — an imperative IR:** the counterpart to a declarative workflow-graph the engine walks. Here the **agent** is the router, so routing lives in its reading of state rather than a precomputed path. Prefer it exactly when the agent is the router and state transitions are the primary contract.

## See also

- [[engine-orchestrates-agents-execute]] — the engine that owns the substrate and exposes the verb set; agents act only through it.
- [[validation-altitude]] — each verb's atomic schema check is the cheap floor; what it must not do is validate the semantic interior.
- [[intent-not-flag-branches]] — the same closed-named-mode discipline at the API seam: a tagged verb set, not per-call-site branching.
- [[agent-consults-engine]] — when the agent is the router, it reads state and picks the next verb from a passive engine it consults as a tool.
