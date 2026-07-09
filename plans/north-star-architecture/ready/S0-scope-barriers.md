# S0 — remove nico/mav scope barriers (whole-project vision)

**Concern (orthogonal):** the agent-configuration barriers that scope nico → CANON and mav → ENGINE.
Operator intent: both agents see + own the whole project holistically. `nico.role` is already `build`
(done by Operator). Remove the _remaining_ boundary conditions.

**static (pinned — censused):**

- `packages/agent-anatomy/src/agents/nico.ts` (`description`, `persona`), `mav.ts` (`description`, `persona`)
- `plans/run-the-business/PLAN.md:37-39` (dangling `CLAUDE.md` "lane split" See-also)
- root `CLAUDE.md` (= `@AGENTS.md`; lane-split doc already absent — verify nothing re-adds it)
- `packages/agent-anatomy/src/hooks/stance-guardrail-pre.ts:20,44` + `guardrail/*.sh` allowlist `nico mav`
  (STANCE guard — NOT a scope barrier; leave binding unless debate says otherwise, note explicitly)

**scope:** nico's + mav's identity/selection surfaces only. Not the engine refactor (that is wave 2).

**barriers to remove (the edit set):**

1. `nico.description` — currently "when work touches the canon — organ catalogs, agent/skill composites,
   repo-wide naming". Broaden: nico is invocable for whole-project canon+architecture work.
2. `mav.description` — already "across packages, tooling, delivery"; verify it does not disclaim design/canon.
3. Reconcile `persona`s so neither disclaims the other's territory (nico may still be the ontology/naming
   specialist and mav the delivery specialist — the SPECIALTY stays; the SCOPE-of-vision barrier goes).
4. Purge the dangling `CLAUDE.md` lane-split reference in RTB See-also.

**accept (falsifier):**

- neither `description` scope-_restricts_ to canon-only / engine-only (both admit whole-project work);
- no dangling reference to a "lane split" doc remains (grep clean);
- `pnpm -w typecheck` (or the repo's tsc) green; agent projection re-runs clean (`project-cli` --check or equiv);
- a fresh Ω\* read of each edited `description`/`persona` does NOT decode a canon-only/engine-only remit.

**dep:** none (wave 0, independent of the refactor).
