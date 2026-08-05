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

---

## Resolution — landed 2026-08-05

The type error was already fixed (the union is narrowed with the corpus's own
`enforcing` predicate rather than a cast). **The unwatched-ness was not**, and that
was always the real defect: this shard's own words, _"a check nobody runs is not a
check."_

`typecheck:test` is now a **dependency of `test`** in `turbo.json`, not a sibling
task — so it runs in the same breath, in anyone's habit, without a release script
having to remember it. A gate that only the release runs is a gate that fails at
the worst possible moment.

**Control ran, both directions.** A type error injected into
`packages/schema/test/enforcing.test.ts` turned `pnpm test` red
(`TS2322`, 3 of 7 tasks), and reverting returned 14/14 green.

### Beyond the shard

Two adjacent holes were found while proving this and are closed in the same act:

- **The render oracle was asserted nowhere in code.** Every shard carries "oracle
  unmoved at `<hash>`" as prose; nothing checked it, so a projection change could
  ship green. It now has one home (`packages/canon/.render-oracle`) and one reader
  (`toolkit/render-oracle/render-oracle.sh`), with `check` / `update` split so a
  re-baseline is deliberate by construction and lands as a reviewable diff.
  Control ran: perturbing `foundingDoctrine` moved the hash and failed the gate;
  reverting restored it.
- **There was no CI at all.** Every green claim was a claim about somebody's
  laptop. `.github/workflows/verify.yml` runs lint → test → typecheck → oracle on
  push and PR, with `--frozen-lockfile`.

`pnpm verify` is the single local name for the same gate.

## Acceptance

- [x] `pnpm typecheck:test` exits 0, all tasks.
- [x] Runs in the same breath as `pnpm test` — folded into the pipeline.
- [x] Control proves it convicts, and reverts clean.
