# D6 · VERIFY — the route is gone, corpus green, root canonical

**Objective.** Prove the `AGENTS.md@node` sink is fully retired and nothing regressed.

## Dependencies

D1, D2, D3, D4, D5 ⊳dep.

## Checks

- `pnpm test` (agent-anatomy) green — accept static floor, reader-density, projection-boundary, hook/rule
  boundary (D4 may touch `rule-cell`).
- `COLD_ORACLE_LIVE=1` accept() over the corpus holds (edited dream/wake/praxis/signify formalBlocks + memory
  desc pass the isolated blind decode).
- `pnpm project` + `project:human` deterministic; no emitted artifact routes to / reads a node `AGENTS.md` sink.
- **Corpus grep clean:** `grep -rniE 'AGENTS-node|plan-agents-md' packages/agent-anatomy/src/` → 0; any
  surviving `AGENTS.md` mention is either the ρ artifact class (signify), the codex projection surface
  (`project-cli-codex.ts`, a generated non-sink), or — if D4=A — the root `rule` cell. No memory-sink assumption.
- **If D4 ratified A:** the root `AGENTS.md` `rule` cell projects + byte-locks (`project:targets` green); the
  root `AGENTS.md` on disk equals the rule's `body`.

## Acceptance (falsifier)

- FAIL if any check reds.
- FAIL if a dream dry-run would still route an item to an `AGENTS.md@node`.
- Report: the retired-site diff summary, the ratified fork branch (A/B), and the green evidence (cache-bypassed).
