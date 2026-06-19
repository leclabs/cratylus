---
kind: concept
delineation: When the agent must be the active driver, give it a passive state engine to consult as a tool — the engine knows the graph and answers "where am I / what's next" but performs no side effect and calls nothing; the agent reports outcomes and decides when to act, so control is inverted from engine-drives-agent to agent-consults-engine.
---

# Inversion-of-Control Orchestration

The dual of [[engine-orchestrates-agents-execute]] under the platform precondition that no engine may call the agent (an agent REPL, a single-context session): the agent calls the engine for navigation rather than the engine calling the agent at inference points. Which side issues the call is fixed, not chosen freely ([[engine-orchestrates-agents-execute]]).

Two properties keep it honest:

- **The engine is a pure query, not an actor.** A four-verb surface (init / start / current / next) is the sufficient set: report outcome, read next position. Once the navigator calls agents or sequences side effects it has become an [[engine-orchestrates-agents-execute]] engine — which an agent-REPL platform cannot host, so the leak is silent breakage.
- **Position is data the agent reads, never a decision the tool makes.** Keep _"where am I"_ (engine) separate from _"what to do about it"_ (agent).

## See also

- [[engine-orchestrates-agents-execute]] — the dual coupling, opposite call direction.
- [[state-transitions-as-agent-protocol]] — the agent-as-router case is exactly this: the agent reads state and picks the next verb; the closed verb menu is the engine's surface.
- [[minimalism]] — the four-verb passive surface is the smallest sufficient set; anything more is the tool grabbing authority that isn't its job.
