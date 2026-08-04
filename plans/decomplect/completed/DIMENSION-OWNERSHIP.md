# The dimension catalog belongs to the corpus — DONE

> **Oracle note:** the render hash cited below is the one verified when this shard landed. It moved
> to `fe084dd1…` at `a2205eb`, which changed the founding doctrine riding into every SOUL. Do not
> check this retired hash against today's tree.

> **LANDED** `29f1185` · `045485d` · `b903c75` · `fb944d2`. The completion criterion below was met:
> a `tempo` dimension was added to canon's `ANATOMY`, given one value module, composed into `nico`,
> and projected — **0 files touched in `agent-forge`** — appearing as `## Tempo` with its body in
> BOTH the claude SOUL and the codex TOML. Reverted; render hash returned to
> `9055e88b6c4679e44fb5ccb73371b9d539d1d6a8`, byte-identical throughout all four steps.
>
> Two things the executing agents surfaced that this spec had missed, both now fixed:
> `discoverPluginFragments` and `bindingsOf` were catalog readers absent from the per-file table —
> either left behind would have been the half-parameterizing hazard, an out-of-catalog dimension
> binding nothing while its SOUL section still printed. And `agentBody`'s default covered the
> adapters by HIDING them, so `ctx.anatomy` would have dead-ended at the port.
>
> Retained below as the record of how it was done.

# Original spec

> Working handle, **not** an anchor. Reader = LLM. Every measurement below was taken, not estimated;
> re-measure only what the tree has since changed.

## Where this stands

`ANATOMY` is the SINGLE source of the dimension set (`b8e8c7b`): `Dimension`, `SetDimension`,
`DIMENSION_FIELD` and the `Agent` fields all derive from it, and `guardrails`' non-nullability is
`required: true` catalog data rather than a hand-written exception. Four hand-kept copies are gone.

**What remains is ownership.** That source still lives in `agent-forge`, so a corpus cannot discover
a dimension without editing the projector — the thesis inverted at its most load-bearing point.

## The seam

- **forge owns the META-MODEL**: that a dimension HAS an `axis`, `kind`, `arity`, `required`, and all
  machinery that operates on any catalog obeying that shape.
- **the corpus owns the INSTANCE**: WHICH dimensions exist, and each one's metadata.

A projector that knows there are exactly 22 dimensions named these 22 things is not projecting a
design — it contains one.

**The catalog rides the PLUGIN.** `defineAgentPlugin` already carries `fragments` · `agents` ·
`skills` · `hooks` · `preamble`, and `preamble`'s own comment states the principle: _"the axiom rides
the PLUGIN, so it survives projection by any consumer."_ The catalog is the same kind of thing.
Do not invent a second delivery mechanism.

## Step 1 was EXECUTED, verified, and reverted — it is proven, not hoped

The whole spec rests on one claim: forge can drop to `O extends string` without losing anything that
matters. That was run, not reasoned about. `O extends Dimension` → `O extends string`, **7 sites** in
`anatomy/index.ts`, then:

| check                                              | result                                          |
| -------------------------------------------------- | ----------------------------------------------- |
| `tsc` (src + tests)                                | clean, 8/8 and 7/7 tasks                        |
| full suite                                         | 216 forge · 152 canon · 255 memory · 52 runtime |
| cross-dimension assignment (`Guardrails` → `Role`) | **still refused**                               |
| guardrails catch-all (property missing)            | **still refused**                               |
| `Value<'guardrials'>` (misspelled dimension)       | **compiles** — the one measured cost            |

Reverted afterwards, so the tree is unmodified: landing step 1 alone would carry the typo gap with no
offsetting benefit until step 4, and would leave a reader unable to tell a half-migrated tree from a
finished one. Re-apply it as step 1 proper; it takes one `sed` and is known green.

## Two facts established by measurement — do not re-derive

**1. The brand discriminates by type ARGUMENT, not by the constraint.**
`Fragment<O> = string & { readonly __dimension?: O }`. Verified directly: assigning a
`Fragment<'guardrails'>` to a `Role` fails with _"Types of property `__dimension` are
incompatible"_, while a fresh string literal assigns freely (which is how canon authors
``const honesty: Guardrails = `honesty` ``).

**Consequence:** relaxing forge's constraint from `O extends Dimension` to `O extends string`
preserves every value-level guarantee — confirmed above, both the cross-dimension refusal and the
guardrails catch-all survive it. The ONLY property lost is typo-catching: `Value<'guardrials'>`
compiles inside forge, measured. Canon's own catalog restores it, because canon derives its `Dimension`
from its own `ANATOMY`. State this in the code, or a later reader will "restore safety" by dragging
the union back into forge.

**2. Forge's internals are already structural.** `project/index.ts` uses `Value<Dimension>` and
`Enforcing<Dimension>` to mean _"a value of ANY dimension"_ — never a specific one. Nothing in forge
branches on a dimension's identity. That is why this refactor is tractable.

## The blast radius, counted

|                                                      | count | nature                                |
| ---------------------------------------------------- | ----- | ------------------------------------- |
| forge files naming `Dimension`                       | 10    | the design work, itemised below       |
| canon files importing `@leclabs/agent-forge/anatomy` | 178   | mechanical import rewrite, one script |
| new canon modules                                    | 1     | `src/anatomy.ts`                      |

The 178 is the intimidating number and the easy half.

## Forge changes, per file

| file                                 | refs | change                                                                                                                                                                                                                                                        |
| ------------------------------------ | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `anatomy/index.ts`                   | 28   | relax `O extends Dimension` → `O extends string`; export `DimensionMeta`, `Anatomy`, `defineAnatomy`; move `ANATOMY`/`DIMENSION_NAMES` OUT; keep the derivations as generic helpers (`AgentOf`, `SetDimensionOf`, `RequiredDimensionOf`, `DimensionFieldsOf`) |
| `catalog/index.ts`                   | 18   | `enumerateCatalog(dir)` → `enumerateCatalog(dir, anatomy)`. It already takes the dir as a param and calls itself doctrine-agnostic — this finishes that sentence                                                                                              |
| `core/exemplify/vector.ts`           | 17   | thread `anatomy` through the plan builders                                                                                                                                                                                                                    |
| `anatomy/project-human.ts`           | 13   | `projectHumanDimension(doc, anatomy)` — reads meta for the genus line                                                                                                                                                                                         |
| `core/exemplify/dimension-fields.ts` | 9    | `DIMENSION_FIELD` → `dimensionFieldsOf(anatomy)`; `enforcingValuesOf(a, anatomy)`                                                                                                                                                                             |
| `project/index.ts`                   | 7    | `Value<string>` structurally; resolve the set's anatomy and thread it                                                                                                                                                                                         |
| `core/exemplify/index.ts`            | 5    | re-export surface only                                                                                                                                                                                                                                        |
| `core/anatomy-body.ts`               | 4    | `agentBody(a, anatomy)` — it iterates `DIMENSION_NAMES` for section order                                                                                                                                                                                     |
| `anatomy/anatomy.test-d.ts`          | 2    | type tests move to canon's derived types                                                                                                                                                                                                                      |
| `adapters/claude/anatomy.ts`         | 1    | comment only — but see the port change below                                                                                                                                                                                                                  |

**Port change.** `agentBody` needs the catalog, and adapters call it. So
`HarnessAdapter.agentDef(agent, mechanisms?)` becomes `agentDef(agent, ctx)` with
`ctx: { anatomy, mechanisms? }`. One signature, both adapters, no new concept.

## Multi-plugin resolution

Plugins compose, so two may declare a catalog. **Merge in `extends` order, later wins per dimension
key, and LOG every override** — the exact semantics `resolve` already uses for fragments
(`override agent <n>: <a> → <b>`). This is not a tie-break detail: it is what lets a CONSUMER add a
dimension without forking canon, which is the whole point of the refactor. A first cut that refused
two catalogs would ship the inversion again one layer up.

## Order of execution — each step lands green on its own

1. **Relax the constraint.** `O extends Dimension` → `O extends string` throughout forge, `ANATOMY`
   staying put. Nothing moves yet. `tsc` + suite + both renders byte-identical.
2. **Inject the catalog into the readers.** Give every function in the table above its `anatomy`
   parameter, defaulting to the still-resident `ANATOMY`. Still nothing moved; every call site now
   _can_ be told. Suite green, renders byte-identical.
3. **Add `anatomy` to `AgentPlugin`** + the merge-and-log resolution. `projectPluginSet` resolves it
   and threads it. Canon does not supply one yet, so the default still wins. Renders byte-identical.
4. **Move the catalog.** Create `packages/agent-canon/src/anatomy.ts`: the `ANATOMY` const plus its
   derived `Dimension`, `Agent`, `Value<D>` and the 22 aliases. Canon's plugin declares it. Delete
   `ANATOMY`/`DIMENSION_NAMES` from forge — **delete, never deprecate**; a surviving default is a
   second home and the drift starts the day it is left behind.
5. **Rewrite the 178 imports.** `@leclabs/agent-forge/anatomy` → canon's `src/anatomy.js` for the
   type-only dimension imports. Scripted, then `tsc`. Forge's own exports (`Enforcing`, `Skill`,
   `HookCell`, …) stay where they are — rewrite only what the new module owns.
6. **Prove it empirically** (below).

Steps 1–3 are reversible and byte-neutral; the commit boundary that matters is 4+5, which must land
together. Half-parameterizing is the standing hazard: the half that still works produces plausible
output masking the half that does not.

## Completion criterion — empirical, not a green suite

Add a throwaway dimension to canon's `ANATOMY`, give it one value module and compose it into one
agent, then project **with zero edits to `agent-forge`**. The dimension must appear as a `##` section
in both the claude SOUL and the codex `developer_instructions`. Then remove it and confirm both
renders return byte-identical.

A passing suite proves only that nothing broke; this proves the ownership actually moved.

## Hazards, each with its mechanism

- **The guardrails catch-all must keep convicting, on BOTH legs** — the property MISSING and the
  property NULL. Verify the verifier first: a loose file under `src/` is not in the build's include
  set, so `tsc` silently compiles nothing and reports success. Confirmed the hard way; test with a
  deliberately-broken control (`const x: number = "nope"`) before trusting any negative here.
- **Both renders are the regression oracle.** Nothing about ownership may change an emitted byte.
  Check `git status --short` on `.render-ts` and `.render-ts-codex` after every step.
- **Do not re-tighten forge's constraint.** `O extends string` will look like lost safety to a later
  reader. The typo-catching lives in canon now, by construction.
- **`isDimensionValue` is shape-checked, not truthy-checked**, and the catalog scan depends on it.
  Widening the constraint must not tempt a rewrite here.
- **`satisfies Record<string, DimensionMeta>` is load-bearing** on the moved const: it preserves the
  literal key types every derivation reads. A plain annotation instead of `satisfies` widens the keys
  to `string` and silently collapses `Dimension` to `string` corpus-wide.

## What this does NOT cover

`CanonicalEvent` (B9) is the same defect in the lifecycle vocabulary — the harness-neutral event
taxonomy IS the ideal design and belongs to canon, with forge keeping only the per-harness maps. Its
header already argues _"This is canon, not a Claude detail."_ Same seam, same shape of fix, separate
shard. Do it after this one, using this as the template.
