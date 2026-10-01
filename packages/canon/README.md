# @cratylus/canon

The **meaning** concern of [cratylus](../../README.md) — the canonical corpus of discovered
optimal-signifiers, authored as typed TypeScript.

The discipline is [latent lexicography](../../VISION.md): describing the vocabulary a foundation model
already holds, rather than authoring prose and hoping it lands. An agent or skill in this corpus is
therefore not a prompt. It is a **dimension-selection vector** over signified values, and the
markdown a harness reads is a projection of these modules.

Canon is harness-agnostic **and** runtime-agnostic: it says what an agent _is_ and what a skill
_means_, never how either is carried.

## Install

```bash
npm install cratylus @cratylus/canon
```

The package's whole public surface is its default export — canon as an agent-plugin. A consumer
`extends` it from a `cratylus.config.ts` and projects it with the `cratylus` command, whose
[README](../cli/README.md) documents each command:

```ts
import { defineConfig } from 'cratylus';
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
| `practices` | **which ways of working exist** — each an installable choice, declared as data      |
| `plumbing`  | what every practice is installed with and none is offered as                        |

Canon owns the catalog because a dimension is **constitutive**: declaring one makes it part of that
corpus's agent design. The manifest rides the plugin rather than living in the projector, so a
consumer can extend this design — or add a dimension to it — without editing the tool that renders
it. The shapes those cells are authored against are [`@cratylus/schema`](../schema/README.md)'s.

A **practice** is a way of working this corpus offers as one installable choice: the agents, skills
and hooks that carry it, installed together. `src/practices.ts` declares four — `cdd` (concept-driven
development, the one a fresh install preselects), `corpus-authoring`, `film-production` and `carry-on` —
each with a one-line description written for a consumer, and the plumbing, the event tap and the
session-wide drift notice, that every practice is installed with and none is offered as. A practice
is closed under skill composition and agent dispatch: it lists the agents its agents dispatch to, and
the dispatch relation is data (`Agent.dispatches`, copied by the `holds` fold from the role cell's
`dispatches`), so projection refuses a chosen set that places a dispatcher without the roles it
dispatches. A guard is listed nowhere: it is registered when a rendered agent composes what it binds.

The first principle (`dimensions/engineering-principles/cratylism.ts`) is not stamped on every cell.
It rides only the cells whose laws apply it: the ten skills that name concepts by anchor, optimal
sign or cold decode set it as their `preamble`, and an agent carries it once, through the
engineering-principles of the role it holds. A cell that does not use it never holds a host's own
authored surfaces to this corpus's naming axiom. The axiom is scoped: the cold-decode oracle decides
signs only for the corpus's core agent dimension names and values, the terminology it was built to
discover. Every other term is the industry's own, used as the industry understands it, and no
consumer surface is held to the oracle. It is intrinsic to those cells' projected bytes, so
it survives deployment into a foreign repository rather than depending on ambient context.

Because the plugin object loses its package-root provenance when a consumer imports it, the
directory fields are resolved against `import.meta.url` at definition time and consumed verbatim.

## Dependencies, stated plainly

`@cratylus/schema` for the cell shapes, and `@cratylus/forge` at the plugin entry for
`defineAgentPlugin`. Canon reaches the projector as **data** — the corpus is passed to it as a
plugin — and no cell imports it.

No cell imports the runtime either. A skill names the capability it routes to — one of `eventTap`,
`design`, `plan` and `note`, the four built into the runtime — as `runtime: { capability: … }`,
never its implementation, and a cell that emits shell invoking the binary carries it as a fact the
projector substitutes at emission. That is the architecture's highest-ranked property — meaning
and mechanism never referencing each other — and [ARCHITECTURE.md](../../ARCHITECTURE.md) records
how it came to hold.

## Tests

`pnpm --filter @cratylus/canon test` builds first, deliberately: the suite drives the shipped
`cratylus project` over this repository's own config, which extends this package's `dist`.
