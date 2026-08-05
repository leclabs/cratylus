# `pnpm typecheck:test` is RED on a clean tree, and `pnpm test` never runs it

## Symptom

```
packages/canon/test/cratylism.test.ts(192,22):
  error TS2339: Property 'length' does not exist on type 'EngineeringPrinciples'.
```

Verified pre-existing by stashing every uncommitted change and re-running: it fails identically on a
clean tree, so it is nobody's regression. `pnpm lint` and `pnpm typecheck` are green.

`turbo run typecheck:test` reports **5 successful of 9** — four tasks never even reach the compiler
because the failure short-circuits the graph.

## Why it survived

`pnpm test` runs the `test` pipeline, which is **9 tasks and does not include `typecheck:test`**. So
the repository's green suite and its red type-check are two different commands, and only one of them
is in anyone's habit. A contributor can be fully green and ship a test tree that does not compile.

The corpus already retired a plan item reading _"no test file in the repo is typechecked"_. The gate
that closed it exists — and then went red without anything reporting it, which is a stricter version
of the same defect: not an absent check, an **unwatched** one.

## Why it matters for release

A type error in the test tree means the tests are not type-checked against the source they exercise.
Every guarantee this project makes about naming and shape is enforced BY those tests. An unchecked
test tree is an unchecked enforcement layer.

## Acceptance

- `pnpm typecheck:test` exits 0, all 9 tasks.
- It runs in the same breath as `pnpm test` — either folded into the `test` pipeline or made an
  explicit, named part of the release gate. A check nobody runs is not a check.
- A control proves it convicts: introduce a type error in a test file, see it fail, revert, see green.
