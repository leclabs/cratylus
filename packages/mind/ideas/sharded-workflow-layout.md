---
kind: structure
delineation: The engine-driven specialization of sharded-work-layout — an ordered set of one-file steps a deterministic engine walks, JIT-loading one step at a time (never peek ahead); the engine owns control flow and the per-step save/continue handshake is the agent's protocol.
---

# Sharded Workflow Layout

The **engine-driven** specialization of [[sharded-work-layout]]: a deterministic engine, not an agent, owns control flow ([[engine-orchestrates-agents-execute]]) — the agent is one operation the engine invokes at each genuine inference point.

- **Ordered step-files** — the work is a sequence (or DAG) of one-file steps the engine walks; an LLM "hub agent" routing the steps is a fiction, it is really an engine.
- **JIT one step at a time** ([[context-at-the-load-bearing-depth]]) — the engine loads only the current step-file and never lets the agent peek ahead.
- **Inversion of control** ([[inversion-of-control-orchestration]]) — where the agent must drive, the engine is the passive state engine it consults ("where am I / what's next"), performing no side effect itself.
- **State-transition handshake** ([[state-transitions-as-agent-protocol]]) — the per-step save/continue is a closed set of state-mutating commands; the typed state, not free text, is the handoff token, and the engine is the only legal mutator.

## See also

- [[sharded-work-layout]] — the genus skeleton this specializes.
- [[sharded-plan-layout]] — the sibling species, agent-driven.
