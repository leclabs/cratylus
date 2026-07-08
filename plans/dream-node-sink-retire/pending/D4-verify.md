# D4 · VERIFY — the route is gone, the corpus is green

**Objective.** Prove the `AGENTS.md@node` route is fully retired and nothing regressed.

## Dependencies

D1, D2, D3 ⊳dep.

## Constraints / checks

- `pnpm test` (agent-anatomy) green — accept static floor, reader-density, projection-boundary.
- `COLD_ORACLE_LIVE=1` accept() over the corpus holds (the edited dream/wake/praxis/handoff formalBlocks +
  memory protocol pass the isolated blind decode).
- `pnpm project` + `project:human` deterministic; no emitted artifact references a node/plan `AGENTS.md` sink.
- Corpus-wide grep clean: `grep -rniE 'AGENTS-node|plan-agents-md' packages/agent-anatomy/src/` → 0 (a bare
  root-`AGENTS.md` pointer reference is fine; a node/plan memory-sink assumption is not).

## Acceptance

- FAIL if any check above reds.
- FAIL if a dream dry-run would still route an item to an `AGENTS.md@node`.
- Report: the retired-route diff summary + the green evidence (cache-bypassed).
