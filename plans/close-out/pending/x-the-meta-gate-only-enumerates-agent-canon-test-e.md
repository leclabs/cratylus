# the meta-gate only enumerates agent-canon/test - every gate outside it is unpoliced for a convicting fixture

> FILED, not specified. A stub: symptom + locus + provenance, no census, no
> acceptance. It exists so the defect was not chased when it was found. Whoever
> promotes it to `ready` owes it a real spec (`/praxis upsert`).

**Symptom.** the meta-gate only enumerates agent-canon/test - every gate outside it is unpoliced for a convicting fixture

**Locus.** _(unfilled — the filer may not have known)_

**Provenance.** Filed 2026-07-26 from `b6cfc7b`, while executing `M3`.

## Scoped 2026-07-26 (mav) — attempted, and deliberately not half-done

**Confirmed and precise.** `gate-convicts.test.ts` enumerates `readdirSync(testDir)` —
agent-canon's test dir alone — against a hand-maintained `REGISTRY`. Its three checks
(everything classified · no stale entry · every GATE ships a convicting fixture) are
sound; they simply cannot see another package. Gates now living outside its reach:
`agent-memory/test/{cell-verb-roster,store-ceiling}.test.ts`,
`agent-runtime/test/brand-derived-literals.test.ts`.

**Current exposure is low and should not be overstated:** all three of those DO carry
convicting fixtures, because their authors were told to. The defect is that nothing
enforces it, so the next one need not.

**Why this was not closed opportunistically.** The mechanism is a DECLARED registry,
not a heuristic — deliberately, and the file says why: _"a heuristic meta-gate is the
very failure it exists to catch."_ Extending coverage therefore means classifying every
test file in the target package as GATE or BEHAVIORAL, and doing that correctly means
reading each one. That is 17 files in agent-memory, 5 in agent-runtime, ~23 in
agent-forge. Guess-classifying them would produce a gate that reports coverage it does
not have — the exact failure mode, reintroduced by the fix.

**Two shapes for the real shard, pick deliberately:**

1. **One meta-gate, several dirs.** Keep the single home in agent-canon and have it read
   sibling test dirs by path — the precedent M3 and V10 both set (read sibling source by
   path rather than invent a package edge for a test). One registry, keyed by
   `<package>/<file>`.
2. **Per-package meta-gates.** Each package polices itself; no cross-package path
   reading. Costs a duplicated ~60-line mechanism, which is the thing DRY exists to
   prevent — and duplicated gates drift, as `runtime-shim.ts` proved this same session.

Shape 1 is better on DRY grounds and has live precedent. The cost either way is the
classification pass, not the plumbing.
