# explicit-omit-to-inherit (organ `null` sentinel)

**Lane** Nico (anatomy type + agent vectors) + Mav (claude & codex adapters) · **Status** COMPLETED
2026-07-02.

**Outcome** — commits `88ccdb1` (type: 24 keys required, `Fragment | null`, `base?` removed; 11
vectors null'd; codegen null emission; `test/null-organ.test.ts` gate) · `44ca1b7` (harness-reset /
subtractReset retired, −624 lines) · `2dbdc2b` (doctrine docs reconciled; `baseline-delta-model.md`
removed) · `b2b0d8f` (pre-existing lint red fixed). Wave-3 ruling: apparatus accidents inherit
(model+modalities null ×11, trigger ×9 — deviants cognizant/tester keep theirs), autonomy null ×9
per directive, substance (guardrails · memory · actions · all identity organs) stays asserted.
Fleet redeployed + content-verified byte-identical (sha256 vs `.render-ts`) on fire/forge/upmav/apps;
upgoose unreachable-deferred (p4-tail carries it). Rider closed by judge audit: shard-C surfaces
already at the reader-density bar (swept in the corpus-wide remediation); no reduction available
without meaning loss.

**Supersedes the retired `minimal-delta-agents`**, which pushed the wrong direction — agents as minimal
deltas over `base`, _deepening_ an implicit inheritance. `base.ts` already carries **no organ defaults**
(only the memory + persona genus blocks): every agent is a flat, explicit 24-organ vector. This task
finishes the pattern by making "inherit from the harness" **explicit**, and refuses to reintroduce a
base-organ hierarchy.

## Inputs (static — all exist at authoring; no dep-fed inputs)

- Anatomy types (the 24-organ `Agent` shape): `packages/agent-forge/src/anatomy/index.ts`
  (+ `packages/agent-forge/src/anatomy.test-d.ts` type-tests).
- Genus-only base + a vector exemplar: `packages/agent-anatomy/src/agents/{base,nico}.ts`; all 11 vectors
  `src/agents/*.ts`.
- The implicit mechanism to supersede: `packages/agent-forge/src/adapters/{claude,codex}/harness-reset.ts`;
  `subtractReset` call-sites in `adapters/{claude,codex}/{index,anatomy}.ts`.
- Projection gates: `packages/agent-anatomy/test/projection-stability.test.ts` ·
  `test/reader-density.test.ts` (agent-vector surface + cross-organ check) · `test/agent-delta.test.ts`.

## The idea — composition over inheritance (industry-standard)

An organ key holds a concrete value **or `null`**. `null` = do not project this organ; inherit whatever
the harness provides — key **visible at the agent source**, self-documenting the deliberate
harness-inheritance. Flat, depth-1, no base-delta to resolve. Explicit-unset / null-object pattern
(cf. CSS `unset`), composition-over-inheritance (GoF / data-oriented); the sentinel's name is the language
primitive `null`, the concept the existing codebase term **omit-to-inherit**.

Today the adapter does this _implicitly_ via `harness-reset` / `subtractReset` (omits an organ whose value
equals a harness fixture). `null` is **explicit and decoupled**: the agent asserts _nothing_ and tracks the
harness default even when it drifts — expressiveness a concrete-value-matching-the-fixture cannot give.

## Operator directive (standing intent — binds the vector edits)

`autonomy` stays **explicit only on nico + mav** (`human-on-the-loop`); the **other 9 agents declare
`autonomy: null`** (harness-inherited). Other organs: judge per vector — `null` where the agent has no
deliberate stance, concrete where it does.

## Scope — internal wave order (type → adapters → vectors)

1. **Anatomy type** (Nico) — all 24 organ keys **required present**; value = `Value | null`; a missing key
   = compile error (completeness enforced, maximal explicitness).
2. **Adapters** (Mav) — `claude` + `codex`: drop `null` organs from the projection. `null` supersedes
   `subtractReset`'s primary use → **evaluate retiring the `harness-reset` fixture** (blind-introspection
   upkeep; both adapters carry one). Retirement vs documented-secondary-role is a genuine fork — surface it.
3. **Agent vectors** (Nico) — declare each harness-inherited organ as explicit `null`, per the directive
   above.

## Acceptance (falsifiers)

- **Type falsifier:** a vector missing any organ key FAILS `tsc` (seed one, watch it fail, remove); a
  `null`-valued key passes.
- **Projection falsifier:** a `null` organ is visible at the agent source AND absent from the projected
  SOUL — proven by a projection test; a concrete organ projects unchanged (projection-stability green on
  untouched organs).
- `harness-reset` / `subtractReset` retired, or reduced to a documented secondary role with the fork
  decision recorded.
  - **FORK DECIDED (nico, 2026-07-02): RETIRE.** Audit (mav) + independent grep: zero live-path
    consumers — `subtractReset` rode only the opt-in `projectAgentDelta` path, never
    `anatomy:project`/`deploy`. `null` is the one home for omit-to-inherit (MECE); the set-difference
    partial-inherit it could express has zero users (YAGNI; git recovers); retiring kills the
    blind-introspection fixture upkeep. Reversible in-domain → decided + surfaced, not blocked on.
- Full gates: anatomy suite (incl. reader-density agent-vector surface) · repo tsc · lint · build.

## Rider (2026-07-01, from reader-llm-default)

On landing: densify agent vector bodies to the reader-density bar (`remediation-fanout` shard C,
deferred here — vectors churn under this refactor, densify after). Gate exists: `conform(a)`,
`test/reader-density.test.ts`.
