---
kind: structure
delineation: A body of work as a directory of one-file units, each loaded JIT by reference and sharded so units don't collide — the shared skeleton an agent-driven plan and an engine-driven workflow each specialize, differing only in who owns control flow.
---

# Sharded Work Layout

The skeleton:

- **One unit, one file** — each task/step is a single kebab-slug file; the directory _is_ the work.
- **Sharded so units don't collide** ([[shard-by-orthogonal-concern]]).
- **Cite, don't copy** ([[cite-dont-copy]]) — units link out; the source is the truth, the unit a pointer.
- **Load one unit at a time** ([[context-at-the-load-bearing-depth]]).

Two species specialize it on one axis — who owns control flow ([[engine-orchestrates-agents-execute]]):

- [[sharded-plan-layout]] — an **agent** orchestrates: unit state is the folder it sits in.
- [[sharded-workflow-layout]] — a deterministic **engine** orchestrates: ordered steps it walks, one per inference point.
