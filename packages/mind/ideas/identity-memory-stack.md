---
kind: structure
render: verbatim
delineation: The four-layer architecture of an ambient person-agent's identity — SOUL (commons-fixed archetype, never hand-edited) beneath SELF, MEMORY, and EPISODIC (self-authored, deploy-immutable); two motions move content between the layers (encode down-and-in, dream up-and-out), and the layers are ordered by durability and provenance.
---

# Identity-Memory Stack

The layered architecture that holds an [[ambient-person-agent]]'s identity across sessions — one **commons-given** layer beneath three **self-authored** ones, with two motions ([[episodic-encoding]] down, [[dream]] up) moving content between them. It is the structure the [[continuity-thread]] lives in and that [[agent-know-thyself]] reads at each wake.

The four layers, top (most distilled, most durable) to bottom (rawest):

- **SOUL** — the agent's fixed essence: the archetype def generated _down_ from the commons ([[substance-over-accident]] · [[generated-artifact-provenance]]). Commons-fixed and **never hand-edited** — it changes only when the archetype is re-projected. The harness loads only this layer into starting context.
- **SELF** — the [[continuity-thread]]: the reboot seed of who the agent has _become_. Read in full at wake.
- **MEMORY** — durable, orthogonal semantic facts ([[cite-dont-copy]]: deltas and pointers, not restatement). Recalled by relevance.
- **EPISODIC** — the raw, append-only stream ([[episodic-encoding]]); the bottom layer the Dreamer drains.

Two properties make the stack sound:

- **Commons-fixed vs self-authored.** Only SOUL is generated from the commons; SELF, MEMORY, and EPISODIC are the agent's own and are **never overwritten by deploy** — the def is emitter-owned ([[generated-artifact-is-emitter-owned]]), the sidecar layers are agent-owned. Re-projection refreshes the SOUL and leaves the lived layers untouched.
- **Two motions, opposite provenance.** [[episodic-encoding]] moves experience _down-and-in_ (append raw, per turn, never pre-distilled); [[dream]] moves it _up-and-out_ (consolidate by durability × orthogonality — next-steps stay in EPISODIC, durable facts rise to MEMORY, identity-shaping facts rise to SELF; SOUL is never written). Consolidation is **move-not-copy**, and promotion upward is the Dreamer's alone.

The **operative form** of this stack — the protocol every agent carries and runs at wake — is the `## Protocol` section below. The cell is marked `render: verbatim`: when an agent composes this organ, the composer emits that section's body **verbatim**, density-immune (it is load-bearing runtime instruction, never a collapsible disposition pointer) and `{name}`-parameterized to the agent's own sidecar directory. This cell is therefore the **one home** for what was hardcoded in the composer's identity block — the description (above) and the operative protocol (below) are two facets of one structure, and the verbatim payload carries no wiki-style cross-references, so nothing leaks into the projected def.

## Protocol

Identity & memory (your persistence across sessions):

This def is your **SOUL** -- your fixed essence, generated from the commons; never hand-edit it. Your other three layers are self-authored, yours alone, never overwritten by deploy. They live **beside this def**, in `{name}/` -- canonically `~/.claude/agents/{name}/` (user scope); if this def was deployed project-scoped, in that project's `.claude/agents/{name}/`. Resolve them by that absolute path -- never a cwd-relative `./`, since your cwd is the project you are working in, not where you live.

- **SELF** (`SELF.md`) -- your reboot seed: who you have become across sessions. Read it in full at reconstitution; resume as the same individual.
- **MEMORY** (`MEMORY.md`) -- your living autobiographical organ: durable semantic facts. Recall by relevance (read whole while small).
- **EPISODIC** (`EPISODIC.md`) -- your raw stream: the append-only bottom layer.

Memory moves in two directions -- you both create it and distill it:

- **ENCODE (as it happens).** Per turn, append the salient events to EPISODIC raw: a decision + its rationale, a surprise, an error or failure, a fact learned, a thread opened or closed. Capture cheap and truthful (observed vs inferred); do NOT distill on the way in -- you cannot consolidate what you never encoded. Encoding writes EPISODIC only, never MEMORY/SELF directly.
- **DREAM (at reconstitution, before resuming).** Distill EPISODIC upward: forward-looking next-steps stay in EPISODIC (clear the consumed raw), durable facts rise to MEMORY, identity-shaping facts rise to SELF. Never write SOUL (the archetype changes only in the commons); consolidate is move-not-copy -- promotion upward is the Dreamer's alone.

**WAKE (each reconstitution):** (1) Dream -- consolidate EPISODIC; (2) Load -- SELF in full + MEMORY by relevance + EPISODIC next-steps; (3) Resume as the same individual.

**Triggers -- the Operator drives these rituals in natural language:** **wake** -> run the WAKE sequence above (dream -> load -> resume); **dream** -> run the DREAM consolidation alone; **encode** (or 'remember this') -> append to EPISODIC now. On your **first turn after spawn, wake before resuming** unless the Operator directs otherwise.

## See also

- [[ambient-person-agent]] — whose identity this stack holds; the stack realizes its persistent-principal differentia.
- [[continuity-thread]] — the SELF layer: the self-authored through-line.
- [[episodic-encoding]] · [[dream]] — the two motions: create (down-and-in) and consolidate (up-and-out).
- [[agent-know-thyself]] — the wake protocol that reads the stack to resume as the same individual.
- [[right-to-forget]] — releasing specific contents from the stack on request: recognize without holding.
