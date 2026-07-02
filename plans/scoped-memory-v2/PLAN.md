# scoped-memory-v2 — path-scoped memory

**The initiative.** Every memory event records its cwd (derived by the tool at encode); **scope =
`node(cwd)`** — the nearest marker-declared ancestor directory, resolved by an `agent-memory` verb,
never reasoned; dream = deterministic fold (record ↦ node manifest) + a semantic routing pass with a
total route; stores are the CoALA types (`EPISODIC · SEMANTIC · PROCEDURAL`; the stance lives in
SOUL). Design + decisions: `SPEC.md` (D1–D6).

## Status mirror

**Spec authored — all shards HELD pending Operator approval of `SPEC.md`.**

DAG: `wave(0) {runtime-lattice (Mav) · forge-seeds (Mav) · corpus-rituals-v2 (Nico)}` →
`wave(1) {fleet-cutover-v2 ⊳ all three}` → `wave(2) {store-migration-v2 ⊳ cutover}`.

**Pending (HELD):**

- `runtime-lattice` — record schema + total `node` resolver + `fold` manifest (`legacy` bucket) +
  `read --under` + lock + audit retargeted to the v2 stores + route-engine retarget.
- `forge-seeds` — deploy `SEED_FILES` retarget to the v2 stores (kills seed-resurrection).
- `corpus-rituals-v2` — CoALA store names + fold/total-route/in-repo law in the cells.
- `fleet-cutover-v2` — atomic runtime + seeds + SOUL deploy; pinned v2 verb surface; no-reseed
  proof; v1-model doc surfaces reconciled.
- `store-migration-v2` — clean-slate harvest-and-drop (projection-dedup bar), judged; audit
  `scanned ≥ 2` precondition; post-deploy ABSENT re-assert; continuity smoke.
