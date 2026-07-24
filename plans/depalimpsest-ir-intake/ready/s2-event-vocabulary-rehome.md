# S2 · event-vocabulary-rehome

**Objective.** Move the canonical lifecycle-event vocabulary (`CanonicalEvent`) and the `Hook` shape out
of `core/ir/` into a home the surviving pipeline owns, carrying their JSON schema and generator with
them. This vocabulary is worth keeping — ten adapters map it — but it is currently parked inside the
lineage being excised, so the excision cannot proceed until it is rehomed.

**Inputs (pinned, exist at authoring).**

- `packages/agent-forge/src/core/ir/generated.ts:9` — `CanonicalEvent`, **generated, not hand-authored**
- `packages/agent-forge/src/core/schema/hook.schema.json` — the generator's source of truth
- `packages/agent-forge/src/core/scripts/generate-types.ts` — the generator (`pnpm gen`)
- `packages/agent-forge/src/core/harness-adapter.ts:16,50` — `Hook` import; `hooks?(hooks: readonly Hook[])`
- `packages/agent-forge/src/anatomy/hook-cell.ts:24,98` — `CanonicalEvent`/`Hook` import; `hookIrOf()`
- `packages/agent-forge/src/project/index.ts:230` — the **live** call site of `hookIrOf`
- `packages/agent-forge/src/adapters/*/events.ts` — the ten consumers mapping `CanonicalEvent`

**Constraints.**

- The **generator travels with the type.** `CanonicalEvent` is generated from the schema; rehoming the
  emitted `.d.ts` while leaving the generator behind reintroduces a generated artifact whose source is in
  a deleted tree. `pnpm gen` must still regenerate the type in its new home.
- `generated-banner-absence is a trap` — do not hand-edit the emitted file. Move schema + generator, then
  regenerate and confirm the output is byte-equivalent modulo its new path.
- The event vocabulary is **harness-agnostic canon**, not a Claude detail; its new home must not sit
  inside a harness adapter.
- Do not delete anything from `core/ir/` in this shard — S6 owns deletion. This shard only rehomes.

**Dependencies.** None. Wave 0.

**Outputs.** `CanonicalEvent` + `Hook` in a home outside `core/ir/`, with their schema and generator;
`harness-adapter.ts` and `hook-cell.ts` retyped against the new home; all ten `adapters/*/events.ts`
importing from it; `pnpm gen` regenerating in place.

**Completion criteria (falsifier).** `pnpm gen` regenerates the vocabulary at its new path and the tree
stays green; `rg -n "core/ir" packages/agent-forge/src/{anatomy,project}/` returns nothing, control
proven; full `pnpm test` green; and a real local dogfood — `project` → `deploy` into a temp `HOME` —
lands **3 hooks** with a `settings.json` byte-identical to the pre-shard output. REJECTED if the emitted
type is copied without its schema+generator; if the type is hand-edited; if the vocabulary lands inside
`adapters/claude/`; if `settings.json` changes by so much as ordering; or if hook count drops.
