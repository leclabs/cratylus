# repo-structure-firstprinciples

**Goal.** Bring the polis monorepo's directory & package structure into first-principles alignment
with pnpm-monorepo conventions and industry best practice, and **de-palimpsest** ([[palimpsest]])
the repo's directory + file naming — strip stale/layered/inconsistent residue so the path mirrors the
identity. This is the structural correction the founding left implicit.

**Status: PLANNING — this plan is the spec, not the migration.** Every task below is decided/specced
here; execution is a separate, Operator-gated arc. No package is moved, renamed, or collapsed by
landing this plan. The deliverable is a converged, sign-off-ready execution spec captured as tasks.

**Scope.**

- `packages/*` layout — flat-vs-nested, the koine-collapse decision, `mind`'s non-member status.
- Root build/config coherence — `pnpm-workspace.yaml` globs/catalog/onlyBuiltDependencies, `turbo.json`,
  `tsconfig.json` references, `.changeset/config.json` (`fixed`/`access`), biome.
- Package-name <-> directory correspondence (dash-flat names under a nested path).
- `[[palimpsest]]` cleanup repo-wide: agentir residue, stale cross-refs to retired paths, the
  `koine/episodic` vs `koine-episodic` mismatch, stale "alignment pending" prose, any other residue.
- First-principles surface: root loose-file hygiene, `plans/` conventions, `docs/`, `.scratchpad/`.

**Out of scope.** Corpus semantics (`packages/mind/ideas/**` cell content) — Nico's lane; the live
agent-organs data store (external runtime DATA) — never folded into a code package; the migration
execution itself (separate arc).

**Lead.** Mav — structure & build are the infra lane, his call. **Naming decisions** (renames, new
package names) are flagged for **Nico** ([[signify]] / [[precise-circumscription]] — naming is his
advisory authority); Mav leads structure, Nico signs off on names. **Operator** owns the two
publish-intent / domain-home forks (see PLAN.md "Forks needing sign-off").

**Method.** First-principles review grounded in [[defer-the-package-boundary]] (a boundary is a cost
paid only against a nameable forcing function) and [[palimpsest]] (a name accreted in layers must be
scraped back to one coherent surface). Every claim empirically verified against the live tree before
it becomes a task — no inherited assumptions.

**Exit criteria (of the PLANNING plan).**

- The target structure is specified concretely (every package's final dir + name + exports/bin).
- Each migration step is an ordered task with file-level touch-list + per-task exit criteria + rollback.
- Every fork that needs Operator or Nico sign-off is named explicitly, with the recommended pick and
  its rationale, so sign-off is a yes/no — not an open design question.
- Fleet/deploy implications of any path change are called out per task.
