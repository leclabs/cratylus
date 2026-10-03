# @cratylus/canon

The **meaning** concern of [cratylus](../../README.md) — the canonical corpus of discovered
optimal-signifiers, authored as typed TypeScript.

The discipline is [latent lexicography](../../VISION.md): describing the vocabulary a foundation model
already holds, rather than authoring prose and hoping it lands. An agent or skill in this corpus is
therefore not a prompt. It is a **dimension-selection vector** over signified values, and the
markdown a harness reads is a projection of these modules.

Canon is harness-agnostic **and** runtime-agnostic: it says what an agent _is_ and what a skill
_means_, never how either is carried. What every package is for is
[ARCHITECTURE.md](../../ARCHITECTURE.md)'s; installing the corpus on a machine, and choosing among
its practices, is [the `cratylus` README](../cli/README.md)'s. This README is for the author of a
corpus, or of a plugin that extends this one.

## Using it

```bash
npm install cratylus @cratylus/canon
```

The package's whole public surface is its default export — canon as an agent-plugin. A consumer
`extends` it from a `cratylus.config.ts` and projects it with the `cratylus` command:

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

| field       | what it is                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| `manifest`  | **which dimensions exist** — 22, across the `'Persona'` and `'Constitution'` axes                    |
| `events`    | **which lifecycle events exist** — the corpus's harness-agnostic event vocabulary                    |
| `fragments` | the dimension value modules, filed one per dimension directory                                       |
| `agents`    | the agent vectors                                                                                    |
| `skills`    | the skill cells — each a self-sufficient formal block plus the siblings it composes                  |
| `hooks`     | the hook cells, each carrying its verbatim worker payload                                            |
| `practices` | **which ways of working exist** — each an installable choice, declared as data in `src/practices.ts` |
| `plumbing`  | what every practice is installed with and none is offered as, declared beside them                   |

Canon owns the catalog because a dimension is **constitutive**: declaring one makes it part of that
corpus's agent design. The manifest rides the plugin rather than living in the projector, so a
consumer can extend this design — or add a dimension to it — without editing the tool that renders
it. The shapes those cells are authored against, and `defineAgentPlugin` that declares the plugin,
are [`@cratylus/schema`](../schema/README.md)'s.

## The agents

The plugin carries eight agents. `architect`, `planner`, `implementer`, `assayer` and `integrator`
are the generic holders of their roles: each is named for the role it holds, the role cell
(`src/roles/`) states the description, archetype and mark that holder carries along with the
dimension values every holder is expected to select, and `agents/<role>.ts` says only which role it
holds with `holds(role)`.

mav, nico and kino are personas over the architect role: each is an agent named as an individual, and
declares a description, an archetype and a mark of its own beside whatever dimension values it adds.
An aspect it states overrides a scalar the role supplies and extends a set, and it never states the
role itself, since the contract is the role's. `holds` refuses, when the cell is defined, an
individual agent with no archetype or mark of its own, one whose mark is its role's, and an agent
named for its role that declares anything beyond it. The architect role also states which roles its
holders dispatch to, and the `holds` fold copies that to `Agent.dispatches`.

## The first principle

The first principle (`dimensions/engineering-principles/cratylism.ts`) is not stamped on every cell.
It rides only the cells whose laws apply it: the ten skills that name concepts by anchor, optimal
sign or cold decode set it as their `preamble`, and an agent carries it once, through the
engineering-principles of the role it holds, where that role states it. A cell that does not use it
never holds a host's own authored surfaces to this corpus's naming axiom. The axiom is scoped: the
cold-decode oracle decides signs only for the corpus's core agent dimension names and values, the
terminology it was built to discover. Every other term is the industry's own, used as the industry
understands it, and no consumer surface is held to the oracle. It is intrinsic to those cells'
projected bytes, so it survives deployment into a foreign repository rather than depending on
ambient context.

Because the plugin object loses its package-root provenance when a consumer imports it, the
directory fields are resolved against `import.meta.url` at definition time and consumed verbatim.

## Dispatch return contracts

Each delegation invocation owns its return schema; role defaults do not define the caller's contract. The omp adapter can pass a native per-call strict schema and consume its parsed structured result. Claude Code carries the caller's schema and conforming-return instruction in the available Agent call instructions, which is the highest-fidelity projection available but does not provide machine-enforced per-call schema validation. A nonconforming return is not a valid route or verdict. Claude's print-mode `--json-schema` option does not establish enforcement for native Agent calls. Repository tests prove contract construction and skill projection, not external harness validation.

## Dependencies, stated plainly

`@cratylus/schema` for the cell shapes and for `defineAgentPlugin`, which declares the plugin at its
entry. Canon reaches the projector as **data** — the corpus is passed to it as a plugin — and no
cell imports it.

No cell imports the runtime either. A skill names the capability it routes to — one of `eventTap`,
`design`, `plan` and `note`, the four built into the runtime — as `runtime: { capability: … }`,
never its implementation, and a cell that emits shell invoking the binary carries it as a fact the
projector substitutes at emission. That is the architecture's highest-ranked property — meaning
and mechanism never referencing each other — and [ARCHITECTURE.md](../../ARCHITECTURE.md) records
how it came to hold.
