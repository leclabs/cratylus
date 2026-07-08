# dream-node-sink-retire

**Status: SPEC (praxis, census-grounded) — authored, not executed.** Materialized via `/praxis` with a live
corpus census (2026-07-08); every edit site below is pinned to a real `file:line`. Supersedes the earlier
hand-authored stub (which missed the toolkit doctrine + the rule-cell fork). Execution deferred.

## Intent

**Retire the `AGENTS.md@node` memory-sink route.** `dream` routes node-scoped knowledge to an `AGENTS.md` at
each node; that route is the accretion factory (the Operator cleared 9 sinks this session). The test: _nothing
stored in an `AGENTS.md` should be readable from the source of truth_ — almost nothing survives it. Collapse to
**one curated root `AGENTS.md`**, **no node memory-sinks**, non-derivable gotchas as **code-site comments**.

## Live census (the sites — pinned 2026-07-08)

- **`src/skills/dream.ts`** — 6 sites: `:7` description, `:20` `route` codomain (`AGENTS-node · …`), `:31` +
  `:32` the `node(i)=plan|project|package ⇒ …AGENTS.md` laws, `:38` `AGENTS-node write ≜ …`, `:39` `in-repo ⇒
dream-writes = versioned AGENTS-node only`, `:42` the `EPISODIC ──dream──→ {AGENTS-node · …}` cascade.
- **`src/genus/memory.md:7`** — frontmatter `description` only ("outward homes (AGENTS.md at scope nodes,
  vault)"). The `## Protocol` body (`:24-51`) is agent-intrinsic memory — **clean, untouched, no `make-base`**.
- **`src/skills/wake.ts:10`** — orient reads "the project's `AGENTS.md` ∧ the active plan's
  `plans/<plan>/AGENTS.md` (the plan-scope memory sink)".
- **`src/skills/praxis.ts:55`** — the `plan-agents-md-is-memory` law.
- **`src/skills/signify.ts:52`** — `AGENTS.md` in the ρ artifact-class list. **KEEP** — it is still a real
  artifact class (a `rule`-projected file, see the fork), just not a dream-sink; verify the gloss.
- **`src/toolkit/project-targets.ts:11`** + **`src/toolkit/rule-cell.ts:5-10,19,32`** — encode the OLD doctrine
  ("`AGENTS.md` IS a dream-written SelfAuthored sink, `SelfAuthored ∉ Target`, so NOT a rule target"). Must be
  reconciled — see the fork.
- **8 node `CLAUDE.md` `@AGENTS.md` partials** — `plans/`, `plans/run-the-business/`, `docs/{research,ideation}/`,
  `packages/{agent-forge,agent-anatomy,agent-anatomy/src/toolkit,agent-memory}/` — each imports a now-empty
  node `AGENTS.md`. (Root `CLAUDE.md → AGENTS.md` stays — it imports the curated root.)

## The fork (design decision the executing session RATIFIES — recommendation attached)

**`rule-cell.ts` says the sole blocker to a byte-locked repo-root `AGENTS.md` rule was the sink collision.**
Retiring the sink removes it. **Recommendation: promote the curated root `AGENTS.md` to a first-class `rule`
cell** (source-of-truth in the corpus, projected + byte-locked, REGENERABLE) — it gives `rule` (a live kind with
0 instances) its first real instance and makes "the curated root" canonical rather than a hand-edited file.
Alternative: leave root `AGENTS.md` a hand-maintained file (no rule). D4 carries this decision.

## Shards + waves

- **D1 · DREAM-ROUTE** (wave 0) — `dream.ts`, the 6 sites: drop `AGENTS-node` from `route`; delete the plan/
  project routing laws + the write/in-repo laws; route → `{SEMANTIC · PROCEDURAL · vault · EPISODIC · drop}`.
- **D2 · MEMORY-DESC** (wave 0) — `memory.md:7` description: drop the `AGENTS.md at scope nodes` outward-home.
- **D3 · SKILL-DEPS** (wave 0) — `wake.ts:10` (orient reads `PLAN.md` + source, not a node/plan sink),
  `praxis.ts:55` (retire `plan-agents-md-is-memory`), `signify.ts:52` (verify AGENTS.md stays as artifact class).
- **D4 · TOOLKIT-DOCTRINE + rule-fork** (wave 0) — `project-targets.ts:11` + `rule-cell.ts`: reconcile the
  "AGENTS.md = sink ⇒ ¬rule-target" doctrine; RATIFY the fork (root AGENTS.md → `rule` cell, recommended).
- **D5 · CLAUDE-PARTIALS** (wave 0) — remove the 8 node `CLAUDE.md` `@AGENTS.md` partials importing empty sinks;
  keep root. (If D4 makes root a rule, the root partial imports the projected root AGENTS.md.)
- **D6 · VERIFY** (wave 1, ⊳ D1-D5) — `pnpm test` + `project`/`project:human` + `COLD_ORACLE_LIVE` accept();
  corpus grep `AGENTS-node|plan-agents-md` → 0; if D4=rule: the root AGENTS.md rule projects + byte-locks.

**R:** D1,D2,D3,D4,D5 independent (wave 0, distinct files → wide fan-out) → D6 (wave 1). Max fan-out 5.

## See also

`src/skills/{dream,wake,praxis,signify}.ts` · `src/genus/memory.md` · `src/toolkit/{project-targets,rule-cell}.ts`
· the memory-organ home. Origin: Operator directive (session 3287f321) after clearing the node-sinks.
