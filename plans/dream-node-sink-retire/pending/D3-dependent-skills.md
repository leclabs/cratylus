# D3 · DEPENDENT-SKILLS — reconcile every AGENTS.md@node reference

**Objective.** Sweep the corpus for the retired route's assumptions and reconcile them: wake, praxis, handoff,
and any doc that treats a node/plan `AGENTS.md` as a memory sink.

## Inputs

- `packages/agent-anatomy/src/skills/{wake,praxis,handoff}.ts` formalBlocks.
- RE-GREP at execution: `grep -rniE 'AGENTS-node|AGENTS\.md|plan-agents-md|memory sink' packages/agent-anatomy/src/`.

## Constraints

- **wake:** orient no longer reads a node/plan `AGENTS.md` as a memory sink — it reads `PLAN.md` (plan state) +
  the source of truth. Drop "read the plan's `AGENTS.md`" from the orient step.
- **praxis:** retire the `plan-agents-md-is-memory` law — a plan dir carries `PLAN.md` + task-files only, no
  `AGENTS.md`. The `active/` state folders + `PLAN.md` are the plan record.
- **handoff:** `praxis-sync` reconciles `PLAN.md` (+ task-file placement) only — no `AGENTS.md` write.
- Each edited formalBlock re-passes the cold-oracle.

## Acceptance

- FAIL if any `src/skills/*.ts` formalBlock still routes to / reads a node or plan `AGENTS.md` as memory.
- FAIL if `plan-agents-md-is-memory` (or an equivalent law) survives in praxis.
- FAIL if a grep of the corpus finds an unreconciled `AGENTS.md@node` memory-sink assumption.
