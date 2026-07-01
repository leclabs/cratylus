# Minimal-delta agents (agents as spread-deltas over base)

**Lane** Nico (modules) + Mav (engine) · **Status** pending — gated on the generic-extraction decision.
Migrated from the retired `koine-absorbs-mind` plan (was T4.1).

## Scope

Agents currently list ALL organs explicitly. Make each a true minimal delta over
`packages/agent-anatomy/src/agents/base.ts`:

1. `base.ts` = the harness-neutral shared floor.
2. Each agent = `{ ...base, <distinctive organs> }`, omitting everything inherited from `base` or provided
   by the claude harness reset (dropped at export by the adapter's `subtractReset`).
3. Prove projected SOULs are behaviorally unchanged — the **projection-stability** gate; the byte-identity
   round-trip oracle is retired (`.ts` is the source, nothing to round-trip against).

## Acceptance

- nico authored as ~8 distinctive organs over `base`; projection-stable, no behavioral change.
- All 11 agents are minimal deltas; `tsc` + projection-stability + the delta-over-target (`subtractReset`)
  tests green.
- A new agent authorable as a handful of organ overrides (demonstrated).
