# @cratylus/schema

The shapes a corpus authors against, for [cratylus](../../README.md) — the dimension
meta-model as a TypeScript type system.

It sits at the **bottom of the dependency graph**. `canon` authors against it, `forge` validates and
projects against it, and it holds no opinion about either. Extracting it is what let meaning and
projection stop depending on each other.

This module is the contract and **only** the contract. It states that a dimension _has_ an axis, a
kind, an arity and a `required`, and derives an entire dimension type-system from any manifest
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
  role: { axis: 'Persona', kind: 'open', arity: 'scalar' },
  guardrails: {
    axis: 'Constitution',
    kind: 'curated',
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

## What is here

| export                                                                  | what it is                                                         |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `DimensionMeta` · `DimensionManifest` · `mergeManifest`                 | a dimension's metadata, the manifest shape, and the per-key merge  |
| `DimensionOf` · `SetDimensionOf` · `RequiredDimensionOf` · `AgentOf`    | generic derivations over any manifest                              |
| `Value` · `Enforcing` · `Binding` · `enforcing` · `bodyOf` · `anchorOf` | a dimension value, bare or self-enforcing, and its α/residue split |
| `Agent` · `Skill` · `SkillDeploy` · `SkillExpression` · `Mark`          | the cell shapes a corpus authors                                   |
| `HookCell` · `RuleCell` · `hookIrOf`                                    | the doctrine-free source-cell kernel                               |

The `@cratylus/schema/hook` subpath carries the harness-agnostic lifecycle-event vocabulary
(`CanonicalEvent`, `Substrate`, `SubstrateEvent`), the `Hook` wire shape, and `HarnessMechanism` —
the realization payload for one enforcing constraint on one harness. It imports nothing.

## One honest edge

`src/index.ts` imports `@cratylus/runtime` — an edge the architecture's graph does not draw:

```ts
import type { RuntimePlugin } from '@cratylus/runtime';
export type RuntimeCapability = keyof Omit<RuntimePlugin, 'name'>;
```

What it consumes is a **vocabulary** (`'memory' | 'eventTap'`), not a shape, and `shape ⊥ vocabulary`
already rules against that fusion elsewhere in the model. The edge is type-only and used in exactly
one place — `SkillDeploy.runtime`. It is **ratcheted, never licensed**: pinned by
`canon/test/architecture.test.ts` so it cannot silently grow, with the resolution filed as
`plans/decomplect/ready/t-runtime-capability-vocabulary.md`.
