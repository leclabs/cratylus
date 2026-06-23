# episodic-raw-store-home

leads: **Nico** (contract — the `memory` cell ruling) + **Mav** (runtime — `packages/episodic`).

obj ≜ raw EPISODIC capture must never live in a project working tree. **Root cause:** a
`scope: project:<key>` record resolved its raw store via `resolveFile(env, scope, DEFAULT)` →
`projectRoot/EPISODIC.jsonl` = the repo root; a 0-byte stray got `git add`-ed into the polis tree.

ruling ≜ **raw capture is single-store, agent-home only; `scope` is a routing TAG, never a
storage-location selector.** `resolveFile`'s `project→projectRoot` survives ONLY for routed dream
targets (where distilled content graduates — SELF/MEMORY/AGENTS/vault), i.e. `dream.resolveTarget`.

do ≜

- **Nico (contract, DONE):** `ideas/memory.md` — `## EPISODIC schema` sharpened (raw=home, scope=tag,
  resolveFile=routed-target-only) + `## Tool` encode line (no `--project-root` to relocate raw capture).
- **Nico (cleanup, DONE):** `git rm` the tracked root `EPISODIC.jsonl`; `.gitignore` guards
  `EPISODIC.jsonl`/`MEMORY.md`/`SELF.md` (memory stores are never repo-tracked).
- **Mav (runtime, delegated):** `store.ts` raw-log locator always home-anchored (`rawFile`); `encode`
  records `scope` as a field but writes home; `read`/`compact`/`applyRoutes` on the home log;
  `resolveTarget` UNCHANGED; `cli.ts` `--scope` = tag/filter; rebuild `dist/episodic.mjs`. Invariants
  held: atomic compaction · idempotence · no-loss migration · ULID monotonicity · portability.

acc ⊨ `encode --scope project:<key>` (even with a projectRoot set) lands in `agentHome/EPISODIC.jsonl`
and creates NOTHING under projectRoot (regression test) · `pnpm build && test && typecheck` green in
`packages/episodic` · `resolve.test.ts` unchanged-green · corpus verify PASS on the `memory` cell edit ·
Nico re-verifies the runtime gate himself before commit.
