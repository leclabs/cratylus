# migration-monolith-to-shards

**Objective.** Convert the existing monolithic `SELF.md`/`MEMORY.md` for all 11 agents into the
sharded layout, **no-loss gated** (reuse the md→JSONL two-leg pattern: round-trip + independent
line-coverage against the raw source).

**Preconditions.** `layout/shard-layout` + `constitution-update` landed; the `episodic` core
exposes the verbs.

**Operations.** Build the splitter (monolith → shards), gate it two-leg no-loss, run per agent at a
session boundary (atomic, like the JSONL migration), never deleting the source until verified.

**Artifacts.** the migration tool in `packages/episodic/src/`, migrated agent sidecar trees.

**Acceptance (blind test).** For each agent, the union of shard contents reproduces the original
MEMORY/SELF line-multiset (no loss/fabrication/dup); a wake reads the shards as one logical store.
