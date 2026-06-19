---
kind: principle
delineation: How much you validate an agent's output sets whether it reasons or merely iterates against the checker — so validate cheaply at the transition boundary (schema/type, the floor), leave the semantic interior to the agent (the middle), gate that with a human reviewer (the ceiling), and make the validator agent-callable so it verifies in-loop instead of being a wall it hits after the fact.
---

# Calibrated Validation Preserves Agency

Validation depth sets the agent's posture: too much and it Goodharts the checker instead of the task; too little and you cannot trust the output. Split the authority by altitude:

- **Floor — schema at the transition boundary.** A type/schema check at each state mutation (save, approve) is the only thing the program validates: cheap, deterministic, drives its own fix-and-retry.
- **Middle — the semantic interior is the agent's job.** The judgement (classification, design, concept induced from code) is left unvalidated by program — mechanizing it collapses the agent into a checklist junior.
- **Ceiling — a human reviewer holds the golden source**, gating the interior by typed review, not schema.

Make the validator **agent-callable** (verify-as-you-go), not a post-hoc wall — the check becomes one in-loop tool call instead of after-the-fact CI. Never let a correlated proxy stand for the real state at the floor (a file's mtime for workflow status lies during transitions) — derive from the authoritative state ([[doc-mirrors-runtime-truth]]).

## See also

- [[state-transitions-as-agent-protocol]] — the transition boundary where the schema floor sits.
- [[metric-is-a-guide-not-a-target]] — the agent-Goodhart twin: a quality _metric_ as target force-fits, as an over-deep _validator_ does.
- [[genuine-fork]] — the human-ceiling gate is the escalation analog: agent decides the reversible interior, reviewer owns the fork.
