# immutability-gate

**Wave 1.** Realizes `immutability gate`.

## Intent

The one enforced law of the substrate: a change that modifies or deletes an existing record is
refused, at commit and in CI. Concretely, any change under the records root whose git status is
not an addition — modified, deleted, renamed, type-changed — is refused with the offending paths
named; additions pass; paths outside the root are ignored. A branch merge adds records only, so it
passes.

- The rule reads the records root from `record-store`'s one declaration and edits no existing
  file of that directory; it lives in one new module there (the store owns its gate).
- **At commit:** `.husky/pre-commit` runs it over the staged changes. Pre-commit runs before any
  build, so it runs from source: `runtime` gains `tsx` as a dev dependency and a package script
  named for the anchor.
- **In CI:** `.github/workflows/gates.yml` runs it over the pushed range (the pull request's base
  to head; a push's `before` to `after`, falling back to the whole tree when `before` is the zero
  sha). `fetch-depth: 0` already holds the history it needs.

## Static

- `git show 9cc32431:docs/design/record-store.md` § Primitives (`immutability gate`), § The record
  model (`record store` owns it).
- `.husky/pre-commit`, `.github/workflows/gates.yml` (a reusable workflow called by `verify.yml`
  and `release.yml`), `.github/workflows/verify.yml` (its triggers).
- The landed `packages/runtime/src/record-store/` — the records root's declaration.

## Deps

`record-store`

## Outputs

- `packages/runtime/src/record-store/immutability-gate.ts` (new; the only file under
  `record-store/` this unit writes)
- `packages/runtime/test/immutability-gate.test.ts` (new)
- `packages/runtime/package.json` — `tsx` dev dependency, one script
- `pnpm-lock.yaml`
- `.husky/pre-commit`
- `.github/workflows/gates.yml`
- `packages/canon/test/gate-convicts.test.ts` — one REGISTRY row
- `.changeset/immutability-gate.md`

## Accept

1. `pnpm --filter @cratylus/runtime test -- immutability-gate` passes, with test names covering: a
   modified record REFUSES naming its path; a deleted record REFUSES; a renamed record REFUSES; an
   added record passes; a change outside the records root is ignored; a merge commit bringing
   records from two branches passes.
2. The bite at commit, shown by a transcript in the return from a throwaway clone of this
   repository: a new record commits; then editing that record and `git commit` exits non-zero
   naming its path; then deleting it and `git commit` exits non-zero; a second new record commits.
3. `grep -n "immutability-gate" .husky/pre-commit .github/workflows/gates.yml` hits both files,
   and the `gates.yml` step names both the pull-request and the push range.
4. `git diff <this unit's base> -- packages/runtime/src/record-store` shows only the added
   `immutability-gate.ts`.
5. Sole: the return names the function that decides refusal; `git grep -n <it> -- packages`
   finds its declaration once, and no other module in the repository inspects git status under
   the records root.
6. `pnpm --filter @cratylus/canon test -- gate-convicts` passes.
7. `.changeset/immutability-gate.md` names every package this unit's paths changed.
