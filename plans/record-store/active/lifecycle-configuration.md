# lifecycle-configuration

**Wave 1.** Realizes `plan` — the part of it the design places on the seams: "Lifecycle states of
plans and units are meaning: the `plan` skill is their one home, and they reach the runtime as
configuration the projection emits, as the event vocabulary does today. The runtime restates none
of them." (§ Boundaries)

## Intent

Build the channel, following the event vocabulary's route exactly (`PLAN.md` § Census, last row):

- **schema** — a skill's runtime face (`SkillOf<C>['runtime']`, today `{ capability }`) may also
  carry the configuration its capability receives: JSON-serializable data, a shape with no opinion
  about any capability. The `plan` skill will put the lifecycle states there (`trio-skill-routing`);
  this unit adds only the shape.
- **forge** — `cratylus deploy` gathers the configuration every skill of the resolved plugin set
  declares on its runtime face and emits it into the host runtime config beside the event
  vocabulary, keyed by capability. Like the vocabulary, it is regenerated on every deploy and is
  harness-independent (the one-harness `native` collision filed in
  `docs/runtime-config-single-harness.md` does not touch it). The operator-owned `capabilities`
  field keeps its current preservation rule.
- **runtime** — `loadRuntimeConfig` lifts that block and exposes each capability's configuration; a
  capability needing configuration that is absent must refuse and say so, never fall back to a set
  of its own.

What the plan capability's configuration must be able to convey, so `plan-domain` and `unit` can act
without spelling a state (PLAN.md § Contract): each lifecycle's states in order; which unit state
satisfies a dependency; which plan state admits at most one holder; which plan state is final. The
keys naming those roles are derived with `signify` and reported. Nothing in `runtime`, `forge` or
`schema` spells a lifecycle state.

## Static

- `git show 4610c33f:docs/design/record-store.md` § Boundaries, § The three domains (`plan`, `unit`).
- `packages/schema/src/index.ts` (`SkillOf`, its `runtime` field) and `packages/schema/README.md`.
- `packages/forge/src/deploy/runtime-config.ts`, `packages/forge/src/cli/commands/deploy.ts`
  (`emitHostRuntimeConfig`, `emitAndReport`).
- `packages/runtime/src/runtime-config.ts`, `packages/runtime/test/runtime-config.test.ts`.
- `packages/canon/test/event-vocabulary.test.ts` § (c) — the round trip this channel mirrors.

## Deps

`scaffold-cutover` — contention, not meaning: `forge/test/deploy/cli.test.ts` exercises both
`init` (whose assertions that unit rewrites) and `deploy` (whose emission this unit changes).

## Outputs

- `packages/schema/src/index.ts`, `packages/schema/README.md`
- `packages/forge/src/deploy/runtime-config.ts`, `packages/forge/src/cli/commands/deploy.ts`
- `packages/runtime/src/runtime-config.ts`
- `packages/runtime/test/runtime-config.test.ts`
- `packages/canon/test/event-vocabulary.test.ts` — § (c) gains the configuration's round trip
- `.changeset/lifecycle-configuration.md`

Apart from `packages/schema/src/index.ts`, where `SkillOf` is declared, no package barrel is edited:
no wave-mate compiles against schema, and the forge and runtime barrels stay untouched.

## Accept

1. The round trip crosses all three packages: `pnpm --filter @cratylus/canon test -- event-vocabulary`
   passes with a leg that builds a synthetic skill declaring runtime configuration, emits the host
   config as `deploy` does, reads it back with the runtime's own `loadRuntimeConfig`, and gets the
   same data; and a leg named with `FAILS` or `REFUSES` convicts a dropped member.
2. `pnpm --filter @cratylus/runtime test -- runtime-config` passes with legs covering: a config
   carrying only capability configuration is a real config (not `null`); a malformed block is
   ignored without wedging the load, as the events block is.
3. `git grep -nE "'(proposed|bound|closed|pending|active|completed)'" -- packages/schema/src packages/forge/src/deploy/runtime-config.ts packages/forge/src/cli/commands/deploy.ts packages/runtime/src/runtime-config.ts`
   prints nothing.
4. `pnpm --filter @cratylus/schema typecheck`, `@cratylus/forge typecheck`, `@cratylus/runtime typecheck`
   and `@cratylus/canon typecheck` pass (`Skill` stays assignable for every existing cell).
5. Sole: one channel carries corpus configuration to the runtime — the return names the one
   emitting function and the one reading function; `git grep -n` finds each declared once.
6. `.changeset/lifecycle-configuration.md` names `@cratylus/schema`, `@cratylus/forge`,
   `@cratylus/runtime` and `@cratylus/canon`.
