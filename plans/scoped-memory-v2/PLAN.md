# scoped-memory-v2 — path-scoped memory

**The initiative.** Every memory event records its cwd (derived by the tool at encode); **scope =
`node(cwd)`** — the nearest marker-declared ancestor directory, resolved by an `agent-memory` verb,
never reasoned; dream = deterministic fold (record ↦ node manifest) + a semantic routing pass with a
total route; stores are the CoALA types (`EPISODIC · SEMANTIC · PROCEDURAL`; the stance lives in
SOUL). Design + decisions: `SPEC.md` (D1–D6).

## Status mirror

**Spec authored — all shards HELD pending Operator approval of `SPEC.md`.**

DAG: `wave(0) {runtime-lattice (Mav) · corpus-rituals-v2 (Nico)}` →
`wave(1) {fleet-cutover-v2 ⊳ both}` → `wave(2) {store-migration-v2 ⊳ cutover}`.

**Pending (HELD):**

- `runtime-lattice` — record schema + `node` resolver (configurable markers) + `fold` manifest +
  `read --under` + lock + audit allow-file.
- `corpus-rituals-v2` — CoALA store names + fold/total-route/in-repo law in the cells.
- `fleet-cutover-v2` — atomic runtime + SOUL deploy; per-host content verification.
- `store-migration-v2` — clean-slate harvest-and-drop (projection-dedup bar), judged; continuity
  smoke.
