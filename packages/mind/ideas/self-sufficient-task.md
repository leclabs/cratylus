---
kind: principle
delineation: A sharded task is a self-sufficient implementation spec — objective · preconditions · operations · artifacts(paths) · acceptance(blind test), and out-of-scope only for a genuine creep-preventing exclusion — so the executing agent re-derives nothing.
---

# Self-Sufficient Task

A task-file is a **spec, not a stub**: it carries everything its executor needs to act without re-deriving context the author already held. The closure is fixed —

- **objective** — the one outcome, stated as the result not the activity.
- **preconditions** — the ground the executor stands on: source paths, conventions, lineage to cite.
- **operations** — the steps, ordered.
- **artifacts** — what is produced, by **path** (not "a file somewhere").
- **acceptance** — the **blind test** that decides done: a fresh reader, holding only the spec, can verify it.

`out-of-scope` is **optional and not reflexive** — the five clauses above are required; this one is added only to fence off a genuine creep, omitted otherwise, never written as ceremony.

A stub that says "do the X thing" forces the executor to reconstruct the author's intent — the re-derivation the spec exists to abolish. The blind-test acceptance is the falsifier: if a reader without the author's context can't both execute and verify, the task is a stub.

## See also

- [[sharded-plan-layout]] — the task-file is the unit this layout moves between state folders.
- [[shard-by-orthogonal-concern]] — a self-sufficient task is one orthogonal slice; self-sufficiency is what lets it run without its siblings.
- [[principal-agency]] — the executor owns the slice end-to-end, which a self-sufficient spec makes possible.
- [[self-sufficient-formalism]] — the same closure discipline applied to a formal block.
