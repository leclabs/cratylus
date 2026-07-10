# E6c — R6: memory verbs (apply/replace) + consolidation lifecycle + genus deletion

**static:** `packages/agent-memory/src/{dream.ts:200 (applyRoutes), cli.ts:595-611}` · `../SESSION-LIFECYCLE.md` ·
`packages/agent-anatomy/src/genus/memory.md` · `packages/agent-anatomy/src/skills/{wake,handoff,dream}.ts` ·
`packages/agent-forge/src/deploy/seeds.ts:33-66` · `../NORTH-STAR.md §3.2, §3.3`.
**scope:** (a) wire dead `applyRoutes` as `apply --routes '[{id,targets[]}]'` (route-decisions as DATA);
(b) add `replace` (whole-file supersede over the 2 prose stores, reusing the RouteTarget selector); (c) ship the
module's threshold-gated `turn.end` (Stop) nudge hook (cheap shell count of unconsolidated records, watermark
below compaction; calibrate the default); (d) rewrite `wake`/`handoff` as thin orchestrators calling
`memory.reconstitute`/`memory.consolidate` (no `episodic.mjs`; `orient` stays praxis); (e) DELETE `genus/memory.md`
— relocate its authored protocol (ENCODE-salience + scope-causality) + the seed content into the module's shipped
skills the agent reads at wake.
**accept:** `cli.ts` dispatches `apply` + `replace`; `applyRoutes` has a production caller; the Stop nudge ships +
fires on threshold (test); `genus/memory.md` gone; `git grep "episodic.mjs" packages/agent-anatomy/src` = empty;
wake reads the memory protocol from the module; memory + skill tests green.
**dep:** E6a, E6b.
