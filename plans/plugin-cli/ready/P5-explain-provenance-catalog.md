# P5 — `explain` + provenance + first-class `catalog` discovery

**static (censused):** `packages/agent-forge/src/cli/commands/catalog.ts` (the existing catalog command to elevate)
· `plans/plugin-cli/NORTH-STAR.md` §5 · **dep-fed:** P2 (`resolve()` must surface per-node provenance).

**scope:** ship the inspection tooling every succeeding precedent shipped early (`eslint --print-config`,
`terraform plan`):

- `explain <agent>` — for each fragment in the resolved agent: which plugin it came from, which `patch` (if any)
  modified it, and the final resolved body. Provenance is read off `resolve()`'s output (P2 must carry it per
  node — coordinate the shape).
- elevate `catalog` to a FIRST-CLASS discovery command: list the extendable fragment IDs across ALL extended
  plugins, so a first-timer needs no source-archaeology.

**accept (falsifier):** `explain <agent>` reports, per fragment, its source plugin + any applied patch + the
resolved value (asserted against a 2-plugin fixture where a patch is visibly attributed); `catalog` lists
cross-plugin fragment IDs; a new inspection test + `pnpm -C packages/agent-forge typecheck` green; a cold Ω\* read
of the `explain` output decodes "why this fragment won + its final value." **dep:** P2 (wave 2).
