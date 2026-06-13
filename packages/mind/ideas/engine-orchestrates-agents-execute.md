---
kind: principle
delineation: Control flow and cross-agent coordination belong to a deterministic engine; an LLM agent is one operation the engine invokes only at genuine inference points — so a "hub agent" that routes other agents is a fiction (it is really an engine), and deepening LLM-into-pipeline coupling is justified only when loose coupling fails.
---

# Engine Orchestrates, Agents Execute

Put **control flow and coordination in a deterministic engine**; make the **LLM agent one operation** the engine invokes — and only at the points where genuine inference is required. The engine owns sequencing, fan-out, retries, and the hand-offs between agents; the agent owns exactly the semantic step a program cannot do (induce a concept from code, classify, draft). This is the division-of-faculty refinement of [[pure-leaf-deterministic-engine]]: **deterministic code orchestrates, the probabilistic agent is a leaf.**

Two consequences follow directly:

- **A "hub agent" that coordinates other agents is a fiction.** When a platform forbids agent→agent calls, what people picture as a central routing agent is, on inspection, either the user picking the next step (a mesh) or a deterministic engine spawning each agent in turn. Coordination is an **engine**, not an agent wearing an orchestrator's clothes; the hub-vs-mesh choice is downstream of the platform's authority model, not a free design choice. Do the coordination at the layer that can actually see all the work ([[decision-at-the-locus-of-need]]).
- **Keep the LLM coupling minimal until it pays.** Running the agent **out-of-band** (the engine calls it at an inference point, reads its output back) already captures most of the benefit. Deepening the integration — making the agent a first-class in-pipeline operation — is justified only once the loose coupling demonstrably fails, never speculatively ([[minimalism]]).

## See also

- [[pure-leaf-deterministic-engine]] — the split this specializes.
- [[decision-at-the-locus-of-need]] — coordination lives at the layer that sees every input; that layer is the engine, not a downstream agent.
- [[state-transitions-as-agent-protocol]] — how the engine and its agents communicate: closed state-mutating commands, not free-text.
- [[inversion-of-control-orchestration]] — the dual coupling: when the platform makes the agent the driver, it consults a passive engine as a tool instead of being called by one.
- [[pretransform-pass-shrinks-inference-surface]] — shrink the agent's surface deterministically before dispatch.
