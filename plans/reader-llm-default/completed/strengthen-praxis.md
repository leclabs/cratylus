# strengthen-praxis — plans as topo-sorted execution-spec DAGs for fan-out

**Independent of `root-cause`** (parallel frontier); **gates `remediation-fanout`** and every future
fan-out. Lane: Nico (`praxis` is a skill cell he owns). Strengthen the `praxis` skill so a generated plan is
optimized for concurrent subagent execution with nico as acceptance judge.

## Inputs (read these — blind-dispatchable)

- The `praxis` cell: `packages/agent-anatomy/src/skills/praxis.ts` (source) → projected
  `~/.claude/skills/praxis/SKILL.md`. Its formal block already declares `slices` · `frontier` · `blocked` ·
  `promote` · `self-sufficient-task` · `fan-out-the-frontier`.
- Dogfood target: `plans/reader-llm-default/` (this plan) — must re-express cleanly under the result.
- Composer/verify gates for a skill cell: `skill-shape`, `symbols`.

## Problem

`praxis` already formalizes the pieces — `self-sufficient-task`, vertical `slices`
(shard-by-orthogonal-concern, MECE), dependency edges `R`, `frontier` / `blocked` / `promote`,
`fan-out-the-frontier`. But the **generated artifact under-delivers**: tasks aren't uniformly
blind-dispatchable execution specs, and the plan isn't emitted as an explicit topo-sorted vertical-slice DAG
a scheduler / Workflow can fan out. Close the gap between the formalism and the artifact.

## Scope — strengthen the `praxis` cell so a generated plan has:

1. **Each task = a self-sufficient execution spec** — blind-dispatchable to a subagent: explicit
   inputs/context, scope, and a **falsifiable** acceptance (state the blind-test falsifier). No task needs
   the plan's prose to be runnable.
2. **The plan = a topologically-sorted DAG of vertical slices** — MECE orthogonal-concern slices; explicit
   dependency edges; the topo order + **frontier waves** emitted, so a scheduler dispatches each frontier
   concurrently and `promote`s dependents on completion.
3. **Optimized for fan-out + nico-as-judge** — the slice cut **maximizes parallelism** (minimize cross-slice
   deps); the frontier **is** the concurrent dispatch set; returns integrate through a nico acceptance gate;
   the structure maps cleanly onto a Workflow (fan-out frontier → judge → promote).

## Acceptance

- The `praxis` cell, on generating a plan, emits blind-dispatchable execution-spec tasks **and** an explicit
  topo-sorted vertical-slice DAG (deps + frontier waves).
- **Dogfood:** `reader-llm-default` re-expresses cleanly under the strengthened praxis with no hand-fixes.
- CE∧ME on the cell edit; `skill-shape` + `symbols` gates green; the cell stays a self-sufficient set-builder.

## Deliverable (accepted 2026-07-01)

`src/skills/praxis.ts` strengthened: execution-spec shape `spec(t) = ⟨static, scope, accept⟩` with
static-pinned-at-authoring + dep-fed `{content(u) | (t,u) ∈ R}` (authoring marker `⊳dep`); falsifiability
law `∀t ∃r ¬accept(t)(r)`; topo strata `wave(n)` + `waves` schedule; `dispatch`/`judge` operations
(judge-not-author); maximize-fan-out cut law; mirror emits R + waves. Formal block deduplicated to one
`const` (formalBlock + body drift-class killed). Gates: 16/16 tests (symbols/skill-shape/projection-
stability/agent-delta) + tsc + build + lint green. Dogfood: this plan's specs + mirror conform with no
hand-fixes.
