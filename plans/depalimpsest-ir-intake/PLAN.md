# depalimpsest-ir-intake — PLAN

> Folder-state is authority; this doc is a derived mirror. Reader = LLM.
>
> **Anchor owed.** `depalimpsest-ir-intake` is the operator's working handle, not a discovered anchor.
> Cold-derive before it canonizes (cratylism: names are discovered, never decided).

**Status: IN-FLIGHT — waves 0 and 1 landed (S1, S2, S5, S7, S3). S4 active; S6 pending.**

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
| **S4** | `adapter-barrel-split`      | adapters     | S3         | 2    | pending       | —         |
| **S6** | `ir-lineage-excise`         | excision     | S1, S4, S5 | 3    | pending       | —         |

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
