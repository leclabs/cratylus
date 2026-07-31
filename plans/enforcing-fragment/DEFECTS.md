# Two defects from the catalog-ownership shard — execution spec

> Working handle, **not** an anchor. Reader = LLM. Both were surfaced by the agents executing
> `DIMENSION-OWNERSHIP.md`, filed rather than chased because neither impeded that shard.

---

## D1 — the inversion re-entered through the test layer

### What it is

`agent-forge/test/catalog/anatomy-descriptor.test.ts:114` — the leg _"matches the actual dimension
dirs in agent-canon (no descriptor↔corpus drift)"_ does:

```ts
const anatomyDimensions = join(here, '..','..','..','agent-canon','src','dimensions');
const dirs = readdirSync(anatomyDimensions, …)
expect(corpusDrift(dirs, FIXTURE_DIMENSION_NAMES)).toEqual({ missing: [], … })
```

**Forge's test suite reaches across the package boundary into canon's source tree, and asserts
canon's dimension directories match forge's own FIXTURE catalog** (`anatomy-descriptor.test.ts:88`
pins that fixture at 22 entries).

### Why it matters

The whole point of `fb944d2` is that canon can add a dimension without editing `agent-forge`. This
test breaks exactly that: add a dimension to canon and forge's fixture must be edited or forge's
suite goes red. **The inversion we removed from the type system re-entered through the tests** — and
it is worse there, because a test-layer coupling reads as diligence.

It is also a package-boundary violation on its own terms. `catalog/index.ts` states the rule it
breaks: _"it consumes a directory of dimension-module dirs, not `packages/agent-canon`."_ The test
consumes `packages/agent-canon`.

### The fix

**Give forge's fixture corpus its own `dimensions/` dirs and point the leg at those.** The leg's real
subject is _descriptor↔corpus drift_ — that a catalog and the value dirs beside it agree. That
invariant is worth keeping and does not need canon to demonstrate it.

**Canon's side covers HALF, measured — extend it as part of this fix.**
`agent-canon/test/cratylism.test.ts:149` computes `orphanDirs = dirs.filter(d => !keys.has(d))` and
asserts it empty. Verified by adding `src/dimensions/bogus/x.ts`: it fires, naming `bogus`.

But that is ONE direction — a directory with no catalog entry. The reverse, a catalog entry with no
directory, is unchecked. Forge's leg used `corpusDrift(dirs, names)` which returns `{ missing, extra }`
and covers BOTH. **Repointing forge's leg without extending canon's would silently drop the
`missing` direction for canon** — the direction in which a typo'd `ANATOMY` key hides, offering a
dimension the catalog claims and no value module can ever fill.

So this fix is two edits, not one:

1. repoint forge's leg at forge's own fixture corpus, and
2. add the reverse assertion to canon's `cratylism.test.ts`, so canon checks drift both ways.

### Verify

1. ~~`grep -rn "agent-canon" packages/agent-forge/test` returns nothing.~~ **This check was
   MIS-SPECIFIED and D1's executor was right to refuse it.** It tests a PROXY — the literal string —
   not the PROPERTY, which is whether forge's suite depends on canon's CONTENT such that canon cannot
   change freely. A comment naming canon, and `scaffold.test.ts` asserting forge's own scaffold emits
   `import canon from '@leclabs/agent-canon'`, both contain the literal and neither is the defect.
   `packages/agent-forge/src` itself carries 10+ such literals, so the rule was stricter than the
   source it polices.

   The correct check is behavioural: **add a dimension to canon and the full forge suite stays
   green.** State the property, not a string that correlates with it.

2. **The leg still convicts.** Add a directory to the fixture corpus that the fixture catalog does not
   declare, and watch it fail; then remove one the catalog does declare, and watch it fail the other
   way. `corpusDrift` reports `missing` and `extra` — exercise BOTH, since a drift check that only
   ever sees one side is half a check.
3. **Canon checks BOTH directions now.** The forward leg is already proven — a stray
   `src/dimensions/bogus/x.ts` fires `dirs not in ANATOMY: bogus`. The new reverse leg needs its own
   conviction: declare a catalog key with no directory and watch it fail. Note that a bare `ANATOMY`
   addition also makes every agent vector miss a field, so build the fixture for that leg from the
   catalog rather than by editing the live one, or you will be reading a compile error and calling it
   a gate.
4. Full suite, and both renders at `9055e88b6c4679e44fb5ccb73371b9d539d1d6a8`.

### Hazard

Deleting the leg instead of repointing it is the tempting move and it is wrong: it would drop
descriptor↔corpus drift coverage entirely on the argument that canon covers it, which is only true
for canon's catalog and not for any other corpus's. Forge's guarantee is that the invariant holds for
**any** corpus, which is precisely what a fixture corpus demonstrates and canon's suite cannot.

---

## D2 — the zero-config catalog path is unreachable by any test

### What it is

`agent-forge/src/cli/commands/catalog.ts:163-169`. With no `--config`, the corpus view resolves the
dimension catalog by loading the corpus package's entry module and reading its plugin's `anatomy`;
finding none, it throws:

> `no dimension catalog for corpus <c> — declare one on the corpus plugin's 'anatomy', or point --config at a config that extends it`

**Measured coverage — the resolver has THREE branches, one covered:**

| #   | branch                                              | covered?                                                                                       |
| --- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | `--config` present → `mergeAnatomy(config.extends)` | **YES** — `test/cli/explain.test.ts` imports `runCatalog` and drives a 2-plugin config fixture |
| 2   | no config → corpus entry module's `default.anatomy` | **NO**                                                                                         |
| 3   | neither → throw                                     | **NO**                                                                                         |

An earlier draft of this spec said no test covered either branch. That was wrong: the `--config` path
is exercised. The uncovered branches are the two that a ZERO-CONFIG consumer hits, which is the
sharper and more worrying version of the same defect.

### Why it matters

This is the path a NEW consumer hits first — zero config, one corpus, `agent-forge catalog`. It is
also newly load-bearing: before `fb944d2` a missing catalog fell back to a resident default, so this
code could not fire. The fallback is now a throw, so the branch went from unreachable to
first-contact, and it did so without acquiring a test.

A refusal with no test is a refusal whose message can rot, whose condition can invert, and whose
failure mode is a confusing crash at exactly the moment a new user has the least context.

### The fix

Two tests for the two uncovered branches, both driving the real CLI entry (`runCatalog`, as
`explain.test.ts` already does — there is no `catalog.test.ts` today):

1. **Branch 2 — resolves from the corpus entry module.** A fixture corpus package whose default
   export declares `anatomy`, and NO config file; assert the catalog view renders its dimensions.
   The absent config is the point: with one present, branch 1 answers and this branch never runs.
2. **Branch 3 — refuses, and says how to fix it.** The same fixture with `anatomy` absent; assert it
   throws, and assert the message names the corpus AND both remedies (declare `anatomy`, or pass
   `--config`). Assert the CONTENT, not merely that it threw: the remedy is the whole value of the
   message, and a message that rots into uselessness still throws.

`test/cli/compose.test.ts` has the tmpdir-fixture pattern already in use.

### Verify

1. Both tests pass, and **both convict**: break the resolution and watch test 1 fail; soften the throw
   to a warning and watch test 2 fail.
2. Register both in `agent-canon/test/gate-convicts.test.ts` — the meta-gate demands every test file
   be classified, and an unregistered file fails the build.
3. Full suite, renders unchanged.

### Hazard

Testing `resolveCorpusAnatomy` directly instead of the CLI would pass while leaving the actual
zero-config path uncovered — the defect is that a USER-REACHABLE path has no test, and a unit test of
its helper does not discharge that. Drive the entry point.

---

---

## D3 — the same defect, second site

`test/catalog/enumerate.test.ts` reads canon's live dimension dirs and asserts _"enumerates exactly
the 22 dimensions"_ against `FIXTURE_DIMENSION_NAMES`. Identical species to D1, found by D1's
executor while refusing the mis-specified check above — the refusal is what surfaced it.

Repoint at `test/fixture-dimensions/` (D1 built it for this). Same rule: repoint, do not delete.

**This also exposed a gap in `DIMENSION-OWNERSHIP.md`'s completion criterion.** That criterion said a
new dimension must PROJECT with zero forge edits, and the `tempo` probe proved exactly that — but it
never required the SUITE to stay green, and `enumerate.test.ts` would have failed. The proof was
weaker than reported. A completion criterion that checks the artifact and not the gates around it
leaves the coupling it was written to disprove.

---

## Sequencing

Independent of each other and of `EVENT-VOCABULARY.md`; any order. D1 is the more urgent — it is an
active coupling that will fire the next time canon discovers a dimension, which is the exact act the
previous shard existed to make cheap.
