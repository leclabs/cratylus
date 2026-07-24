# S4 · adapter-barrel-split

**Objective.** Separate the two adapter kinds that currently share one barrel per harness. `claude/` and
`codex/` each export **both** an IR `Adapter` (`detect`/`read`/`write`) and a `HarnessAdapter`
(`agentDef`/`skillDef`/`hooks`) — two unrelated interfaces behind one import path, which is why deleting
the IR lineage appears to threaten the live projection.

**Inputs (pinned, exist at authoring).**

- `packages/agent-forge/src/adapters/claude/index.ts:82-83` — the package's own comment naming the split:
  the anatomy export is "the inversion's projection path, **distinct from the IR serialize path above**"
- `packages/agent-forge/src/adapters/codex/index.ts` — same dual shape
- `packages/agent-forge/src/adapters/registry/index.ts:11-12,25-28` — imports from those barrels; the
  projection registry holds exactly two entries, `claude` and `codex`
- `packages/agent-forge/src/core/harness-adapter.ts:38` — the `HarnessAdapter` interface
- `packages/agent-forge/src/core/adapter/types.ts:92` — the IR `Adapter` interface (~16 clients)

**Constraints.**

- Point the projection registry at the **anatomy modules directly**, not at the harness barrel. After
  this shard the registry must not transitively pull the IR adapter type.
- Preserve the `./adapters/*` package subpath contract; if the shape of that export changes, update the
  `exports` map and prove the built artifact resolves.
- Two interfaces named "adapter" is a signification collision that made this braid hard to see. Note any
  renaming that would help, but do **not** rename in this shard — a rename is a signify act with its own
  cold-derivation obligation, and mixing it into a structural split makes both unreviewable.

**Dependencies.** S3 (the serializer must already be extracted, or `claude/index.ts` still needs
`write.ts`).

**Outputs.** `adapters/registry/` importing only projection-side modules; the IR `Adapter` reachable only
from the IR lineage; each harness barrel exporting one kind, not two.

**Completion criteria (falsifier).** `rg -n "core/adapter" packages/agent-forge/src/adapters/registry/`
returns nothing, control proven; a dependency trace from `src/project/index.ts` reaches **no** module
under `core/{ir,engine,serialize,adapter}/`; full `pnpm test` green; the local dogfood still lands 10
agents / 15 skills / 3 hooks. REJECTED if the registry still resolves through a dual barrel; if the trace
is asserted from reading imports rather than actually traced; if an adapter is renamed here; or if the
`./adapters/*` subpath breaks for an installed consumer.
