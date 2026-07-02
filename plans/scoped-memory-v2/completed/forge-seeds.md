# forge-seeds — deploy seeds retarget to the v2 stores

**Lane** Mav · **wave(0)** · deps: none (SPEC static) · HELD until Operator approves `../SPEC.md`.

## Static

`../SPEC.md` D1 (stores) + D5 coverage law. Source: `packages/agent-forge/src/deploy/seeds.ts`
(`SEED_FILES = [SELF.md, MEMORY.md, EPISODIC.jsonl]`, seeded-if-absent on every deploy) + its
consumers `deploy/{local,index}.ts` + `packages/agent-forge/test/` deploy coverage.

## Scope

`packages/agent-forge/**` ONLY: `SEED_FILES` → `{SEMANTIC.md, PROCEDURAL.md, EPISODIC.jsonl}` with
seed content matching the v2 store headers; no other deploy behavior changes (seed-if-absent,
never-clobber, never-prune all unchanged).

## Accept (falsifiers)

- Deploy to a scratch home seeds exactly the three v2 files; a second deploy over a populated home
  touches none of them (never-clobber proven by mtime/sha); `SELF.md`/`MEMORY.md` are NOT created
  under any input (a home carrying only v2 stores stays v1-free after deploy — the resurrection
  case is the named failing return).
- Repo gates 4×0.

**Outcome (2026-07-02):** completed — see git; judge re-verified falsifiers live (bundle probes / fresh-seed deploy / blind-reader transcript + 36-36 suite).
