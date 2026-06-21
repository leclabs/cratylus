# consolidate-reconcile

**Objective.** Make `consolidate` **reconcile** contradictions (ADR D7): a new fact that contradicts
a resident one updates it, rather than appending a duplicate.

**Preconditions.** `interface/verb-interface-spec` landed; sharding live.

**Operations.** Define the contradiction/dedup rule (mem0-style extract→match→update); implement in
the `consolidate` verb; cover with tests (update-not-append, idempotent re-run).

**Artifacts.** `consolidate` impl + tests in `packages/episodic/src/`.

**Acceptance (blind test).** Encoding a fact then a contradicting fact leaves **one** reconciled
shard, not two; re-running consolidate is a no-op.
