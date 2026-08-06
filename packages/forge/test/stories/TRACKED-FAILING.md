# TRACKED-FAILING — the enumerated gap set

The red half of the story library: every test here asserts DOCUMENTED reality that the library does
not yet deliver. Mechanism: `story.tracked()` = vitest `it.fails` — the assertions RUN on every
`pnpm test`; their failure is asserted, so the suite stays green while the gap exists and the set
below is exactly countable (coverage.test.ts prints the enumeration and fails if this file drifts
from the `story.tracked` call sites).

**Graduation protocol**: when an implementation lands, the tracked test FAILS (it now passes inside
`it.fails`) — flip `story.tracked` → `story`, delete the row here, regenerate MAP.md
(`pnpm exec tsx test/stories/tools/render-map.ts`). No skip/todo markers exist in the story suites
(meta-gated).

Call sites: 0 tracked-failing across 0 stories.

**convergence-graduation (2026-07)**: the interop-hardening wave closed every cross-adapter
equation it tracked; its last two rows were reclassified as by-design boundaries rather than gaps.

**the IR-intake excision (2026-07)**: the IR-intake lineage was excised and nine of the ten
epics went with their subject (E1–E5, E7–E10 — all `import` / `compile` / adapter-roster stories).
Every row this file ever carried belonged to those epics, so the ledger is now empty by
construction, not merely by graduation. E6 (exemplify-optimization) is the surviving epic and has
never carried a tracked row.

No table below: zero `story.tracked` call sites remain.
