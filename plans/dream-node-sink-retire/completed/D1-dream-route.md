# D1 · DREAM-ROUTE — strip AGENTS-node from dream's formalBlock

**Objective.** Remove the `AGENTS.md@node` target + its laws from `dream`'s formalBlock so the skill never
writes a node sink.

## Static inputs (pinned 2026-07-08)

- `packages/agent-anatomy/src/skills/dream.ts` — 6 sites: `:7` (σ_human\* description), `:20`
  (`route : record → { AGENTS-node · SEMANTIC · PROCEDURAL · vault · EPISODIC · drop }`), `:31`
  (`node(i) = plan ⇒ i ↦ plans/<plan>/AGENTS.md`), `:32` (`node(i) = project ∨ package ⇒ i ↦ <node>/AGENTS.md`),
  `:38` (`AGENTS-node write ≜ dedup ∧ net-current ∧ move-not-copy`), `:39` (`in-repo ⇒ dream-writes = versioned
AGENTS-node only ∧ ¬raw-telemetry`), `:42` (`EPISODIC ──dream──→ { AGENTS-node · … }`).

## Constraints

- `route` codomain (:20) → `{ SEMANTIC · PROCEDURAL · vault · EPISODIC · drop }` (drop `AGENTS-node`).
- Delete the routing laws :31, :32 (the `node=plan|project|package ⇒ …AGENTS.md` lines), :38 (`AGENTS-node
write`), :39 (`in-repo ⇒ … AGENTS-node only`).
- Cascade :42 → `EPISODIC ──dream──→ { SEMANTIC · PROCEDURAL · EPISODIC · vault }`.
- Description :7 → drop "scoped knowledge and next-steps to the node's AGENTS.md"; keep the SEMANTIC/PROCEDURAL/
  vault/drop routing. (σ_human\* — a selection line, not σ\*.)
- KEEP the invariant `node(i) ∉ {HOME·legacy} ⇒ i ∉ SEMANTIC ∧ i ∉ PROCEDURAL` (:30) and the projection-dedup
  bar. A node-local non-derivable fact worth keeping → a code-site comment (outside dream's route); else `drop`.
- formalBlock stays self-sufficient (re-passes `COLD_ORACLE_LIVE`); no dangling `AGENTS-node` token.

## Acceptance (falsifier)

- FAIL if `grep -niE 'AGENTS-node|AGENTS\.md' packages/agent-anatomy/src/skills/dream.ts` matches.
- FAIL if `route`'s codomain still lists a node/AGENTS target.
- FAIL if `COLD_ORACLE_LIVE=1` rejects the edited formalBlock, or `pnpm test` reds on dream.
