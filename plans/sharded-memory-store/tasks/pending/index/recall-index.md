# recall-index (deferred — build only when load-whole breaks)

**Objective.** Add a **derived, rebuildable** recall index behind the `recall` verb (ADR D1/D6):
grep → SQLite FTS5 → embeddings (`sqlite-vec`), scored by recency + importance + relevance.

**Preconditions.** Sharding live AND "load whole" demonstrably failing (size/latency). Until then
this stays deferred — do not build prematurely (ADR D5/D6).

**Operations.** Implement the index as a cache rebuildable from the shard files; wire it behind
`recall` only; the files stay source of truth; document the rebuild command.

**Artifacts.** index module in `packages/episodic/src/`, rebuild CLI verb.

**Acceptance (blind test).** Deleting the index and rebuilding from shards yields identical recall
results; the agent-facing `recall` verb signature is unchanged from `verb-interface-spec`.
