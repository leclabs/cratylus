# compiler-projector-split — PLAN

> Working handle, **not** an anchor — `compiler`/`projector` are operator-floated candidates held as
> concepts, not adopted as names. Reader = LLM.

**Status: PROPOSED — census owed before sharding. Naming NO LONGER blocked on `discipline-anchor` (edge
cut 2026-07-26; see §Naming). Derive the package anchors at this altitude, where the priors converge.**

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

## The IR here is IN-MEMORY — and the canon already declares it

Operator clarification (2026-07-25): the IR meant is **the in-memory composited agent instance**. It is
**not** materialized. The projector consumes it to generate the target harness artifacts.

This is not a new proposal — `MODEL.md:25` already declares it:

```
compose : (DimensionName ⇸ ℘(fragment)) → IR ;  ir : agent → IR
```

and `ENGINE.md:22` binds it: `compose(select(a)) = ir(a) ∧ ir(a) ⊑ content(a)`. So the compiler/projector
seam the operator describes **is the seam MODEL already specifies**. The hypothesis is not "add an IR"; it
is "give the declared IR a package boundary."

> **A prior draft of this plan asked "must the IR be materialized?" — that question was wrong**, and it
> was wrong because **`IR` was overloaded in this corpus**: MODEL's composed structure vs the on-disk
> `.agent-forge/` intake IR that `depalimpsest-ir-intake` deleted. Two concepts, one sign — a PARTITIONED
> violation (`∀c: |home(c)| = 1`). The excision incidentally resolved it; only MODEL's sense survives, and
> the `emit_ir.py` / `d532a5f` history is **irrelevant** here (that was the materialized intake sense).

## The question the census must actually answer

**MODEL declares ONE `IR`. The code has no such type.**

`HarnessAdapter` (`core/harness-adapter.ts:42,44`) consumes them **separately**:

```
agentDef(agent: Agent): HarnessProjection
skillDef(skill: ResolvedSkill): HarnessProjection
hooks(...)                                     -- a third path again
```

So the composited instance is today **three parallel types**, not one `ir(a)`. The compiler/projector
boundary is exactly the type that crosses it, so the boundary cannot be drawn until this is settled:

1. Is there **one** composited instance (MODEL's `IR`) with agents/skills/hooks as members, or **three**
   peer structures that merely happen to be produced together?
2. If one: what is it, where is it built today, and is it ever whole in memory at any single point — or is
   it only ever assembled per-kind inside `projectPluginSet`?
3. If three: **MODEL is wrong and must be revised** (apex order — MODEL is the most revisable of the
   triad), or the code is wrong and must converge on `ir(a)`. Decide which, with evidence.

This is the crux and it is cheap to settle by reading `project/index.ts` + `resolve/` against `MODEL.md`.
The package split is downstream of the answer: a boundary needs a type to be a boundary **of**.

Note the payoff scale is unchanged by any of this: there are **two** harness adapters today
(`claude`, `codex`).

## Census scope (delegable; do this before authoring shards)

1. Is MODEL's single `IR` real in the code, or are `Agent` / `ResolvedSkill` / hooks three peers? This
   gates everything below — see "The question the census must actually answer".
2. What would each package own — modules, exports, tests? Does the dependency edge stay acyclic?
   (`agent-runtime` could not declare a capability package for exactly this reason; the cycle bit once.)
3. Where is the composited instance whole in memory, if anywhere? `project/index.ts` + `resolve/`.
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

**Blocking edge CUT 2026-07-26 (mav).** This line previously read: _"Derivation runs after
`discipline-anchor`: package names are projections of what the discipline is."_ That was an inference,
and the `discipline-anchor` run of 2026-07-26 supplies evidence against it.

The anchor derivation returned **⊥** — not "not yet", but _absent_: the naming-discipline lexicon is
Hermogenean throughout, so the location in sign-space is occupied by its own inverse, and abstention
converged harder (3/3) than any candidate (3/8). Waiting on it is therefore waiting on nothing.

More decisively, its **ablation localizes the failure**. Two differentiae caused the scatter and nothing
else did: _discovered-not-invented_ (D2) and _the cold test is sole standing_ (D3). Remove them and
convergence sharpens to 2/2. Both are properties of the **methodology**, not of an artifact. The two
concerns here — harness-**blind** semantic resolution, harness-**bound** realization (§table above) —
carry neither in their definiendum, so a derivation at _this_ altitude is not contaminated by the residue
that broke the one above it. That is precisely the region the ablation showed converging.

Naming a compiler does not require first naming compiler science. **Derive here, at this altitude, now.**
Full differentia still required (an under-specified definiendum yields the genus — `install-parity` S4's
six failures), and the candidate cautions above still bind.
