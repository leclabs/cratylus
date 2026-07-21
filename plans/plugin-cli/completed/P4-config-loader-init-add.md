# P4 — `agents.config.ts` loader + `init`(zero-config)/`add` + `compose --dry-run`

**static (censused):** `packages/agent-forge/src/deploy/config.ts` (`loadConfig()` parses the EXISTING
`.agent-factory.config` JSON → `AgentFactoryConfig`, schema-versioned — the deploy TOPOLOGY config) ·
`packages/agent-forge/src/cli/commands/init.ts` · `packages/agent-forge/src/deploy/init.ts` (`initSociety`) ·
`packages/agent-forge/src/cli/commands/compile.ts` (the `compose`/compile entry `--dry-run` attaches to) ·
`plans/plugin-cli/NORTH-STAR.md` §5 · **dep-fed:** P2 (`resolve()`), P3 (discovery).

**scope:** add the config-is-code layer + the two scaffold verbs, both thin callers into `resolve()`:

- a `c12`/`bundle-require`-style loader for `agents.config.ts` (TS/ESM, no build step) → `{ extends, patches }` →
  `resolve()`. `extends` are real imports (type-checked, IDE-complete).
- `init` scaffolds a zero-config `agents.config.ts` (`extends: [anatomy]`, empty `patches`).
- `add <plugin>` installs + wires a plugin into `extends`.
- `compose --dry-run` prints the resolved set WITHOUT writing; documents the local `file:`-link pre-publish
  workflow.
- **FORK (censused — resolve at execution, do not silently pick):** the existing `.agent-factory.config` JSON
  (`loadConfig`, deploy topology) is a DIFFERENT concern from `agents.config.ts` (plugin-extends). Decide whether
  `agents.config.ts` SUBSUMES it (config-is-code becomes the single home; deploy topology a field — RECOMMENDED per
  one-core-two-skins §5) or the two stay orthogonal. Ground the call on NORTH-STAR §5; document the decision.

**accept (falsifier):** an `agents.config.ts` with `extends: [anatomy]` loads (no build step) and resolves to the
anatomy default set; `init` scaffolds that file; `add` appends to `extends`; `compose --dry-run` prints the
resolved set and writes nothing; the config/topology fork is resolved + documented in the code; a new loader test +
`pnpm -C packages/agent-forge typecheck` green. **dep:** P2, P3 (wave 2).

**SEAM (ratified from P2, nico):** P1's `AgentPlugin` carries only dir strings; P2's resolver folds a
`LoadedPlugin = { name, contributions: PatchEntry[] }`. **P4 must wire the load step:** `AgentPlugin` dirs →
`LoadedPlugin` (scan each dir to fragment `contributions`) before calling `resolve()`. P3's multi-plugin discovery
produces the per-plugin fragment enumeration this load consumes.
