# P3 — object-import addressing + multi-plugin catalog discovery

**static (censused; re-verify at dispatch):** `packages/agent-forge/src/catalog/index.ts`
(`enumerateCatalog(corpusDimensionsDir)` — walks ONE corpus's `<dimension>/*.ts` per `DIMENSION_NAMES` × `ANATOMY`;
`valuesOf`; single-corpus, NO cross-corpus collision check) · `packages/agent-forge/src/anatomy/index.ts`
(`DIMENSION_NAMES` · `ANATOMY`) · `plans/plugin-cli/NORTH-STAR.md` §3 · **dep-fed:** P1's `AgentPlugin` contract.

**scope:** generalize discovery + addressing from single-corpus to multi-plugin:

- lift `enumerateCatalog` from one `corpusDimensionsDir` to the fragment dirs of EACH extended plugin; identity is
  namespaced by the plugin `name` segment (a per-plugin invariant — two plugins may both name a concept `parsimony`
  without collision; that is a resolution event, not a σ\* violation).
- fragment cross-references resolve by **imported binding** = a late-bound node identity (reads the RESOLVED value,
  post-patch — NORTH-STAR §3), never a string ID; enforce **acyclicity** (a reference cycle throws).
- **VOCAB (C2 LANDED):** the live symbols are `dimension`/`DIMENSION_NAMES`/`corpusDimensionsDir`/`Fragment` — build
  on them directly (the earlier "pin organ, C2 sweeps later" ordering note is moot; C2 already swept).

**accept (falsifier):** `enumerateCatalog` (or its multi-plugin successor) enumerates fragments across ≥2 plugins
with namespaced IDs; two distinct plugins sharing an anchor do NOT collide at discovery; a cross-plugin reference
cycle throws a named error; a new discovery test + `pnpm -C packages/agent-forge typecheck` green; a cold Ω\* read
decodes "fragments discovered per-plugin, addressed by import, resolved late." **dep:** P1 (wave 1).

**FEEDS THE LOADER (ratified from P2):** P3's per-plugin fragment enumeration is what P4's load step turns into
P2's `LoadedPlugin.contributions` (the fold atoms). Enumerate fragments with their imported-binding identity so the
resolver keys its `ResolvedAgentSet.fragments` map by object identity (object-import addressing, not string ids).
