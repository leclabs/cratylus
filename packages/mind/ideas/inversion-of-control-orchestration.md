---
kind: concept
delineation: When the agent must be the active driver, give it a passive state engine to consult as a tool — the engine knows the graph and answers "where am I / what's next" but performs no side effect and calls nothing; the agent reports outcomes and decides when to act, so control is inverted from engine-drives-agent to agent-consults-engine.
---

# Inversion-of-Control Orchestration

The complement to [[engine-orchestrates-agents-execute]] for the case where the platform makes the **agent the active driver** (no engine may call the agent — an agent REPL, a single-context session). Don't let the agent reinvent an unreliable state machine in its own reasoning. Instead give it a **passive state engine as a tool it consults**: the engine holds the workflow graph and the current position; the agent reports what just happened and asks _where am I / what runs next_; the engine answers with the next coordinate and performs **no side effect of its own** — it drives nothing, calls nothing, schedules nothing.

This is the GPS, not the driver: you report your position and what happened, it tells you the next turn; it never seizes the wheel. Control is **inverted** relative to the engine-drives-agent arrangement — there the engine calls the agent at inference points; here the agent calls the engine for navigation. Both keep workflow order out of the agent's free reasoning; they differ only in which side issues the call, and that is fixed by the platform's authority model, not chosen freely.

Two properties keep it honest:

- **The engine is a pure query, not an actor.** A minimal four-verb surface (init / start / current / next) is the sufficient set: report outcome, read next position. The moment the "navigator" starts calling agents or sequencing side effects it has become an [[engine-orchestrates-agents-execute]] engine wearing a tracker's clothes — and an agent-REPL platform cannot host that, so the leak is silent breakage. Keep the side effects with the agent; keep the graph-and-position with the tool.
- **Position is data the agent reads, never a decision the tool makes.** Separate _"where am I"_ (the engine's answer) from _"what should I do about it"_ (the agent's call). Folding the second into the engine recreates the very LLM-as-orchestrator pattern this is meant to dissolve, one layer down.

Adopting a workflow engine as a navigation **provider** for an agent REPL — rather than letting the REPL's primary agent hold the whole execution plan in its head — is the standing upgrade this names.

## See also

- [[engine-orchestrates-agents-execute]] — the dual coupling, opposite call direction.
- [[state-transitions-as-agent-protocol]] — the agent-as-router case is exactly this: the agent reads state and picks the next verb; the closed verb menu is the engine's surface.
- [[minimalism]] — the four-verb passive surface is the smallest sufficient set; anything more is the tool grabbing authority that isn't its job.
