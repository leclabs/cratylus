# @cratylus/canon

The **meaning** concern of [cratylus](../../README.md) — the canonical corpus of discovered
optimal-signifiers, authored as typed TypeScript.

The practice is [latent lexicography](../../VISION.md): describing the vocabulary a foundation model
already holds, rather than authoring prose and hoping it lands. An agent or skill in this corpus is
therefore not a prompt. It is a **dimension-selection vector** over signified values, and the
markdown a harness reads is a projection of these modules.

Canon is harness-agnostic **and** runtime-agnostic: it says what an agent _is_ and what a skill
_means_, never how either is carried.

## Install

```bash
npm install @cratylus/canon
```

The package's whole public surface is its default export — canon as an agent-plugin. A consumer
`extends` it from an `cratylus.config.ts` and projects it with
[`@cratylus/forge`](../forge/README.md):

```ts
import { defineConfig } from '@cratylus/forge/config';
import canon from '@cratylus/canon';

export default defineConfig({
  extends: [canon],
  patches: [],
});
```

Addressing is by **imported binding**, never a string id. That holds one level down too: an agent
cell imports each dimension value it selects, so composition is checked by the compiler rather than
resolved by a registry, and every part of a composite is traceable to its one home.

## What the plugin carries

| field       | what it is                                                                          |
| ----------- | ----------------------------------------------------------------------------------- |
| `manifest`  | **which dimensions exist** — 22, across the `Persona` / `Constitution` axes         |
| `fragments` | the dimension value modules, filed one per dimension directory                      |
| `agents`    | the agent vectors                                                                   |
| `skills`    | the skill cells — each a self-sufficient formal block plus the siblings it composes |
| `hooks`     | the hook cells, each carrying its verbatim worker payload                           |
| `preamble`  | the founding doctrine, emitted above every projected agent body                     |

Canon owns the catalog because a dimension is **constitutive**: declaring one makes it part of that
corpus's agent design. The manifest rides the plugin rather than living in the projector, so a
consumer can extend this design — or add a dimension to it — without editing the tool that renders
it. The shapes those cells are authored against are [`@cratylus/schema`](../schema/README.md)'s.

The preamble rides the plugin for the same reason: the first principle
(`dimensions/engineering-principles/cratylism.ts`) is intrinsic to the projected bytes, so it
survives deployment into a foreign repository rather than depending on ambient context.

Because the plugin object loses its package-root provenance when a consumer imports it, the
directory fields are resolved against `import.meta.url` at definition time and consumed verbatim.

## Dependencies, stated plainly

`@cratylus/schema` for the cell shapes, and `@cratylus/forge` at the plugin entry for
`defineAgentPlugin`. Canon reaches the projector as **data** — the corpus is passed to it as a
plugin — and no cell imports it.

One cell does import the runtime: `hooks/memory-consolidation-nudge.ts` takes `CLI_BIN` from
`@cratylus/runtime/bin-name`, because it emits shell that invokes that binary and the alternative is
repeating the literal inside a compiler-invisible string. This breaches the architecture's
highest-ranked property — meaning and mechanism never referencing each other — and a test currently
requires the breach. It is recorded in [ARCHITECTURE.md](../../ARCHITECTURE.md), not explained away.

## Tests

`pnpm --filter @cratylus/canon test` builds first, deliberately: the suite drives the shipped
`cratylus project` over this repository's own config, which extends this package's `dist`.
