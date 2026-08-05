# Two of the catalog family are the same functor, and neither rejects a duplicate namespace

> Filed, not fixed — a defect beside the path. `cost(file) < cost(fix)`.
> Provenance: surfaced independently by two of the three blind readers who derived the
> `t-engine-internal-names-await-decode` family. Neither was asked about structure; both
> volunteered it, which is the strongest signal a finding can carry.

## Symptom

`PluginFragmentRoot` is `{ name, fragmentsDir }`. `PluginFragmentCatalog` is
`{ name, fragments }`. These are the same shape twice — `Namespaced<T>` for
`T = AbsolutePath` and `T = readonly FragmentEntry[]` — and the pipeline is
`Namespaced<AbsolutePath>[] → Namespaced<FragmentEntry[]>[]`.

Both sides are **arrays of key-value pairs**, which is a hand-rolled map. The namespace's
uniqueness is therefore a convention rather than a type-level fact, and **nothing rejects
two entries sharing a namespace** — the collision the per-plugin σ\* invariant exists to
make impossible is unguarded on the way in.

## The second observation

`PluginFragmentCatalog`'s `name` is pure passthrough from `PluginFragmentRoot`. It carries
no _discovered_ information: the plugin was already declared in configuration before any
scan ran. A field that transports a known value through a stage is a strong signal the
wrapper exists only to survive one function return.

## Why this was NOT folded into the decode shard

That shard's cut is signification: it asks what these things should be CALLED. This asks
whether two of them should EXIST. Fixing the naming and the structure in one commit would
have made the rename unreviewable — a reader could not tell which edits followed from the
decode and which from the collapse.

## Acceptance

- Either the two interfaces are replaced by a keyed map at both ends (`ReadonlyMap` or
  `Record<Namespace, …>`), or the reason for keeping the pair-array form is recorded in the
  module — a considered rejection is a valid outcome, silence is not.
- Whatever survives, a duplicate namespace is **rejected**, not last-write-wins. A gate
  convicts a fixture that supplies two roots under one namespace.
- If `PluginFragmentCatalog` survives the cut, its `name` field earns its place with a
  stated reason (empty-catalog representation and per-plugin batching are the two candidates
  the readers named), or it is pushed down onto `FragmentEntry`, which likely needs the
  namespace anyway for late reference resolution.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** deploy-surface · **wave** 0
- **depends on** `t-engine-internal-names-await-decode`
- **writes** `packages/forge/src/catalog/**` · `packages/forge/src/config/loader.ts` · `packages/forge/test/catalog/**`
- **compiles against** `packages/schema/src/index.ts`
- **evidence** `packages/forge/src/catalog/index.ts`
- **dispatchable** no ruling owed
