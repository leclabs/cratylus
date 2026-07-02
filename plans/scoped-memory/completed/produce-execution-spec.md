# produce-execution-spec — the scoped-memory redesign

**Status COMPLETED 2026-07-02.** Produced `../SPEC.md` (scope model · least-scope routing · encode/dream
mechanics · `AGENTS.md`-reconciliation · enforcement `audit` verb · migration; decisions D1–D5 with
rationale, D2 the flagged departure: single-store scope-tagged capture over per-scope raw streams) + the
sharded build plan: `pending/{corpus-scope-laws, runtime-scope-audit}` (wave 1) → `fleet-cutover`
(wave 2) → `depollute-migration` (wave 3), each ⟨static, scope, accept⟩ blind-dispatchable. All shards
HELD pending Operator approval of the SPEC. Acceptance (a)–(f) satisfied; blind-test: shards pin the
SPEC as static input and carry falsifiers a fresh reader can execute.

**This task = plan the plan.** Author a decision-grade **execution spec** (in planning mode) for the
scoped-memory redesign, seeded below. It does NOT implement — it produces the sharded build plan the
Operator approves into execution. Author: **Nico** (memory + corpus is his lane); the design calls are his
to make and assert, escalating only a genuine fork.

## The invariant to achieve

An agent's **own** files — `SELF.md` (identity/continuity) and `MEMORY.md` (durable semantic) — are
**always free of project- and plan-specific content**. They hold only cross-project, agent-intrinsic
material: who I am · how I work · system/host guardrails. Everything project- or plan-bound lives at
project or plan scope, never in the agent.

## Evidence — the mav pollution (the spec seed)

Ground truth on `upmav.lan` (`lcaraccioli@upmav`), captured 2026-07-01:

- `agents/mav/MEMORY.md` ≈ **27 KB**, saturated with web-platform / Upwork / direction-site / AWS-infra /
  people-cast / Linear-ticket facts — an agent-owned file turned project dumping-ground.
- `agents/mav/.bak/SELF.md.bak` (pre-edit) carried a project-specific **"Open threads / where I left off"**
  block (direction-site-v2, branch names, PR #111, task frontier) alongside genuine identity/Laws.
- **Operator hand-fix:** gutted `SELF.md` to a directive stub — _"Only: system specific guardrails;
  ¬Project, ¬Ops, ¬Soul"_ — and **moved "Open threads" into the active plan's `AGENTS.md`**
  (`~/workspaces/web-platform/plans/direction-site-v2/AGENTS.md`). This hand-fix **is** the target
  behavior to systematize.

## The Operator's routing rule (explicit)

Project/plan-specific memory routes by the **narrowest active scope**, in precedence:

1. **active plan** → that plan's `AGENTS.md` (sibling to the plan) — _reconciled the same way memories are
   reconciled: an `AGENTS.md` is part of the **memory system**, not the plan system._
2. **no active plan, plans exist** → the **RTB** plan (`run-the-business`).
3. **no plans at all** → the **project** `AGENTS.md`.
4. cross-project, agent-intrinsic only → the agent's own `SELF.md` / `MEMORY.md`.

## The generalization to design

- **Scope is an axis orthogonal to memory type.** Type (CoALA): episodic (event stream) · semantic
  (`MEMORY` / `AGENTS.md`) · identity (`SELF`) · procedural (skills). Scope: user(agent) ⊃ project ⊃ plan
  (⊃ task?). Each _(type × scope)_ cell has a home; `AGENTS.md` at plan/project scope **is** the semantic
  organ at that scope.
- **Scoped episodic capture.** An episodic entry is written at the scope of its context — plan-scoped
  entries live as a **sibling to the plan**, project-scoped beside the project, user-scoped beside the
  agent, ⟨X⟩-scoped likewise. The encode API derives the scope from context (cwd → project; active plan →
  plan).
- **Scoped draining.** Dream routes each raw item to the durable home of the **narrowest scope that
  dominates every context it is relevant to** (least-scope / locality). A plan-scoped stream drains into
  the plan's `AGENTS.md`; a project stream into the project `AGENTS.md`; only genuinely cross-project
  identity rises to `SELF`/`MEMORY`.
- **`AGENTS.md` reconciliation = memory consolidation.** When dream writes an `AGENTS.md` it dedups /
  net-currents it exactly like `MEMORY` (no scar · move-not-copy). This makes the "part of the memory
  system" claim mechanical.

## Expert framing — industry standards to apply (Nico)

- **CoALA** (Cognitive Architectures for Language Agents) — the canonical memory taxonomy
  working/episodic/semantic/procedural. We already realize episodic (stream) + semantic (`MEMORY`) +
  procedural (skills); this redesign adds **scope** as a clean orthogonal dimension.
- **MemGPT / Letta** — _core_ vs _archival/recall_ memory. Core memory is small, in-context, and holds
  **only** persona + the user relationship, explicitly NOT task detail. That is exactly our
  "agent-owned files stay pollution-free": `SELF`/`MEMORY` = core; the scoped `AGENTS.md` stores = archival
  at scope.
- **Generative Agents** (Park et al.) — memory-stream + reflection + relevance/recency/importance retrieval.
  Our EPISODIC = the stream, dream = reflection; scoping refines _where_ the stream and its distillate live.
- **Least-scope / locality** (from lexical scope + config precedence system>user>project>local) — the
  load-bearing rule: **a memory homes at the narrowest scope that contains all contexts it is relevant to.**
  Promotion to a wider scope demands evidence of cross-scope relevance; the default is narrow.

## What the spec must design

1. **Scope model** — the scope lattice (user/agent ⊃ project ⊃ plan ⊃ task?), and how the active scope is
   resolved at encode-time and at dream-time (cwd, active plan, host).
2. **Per-scope homes** — where each scope's episodic stream + semantic store physically live (path
   conventions), reconciling the LOCAL-PER-HOST nature of agent/host memory with the version-controlled
   nature of project/plan `AGENTS.md`.
3. **Encode routing** — `episodic.mjs encode` becomes scope-aware (writes to the context's scoped stream);
   `--scope` / `--home` semantics.
4. **Dream routing** — the algorithm draining each scoped stream to its narrowest-dominating-scope home;
   `AGENTS.md` reconciliation (dedup / net-current / move-not-copy); the pollution-free guarantee for
   `SELF` / `MEMORY`.
5. **`memory` skill + Protocol edits** — encode / dream / wake taught the scope model; the Memory Protocol
   block updated.
6. **`praxis` integration** — a plan's `AGENTS.md` is a first-class memory sink; wake/orient reads the
   scoped stores for the active plan/project.
7. **Migration** — de-pollute existing stores (mav's 27 KB `MEMORY.md` → project/plan `AGENTS.md`; nico's
   own `SELF`/`MEMORY` audited), move-not-copy; a one-time reroute.
8. **Enforcement** — a gate/lint that FAILS if `SELF`/`MEMORY` holds project/plan-scoped content
   (codify ⇒ lint ⇒ conform, one change).

## Constraints / invariants

- **Generic, corpus-level** — not mav- or nico-specific; the design lands in the anatomy + skills so every
  agent inherits it.
- **Net-current / no-scar · move-not-copy · SOUL never written** — the standing memory laws hold.
- **Memory is LOCAL-PER-HOST** for agent + host scopes; project/plan `AGENTS.md` are shared,
  version-controlled artifacts — the spec must reconcile the two natures.
- **Pollution-free is provable** — the invariant carries a falsifier (the enforcement gate), not merely a
  disposition.

## Adjacent (note, do NOT absorb)

The **execution-organ** question rides alongside but is separate: mav's anti-typism brake is load-bearing
_until the SOUL carries intent-extraction in a dedicated execution organ_ (`SELF.md.bak` note, 2026-06-30 —
Provenance is a weak enforcement site). That is a SOUL / organ-catalog concern, independent of both
memory-scoping and packaging. Keep it a pointer; resolve separately.

## Acceptance

A decision-grade execution spec exists that: (a) states the scope model + the least-scope routing algorithm
precisely; (b) specifies encode + dream + `AGENTS.md`-reconciliation mechanics; (c) covers `memory`-skill +
`praxis`-skill + `episodic.mjs` integration; (d) covers migration of the existing polluted stores;
(e) names the pollution-free invariant AND its enforcement gate; (f) is approvable by the Operator into its
own sharded build plan. **Blind test:** a fresh reader builds from it without re-deriving intent.
