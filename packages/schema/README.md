# @cratylus/schema

The shapes a corpus authors against, for [cratylus](../../README.md) — the dimension
meta-model as a TypeScript type system.

It sits at the **bottom of the dependency graph**. `canon` authors against it, `forge` validates and
projects against it, and it holds no opinion about either. What every package is for is
[ARCHITECTURE.md](../../ARCHITECTURE.md)'s; this README is for the author of a corpus.

This module is the contract and **only** the contract. It states that a dimension _has_ an axis, a
repertoire, an arity and a `required`, and derives an entire dimension type-system from any manifest
obeying that shape. It does **not** state which dimensions exist — that is the corpus's, and it
rides the plugin as `manifest`.

## Install

```bash
npm install @cratylus/schema
```

## Deriving a corpus's type system

A corpus declares its manifest once and reads its whole dimension type-system out of it:

```ts
import type { AgentOf, DimensionMeta } from '@cratylus/schema';

export const MANIFEST = {
  role: { axis: 'Persona', repertoire: 'open', arity: 'scalar' },
  guardrails: {
    axis: 'Constitution',
    repertoire: 'curated',
    arity: 'set',
    required: true,
  },
} as const satisfies Record<string, DimensionMeta>;

export type Dimension = keyof typeof MANIFEST;
export type Agent = AgentOf<typeof MANIFEST>;
```

`as const satisfies` is **load-bearing**. A plain `: Record<string, DimensionMeta>` annotation
widens the keys to `string`, which silently collapses every derivation to `string` and takes the
corpus's dimension typing with it.

`AgentOf<A>` reads arity and nullability off the manifest, so the three facts about a dimension —
is it multi-valued, may it be omitted, what is it called — are stated exactly once. A wrong
dimension→value or a wrong arity is a **compile error**: each value is a nominal-branded string
keyed to its dimension.

The axis is a `Genus`, one of `'Persona'` and `'Constitution'`; the repertoire says how the
dimension's values are sourced (`'latent'`, `'open'` or `'curated'`), and the arity says whether a
field holds one value (`'scalar'`) or many (`'set'`).

## Declaring a plugin

A package offers its corpus as an agent-plugin: the default export of `defineAgentPlugin`, an
identity factory, so a consumer addresses the plugin by the imported binding and never by a string
id.

```ts
import { fileURLToPath } from 'node:url';
import { defineAgentPlugin } from '@cratylus/schema';

const dir = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

export default defineAgentPlugin({
  name: 'acme',
  manifest: MANIFEST,
  events: ['session.start', 'turn.end'],
  fragments: dir('./dimensions'),
  agents: dir('./agents'),
  skills: dir('./skills'),
  hooks: dir('./hooks'),
});
```

`AgentPlugin` is a `Layout` (the four directories a projector scans: `fragments`, `agents`,
`skills` and `hooks`) plus what the plugin contributes: the `manifest`, the `events` vocabulary,
the `practices` it offers and the `plumbing` every practice is installed with. A plugin gives its
directories as absolute paths; [`@cratylus/canon`](../canon/README.md) shows one locating its own.

## What is here

| export                                                                  | what it is                                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `DimensionMeta` · `DimensionManifest` · `mergeManifest`                 | a dimension's metadata, the manifest shape, and the per-key merge        |
| `Genus` · `Repertoire` · `Arity`                                        | a dimension's axis, how its values are sourced, and one value or many    |
| `DimensionOf` · `SetDimensionOf` · `RequiredDimensionOf` · `AgentOf`    | generic derivations over any manifest                                    |
| `Value` · `Enforcing` · `Binding` · `enforcing` · `bodyOf` · `anchorOf` | a dimension value, bare or self-enforcing, and its α/residue split       |
| `Agent` · `Skill` · `SkillDeploy` · `SkillExpression` · `Mark`          | the cell shapes a corpus authors                                         |
| `JsonValue`                                                             | the data a skill's runtime face may carry as `configuration`             |
| `HookCell` · `RuleCell` · `hookIrOf` · `resolveWorker`                  | the doctrine-free source-cell kernel, and a worker's template resolution |
| `ProjectionFact` · `ProjectionFacts`                                    | the names of the facts a projector binds into a hook worker's template   |
| `AgentPlugin` · `Layout` · `defineAgentPlugin`                          | a package's plugin declaration                                           |
| `Practice` · `Plumbing` · `Agent.dispatches`                            | a way of working, its shared plumbing, and an agent's dispatch           |

An `Agent` also names, optionally, the `skills` it operates through, the role it `holds` and the
roles it `dispatches` to. The corpus's own fold copies the held role's anchor to `holds` because the
projector is blind to which dimension is the role; a harness keys its model routing by that anchor,
and a practice is closed under `dispatches`.

The `@cratylus/schema/hook` subpath carries the harness-agnostic event name (`EventName`), the
`Substrate` a constraint is realized on, the `Hook` wire shape, `NativeBinding`, and
`HarnessMechanism` and `HarnessWorker` — the realization payload for one enforcing constraint on one
harness. It imports nothing.

## A skill's runtime face

`SkillDeploy.runtime` names the runtime capability a skill is a face of and, optionally, the
`configuration` that capability receives: a `JsonValue`, with no opinion here about any
capability's keys. `deploy` gathers the `configuration`
from every skill of the resolved plugin set and emits it into the host runtime config keyed by
capability, beside the event vocabulary; the runtime's `loadRuntimeConfig` lifts it. Meaning a
capability needs therefore lives in the corpus and reaches the runtime as configuration, never as a
second copy spelled inside the runtime.

## No edge out

This package imports nothing. A capability's name is a plain `CapabilityName` string here; the closed
set is declared where a corpus declares its own vocabulary (`RUNTIME_CAPABILITIES` in
`packages/canon/src/manifest.ts`), and `SkillDeploy.runtime` is parameterized over it. The shape
belongs here, and the vocabulary belongs to the corpus that declares the members.
