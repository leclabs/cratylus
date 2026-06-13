---
kind: principle
delineation: Agents coordinate through a closed set of state-mutating commands — each verb atomically validates, transitions, and persists — so the typed state, not free text, is the handoff token; the verb set is the agent's whole surface and the engine is the only legal mutator of the underlying substrate.
---

# State Transitions as Agent Protocol

When several agents (or roles) collaborate on shared work, make **typed state the protocol between them**, not free-text handoff. Expose a **closed set of commands** — a finite verb menu (`load`, `save`, `approve`, `reject`) — where each verb **atomically validates, transitions, and persists** one move. Each role's authority is then a precise statement: "may move state X→Y under condition Z." An agent picks any item in its in-state, transitions it, moves on — the work becomes inspectable, resumable, and stateless from the agent's point of view.

Three properties make this hold:

- **The verb set is the agent's whole surface; the engine is the only legal mutator.** Agents must not touch the substrate directly (hand-edit the JSON, flip a status field) — a mutable substrate with an implicit state machine gets corrupted. Closing the surface to a validated verb menu is information-hiding at the state boundary: git porcelain over plumbing, REST over arbitrary DB writes.
- **State is the handoff token.** A transition carries the work to the next role; no narrative summary is needed or trusted. The org chart and the state graph match (one role owns each transition); a human-gated transition (a reviewer approving) is just one typed verb in the set.
- **The graph is implicit in the verb set — an imperative IR.** This is the imperative counterpart to a declarative workflow-graph the engine walks: here the **agent** picks the next verb from the menu based on observed state, so the routing lives in the agent's reading of state rather than a precomputed path. Prefer it exactly when the agent is the router and state transitions are the primary contract.

## See also

- [[engine-orchestrates-agents-execute]] — the engine that owns the substrate and exposes the verb set; agents act only through it.
- [[calibrated-validation-preserves-agency]] — each verb's atomic schema check is the cheap floor; what it must not do is validate the semantic interior.
- [[intent-not-flag-branches]] — the same closed-named-mode discipline at the API seam: a tagged verb set, not per-call-site branching.
- [[inversion-of-control-orchestration]] — when the agent is the router, it reads state and picks the next verb from a passive engine it consults as a tool.
