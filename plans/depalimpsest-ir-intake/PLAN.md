# depalimpsest-ir-intake — PLAN

> Folder-state is authority; this doc is a derived mirror. Reader = LLM.
>
> **Anchor owed.** `depalimpsest-ir-intake` is the operator's working handle, not a discovered anchor.
> Cold-derive before it canonizes (cratylism: names are discovered, never decided).

**Status: PROPOSED — sharded, wave 0 ready, nothing dispatched.**

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

| id     | shard                       | concern      | deps       | wave | state   |
| ------ | --------------------------- | ------------ | ---------- | ---- | ------- |
| **S1** | `dead-plugin-adapter-field` | contract     | —          | 0    | ready   |
| **S2** | `event-vocabulary-rehome`   | vocabulary   | —          | 0    | ready   |
| **S5** | `module-scan-subpath`       | package-seam | —          | 0    | ready   |
| **S7** | `readme-reground`           | doc          | —          | 0    | ready   |
| **S3** | `hooks-serializer-extract`  | projection   | S2         | 1    | pending |
| **S4** | `adapter-barrel-split`      | adapters     | S3         | 2    | pending |
| **S6** | `ir-lineage-excise`         | excision     | S1, S4, S5 | 3    | pending |

`R = {(S3,S2), (S4,S3), (S6,S1), (S6,S4), (S6,S5)}`

waves `{S1,S2,S5,S7} → {S3} → {S4} → {S6}` · frontier fan-out at wave 0 = **4**.

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
