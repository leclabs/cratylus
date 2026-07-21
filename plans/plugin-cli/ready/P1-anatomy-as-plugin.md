# P1 — establish the plugin contract + make agent-anatomy the first plugin

**static (censused):** `packages/agent-forge/src/anatomy/index.ts` (`OrganValue<K>` types · `ANATOMY` map ·
`ORGAN_NAMES` — the fragment-kind surface a plugin exposes) · `packages/agent-forge/package.json` (the `exports`
map — `./anatomy`/`./catalog`/`./deploy` today; ADD a `./resolve` or `./plugin` subpath) ·
`packages/agent-anatomy/package.json` (`"private": true`, NO `exports`/`files` today) ·
`packages/agent-anatomy/src/{agents,skills,organs}/` (the dirs the anatomy plugin points at) ·
`plans/plugin-cli/NORTH-STAR.md` §2·§3 (contract shape).

**scope:** mint the plugin contract in the forge CORE (doctrine-agnostic) and make agent-anatomy the first plugin
that uses it — NO resolver logic (that is P2):

- forge: a `defineAgentPlugin({ name, fragments?, agents?, skills?, adapters? })` factory + `AgentPlugin` type,
  homed in a new `forge/src/resolve/` (or `forge/src/plugin/`) and exported via a new package subpath. `name` is
  the namespace segment; the dir fields are scanned per-plugin exactly as the existing directory-scan does.
  Addressing is by imported binding, never a string ID (NORTH-STAR §3) — a plugin's fragments reference others by
  binding; no `<plugin>:<dim>/<anchor>` string scheme.
- anatomy: add a `defineAgentPlugin(...)` **default export** (`name: 'anatomy'`, pointing at its fragment/agent/
  skill dirs). Make the package PUBLISHABLE: drop `"private": true`, add `exports` + `files` + the default entry.
  Stays a peer plugin, not the corpus.
- σ\* uniqueness is a per-plugin invariant (Q2) — do not add a cross-plugin collision check here (that is P2/P3).

**accept (falsifier):** `defineAgentPlugin` + `AgentPlugin` are exported from a forge subpath and typed;
`packages/agent-anatomy/package.json` has no `"private": true` and carries `exports` + `files` + a default export
that returns `defineAgentPlugin({ name: 'anatomy', … })`; `pnpm -C packages/agent-forge typecheck` and
`pnpm -C packages/agent-anatomy typecheck` both green; the full anatomy suite green (no projection regression); a
cold Ω\* read of the contract decodes "an npm package that declares which dirs supply fragments/presets, addressed
by import." **dep:** none (wave 0).
