# sharded-memory-store

**Owner.** Mav (machinery) + Nico (constitution). **Origin.** Operator insight, 2026-06-20 (during
`vault-reference-home`). **State: PENDING — design-first, scope with Operator + Nico before building.**

**The insight.** Today `SELF.md` and `MEMORY.md` are **monolithic files rewritten wholesale on every
dream** — costly, and a palimpsest risk (the same file rewritten over and over). The Operator's
realization: **shard memories one-file-per-memory, grouped by type**, so consolidation becomes **moving a
file** between homes, not rewriting a big file. This is `sharded-work-layout` (one-unit-one-file,
state-is-the-folder, move-not-rewrite) applied to the memory store itself — and it makes MEMORY→vault
graduation literal (`mv` a shard into the vault namespace) instead of delete-here / write-there.

**Why now.** `vault-reference-home` already established sharded notes in a namespaced home
(`agents/<name>/`). Extending sharding inward to SELF/MEMORY makes the whole store uniform: every memory
is a file; dream routes by moving files; the hot/cold split is which directory a shard lives in.

**Key design questions (resolve before building):**

- **Granularity** — one file per fact, or per topic/cluster? How does "recall by relevance" work over
  many shards (frontmatter tags? an index file? graphify)?
- **Layout** — `MEMORY/` as a dir of typed shards vs the current single `MEMORY.md`; how "load whole while
  small" becomes "load by relevance" without a wake-time cost blow-up.
- **Dream mechanics** — consolidation as file-moves (EPISODIC→MEMORY shard, MEMORY shard→vault); does the
  `episodic` tool gain a move/shard affordance, or stays in-the-loop reasoning + plain `mv`?
- **Migration** — convert existing monolithic `SELF.md`/`MEMORY.md` across all 11 agents → sharded,
  **no-loss gated** (reuse the md→jsonl migration pattern: round-trip + independent line-coverage).
- **Constitution** — the `memory` cell's "store — resident layers" model + dream routing updated for
  sharded files (Nico's domain).

**Exit criteria (provisional).** Memories are sharded files; dream consolidation moves files (not
rewrites); graduation MEMORY→vault is an `mv`; all agents migrated no-loss; constitution updated +
`verify.py` PASS.
