# scoped-memory-v2 — path-scoped memory

**The initiative.** Every memory event records its cwd (derived by the tool at encode); **scope =
`node(cwd)`** — the nearest marker-declared ancestor directory, resolved by an `agent-memory` verb,
never reasoned; dream = deterministic fold (record ↦ node manifest) + a semantic routing pass with a
total route; stores are the CoALA types (`EPISODIC · SEMANTIC · PROCEDURAL`; the stance lives in
SOUL). Design + decisions: `SPEC.md` (D1–D6).

## Status mirror

**Wave 0 complete; fire cutover verified 18/18 (staged rollout per Operator directive).**

DAG: `wave(1) {fleet-cutover-v2}` → `wave(2) {store-migration-v2 ⊳ cutover}`.

**Pending:**

- `fleet-cutover-v2` — remaining 6 hosts (fire already live + oracle-verified: derived-cwd encode ·
  node resolver · fold determinism + legacy bucket · `--under` · audit v2 bite · lock · v2
  skills/SOUL content); pinned verb surface; no-reseed proof; `docs/scoped-memory.md` reconciliation.
- `store-migration-v2` — clean-slate harvest-and-drop (projection-dedup bar), judged; audit
  `scanned ≥ 2` precondition; post-deploy ABSENT re-assert; continuity smoke.

**Completed:** `runtime-lattice` · `forge-seeds` · `corpus-rituals-v2`.
