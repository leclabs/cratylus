# ARCHITECTURE

> **Meaning, mechanism, and projection are three concerns. Each has one home.**

This document states the **intended** architecture — the target the source converges upon. It is
hand-authored ground, of the same nature as [`VISION.md`](./VISION.md) and [`MODEL.md`](./MODEL.md):
never generated from source, and never revised to match what the source currently does. Where the
two disagree, the source is wrong.

## The three concerns

A working agent is three separable things that the industry routinely fuses:

| concern        | what it answers                        | home            |
| -------------- | -------------------------------------- | --------------- |
| **meaning**    | what this agent IS, what a skill MEANS | `agent-canon`   |
| **mechanism**  | the programmatic thing that runs       | `agent-runtime` |
| **projection** | how both reach a particular harness    | `agent-forge`   |

Fusing any two is the defect this architecture exists to prevent. A canon cell that names a file path
has fused meaning with projection. A projector that decides which dimensions exist has fused
projection with meaning. A skill that embeds its own implementation has fused meaning with mechanism.

## A skill is a tool the harness would not let you install

This is the observation that makes the runtime necessary, and it is worth stating plainly because
everything downstream follows from it.

Conceptually, **a skill and a tool are the same thing**: a capability the agent invokes. The
difference is administrative — most harnesses will not accept a new tool, but will accept a _skill_
with companion scripts. The skill format is therefore a **plug-in mechanism for harnesses that have
no plug-in mechanism**.

So a skill has two faces:

- its **semantic routing** — what it means, when it applies, what it composes from. That is canon.
- the **programmatic thing it routes to** — that is runtime.

The projection wires the two together for a given harness.

## The fidelity ladder

The same shape governs every capability, and it generalizes the bound/steer rule already proven for
enforcing constraints. A harness offers some, all, or none of what the canon declares, and the
adapter realizes the **highest fidelity available**:

| fidelity    | when                                  | example                                            |
| ----------- | ------------------------------------- | -------------------------------------------------- |
| **proxy**   | the harness has the facility natively | a memory strategy that delegates to the host's own |
| **provide** | the harness lacks it                  | our implementation behind the same port            |
| **declare** | neither is possible                   | the rule reaches the agent as prose — a steer      |

**A shortfall degrades and warns; it never refuses and never widens.** Degrading changes how strongly
a subject is bound. Widening changes _which_ subjects are bound, which is a different constraint
wearing this one's name.

The floor is never silence. Every declaration reaches the agent regardless of what the harness can
mechanize, which is what makes a warning sufficient where the loss of the declaration would demand a
refusal.

## The packages

### `agent-canon` — meaning

Signified fragments and their composites: agents, skills, rules. Harness-agnostic **and
runtime-agnostic** — it says what an agent _is_ and what a skill _means_, never how either is carried.

ESM imports are the composition substrate. A fragment is addressed by **import binding**, never by
string id, so composition is checked by the compiler rather than resolved by a registry. That is not
an implementation convenience: it is what makes a composite's parts traceable to their one home.

Canon owns the **catalog** — which dimensions exist — because a dimension is _constitutive_:
declaring one makes it part of that corpus's agent design.

### `agent-runtime` — mechanism

The generic platform beneath the two things that need programmatic support:

1. **the tools skills route to** — the implementations behind the semantic surface;
2. **lifecycle guardrails** — enforcement of stances the agent would otherwise drift out of, the same
   species as a harness's own goal check.

Structured as **ports** (the abstraction) and **strategies** (the interchangeable implementations).
Every capability is pluggable, so a rich harness gets a proxying strategy and a poor one gets ours,
selected by configuration rather than by code.

It ships **with** the agent and runs on the host. It knows no harness and no corpus.

### `agent-forge` — projection

The deterministic map from canon's meaning and runtime's capabilities onto **one** harness's surfaces.
It chooses achievable fidelity and emits accordingly.

Forge owns nothing semantic and nothing mechanical — **only the mapping**. Anything it _decides_
about the design, rather than _carries_, is a defect. That single rule is the audit criterion for this
package.

### `agent-schema` — the shapes

The shapes a corpus authors against: what a cell is, what a value is, what carries enforcement —
[`MODEL.md`](./MODEL.md) realized in types. It belongs to **neither** canon nor forge: canon authors
against it, forge validates and projects against it, and it holds no opinion about either.

Extracting it is what let meaning and projection stop depending on each other. **Landed 2026-08-04**: canon cells importing the projector went **22 → 0**, and the render oracle did not move a byte — the proof the change was structural.

The sign was discovered, not chosen, and it carries its own constraint: asked what `agent-schema`
would be beside these siblings, a reader with no access to this document answers _"the other three
would depend on it, not the reverse — schema packages sit at the bottom of the dependency graph"_,
and places content in canon and execution in runtime unprompted. **That is properties 2 and 4 below,
recovered from the name alone.** It replaces a working title of `agent-anatomy`, which could not be
used: `anatomy` was a metaphor binding four distinct concepts, and `agent-anatomy` was already
`agent-canon`'s own package name before `2f9bd6e5`.

### `agent-memory` — a runtime strategy

One implementation behind the memory port, not a peer of the three concerns. Named here only because
its package sits alongside them.

### Two consumer entries, because there are two DAGs

A consumer meets this system at two different times, and they are not the same entry:

| entry           | when           | what it answers                                       | shipped by    |
| --------------- | -------------- | ----------------------------------------------------- | ------------- |
| `agent-forge`   | **build time** | author, resolve, project and deploy a corpus          | `agent-forge` |
| `agent-runtime` | **run time**   | the capabilities an agent invokes while it is running | `agent-cli`   |

This is not two ways of doing one thing. It is the **same decomplection the plugin contract already
makes one level down**: a capability package exposes `buildPlugin` (its `AgentPlugin` face) and
`runtimePlugin` (its `RuntimePlugin` face), never one dual-hook object, so the build DAG and the
runtime DAG never reach across. The two bins are that seam surfacing as installable commands.

**Everything a consumer can do at build time belongs to `agent-forge`'s command surface**, and
anything in this repository that performs such a step by another route is a divergence — a private
reimplementation of a shipped command, which is how a projector drifts from its own CLI without
anything reporting it.

#### `agent-cli` — the runtime's installable entry

It exists for a reason the package name does not carry: **to break a dependency cycle.** Every
capability package depends on the runtime for its contracts, so the runtime cannot declare the
capabilities. `agent-cli` is the third package that depends on both and wires them by static import,
which is what makes resolution succeed by declaration rather than by co-installation accident. It
owns the `bin` key — the one copy of the bin name no TypeScript can compute.

**The sign is wrong and is filed for re-signification.** `agent-cli` names "the CLI" while shipping
exactly one of the two, and the one it ships is named `agent-runtime` — the package name and its own
bin name disagree. Neither is `σ*`.

## The north star

```mermaid
graph BT
    schema["agent-schema<br/><i>the shapes</i>"]
    canon["agent-canon<br/><b>meaning</b>"]
    runtime["agent-runtime<br/><b>mechanism</b>"]
    forge["agent-forge<br/><b>projection</b>"]
    memory["agent-memory<br/><i>a strategy</i>"]
    cli["agent-cli<br/><i>consumer entry</i>"]

    canon --> schema
    forge --> schema
    forge --> runtime
    memory --> runtime
    cli --> runtime
    cli --> memory

    canon -. "as DATA, never a dependency" .-> forge

    classDef concern fill:#1f6feb22,stroke:#1f6feb,stroke-width:2px
    classDef support fill:#8b949e22,stroke:#8b949e
    class canon,runtime,forge concern
    class schema,memory,cli support
```

The load-bearing properties, in order of how much they matter:

1. **Meaning and mechanism never reference each other.** `agent-canon` and `agent-runtime` share no
   edge in either direction. A skill names a capability; it does not name an implementation.
2. **Nothing depends on projection.** Forge is a leaf in the direction that matters. Canon reaches it
   only as a **build tool for canon's own scripts** — never from a cell.
3. **Canon reaches forge as DATA, not as a dependency.** The corpus is passed to the projector as a
   plugin. The dotted edge is a flow, not an import.
4. **Runtime depends on nothing.** It is the deployed base, and everything corpus-specific reaches it
   as configuration the projection emitted.

## Where the source diverges today

Stated honestly, because a north star that pretends to be a description is useless:

| divergence                                                                            | evidence                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`agent-schema` imports `agent-runtime`** — an edge this graph does not draw         | `schema/index.ts` takes `RuntimePlugin` only to derive `keyof Omit<…,'name'>` — it wants a **vocabulary**, not a shape. `shape ⊥ vocabulary`, as `MODEL.md:22` already rules for `Event`. Ratcheted, never licensed |
| **build-time steps bypass the build-time CLI** — a private reimplementation           | `agent-canon/src/toolkit/project-cli.ts` and `project-cli-codex.ts` duplicate `agent-forge project --harness <name>`, differing by one string; the codex copy already drifted once and shipped sessionless shims    |
| **this repository is not a consumer of its own CLI** — no `agents.config.ts` exists   | `agent-forge project` exits 1 without one, so the corpus that DEFINES the design cannot be built by the shipped command                                                                                             |
| **three packages are `private: true`** — including the one owning the installable bin | `agent-cli`, `agent-memory`, `agent-runtime`; nothing is published and every version is `0.0.0`                                                                                                                     |
| **canon's own most structural module is still `src/anatomy.ts`** — holding `MANIFEST` | the file name is the retired sign; 154 importers reach it                                                                                                                                                           |
| **a canon cell names the runtime's binary** — projection knowledge in a cell          | `RUNTIME_BIN` in `hooks/memory-consolidation-nudge.ts`                                                                                                                                                              |
| **the lifecycle vocabulary is declared twice** — forge and runtime, independently     | 28 members each, identical set and order, nothing enforcing it                                                                                                                                                      |
| **property 1 is breached, and a GATE PINS THE BREACH**                                | `src/hooks/memory-consolidation-nudge.ts:2` — a canon **cell** — imports `RUNTIME_BIN` from `@leclabs/agent-runtime`, and `test/bin-name-single-home.test.ts:57,101` asserts it stays                               |
| **`FIXTURE_ANATOMY`** — the fixture corpus's instance of the same concept             | ~110 sites in `agent-forge/test`, now read as `manifest: FIXTURE_ANATOMY`                                                                                                                                           |

**The property-1 row is the one that matters most.** Property 1 is the highest-ranked property here,
and the repository does not merely fail it: a test **requires** the failure, so repairing the
architecture turns the suite red. That is not a defect to fix in passing. Amending the counter-gate is
a design decision, and it comes first.

**All four properties are now enforced** by `agent-canon/test/architecture.test.ts`, which reads every
workspace package's real import graph and pins each breach above. Every row here is therefore a live
ratchet entry rather than a claim — it fails the suite the day it is repaired, and it cannot silently
grow.

The third row is why this whole class persisted. These four properties are the load-bearing claims of
this document and **nothing has ever checked any of them**. A property stated only in prose is a
property that drifts silently — which is the same lesson the corpus already learned about signs, one
level up. **The gate is owed before the repairs are, or the repairs will not hold.**

Canon's **build scripts** importing forge (`project`, `deploy`, `validate`, `module-scan`) is _not_ a
divergence — those are canon's build steps using the projector as a tool, which is what a tool is for.
The divergence is a **cell** importing it. Keep that distinction: it is the difference between a
corpus that is built by forge and a corpus that is defined by it.
