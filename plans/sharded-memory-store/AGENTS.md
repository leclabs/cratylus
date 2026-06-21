# sharded-memory-store — charter

**What.** Reshape the agent memory **store** from monolithic per-layer files (`SELF.md`,
`MEMORY.md` rewritten wholesale every dream) into **sharded files behind a stable verb
interface**, so consolidation is a file-`move` not a rewrite, and the storage backend can
grow (index, DB) without touching the agent or the constitution. Origin: Operator insight,
2026-06-20 (during `vault-reference-home`), refined into an architecture in
`decisions/0001-memory-store-architecture.md`.

**Why.** Whole-file rewrites are costly and [[palimpsest]]-prone, and "load whole" doesn't
scale. The field (CoALA · MemGPT/Letta · mem0 · LangMem) converges on typed, sharded,
indexed memory behind a portable interface — we adopt the proven primitives rather than grow
a bespoke database.

**Founder split.** **Mav** — the verb interface, the `episodic` core library + CLI, the shard
machinery, the (later) recall index, the no-loss migration. **Nico** — the constitution: the
[[memory]] cell's resident-layers model and [[dream]]/[[wake]] routing updated for sharded
files. Cross-boundary; both leads named.

**Architecture spine** (`decisions/0001`): files are the source of truth; any DB is a
derived, rebuildable index; a stable interface (`encode/recall/consolidate/graduate/forget`)
decouples agent + corpus from storage; the immediate transport is the bundled CLI over the
shell (koine-trivial), **not MCP**; MCP/server is a future adapter behind the same interface,
built only when memory goes networked.

**Acceptance discipline.** No-loss on every migration (two-leg gate: round-trip + independent
line-coverage, as in md→JSONL) · CE ∧ ME on any cell edit (Nico) · `verify.py` PASS · the
`episodic` core stays dependency-free + harness-agnostic (runs under `node`, no install) ·
golden-master byte-identity on the rendered fleet except deliberately-scoped change.
