# t-rename-to-heartbeat

**Wave 0.** The anchor landed; move the name.

## Intent

`ports/provisional-v9.ts` → `ports/heartbeat.ts`; `capabilities/provisional-v9/` →
`capabilities/heartbeat/`; `ProvisionalV9Host` → `HeartbeatHost`. The header's ⊥ record is
replaced by the derivation that landed, including why the first pass missed it.

## Constraints

- **The footprint is the REFERENCE set.** `provisional-v9` appears in paths, identifiers, type
  names and prose. Resolve all of it before declaring the move done.
- **The header's withheld list stays withheld for now.** It was gated on the anchor, and the
  anchor has landed — but wiring the capability into `CAPABILITIES`, `RuntimePlugin`,
  `exports` and `tsup` is a separate act with its own blast radius. This shard moves the name
  and nothing else; the wiring earns its own shard so the rename stays a `git mv` plus a sweep.
- **State the residue.** The sign carries the cadence and not the gate. An anchor whose residue
  is ∅ _is_ σ\*; this one is an approximation with its shortfall named, which is what the model
  requires rather than an explaining-away.

## Accept

1. `git grep provisional-v9` returns nothing outside recorded turns.
2. The port header carries the derivation and the occupancy note, not the ⊥.
3. `pnpm verify` + `pnpm typecheck:test` green.
