# Two writers seed the same three files, and they no longer agree

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). Every number below was measured,
> not quoted forward.

## This is no longer "prose in the wrong layer" — the copies have DRIFTED

`forge/src/deploy/seeds.ts:73-82` carries a TODO naming its own release condition verbatim: _"When
memory exports `seedTemplates`, delete … and re-export the memory source instead."_

**That condition is satisfied today.** `memory/src/seeds.ts:74` exports `seedTemplates` and
`memory/package.json` declares the `./seedTemplates` subpath. The stated blocker is gone; the
fallback was never retired.

Both writers are reachable — `forge/src/deploy/local.ts:82` iterates `SEED_FILES`;
`memory/src/strategy.ts:148` and `memory/src/cli.ts:1227` iterate `seedTemplates` — and they emit
**different bytes**: 2 divergences across 3 seeded files (`deploy never overwrites me` vs
`` `memory init` never overwrites me ``). **Which prose an agent's `SEMANTIC.md` carries depends on
which tool provisioned the home first.**

## The TODO's own remedy is REFUTED — do not follow it

It instructs adding `@cratylus/memory` to forge's deps. `forge/package.json` declares only
`@cratylus/runtime` and `@cratylus/schema`, and **`ARCHITECTURE.md:212-234`'s north-star graph has no
`forge → memory` edge.** Following the TODO adds an edge the north star does not contain.

## Constraints

- The drift is a defect **today**, independent of where the prose ends up. Fix the divergence first
  if the ownership question needs more time; do not let it ride.
- Intersects `t-soul-to-target-in-forge` (`seeds.ts:57`). Sequence, do not collide.
- **If the only way to one home is a new package edge: STOP and report.** That is an ARCHITECTURE
  change, and it is not this shard's to make.

## Acceptance

- One writer, or two writers proven byte-identical by a test that fails when they diverge.
- No new package edge without an ARCHITECTURE amendment argued separately.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** projection-and-ground · **wave** 1
- **depends on** `t-soul-to-target-in-forge`
- **writes** `packages/forge/src/deploy/seeds.ts` · `packages/memory/src/seeds.ts`
- **compiles against** `packages/forge/src/deploy/local.ts` · `packages/memory/src/strategy.ts`
- **evidence** `packages/forge/src/deploy/seeds.ts` · `packages/memory/src/seeds.ts` · `ARCHITECTURE.md`
- **dispatchable** no ruling owed
