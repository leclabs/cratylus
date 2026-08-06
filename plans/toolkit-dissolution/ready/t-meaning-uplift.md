# t-meaning-uplift

**Wave 1.** Five canon-meaning modules leave `toolkit/` for canon's own `src/`.

## Intent

`plan-states.ts`, `operator-lexicon.ts`, `project-template.ts`, `cold-oracle/policy.ts`, and
the `hooks.ts` barrel carry MEANING, not mechanism. They are canon's, and they belong one
level up — not in runtime, and not in a subdirectory named for the leftovers.

`plan-states.ts` is the one file whose location is justified by its imports: two canon cells
(`skills/carry-on`, `skills/praxis`) import it. That justifies `src/`, not `src/toolkit/`.

## Constraints

- **`plan-states.ts` MUST NOT move to runtime.** `runtime/carry-on/terminus.ts` deliberately
  names it in PROSE rather than importing it, because canon and runtime share no edge
  (ARCHITECTURE property 1, enforced by `architecture.test.ts`). Moving it inverts the
  invariant the gate exists to hold. If the gate does not red when you try, that is a second
  defect — report it.
- `hooks.ts` is a barrel over canon cells. Its correct name at the new location is not
  `hooks.ts` in a directory that already has a `hooks/` — resolve the collision deliberately.
- `cold-oracle/oracle.ts` (38 lines) binds policy to `@cratylus/forge/validate`. It is a
  composition root; decide whether it follows policy up or goes to forge, and say which.
- Imports are ESM by binding — the compiler holds this. A move that typechecks is a move that
  resolved.

## Deps

`t-dead-and-tests`

## Accept

1. No canon cell or test imports anything under `src/toolkit/`
2. `architecture.test.ts` green — property 1 still holds with no exceptions
3. `pnpm verify` + `pnpm typecheck:test` green; render oracle UNMOVED (these are not
   projected modules — if the oracle moves, something projected changed and you must say what)
