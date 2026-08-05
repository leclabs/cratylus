# `surface` is the genus in the prose and a species in the field, in one file

> Found 2026-08-05 by the `render` ruling, which rejected `surface` as a module anchor **because of
> this** — naming a module `surface.ts` would have hardened the mis-cut instead of exposing it.

## The collision

`core/harness-adapter.ts:158` binds `surface?()` to the **narrow species** — the always-loaded
instruction/index artifact (codex's `AGENTS.md`; claude has none). The same file's prose at `:4`,
`:11` and `:37` uses `surface` as the **genus**: any projected harness artifact.

So the field and its own file's documentation disagree about the extension of the sign, and a reader
who takes either at face value is wrong about the other.

## Why it matters beyond tidiness

It is a live constraint on other work: it removed the leading candidate from an anchor derivation,
which means the defect is already **costing** derivations elsewhere, not merely sitting there.

## Acceptance

- The genus and the species carry different signs, both derived.
- `harness-adapter.ts`'s prose and its field agree, and a reader of either recovers the same extension.
- The `render` ruling's rejection note is updated to record that this was repaired — a rejection kept
  with its reason, per the C6 protocol.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** event-vocabulary · **wave** 1
- **depends on** `t-projection-file-anchor`
- **writes** `packages/forge/src/core/harness-adapter.ts`
- **compiles against** `packages/forge/src/adapters/**`
- **evidence** `packages/forge/src/core/harness-adapter.ts`
- **dispatchable** no ruling owed
