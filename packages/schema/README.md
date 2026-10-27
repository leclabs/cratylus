# @cratylus/schema

The shapes [cratylus](../../README.md)'s canon is written against — its factors, their values,
terms and corrections, hook declarations and plugin — as a TypeScript type system.

It sits at the **bottom of the dependency graph**. `canon` is written against it, `forge` validates
and projects against it, and it holds no opinion about either. Installing and using cratylus is
[the `cratylus` README](../cli/README.md)'s; this README is for whoever works on the canon or on
the projector.

This module is the contract and **only** the contract. It states that a factor _has_ a group, a
repertoire, an arity, a default enforcement level and a projection, and derives an entire factor
type-system from any manifest obeying that shape. It does **not** state which factors exist —
that is the canon's, and it rides the plugin as `manifest`.

## Deriving the canon's type system

The canon declares its manifest once (`packages/canon/src/manifest.ts`) and reads its whole
factor type-system out of it. In outline:

```ts
import type { AgentOf, FactorMeta } from '@cratylus/schema';

export const MANIFEST = {
  role: {
    group: 'Identity',
    repertoire: 'open',
    arity: 'scalar',
    level: 'fixed',
    projection: 'text',
  },
  model: {
    group: 'Cognition',
    repertoire: 'curated',
    arity: 'slots',
    level: 'firm',
    projection: 'binding',
    slots: [{ name: 'tier' }, { name: 'effort' }],
  },
  guardrails: {
    group: 'Governance',
    repertoire: 'curated',
    arity: 'set',
    level: 'fixed',
    projection: 'text',
    required: true,
  },
} as const satisfies Record<string, FactorMeta>;

export type Factor = keyof typeof MANIFEST;
export type Agent = AgentOf<typeof MANIFEST>;
```

`as const satisfies` is **load-bearing**. A plain `: Record<string, FactorMeta>` annotation
widens the keys to `string`, which silently collapses every derivation to `string` and takes the
canon's factor typing with it.

`AgentOf<A>` gives every factor whose arity is not `'attribute'` one field, named in camelCase,
holding a list of `Entry` — `{ value, level, slot?, note? }`: the catalog value, the enforcement
level it holds at, the slot it fills and a qualifier the design states. An explicitly empty
factor is `[]`. A wrong factor→value is a **compile error**: each value is a nominal-branded
string keyed to its factor.

The group files a factor; groups are ordered by first appearance and the projected text has one
section each. The repertoire says how the factor's values are sourced (`'latent'`, `'open'`,
`'curated'`, or `'fixed'` — a closed list the design fixes). The arity says whether a field holds one
value (`'scalar'`), many (`'set'`), one per named `Slot` (`'slots'`), or is no field at all but an
attribute of other values (`'attribute'`). The level is the `EnforcementLevel` (`'advisory'`,
`'firm'` or `'fixed'`) an entry takes by default, `null` when none applies. The projection says
whether the factor is rendered as `'text'` or compiled to harness settings (`'binding'`).
`required` forbids holding the factor empty.

## The canon as a plugin

[`@cratylus/canon`](../canon/README.md)'s default export is the canon as an `AgentPlugin`, made with
`defineAgentPlugin`, an identity factory: the `cratylus` command is built with that one plugin, and
the projector reads it by the imported binding, never by a string id.

`AgentPlugin` is a `Layout` (the four directories the projector scans: `factors`, `agents`,
`skills` and `hooks`) plus what the canon contributes: the `manifest`, the `events` vocabulary,
the `rulesets` it offers and the `practiceRulesets` installed with its agents. Canon gives its directories as absolute paths, located against its
own module.

## What is here

| export                                                                                           | what it is                                                                                                                  |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `FactorMeta` · `FactorManifest` · `ManifestDeclaring` · `mergeManifest`                          | a factor's metadata, the manifest shape, a plugin as the merge sees one, and the per-key merge                              |
| `Repertoire` · `Arity` · `Slot` · `EnforcementLevel` · `Entry`                                   | how values are sourced, how many a field holds, and one held value                                                          |
| `FactorOf` · `SetFactorOf` · `RequiredFactorOf` · `FieldFactorOf` · `FactorFieldsOf` · `AgentOf` | generic derivations over any manifest                                                                                       |
| `KebabToCamel` · `kebabToCamel` · `FactorFieldName`                                              | a factor's name to the field it occupies, at the type level and at runtime                                                  |
| `Value` · `Enforcing` · `Binding` · `enforcing` · `isFactorValue` · `bodyOf` · `termOf`          | a factor's value, bare or self-enforcing, and its term/correction split                                                     |
| `Agent` · `factorValueOf` · `AgentContract` · `JsonSchema`                                       | the agent shape, a factor field read off it, and its typed handoff                                                          |
| `Skill` · `SkillDeploy` · `SkillExpression` · `CapabilityName`                                   | the skill shape and the runtime capability it may be a face of                                                              |
| `Mark` · `markToColor`                                                                           | an agent's emoji·hue mark, and its hue as a terminal color                                                                  |
| `JsonValue`                                                                                      | the data a skill's runtime face may carry as `configuration`                                                                |
| `HookDeclaration` · `HookSource` · `HookWorker` · `HookMessage` · `HookSubstrate` · `EventName`  | the doctrine-free hook declaration, its config-IR entry, its worker payload, the speech it carries, its substrate and event |
| `hookIrOf` · `resolveWorker`                                                                     | a declaration's lift to the hook config-IR, and a worker's template resolution                                              |
| `ProjectionFact` · `ProjectionFacts`                                                             | the names of the facts a projector binds into a hook worker's template                                                      |
| `AgentPlugin` · `Layout` · `defineAgentPlugin`                                                   | the canon's plugin declaration                                                                                              |
| `Rule` · `Ruleset`                                                                               | a rule and why it holds, and a named set of rules offered together                                                          |

An `Agent`'s identity face is its `name`, `description`, `mark` and a reserved `key` (always
`null`), and optionally the role it `holds`, its model `routing` (`{ tier, effort }`), its typed
handoff `contract`, the `skills` it operates through and its `isolation`. The canon's own fold
copies `holds`, `routing` and `contract` from its factors, because the projector is blind to which
factor is which; a harness binds model routing per agent. `skills` and `isolation` are not factors:
a canon states them on the agent itself, and cratylus's own canon sets neither.

The `@cratylus/schema/hook` subpath carries the harness-agnostic event name (`EventName`), the
`Substrate` a constraint is realized on, the `Hook` wire shape, `NativeBinding`, and
`HarnessMechanism` and `HarnessWorker` — the realization payload for one enforcing constraint on one
harness. It imports nothing.

## A skill's runtime face

`SkillDeploy.runtime` names the runtime capability a skill is a face of and, optionally, the
`configuration` that capability receives: a `JsonValue`, with no opinion here about any
capability's keys. `install` gathers the `configuration`
from every skill of the resolved plugin set and emits it into the host runtime config keyed by
capability, beside the event vocabulary; the runtime's `loadRuntimeConfig` lifts it. Meaning a
capability needs therefore lives in the canon and reaches the runtime as configuration, never as a
second copy spelled inside the runtime.

## No edge out

This package imports nothing. A capability's name is a plain `CapabilityName` string here; the closed
set is declared where the canon declares its own vocabulary (`RUNTIME_CAPABILITIES` in
`packages/canon/src/manifest.ts`), and `SkillDeploy.runtime` is parameterized over it. The shape
belongs here, and the vocabulary belongs to the canon that declares the members.
