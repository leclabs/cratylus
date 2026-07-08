# D1 · DREAM-ROUTE — drop AGENTS-node from dream's route

**Objective.** Remove the `AGENTS.md@node` target from `dream`'s routing so the skill never writes a node sink.

## Inputs

- `packages/agent-anatomy/src/skills/dream.ts` — the `route` declaration + the routing LAWS in the formalBlock
  (`route : record → { AGENTS-node · SEMANTIC · PROCEDURAL · vault · EPISODIC · drop }` and the
  `node(i)=plan ⇒ plans/<plan>/AGENTS.md` / `node(i)=project|package ⇒ <node>/AGENTS.md` laws).

## Constraints

- `route` codomain → `{ SEMANTIC · PROCEDURAL · vault · EPISODIC · drop }` (drop `AGENTS-node`).
- Remove the `node(i)=plan|project|package ⇒ …AGENTS.md` routing laws. A node-local fact worth keeping that is
  NOT in source → a code-site comment (out of dream's automated route); otherwise `drop`.
- Keep the `INVARIANT node(i) ∉ {HOME,legacy} ⇒ i ∉ SEMANTIC ∧ i ∉ PROCEDURAL` (agent-intrinsic stores stay
  clean) and the projection-dedup bar for PROCEDURAL.
- σ\* density preserved; formalBlock stays self-sufficient (re-passes the cold-oracle).

## Acceptance

- FAIL if `grep -iE 'AGENTS-node|AGENTS\.md' packages/agent-anatomy/src/skills/dream.ts` matches.
- FAIL if `route`'s codomain still lists an AGENTS/node target.
- FAIL if the cold-oracle (`COLD_ORACLE_LIVE`) rejects the edited formalBlock.
