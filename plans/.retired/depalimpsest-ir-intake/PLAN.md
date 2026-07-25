# depalimpsest-ir-intake — PLAN

> Folder-state is authority; this doc is a derived mirror. Reader = LLM.
>
> **Anchor owed.** `depalimpsest-ir-intake` is the operator's working handle, not a discovered anchor.
> Cold-derive before it canonizes (cratylism: names are discovered, never decided).

**Status: LANDED — all 7 shards completed. One pipeline remains. Two naming acts owed (below).**

## Intent

`agent-forge` carries **two disjoint pipelines behind one binary**. Excise the second.

|                 | **A — canon projection (live)**          | **B — IR intake (excise)**                                 |
| --------------- | ---------------------------------------- | ---------------------------------------------------------- |
| entry           | `init → add → compose`                   | `import <client>`                                          |
| source of truth | `agents.config.ts` plugin set — TS cells | `.agent-forge/` IR, lifted from an existing harness config |
| terminal        | `project → deploy`                       | `compile [...clients]`                                     |
| writes          | `.render/` → `~/.claude/`                | `~/.claude/` **directly**                                  |
| renderer        | `claudeHarnessAdapter.agentDef`          | `serializeAgent()`                                         |
| registry        | `adapters/registry` — 2 harnesses        | `core/adapter` — ~16 clients                               |

They share no data: `projectPluginSet` never calls `readIR`/`writeIR`, and the only IR writers are
`import` and `migrate`.

**Why B goes, on three independent grounds.**

1. **It runs against VISION.** `import` takes an existing harness config as the source of truth and
   derives from it. VISION's thesis is the inverse — the canon is authored; runtime artifacts are
   projections that never author meaning. B is residue of forge's pre-VISION identity as a config
   transpiler.
2. **Its upstream was already deleted.** `test/adapters/ir-bridge/round-trip.test.ts:18-20` names its
   75KB fixture as the output of `agent-canon/toolkit/emit_ir.py` — the corpus→IR emitter, removed in
   `d532a5f` ("delete Python toolkit"). The one bridge from a semantic corpus into an IR is gone; only
   its frozen output survives, pinned in a green test. The IR has no producer but `import`.
3. **Two writers, one destination.** `compile` and `deploy` both write `~/.claude/`, through two
   different renderers. This is the "two projectors" defect `install-parity` S7 fixed one level down,
   recurring at the level of source-of-truth.

Censused twice with file:line evidence. Recorded in `plans/install-parity/DESIGN.md` §7a.

## The braid — why excision is last, not first

Only **five import edges** cross from the live lineage into the IR lineage. Four are trivial; three of
them are **one braid: hooks**. The live `project → deploy` path renders `settings.json` by lifting an
anatomy `HookCell` into an IR `Hook` and calling the IR write path's serializer. That is the only place
the IR type system is load-bearing for the surviving pipeline — so it is decomplected first, and the
deletion happens only once nothing live points into the doomed tree.

## Shards

| id     | shard                       | concern      | deps       | wave | state         | commit    |
| ------ | --------------------------- | ------------ | ---------- | ---- | ------------- | --------- |
| **S1** | `dead-plugin-adapter-field` | contract     | —          | 0    | **completed** | `9232224` |
| **S2** | `event-vocabulary-rehome`   | vocabulary   | —          | 0    | **completed** | `87c0f79` |
| **S5** | `module-scan-subpath`       | package-seam | —          | 0    | **completed** | `927d484` |
| **S7** | `readme-reground`           | doc          | —          | 0    | **completed** | `523e3ad` |
| **S3** | `hooks-serializer-extract`  | projection   | S2         | 1    | **completed** | `716cfdb` |
| **S4** | `adapter-barrel-split`      | adapters     | S3         | 2    | **completed** | `ebdfb05` |
| **S6** | `ir-lineage-excise`         | excision     | S1, S4, S5 | 3    | **completed** | `30dd32b` |

`R = {(S3,S2), (S4,S3), (S6,S1), (S6,S4), (S6,S5)}`

waves `{S1,S2,S5,S7} → {S3} → {S4} → {S6}` · frontier fan-out at wave 0 = **4**.

### Wave 0 — closed, with two authoring defects of my own

Full suite re-run on the **merged** state (`turbo run test --force`, 0 cached / 7 tasks): green. Per-shard
green does not prove the combination.

Two falsifiers **I wrote were vacuous**, both caught by the executors, not by me:

- **S7's static input** pinned `README.md:33-35`. The root `README.md` is a five-line thesis stub; the
  offending headline lives in `packages/agent-forge/README.md`. I verified the path **existed** and never
  opened the lines. DESIGN §7a inherited the same error, copied from the census unverified.
  **Pin the claim, not just the path.**
- **S2's stated falsifier** (`rg -n "core/ir" src/{anatomy,project}/`) returned clean **at HEAD too** —
  `hook-cell.ts` reached the IR through `../core/index.js`, a string containing no `core/ir`. A textual
  grep cannot see a transitive reach. The executor replaced it with a **resolution-level** falsifier
  (transitive relative-import closure), which is the right instrument. Verified independently:
  `hook-cell.ts` reaches 3 modules, 0 in the IR lineage; control walk from `core/adapter/types.ts`
  reaches 2, proving the walker works.

Carry into remaining shards: **prefer a reachability oracle over a substring oracle** whenever the claim
is "X no longer depends on Y."

### What wave 0 surfaced beyond its own scope

- **The forge README was substantially fiction.** An env-var table (`AGENT_FORGE_HOME/CONFIG/LOG_LEVEL`)
  with zero consumers — forge's source reads no environment at all; exit codes 2/3/4 when every live
  command returns 0 or 1; "10 official adapters" against 17 dirs and a 2-harness registry. All cut.
- **A two-resolver `$ref` trap (S2).** `ir.schema.json` refs `hook.schema.json`; **ajv resolves `$ref` in
  URI space against `$id`, while json-schema-ref-parser resolves the same string on the filesystem.**
  Rewriting the ref satisfies the generator and breaks the validator (95 test files); leaving it does the
  inverse. Resolved by leaving `ir.schema.json` byte-identical and putting the path knowledge in the
  legacy generator's file-reader — which S6 deletes anyway.
- **Biome, not prettier, owns JSON here** (`biome check --staged` in pre-commit). Pre-existing biome debt
  in `agent-forge/package.json` surfaces on first touch.

### Wave 1 — the braid is cut

`716cfdb`. The serializer now lives at `adapters/claude/hooks.ts`, typed against S2's `core/hook/` home;
`write.ts` calls the **same** function, so there is one emitter, not two. Verified independently with the
control the shard demanded: the closure from `adapters/claude/anatomy.ts` reaches `write.ts` **YES at
HEAD~1 (59 modules) → NO at HEAD (57)**.

Two things the shard did not anticipate, both handled correctly:

- **The braid had a second strand.** The serializer also depended on `ClaudeHook` (the adapter-private
  `if`/`env`/`kind` extension) defined in `read.ts`, whose own closure runs through `core/index.js` into
  `core/ir`. Extracting only the serializer would have left the live path reaching the IR lineage via
  `read.ts` instead of `write.ts` — the same defect one file over. Relocated into `hooks.ts`; `read.ts`
  now imports it. Relocation, not deletion — S6's territory intact.
- **A substring grep would have reported this shard FAILING.** `git grep "write\.ts" -- anatomy.ts` still
  hits, on a prose mention in a header comment. Grep says dirty; resolution says clean; resolution is
  right. The inverse of the wave-0 error, and further reason to prefer the reachability oracle.

**My dispatch spec for S3 named a vacuous entry point** (`project/index.ts`), for the same reason S4's
did: the projection core takes `HarnessAdapter` as an injected parameter and never imports an adapter, so
its closure is 13 modules and reached `write.ts` = NO before any work. Caught independently by the
executor and by me, minutes apart. Standing correction now applied: **run every falsifier against HEAD at
authoring and confirm it fails.**

### Out of scope, found in passing — a third hook-block shape

`packages/agent-runtime/src/capabilities/event-tap/claude-serialize.ts` declares its **own**
`ClaudeHooksBlock` and serializer. It does not import agent-forge and serializes `LifecycleEvent` rather
than `Hook`, so it is a separate lineage — **not** the fork this plan forbids, and correctly left alone.
But it is a second hand-maintained copy of the Claude settings hook-block shape, and
`plans/agent-runtime/PLAN.md:26` already records the coupling question as FORK-1. Wants its own census;
not scoped here.

### Wave 3 — excised

`fd2ae76` tests · `30dd32b` source · `abf975d` package surface · `6a64cbd` init contract · `014fb37` docs.
**242 files, −30,744 lines.** Source 7,332 lines survive; tests 3,857 (was 18,768).

Verified independently: falsifier 10 files → **0** with a live control of 9 through the same instrument;
every IR directory gone **including `core/index.ts`**, the barrel whose `export *` was the actual
entanglement mechanism; suite 7/7 at 0 cached; deployed tree byte-identical (`settings.json` sha
`8e21ace4…07205`, matching the pinned prior-wave value, `diff -r` clean over all 63 files).

**The defect that would have made this whole plan unobservable.** cac parses an unrecognized command into
the absent global command and exits **0, silently** — `agent-forge compile` looked like a _success_ after
its implementation was deleted. A removed verb was indistinguishable from a working one by exit code.
Guard added (`cli/index.ts`, `parse({run:false})` + `matchedCommand`). Now removed verbs fail at the
**parser** site with a named-alternatives message, while a surviving verb like `compose` fails at the
**command-body** site — same `rc=1`, different site. This is the session's `rc`-is-a-low-cardinality-oracle
lesson at its sharpest: here the low-cardinality value was **0**, i.e. success.

**`.` and `./core` exports deleted, not repaired.** After the cut the core barrel had zero source
consumers, and 197 of 205 cross-package imports already use `/anatomy` with **zero** using the root. The
package has no single root _concept_ — it is a set of named surfaces. Pointing `.` at a residue barrel
would describe the package falsely, and a barrel that `export *`s a lineage is the exact invisible edge
this plan spent three waves cutting. `import '@leclabs/agent-forge'` now fails honestly with
`ERR_PACKAGE_PATH_NOT_EXPORTED` (verified).

**The carried-in oracle trap reproduced exactly:** `import.meta.resolve` _resolved_ both bogus
`./adapters/*` paths; only a real `await import()` caught them. Confirmed as a genuine hazard, not a
one-off.

Four things my shard input list got wrong or missed:

- **`init` was a live verb with a dead half** — it bootstrapped `.agent-forge/` _and_ scaffolded
  `agents.config.ts`, and held 2 of the 10 falsifier hits. Surgery, not deletion. Its `--scope` flag
  selected only the IR root, so keeping it would have been a parse-and-ignore flag; removed, and `init`
  is now idempotent with two new tests pinning that.
- **Stories E5 and E8 were absent from my list** (932 + 2,314 lines), both pure IR round-trips; and **E6
  was not wholly safe** — 2 of its 8 stories rode the compile path. E6.S7 was **narrowed, not deleted**:
  its `checkCoverage` ledger leg survives verbatim because `checkCoverage` survives.
- **The `adapters` roster verb** was not among the nine I named, but its subject _is_ the IR `Adapter`
  capability table. Removed.
- **Six dependencies went dead** with the cut (`ajv`, `ajv-formats`, `chokidar`, `gray-matter`, `js-yaml`,
  `@types/js-yaml`), removed with the lockfile synced. `zod` was **already** dead at `HEAD~2` —
  pre-existing debt, reported and deliberately left rather than swept into an unrelated change.

## Owed, and mine — two naming acts

Both are `signify` acts under cratylism, so neither was delegated and neither is done:

1. **`HarnessAdapter` is now the only adapter kind in the package.** No bare `Adapter` type exists. The
   qualifier is dead weight on the surviving anchor, which wants re-deriving against the post-excision
   shape. Executors were instructed to report it and change nothing; they did.
2. **This plan's own directory name.** `depalimpsest-ir-intake` is the operator's working handle, never
   cold-derived. It rides into `.retired/` un-canonized, which is honest but unfinished.

## Scale

Roughly **4,000 source lines** and **10,200 of 17,635 test lines** leave in S6, plus 15 of 18 adapter
directories and the orphaned fixture. Verified untouched (zero IR references): `src/deploy/`,
`src/validate/`, `src/catalog/`, `src/config/`, `src/project/`, `src/resolve/` (after S1), `src/anatomy/`
(after S2). Cross-package, 175 of 183 imports of agent-forge are `@leclabs/agent-forge/anatomy`; no
package imports the root.

## Standing gates (every shard)

- **Full `pnpm test` from the repo root** — never a package subset. Per-shard green ≠ corpus green.
- **Non-vacuous falsifier greps** — prove the control matches _before_ claiming a clean grep. Prefer
  `git grep` (errors loudly; cannot silently no-match). An exit code is a low-cardinality oracle:
  discriminate on the failure site or message, not on `rc`.
- **A real local dogfood** — `project` → `deploy` into a temp `HOME`, counting landed agents / skills /
  hooks — because hooks are the one genuinely braided surface. A mocked runner does not discharge this.
- **Deletion, not deprecation** — no shims, no `@deprecated` aliases, no parse-and-ignore flags.

## Salvageable intent, deliberately not scoped here

Lifting an existing setup is genuinely useful onboarding. Its **target** is what was wrong: the valuable
form is `import → cells` (into the canon), not `import → IR` (into a rival source of truth). That is a
future plan needing its own census and its own derivation — recorded so the idea is not lost with the
code, and explicitly **not** promised in the README (S7).
