---
"@cratylus/runtime": patch
"@cratylus/canon": patch
---

The record store's immutability gate refuses a change that modifies or deletes a record, at commit and in CI

`@cratylus/runtime` gains the immutability gate, the one enforced law of the record store. A
change under the records root whose git status is not an addition (modified, deleted, renamed or
type-changed) is refused, and the refusal names every offending path. Additions pass, paths outside
the root are ignored, and a branch merge, which only adds records, passes. The gate reads the
records root from the store's one declaration and is internal like the store: it is exported
through neither the `.` barrel nor a subpath, and runs from source through the package's
`immutability-gate` script (`tsx` is a new dev dependency). The pre-commit hook runs it over the
staged changes. The gates workflow runs it over the pushed range (a pull request's commits, or a
push's `before` to `after`), judging every commit against each of its parents, so a later commit
cannot mask an earlier edit: a record added then edited, or edited then restored, is refused.

`@cratylus/canon`: the test registry classifies the new immutability-gate test under `runtime`.
