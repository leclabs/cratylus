# t-test-dangling-references

**Wave 0.** Every dangling reference under `packages/*/test`. Outputs are the test trees
ONLY — disjoint from `t-src-dangling-references`, `t-invoke-coverage-claim` and
`t-drift-notice-timing`.

## Intent

`df3aad73` repaired 119 designator citations but scoped itself to `packages/*/src` +
READMEs. **13 live violations remain, and they are in tests**, measured at HEAD:

- `packages/canon/test/reader-density.test.ts` — `root-cause H3` ×4, and `reader-density L569`
- `packages/canon/test/runtime-shim.test.ts:10` — `skills-refactor T4`
- `packages/forge/test/core/runtime-shim-binding.test.ts:1` — `install-parity S1`
- `packages/forge/test/deploy/local.test.ts:1` — `scoped-memory-v2 D1/D5`
- `packages/forge/test/stories/**` — `depalimpsest-ir-intake S6` ×6

Three files here also carry dead-DOCUMENT citations (`resolver-parity`, `provenance`,
`resolve.test`); they take the same repair and belong to this shard by location.

## The scope ruling this shard owes

`command-veracity.test.ts`'s `inScope` **excludes test files**, by a use/mention argument that
is correct for command citations: a test may legitimately MENTION a dead command to assert the
gate convicts it. That argument does NOT transfer to a designator in a test's own header
comment, which is a USE — the author citing a warrant for why the test is shaped as it is.

**Argue the distinction in the header where the repair lands, not silently.** The exemption
that must survive is the closed-record one (`fixtures/turn-*.txt`, captured banners), which is
a genuine mention.

## Inputs

- `git grep -nP '[a-z][a-z0-9]*(-[a-z0-9]+)+ [A-Z][0-9]+[a-z]?' -- 'packages/*/test/*'`
- `packages/canon/test/command-veracity.test.ts` — `authoredLines()`, `inScope`, `isTranscript`
  and the use/mention argument this shard must engage rather than assume.
- `df3aad73` — the doctrine: inline the cargo, or withdraw. Never re-point.

## Constraints

- **Re-census before repairing.** The 13 above is measured at HEAD and decays.
- **Do not widen `inScope` in this shard.** Repair the sites; the SCOPE decision belongs to
  `t-retirement-oracle`, which is the shard that has to live with it.
- `fixtures/turn-*.txt` and captured banners are closed records — exempt, and the exemption is
  argued from the use/mention property, never from the path.

## Deps

(none — wave 0)

## Outputs

- `packages/canon/test/**`
- `packages/forge/test/**`
- `packages/memory/test/**`

## Accept

1. The sigil sweep over `packages/*/test/**`, excluding closed records, returns **0** live
   designator citations — **and prints the denominator walked**.
2. Each repaired site either states what the change WAS, or the claim is withdrawn. No site
   retains a bare id as its only warrant, and none is re-pointed at a live path.
3. The use/mention ruling for test-file headers is written down at the repair site.
4. `pnpm verify` green, `pnpm typecheck:test` green.
