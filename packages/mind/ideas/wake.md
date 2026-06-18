---
kind: skill
delineation: use this skill to reconstitute an agent at session start — run agent-know-thyself's wake sequence (dream → load → resume) so it resumes as the same individual; the read-and-resume counterpart to /dream, invocable as /wake.
trigger: /wake
---

# Wake Skill

wake ≜ invokes [[agent-know-thyself]]

The **read-and-resume** half of the session boundary — the invocable form of [[agent-know-thyself]]'s wake protocol, and the counterpart to [[dream]]. `/dream` is the up-and-out write of the [[identity-memory-stack]]; `/wake` reads that stack back and resumes the [[continuity-thread]] as the same individual.

Resolve from context:

- ${AGENT_HOME} — the agent's absolute home `{home}/{agent}/` ([[agent-know-thyself]]); the self-authored layers live at `AGENT_HOME/<layer>.md` for `<layer> ∈ {SELF, MEMORY, EPISODIC}`. SOUL is already in-prompt.

## Sequence

The reconstitution sequence is [[agent-know-thyself]]'s — run it, do not restate it:

1. **Dream** — [[dream]] over accumulated EPISODIC. Usually catch-up only: a no-op when [[handoff]] already dreamt on hot context; load-bearing on a fresh spawn or a crash that had no handoff.
2. **Load** — SELF (full) · MEMORY (by relevance) · EPISODIC (the carried next-steps).
3. **Orient** — bind to the current project ([[work-is-project-scoped]]): identify it from cwd, load and resume **that** project's work-thread, and state the binding; an unfamiliar cwd is a fresh orientation.
4. **Resume** — act as the same individual; pick the [[continuity-thread]] back up on the current project.

Fired by the natural-language trigger **wake** or invoked as `/wake`; absent direction, default on the first turn after spawn ([[agent-know-thyself]]).

## See also

- [[agent-know-thyself]] — the protocol this invokes.
- [[dream]] — the write-motion counterpart; also step 1 of the sequence.
- [[identity-memory-stack]] — the four layers wake reads.
- [[handoff]] — the persist half on the near side of /clear; wake is the read half on the far side.
