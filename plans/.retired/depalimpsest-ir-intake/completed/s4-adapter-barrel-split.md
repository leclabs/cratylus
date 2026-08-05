# S4 · adapter-barrel-split

**Objective.** Separate the two adapter kinds that currently share one barrel per harness. `claude/` and
`codex/` each export **both** an IR `Adapter` (`detect`/`read`/`write`) and a `HarnessAdapter`
(`agentDef`/`skillDef`/`hooks`) — two unrelated interfaces behind one import path, which is why deleting
the IR lineage appears to threaten the live projection.

**Inputs (pinned, exist at authoring).**

- `packages/forge/src/adapters/claude/index.ts:82-83` — the package's own comment naming the split:
  the anatomy export is "the inversion's projection path, **distinct from the IR serialize path above**"
- `packages/forge/src/adapters/codex/index.ts` — same dual shape
- `packages/forge/src/adapters/registry/index.ts:11-12,25-28` — imports from those barrels; the
  projection registry holds exactly two entries, `claude` and `codex`
- `packages/forge/src/core/harness-adapter.ts:38` — the `HarnessAdapter` interface
- `packages/forge/src/core/adapter/types.ts:92` — the IR `Adapter` interface (~16 clients)

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

**Completion criteria (falsifier) — measured at HEAD before authoring, per "run the falsifier first".**

The two falsifiers originally written here were **vacuous**, and are replaced:

- ~~`rg -n "core/adapter" src/adapters/registry/`~~ — returns **0 at HEAD**. The registry imports
  `../claude/index.js`; the IR reach is **transitive through the barrel**, and a substring grep cannot
  see it. This is the exact error the plan's wave-0 note warns about.
- ~~a trace from `src/project/index.ts`~~ — reaches **13 modules, 0 IR-lineage at HEAD**. The projection
  core takes `HarnessAdapter` as an **injected parameter** (`project/index.ts:26,51`) and never imports
  the registry, so it is already decoupled. Anchoring here measures nothing.

**The real measurement — reachability from the registry, which is what actually braids:**

| entry (at HEAD)                  | modules reached | IR-lineage reached                  |
| -------------------------------- | --------------- | ----------------------------------- |
| `src/adapters/registry/index.ts` | 69              | **26**                              |
| `src/cli/commands/project.ts`    | 79              | **26** (inherited via the registry) |
| `src/project/index.ts`           | 13              | 0 (already clean)                   |

**PASS** ⇔ the transitive relative-import closure from `src/adapters/registry/index.ts` contains **zero**
modules under `core/{ir,engine,serialize,adapter}/` — i.e. **26 → 0** — and the closure from
`src/cli/commands/project.ts` likewise drops to 0. Report both before/after counts. The walker must be
demonstrated live by a control that still reaches the IR lineage from a known IR consumer
(`src/core/adapter/types.ts` reaches 2).

Plus: full `pnpm test` green (`turbo --force`, report cached count); the local dogfood still lands 10
agents / 15 skills / 3 hooks with `settings.json` byte-identical.

REJECTED if the registry still resolves through a dual barrel; if the claim rests on a substring grep
rather than a traced closure; if the control walk is not shown to reach the IR lineage today; if an
adapter is renamed here; or if the `./adapters/*` subpath breaks for an installed consumer.
