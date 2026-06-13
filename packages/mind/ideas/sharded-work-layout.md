---
kind: structure
delineation: A body of work as a directory of one-file units, each loaded JIT by reference and sharded so units don't collide — the shared skeleton an agent-driven plan and an engine-driven workflow each specialize, differing only in who owns control flow.
---

# Sharded Work Layout

The skeleton shared by every sharded body of work — a plan or a workflow:

- **One unit, one file** — each task/step is a single kebab-slug file; the directory _is_ the work.
- **Sharded so units don't collide** ([[shard-by-orthogonal-concern]]) — a MECE decomposition, so units progress without stepping on each other.
- **Cite, don't copy** ([[cite-dont-copy]]) — units link out to their sources (research, decisions, references); the sources are the truth, the unit is a pointer.
- **Load one unit at a time** ([[context-at-the-load-bearing-depth]]) — JIT-load the unit you are working; never hoist the whole body of work into context.

Two species specialize this skeleton, differing on a single axis — **who owns control flow** ([[engine-orchestrates-agents-execute]]):

- [[sharded-plan-layout]] — an **agent** orchestrates: no engine, unit state is the folder it sits in, work is picked by a trivial rule.
- [[sharded-workflow-layout]] — a deterministic **engine** orchestrates: ordered steps the engine walks, the agent executing one step per inference point.

## See also

- [[shard-by-orthogonal-concern]] — why the decomposition is MECE.
