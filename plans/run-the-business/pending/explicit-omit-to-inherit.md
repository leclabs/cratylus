# explicit-omit-to-inherit (organ `null` sentinel)

**Lane** Nico (anatomy type + agent vectors) + Mav (claude & codex adapters) · **Status** pending.

**Supersedes the retired `minimal-delta-agents`**, which pushed the wrong direction — agents as minimal
deltas over `base`, _deepening_ an implicit inheritance. The corpus already favors the right pattern:
`base.ts` carries **no organ defaults** (only the memory + persona genus blocks), so every agent is
_already_ a flat, explicit 24-organ vector. This task finishes that pattern by making "inherit from the
harness" **explicit**, and refuses to reintroduce a base-organ hierarchy.

## The idea — composition over inheritance (industry-standard)

An organ key may hold a concrete value **or `null`**. `null` = **do not project this organ; inherit
whatever the harness provides** — while the key stays **visible at the agent source**, self-documenting the
deliberate harness-inheritance. Flat, depth-1, no base-delta to resolve. This is the explicit-unset /
null-object pattern (cf. CSS `unset`), and composition-over-inheritance (GoF / data-oriented) — no bespoke
coinage; the sentinel's name is the language primitive `null`, the concept is the existing codebase term
**omit-to-inherit**.

Today the adapter does this _implicitly_ via `harness-reset` / `subtractReset`: it omits an organ whose
value equals a harness fixture. `null` makes it **explicit and decoupled** — the agent asserts _nothing_
and tracks the harness default even if it drifts (expressiveness a concrete-value-matching-the-fixture
cannot give).

## Scope

1. **Anatomy type** (Nico) — each of the 24 organ keys **required present**; value = `Value | null`; a
   missing key = compile error (completeness enforced, maximal explicitness).
2. **Adapters** (Mav) — `claude` + `codex`: drop `null` organs from the projection. `null` supersedes the
   primary use of `subtractReset` → **evaluate retiring the `harness-reset` fixture** (it needs
   blind-introspection upkeep; both adapters carry one).
3. **Agent vectors** (Nico) — declare each harness-inherited organ as explicit `null`.

## Acceptance

- `tsc` enforces all-keys-present + `Value | null`; the projector drops `null` organs; projection-stability
  green.
- A `null` organ is **visible at the agent source** AND **absent from the projected SOUL** (inherited from
  the harness) — proven by a projection test.
- `harness-reset` / `subtractReset` is retired, or reduced to a documented secondary role with a stated
  reason.

## Rider (2026-07-01, from reader-llm-default)

On landing: densify agent vector bodies to the reader-density bar (`remediation-fanout` shard C,
deferred here — vectors churn under this refactor, densify after). Gate exists: `conform(a)`,
`test/reader-density.test.ts`.
