# ε — Update /praxis: tasks are impl specs; fan out vertical slices (impl spec)

**Slice.** ε · standalone (no spine dep) · **dogfooded by this very plan**. **Owner.** Nico (corpus) · principal (doctrine).

**Objective.** Embed two concepts into the `[[praxis]]` skill so every future plan is built this way:
(1) each sharded task is a self-sufficient **implementation spec**; (2) `start` **precomputes
parallelizable vertical slices** and the **frontier is a fan-out set**, not a single next step.

**Preconditions.**

- praxis source = `packages/mind/ideas/praxis.md` (the `.render/skills/praxis/SKILL.md` is **generated** — do not hand-edit).
- conventions: `packages/mind/ideas/AGENTS.md`; lineage `[[shard-by-orthogonal-concern]]` · `[[sharded-plan-layout]]` · `[[principal-agency]]`.

**Operations.**

1. **Mint two cells** (signify the anchors blind, per the gate):
   - `principle` — _a task is an implementation spec_: a sharded task is self-sufficient
     (`objective · preconditions · operations · artifacts(paths) · acceptance(blind test)`; `out-of-scope`
     only for a genuine exclusion, never reflexive) so the executing agent re-derives nothing. Anchor: blind-test
     (`task-is-an-implementation-spec` / `spec-not-stub`).
   - `principle` — _precompute parallelizable vertical slices; fan out the frontier_: decompose into
     **vertical** (end-to-end per concern) slices cut so they don't collide ([[shard-by-orthogonal-concern]]);
     the ready-frontier is a **set** dispatched concurrently, each slice carrying its fan-out width.
     Anchor: blind-test (`fan-out-the-frontier` / `parallelizable-vertical-slice`).
2. **Edit `praxis.md`:** add both to the _Composed from_ line + a short section; extend the formal block
   so `start : intent ↦ (P, slices)` precomputes vertical slices and `frontier(P)` is the fan-out set;
   keep the state machine (`States`, `next`, `advance`, `sync`) intact. Cite-don't-copy.
3. **Regenerate** the praxis render via the projector (toolkit); refresh glossary if anchors are new.
4. **Gate:** `verify.py` + round-trip; a blind reader of the updated praxis reconstructs both concepts.

**Artifacts.** `packages/mind/ideas/praxis.md` (edited) · 2 new cells · regenerated
`.render/skills/praxis/SKILL.md` · glossary.
**Acceptance.** verify PASS; blind-equivalence on the two new concepts; render reflects them.
