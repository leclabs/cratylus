# refresh-koine-ir-fixture

**Owner.** Mav. **Deps.** redesign-memory-constitution (ideally after rename-memory-cell, to snapshot the final slugs).

**What.** Regenerate the stale koine IR fixture `packages/koine/adapters/test/ir-bridge/mind.koine.json` so it reflects the consolidated corpus: `cd packages/mind && python3 toolkit/emit_ir.py <fixture> --target claude --target codex`. The committed fixture predates recent corpus changes — it carries a dead `[[agent-know-thyself]]` ref and only **7** of the current **10** skills.

**Not build-breaking** (the koine `round-trip.test.ts` round-trips the *fixture* itself, not the live corpus; the mind-side `test_ir_bridge.py` regenerates fresh) — but stale and worth refreshing for honesty.

**Exit criteria.** Fixture matches live `emit_ir` (no dead refs); `round-trip.test.ts` length assertions updated to the live counts (11 agents + **10** skills, currently asserts 7); `pnpm test` green.
