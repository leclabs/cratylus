# scoped-memory-v2 — path-provenance memory

**The initiative.** Memory events carry mechanical file-path provenance captured by the harness
(PostToolUse path-journal hook; the tool derives host/cwd/write-sets); **scope is a position in a
marker-declared directory lattice** (`node(p)` = nearest ancestor boundary; markers configurable,
launch cwd always a node), computed at consolidation — never judged at capture; dream is a
**re-runnable fold** (deterministic lattice pass → semantic re-judge; `--replay` = migration as
recomputation); stores are the CoALA types (`EPISODIC · SEMANTIC · PROCEDURAL`; the stance lives in
SOUL). Design + decisions: `SPEC.md` (D1–D7).

## Status mirror

**Spec authored — all shards HELD pending Operator approval of `SPEC.md`.**

DAG: `wave(0) {runtime-telemetry (Mav) · telemetry-hook (Mav) · corpus-rituals-v2 (Nico)}` →
`wave(1) {fleet-cutover-v2 ⊳ all three}` → `wave(2) {store-migration-v2 ⊳ cutover}`.

**Pending (HELD):**

- `runtime-telemetry` — record schema + lattice resolver (`node(p)`, configurable markers) +
  `dream fold [--replay]` manifest + `read --under` + lock + audit allow-file; oracle-suite
  acceptance.
- `telemetry-hook` — PostToolUse path-journal hook (agent-forge-projected, fails open, off-repo).
- `corpus-rituals-v2` — CoALA store names + fold/out-of-node/in-repo-policy laws in the cells.
- `fleet-cutover-v2` — atomic runtime+hook+SOUL deploy; per-host content verification.
- `store-migration-v2` — harvest-and-drop to the new stores (projection-dedup bar, drop-biased),
  judged; continuity smoke.
