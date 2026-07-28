# S1 · fragment-events

**Objective.** Let a dimension fragment carry `events`, and make `enforcing(f) ⇔ events(f) ≠ ∅`
derivable from the cell alone. This is the DECLARATION face of an enforcing constraint — the part
read inline, by the reasoning it governs.

**Why the declaration must be inline, stated so it is not re-litigated.** A constraint the agent
cannot see is a rule it burns turns discovering by rejection, and it may satisfy the enforcer while
violating its intent. The declaration is not decoration on the mechanism; it is what makes a
refusal legible rather than an opaque wall. See §Resolution in PLAN.md — the inline declaration is
REQUIRED, and it is not what does the binding.

**Static inputs (pinned, verified present at authoring):**

- `packages/agent-forge/src/anatomy/hook-cell.ts:32` — `HookEvent = CanonicalEvent | 'vcs.commit.post'`. The event vocabulary to reuse VERBATIM. Do not mint a second event union; two vocabularies for one concept is the congruence-drift failure.
- `packages/agent-forge/src/anatomy/hook-cell.ts:35` — `HookSubstrate = 'harness' | 'git'`. `substrate` travels WITH `events`; S3's refusal law is substrate-relative and cannot be evaluated without it.
- `packages/agent-forge/src/anatomy/hook-cell.ts:54` — `residue`, the σ\*-signified identity that `accept()` already gates. The fragment's own body plays this role; do not add a second identity field.
- `packages/agent-forge/src/anatomy/index.ts:109` — `export type Guardrails = Fragment<'guardrails'>` and the `Fragment` brand at `:15`. `events` attaches to the FRAGMENT shape.
- `packages/agent-forge/src/core/hook/generated.ts` — `CanonicalEvent`, 28 harness-agnostic values, schema-owned leaf module.

**Constraints.**

- `events` is OPTIONAL on a fragment (`events?`), never required. `enforcing(f)` is DERIVED from its presence — do not add a boolean `enforcing` field. A derived predicate cannot disagree with the data; two fields can.
- Reuse `HookEvent` and `HookSubstrate` by import. If they must move to a shared module to avoid a cycle, MOVE them — do not copy.
- A fragment carrying `events` must also carry `substrate`. Make that a type-level requirement (the pair is one fact), not a runtime check.
- Do NOT emit any mechanism here. S1 is the declaration only; the realization is S2. A fragment carrying `events` that deploys to nothing must still be a build error — that gate is S3's, and S1 must not pre-empt it with a silent default.
- Do not touch `HookCell` — it stays until S4. S1 ADDS a capability; it removes nothing.

**Dependencies.** none (wave 0 root; disjoint outputs from S0 — S0 edits the `Agent` interface's
`guardrails` field, S1 edits the `Fragment` shape).

**Outputs.** `packages/agent-forge/src/anatomy/index.ts` (fragment `events?` + `substrate`);
possibly a shared event-vocabulary module if the import would cycle; type-level tests in
`packages/agent-forge/src/anatomy/anatomy.test-d.ts`.

**Completion criteria (falsifier).**

1. A fragment with `events: ['tool.use.pre']` + `substrate: 'harness'` type-checks; `enforcing(f)` is computable from it with no other input.
2. **The control fires:** a fragment declaring `events` WITHOUT `substrate` is a compile error. Observe the rejection before believing the constraint binds.
3. A fragment with no `events` still type-checks unchanged — every existing dimension value compiles untouched (`pnpm typecheck && pnpm typecheck:test && pnpm test` green).
4. `rg -n "enforcing"` shows the predicate derived at exactly one site.

**REJECTED if:** a second event union or a boolean `enforcing` field is introduced; `events` is made
required; `HookCell` is modified; or a mechanism/realization payload is emitted from S1.
