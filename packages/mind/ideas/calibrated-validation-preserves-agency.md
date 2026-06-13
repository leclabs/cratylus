---
kind: principle
delineation: How much you validate an agent's output sets whether it reasons or merely iterates against the checker — so validate cheaply at the transition boundary (schema/type, the floor), leave the semantic interior to the agent (the middle), gate that with a human reviewer (the ceiling), and make the validator agent-callable so it verifies in-loop instead of being a wall it hits after the fact.
---

# Calibrated Validation Preserves Agency

The depth of programmatic validation directly sets the agent's posture. Validate **too much** and the agent stops reasoning and just iterates against the validator — Goodhart at the agent level: it optimizes the checker, not the task. Validate **too little** and you cannot trust the output. The resolution is a calibrated split of authority:

- **Floor — schema at the transition boundary.** A type/schema check at each state mutation (save, approve) is the cheapest deterministic guard between "the agent did the right thing" and "the state is now subtly wrong." It catches the high-frequency, low-severity drift class and hands the agent a fix-and-retry loop it can drive itself. This is the only thing the program validates.
- **Middle — the semantic interior is the agent's job.** The actual judgement (the classification, the design, the concept induced from code) is **left unvalidated by program** — that is the autonomous work. Validating it mechanically is what collapses the agent into a procedural-checklist junior.
- **Ceiling — a human reviewer holds the golden source.** The semantic interior is gated by a typed human-in-the-loop review, not by a schema. The schema is the floor; the human is the ceiling; the agent owns the middle.

The validator should be **agent-callable**, not a wall the agent hits after the fact. When the policy/standards check is a tool the agent invokes proactively (verify-as-you-go), behaviour shifts from optimistic-write-then-fail to in-loop fix-and-recheck — the cost of the check moves from after-the-fact CI feedback to one tool call. A proxy signal must never stand in for the real state at the floor: an indicator derived from a correlated proxy (a file's mtime standing in for workflow status) lies during transitions and breeds learned-helplessness — derive it from the authoritative state ([[doc-mirrors-runtime-truth]]).

## See also

- [[state-transitions-as-agent-protocol]] — the transition boundary where the schema floor sits.
- [[metric-is-a-guide-not-a-target]] — the agent-Goodhart twin: a quality _metric_ as a target force-fits, exactly as an over-deep _validator_ does.
- [[genuine-fork]] — the human-ceiling gate is the escalation analog: the agent decides the reversible interior, the reviewer owns the fork.
