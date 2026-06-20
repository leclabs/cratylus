---
kind: principle
delineation: How much you validate an agent's output sets whether it reasons or merely iterates against the checker — so validate cheaply at the transition boundary (schema/type, the floor), leave the semantic interior to the agent (the middle), gate that with a human reviewer (the ceiling), and make the validator agent-callable so it verifies in-loop instead of being a wall it hits after the fact.
---

# Validation Altitude

Split the authority by altitude:

- **Floor — schema at the transition boundary.** The type/schema check at each state mutation (save, approve) is the only thing the _program_ validates; it drives its own fix-and-retry.
- **Middle — the semantic interior** (classification, design, concept induced from code) is left unvalidated by program.
- **Ceiling — the human reviewer holds the golden source**, gating the interior by typed review, not schema.

At the floor, never let a correlated proxy stand for the real state (a file's mtime for workflow status lies during transitions) — derive from the authoritative state ([[doc-mirrors-runtime-truth]]).

## See also

- [[state-transitions-as-agent-protocol]] — the transition boundary where the schema floor sits.
- [[goodharts-law]] — the agent-Goodhart twin: a quality _metric_ as target force-fits, as an over-deep _validator_ does.
- [[genuine-fork]] — the human-ceiling gate is the escalation analog: agent decides the reversible interior, reviewer owns the fork.
