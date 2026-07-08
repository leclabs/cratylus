# D3 · SKILL-DEPS — wake, praxis, signify

**Objective.** Reconcile the three skills that assume a node/plan `AGENTS.md` memory sink.

## Static inputs (pinned 2026-07-08)

- `packages/agent-anatomy/src/skills/wake.ts:10` — orient reads "the project's `AGENTS.md` ∧ the active plan's
  `plans/<plan>/AGENTS.md` (the plan-scope memory sink — may not exist until a dream first writes it; PLAN.md is
  the state mirror)".
- `packages/agent-anatomy/src/skills/praxis.ts:55` — `-- plan-agents-md-is-memory: a plan's AGENTS.md is the
semantic memory SINK at plan scope …`.
- `packages/agent-anatomy/src/skills/signify.ts:52` — `AGENTS.md` inside the ρ artifact-class list.

## Constraints

- **wake:10** — orient reads `PLAN.md` (plan state) + the source of truth; DROP "read the project's/plan's
  `AGENTS.md`" (the memory-sink read). Keep the liveness-gated plan bind (owner/occupied) + `active/` state.
- **praxis:55** — DELETE the `plan-agents-md-is-memory` law. A plan dir = `PLAN.md` + task-files (state folders)
  only; no `AGENTS.md`. (If any adjacent law says "AGENTS.md is memory, not just docs", strike it too.)
- **signify:52** — `AGENTS.md` KEEPS its place in the ρ artifact-class list (it is still a real artifact — a
  `rule`-projected file per D4, ρ=human/LLM per its binding), just not a dream-sink. Verify the surrounding
  gloss does not call it a memory sink; if it does, correct to "rule-projected instruction file".
- Each edited formalBlock re-passes `COLD_ORACLE_LIVE`.

## Acceptance (falsifier)

- FAIL if `wake.ts`/`praxis.ts` still read/route a node or plan `AGENTS.md` as memory.
- FAIL if `grep -n 'plan-agents-md' packages/agent-anatomy/src/skills/praxis.ts` matches.
- FAIL if `signify.ts:52` was deleted (the artifact class must stay) OR still glosses AGENTS.md as a sink.
