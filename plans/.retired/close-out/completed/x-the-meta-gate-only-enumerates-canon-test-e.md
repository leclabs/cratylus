# the meta-gate only enumerates canon/test - every gate outside it is unpoliced for a convicting fixture

> FILED, not specified. A stub: symptom + locus + provenance, no census, no
> acceptance. It exists so the defect was not chased when it was found. Whoever
> promotes it to `ready` owes it a real spec (`/praxis upsert`).

**Symptom.** the meta-gate only enumerates canon/test - every gate outside it is unpoliced for a convicting fixture

**Locus.** _(unfilled — the filer may not have known)_

**Provenance.** Filed 2026-07-26 from `b6cfc7b`, while executing `M3`.

## Scoped 2026-07-26 (mav) — attempted, and deliberately not half-done

**Confirmed and precise.** `gate-convicts.test.ts` enumerates `readdirSync(testDir)` —
canon's test dir alone — against a hand-maintained `REGISTRY`. Its three checks
(everything classified · no stale entry · every GATE ships a convicting fixture) are
sound; they simply cannot see another package. Gates now living outside its reach:
`memory/test/{cell-verb-roster,store-ceiling}.test.ts`,
`runtime/test/brand-derived-literals.test.ts`.

**Current exposure is low and should not be overstated:** all three of those DO carry
convicting fixtures, because their authors were told to. The defect is that nothing
enforces it, so the next one need not.

**Why this was not closed opportunistically.** The mechanism is a DECLARED registry,
not a heuristic — deliberately, and the file says why: _"a heuristic meta-gate is the
very failure it exists to catch."_ Extending coverage therefore means classifying every
test file in the target package as GATE or BEHAVIORAL, and doing that correctly means
reading each one. That is 17 files in memory, 5 in runtime, ~23 in
forge. Guess-classifying them would produce a gate that reports coverage it does
not have — the exact failure mode, reintroduced by the fix.

**Two shapes for the real shard, pick deliberately:**

1. **One meta-gate, several dirs.** Keep the single home in canon and have it read
   sibling test dirs by path — the precedent M3 and V10 both set (read sibling source by
   path rather than invent a package edge for a test). One registry, keyed by
   `<package>/<file>`.
2. **Per-package meta-gates.** Each package polices itself; no cross-package path
   reading. Costs a duplicated ~60-line mechanism, which is the thing DRY exists to
   prevent — and duplicated gates drift, as `runtime-shim.ts` proved this same session.

Shape 1 is better on DRY grounds and has live precedent. The cost either way is the
classification pass, not the plumbing.

## Closed 2026-07-26 (developer) — Shape 1, and the classification pass was the work

**Shape 1 taken.** One meta-gate, four test dirs. `gate-convicts.test.ts` keeps its
single home in canon and reads the three sibling `test/` dirs BY PATH (recursively
— forge nests its suites), keyed `<package>/<path-under-test>`. A fourth check was
added ahead of the other three: **every root must yield at least one file**, because a
mistyped root would otherwise police nothing and report the same green as a clean corpus.

**The classification pass: 65 files, each opened.** No heuristic, no guess — the file's
own doctrine forbids both. Final counts (GATE · BEHAVIORAL): canon 16 · 2,
forge 5 · 21, memory 3 · 13, runtime 3 · 2 — **27 GATE, 38 BEHAVIORAL**.
Ambiguity resolved toward GATE, which demands evidence rather than granting an exemption.
The registry's own two checks (nothing unclassified, nothing stale) passed on the first
run, which is the evidence the enumeration is exact.

**Six naked gates surfaced — the point of the exercise.** Each got a real convicting
fixture (synthetic BAD input → assert rejection), and in every case the guard's predicate
was first EXTRACTED from the assertion so the same code could be fed the bad input; the
`CONVICTS` detector was not widened by one character.

| naked gate                                 | the invariant it asserts over the live corpus                      | what now convicts it                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `runtime/event-tap.test.ts`                | no capability source imports `forge`                               | `forgeImports` FLAGS `import`/`export *`/`require` forms; exonerates prose + relative imports                             |
| `forge/catalog/anatomy-descriptor.test.ts` | canon's dimension dirs == `DIMENSION_NAMES`; axis/kind/arity legal | `corpusDrift` convicts a lost + gained dir; `illegalMeta` convicts values outside the closed vocabularies                 |
| `forge/catalog/enumerate.test.ts`          | every value non-empty + shortlex; metadata matches `ANATOMY`       | `shapeViolations` convicts unsorted + empty-bodied entries; `metaDrift` convicts a drifted arity and an unknown dimension |
| `forge/project/resolver-parity.test.ts`    | the unpatched fold is the identity over canon                      | a patched fold must yield a NON-empty substitution; two nodes sharing one body throw `AmbiguousFragmentBodyError`         |
| `forge/project/tree.test.ts`               | `src/project/index.ts` performs no writes                          | `writeCalls` FLAGS a synthetic writing projector; spares a returning/reading one                                          |
| `forge/stories/coverage.test.ts`           | no bare/silenced tests, every test traces to a story               | a synthetic `E99/` dir with a bare test, `.skip`, `describe.only` and an unregistered id is FLAGGED on all four counts    |

Verified by mutation, not by green: neutering `writeCalls` to always-return-`[]` leaves
the purity check passing and fails only the conviction — exactly the separation the
meta-gate exists to make visible.

**Gates.** `pnpm typecheck` 8/8 · `pnpm test` 559 passing, 1 skipped (552 + 7 new here).
