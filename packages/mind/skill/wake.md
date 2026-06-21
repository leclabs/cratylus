---
kind: skill
name: wake
delineation: use this skill to reconstitute an agent at session start — run the memory home's WAKE sequence (dream → load → orient → resume) so it resumes as the same individual; the read-and-resume counterpart to /dream, invocable as /wake.
trigger: /wake
---

# Wake Skill

wake ≜ invokes [[memory]], [[dream]] · references [[continuity-thread]], [[handoff]]

The read-and-resume half of the session boundary: [[dream]] is the up-and-out write of the store; `/wake` reads it back and resumes the [[continuity-thread]] as the same individual.

Resolve from context:

- `${AGENT_HOME}` — the agent's absolute sidecar home; the self-authored layers live at `${AGENT_HOME}/<layer>.md` for `<layer> ∈ {SELF, MEMORY, EPISODIC}`. `SOUL` is already in-prompt.

## Sequence

**0. Migrate if needed (host-bootstrap precondition).** Wake is the first ritual to touch the store on a new host, so it is the trigger site for the [[memory]] runtime's `migrate` verb. Before loading the layers: if `${AGENT_HOME}/EPISODIC.md` exists and `${AGENT_HOME}/EPISODIC.jsonl` does not, convert via the bundled runtime — `node ~/.claude/skills/memory/episodic.mjs migrate ${AGENT_HOME}/EPISODIC.md ${AGENT_HOME}/EPISODIC.jsonl`. No-loss gated and idempotent: once `.jsonl` exists it is a no-op and wake proceeds.

Then run the [[memory]] WAKE sequence:

```text
WAKE ≜ dream → load → orient → resume

dream   — dream; usually catch-up only — a no-op when handoff already dreamt on hot context,
          load-bearing on a fresh spawn or a crash that had none.
load    — read the resident layers ${AGENT_HOME}/{SELF, MEMORY} (EPISODIC via the runtime `read` verb).
orient  — bind to the current project, resume that project's work-thread; an unfamiliar cwd is a fresh orientation.
resume  — act as the same individual; a wake-time read biases the very next action.
```

Fired by **wake** / `/wake`; absent direction, default on the first turn after spawn.

## See also

- [[memory]] — the organ-home whose WAKE protocol this invokes (and whose `migrate`/`read` verbs it calls).
- [[dream]] — the write-motion counterpart; also step 1 of the sequence.
- [[handoff]] — the persist half on the near side of /clear; wake is the read half on the far side.
