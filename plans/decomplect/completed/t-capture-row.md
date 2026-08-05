# `export interface Record` shadows the global, and both consumers already say the real name

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). Every number below was measured,
> not quoted forward.

## Intent

`runtime/src/ports/event-tap.ts:32` exports `interface Record` — shadowing the TypeScript global.
**Both consumers import it as `Record as CaptureRow`** (`capabilities/event-tap/claude.ts:18`,
`dispatch.ts:14`). The discovered sign is already written, twice, in the aliases.

## Measured

3 files / 8 sites (decl + 2 aliased imports + 5 uses at `claude.ts:166,169`, `dispatch.ts:27`).

## Constraints

- **Nothing to mint.** An alias every consumer independently reaches for IS the cold decode, already
  run by the code. Adopt it unless `CaptureRow` fails on its own merits.
- Removing the aliases is part of the act — leaving `X as X` is the defect at a new name.

## Acceptance

- No `export interface Record` under `packages/`; no consumer aliases the type.
- Suite green. Render oracle unmoved (runtime source is not projected).

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** event-vocabulary · **wave** 0
- **depends on** —
- **writes** `packages/runtime/src/ports/event-tap.ts` · `packages/runtime/src/capabilities/event-tap/**`
- **compiles against** `packages/runtime/src/loader.ts`
- **evidence** `packages/runtime/src/ports/event-tap.ts`
- **dispatchable** no ruling owed
