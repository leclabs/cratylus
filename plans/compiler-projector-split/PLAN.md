# compiler-projector-split — PLAN

> Working handle, **not** an anchor — `compiler`/`projector` are operator-floated candidates held as
> concepts, not adopted as names. Reader = LLM.

**Status: PROPOSED — census owed before sharding. Naming blocked on `discipline-anchor`.**

## Intent (operator hypothesis, 2026-07-25)

> _"agent-forge seems to now represent a combination of a compiler and a projector — maybe two packages.
> The compiler's output is the IR which the projector receives and then projects via a selected harness
> strategy (`HarnessAdapter`, e.g. claude code, codex) to the target harness artifacts."_

The `depalimpsest-ir-intake` excision left `agent-forge` meaning **one** thing where it used to mean two —
and in doing so exposed that the surviving thing is itself two concerns fused:

| concern                 | character         | current home                                |
| ----------------------- | ----------------- | ------------------------------------------- |
| **semantic resolution** | harness-**blind** | `compose` → `resolve/`, `project/` (partly) |
| **harness realization** | harness-**bound** | `project/` + `adapters/*/anatomy.ts`        |

This split is already asserted in `plans/install-parity/DESIGN.md` §1, which distinguishes phase 6
(projection: composed cells → harness-agnostic IR, "semantic, harness-blind") from phase 7 (realization:
IR → `~/.claude/…`, "mechanical, harness-bound"). The census found that distinction is an **aspiration the
code does not implement** — `projectPluginSet` goes cells → artifacts directly.

## This does NOT re-litigate the excision

Worth stating plainly, because the words collide. The IR just deleted ran **harness config → IR**
(`import`), taking a runtime artifact as source of truth — the inversion VISION exists to undo. A
**canon → IR** compiler runs the opposite direction and is fully VISION-consistent: the canon stays the
authored source and the IR is a derived intermediate.

## The question the census must answer first

**Must the IR be materialized, or is the split conceptual?**

The resolved plugin set already exists as an in-memory structure between `compose` and `project`. So:
**what does an IR provide that the resolved set does not?** Candidate answers to test, not assume —
independent testability against golden fixtures; N harnesses needing only a projector each; a stable
serialization boundary for third-party projectors; inspectability of a build.

Weigh against: **it existed and was removed.** `packages/agent-canon/toolkit/emit_ir.py` was exactly a
canon→IR emitter, deleted in `d532a5f` ("delete Python toolkit — koine is the only projection+deploy
machinery"). Establish whether that was **Python-toolkit retirement** (incidental) or **IR-rejection**
(a decision being re-opened) — read the commit and its neighbours before building.

Also weigh: today there are **two** harness adapters (`claude`, `codex`). An IR's payoff scales with N.

**A package split is cheap and clarifying. A materialized IR is expensive and has already been tried
once.** They are separable decisions and the census should report them separately.

## Census scope (delegable; do this before authoring shards)

1. Where exactly is the harness-blind/harness-bound seam in the surviving code? Does `project/` already
   contain both, and does it separate cleanly?
2. What would each package own — modules, exports, tests? Does the dependency edge stay acyclic?
   (`agent-runtime` could not declare a capability package for exactly this reason; the cycle bit once.)
3. Read `d532a5f` and its neighbours: why did the canon→IR emitter go?
4. What does `HarnessAdapter` (`core/harness-adapter.ts:38`) consume today, and would it consume an IR
   instead of an anatomy vector? That is the interface the split turns on.
5. Cross-package blast radius: 197 of 205 imports are `@leclabs/agent-forge/anatomy`. A split changes
   package names in every one.

## Naming — deliberately deferred

`agent-compiler` / `agent-projector` are **operator-floated candidates**, which contaminate a derivation
exactly as self-floated ones do. Neither is adopted. Two cautions for whoever derives:

- **`compiler`** carries a heavy prior (source → machine code). The act here resolves, merges and
  normalizes a plugin set — closer to link/resolve/compose than to compile. The corpus already calls the
  step `compose`.
- **`projector`** is closer, since `project` is already a discovered verb in the pipeline — but a name
  taken because it echoes an existing verb is still a coinage unless it survives candidate-free derivation.

Derivation runs **after** `discipline-anchor`: package names are projections of what the discipline is.
