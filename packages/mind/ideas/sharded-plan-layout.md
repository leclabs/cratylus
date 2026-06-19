---
kind: structure
delineation: The agent-driven specialization of sharded-work-layout — task state is the folder a unit sits in (pending→ready→active→completed), each sub-sharded into {concern} vertical slices; the dependency graph is prestructured by placement (no engine), PLAN.md mirrors it, and the open frontier is `ls tasks/ready/`.
---

# Sharded Plan Layout

An agent, not an engine, orchestrates: it plans and executes as it normally would, and the layout carries the state.

```
{plansDirectory}/{plan}/
├── AGENTS.md        — conventions for agents working this plan (CLAUDE.md symlinks it)
├── PLAN.md          — ordered task list + status + the cross-slice dependency edges (the mirror); the edges say which pending tasks a completion promotes to ready
├── tasks/           — lifecycle = the folder a task sits in, each state sub-sharded into {concern}/ vertical slices
│   ├── pending/{concern}/   — authored but blocked: a cross-slice dep is unmet
│   ├── ready/{concern}/     — the unblocked frontier; work is drawn from here
│   ├── active/{concern}/    — in progress
│   └── completed/{concern}/ — done
├── research/        — research notes ({topic}.md)
├── decisions/       — ADR-style design decisions ({NNNN}-{slug}.md, zero-padded)
└── references/      — external pointers ({topic}.md)
```

- **State is the folder, not a field.** Advancing a task is an `mv`. The graph is prestructured by placement: the author drops each task into its starting state, and on a completion the agent promotes the now-unblocked dependents `pending → ready`. Execution is one rule: work anything in `tasks/ready/` ([[doc-mirrors-runtime-truth]]).
- **`{concern}` is a vertical slice** ([[shard-by-orthogonal-concern]]); distinct concerns in `ready/` are parallelizable across agents without collision.
- **Decisions in clean current-state** ([[clean-slate]]) — no superseded ADRs, no "amended-by" footnotes.
- **`ls tasks/ready/` is the open frontier**; read PLAN.md for the ordering and the cross-slice edges.

## See also

- [[sharded-work-layout]] — the genus skeleton this specializes (one-unit-one-file, cite-don't-copy, load-at-depth).
- [[sharded-workflow-layout]] — the sibling species, engine-driven.
- [[doc-mirrors-runtime-truth]] — PLAN.md is a mirror of the folder state, not the authority.
