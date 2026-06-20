---
kind: skill
delineation: use this skill to reconstitute an agent at session start — run the memory home's WAKE sequence (dream → load → orient → resume) so it resumes as the same individual; the read-and-resume counterpart to /dream, invocable as /wake.
trigger: /wake
---

# Wake Skill

wake ≜ invokes [[memory]]

`/dream` is the up-and-out write of the store; `/wake` reads it back and resumes the [[continuity-thread]] as the same individual.

Resolve from context:

- ${AGENT_HOME} — the agent's absolute home `{home}/{agent}/`; the self-authored layers live at `AGENT_HOME/<layer>.md` for `<layer> ∈ {SELF, MEMORY, EPISODIC}`. SOUL is already in-prompt.

## Sequence

**Migrate if needed (host-bootstrap precondition).** Wake is the first ritual to touch the store on a new host, so it is the trigger site for the EPISODIC md→JSONL migration. Before loading the layers: if `${AGENT_HOME}/EPISODIC.md` exists and `${AGENT_HOME}/EPISODIC.jsonl` does not, convert the legacy store via the bundled `episodic` tool — `node ~/.claude/skills/memory/episodic.mjs migrate ${AGENT_HOME}/EPISODIC.md ${AGENT_HOME}/EPISODIC.jsonl` — before the opening dream. The migrate is no-loss gated and runs once: when `${AGENT_HOME}/EPISODIC.jsonl` is already present it is a no-op and wake proceeds straight to the sequence.

Then run the [[memory]] WAKE sequence. The opening **dream** is usually catch-up only: a no-op when [[handoff]] already dreamt on hot context, load-bearing on a fresh spawn or a crash that had none. **Orient** binds to the current project and resumes that project's work-thread; an unfamiliar cwd is a fresh orientation.

Fired by the trigger **wake** or `/wake`; absent direction, default on the first turn after spawn.

## See also

- [[memory]] — the memory home whose WAKE protocol this invokes.
- [[dream]] — the write-motion counterpart; also step 1 of the sequence.
- [[handoff]] — the persist half on the near side of /clear; wake is the read half on the far side.
