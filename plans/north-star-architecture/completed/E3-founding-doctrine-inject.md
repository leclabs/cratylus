# E3 — R3: founding doctrine out of the engine (FoundingTemplate)

**static:** `packages/agent-forge/src/deploy/init.ts:1,3,15,36,108,150` · `packages/agent-anatomy/src/skills/praxis.ts`
(the `PLAN_STATES` canon source) · `../NORTH-STAR.md §2 R3`.
**scope:** extract the founding prose (`polis`/`politeia`/`mind-society`, `foundingAgentsMd`/`foundingPlanMd`) +
`PLAN_STATES` from `init.ts` into a `FoundingTemplate` injected from CANON; `init` emits structure +
placeholders only. `register.ts` `HUMAN_MARKERS` stays (general mechanism, not corpus doctrine).
**accept:** `git grep -iE 'polis|politeia|mind-society' packages/agent-forge/src/deploy/init.ts` = empty;
`PLAN_STATES` sourced from the praxis canon (no forge literal); `found`/`init <target>` still produces a valid
founded society (run it); typecheck green.
**dep:** E2 (reuse the injection pattern).
