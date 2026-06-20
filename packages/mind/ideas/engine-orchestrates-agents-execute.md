---
kind: principle
delineation: Control flow and cross-agent coordination belong to a deterministic engine; an LLM agent is one operation the engine invokes only at genuine inference points — so a "hub agent" that routes other agents is a fiction (it is really an engine), and deepening LLM-into-pipeline coupling is justified only when loose coupling fails.
---

# Engine Orchestrates, Agents Execute

The division-of-faculty refinement of [[pure-leaf-deterministic-engine]]: the engine owns sequencing, fan-out, retries, and inter-agent hand-offs; the agent owns exactly the one semantic step a program cannot do (induce a concept, classify, draft).

Two consequences:

- A "hub agent" resolves, on inspection, to either the user picking the next step (a mesh) or a deterministic engine spawning each agent in turn; the hub-vs-mesh choice is downstream of the platform's authority model, not free design ([[decision-at-the-locus-of-need]]).
- Running the agent **out-of-band** — the engine calls it at an inference point and reads its output back — already captures most of the benefit; deepen the integration only once loose coupling demonstrably fails ([[minimalism]]).

## See also

- [[pure-leaf-deterministic-engine]] — the split this specializes.
- [[decision-at-the-locus-of-need]] — coordination lives at the layer that sees every input; that layer is the engine, not a downstream agent.
- [[state-transitions-as-agent-protocol]] — how the engine and its agents communicate: closed state-mutating commands, not free-text.
- [[agent-consults-engine]] — the dual coupling: when the platform makes the agent the driver, it consults a passive engine as a tool instead of being called by one.
- [[pretransform-shrinks-inference-surface]] — shrink the agent's surface deterministically before dispatch.
