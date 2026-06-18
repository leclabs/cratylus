# corpus-hardening — PLAN

Post-founding refinement backlog. Status mirror; task files live under state folders.

## Active

_(none — cite-once-sweep completed this session.)_

## Frontier (ready)

- **full-fleet-redeploy** · Mav (steward) — propagate the salience fix to the fleet. **fire ✓ + upmav ✓**
  (2026-06-17); remaining: forge/spark/ash + upgoose — **BLOCKED on reachability** (all probed unreachable via
  ssh this session). Deploy-neutral for this session's corpus + prettier work (defs byte-identical). Awaits
  reachability / next cadence. apps dropped.
- **prettier-markdown-adoption** · Nico (config+normalize) + Mav (hook) — **config + normalization DONE** (Nico,
  by proxy): `.prettierrc` (`proseWrap:preserve` + `embeddedLanguageFormatting:off`) + `.prettierignore` (excludes
  the generated GLOSSARY) committed; 39 markdown files normalized to prettier's fixpoint; verify.py PASS,
  fence/Protocol byte-identical, defs deploy-neutral. **Remaining (Mav, small):** wire prettier into the
  pre-commit pipeline (dev-dep + `.husky/pre-commit` step) — needs `pnpm install`, the build env.

## Backlog (pending)

_(none — the frontier is the backlog.)_

## Completed (2026-06-17 — corpus-hardening execution session, under `/goal complete plan execution`)

- **cite-once-sweep** (`e5dcb4f`) — cells 6/6 prose-free + CITE-TWICE promoted NOTE → hard FAIL in `verify.py`;
  `test_bindings.py` flipped to assert FAIL. The single-citation-home law is now mechanically enforced.
- **plan-retirement-principle** (`6106f1d`) — minted `ideas/plan-retirement.md` (transient scaffold; retire on
  result-homed ∧ rationale-homed; git = recovery net). CE∧ME blind-judge PASS.
- **crystallize-verbatim-salience** (`6106f1d`) — homed the competing-prior ⇒ verbatim-salience rule in
  `reader-prior-projection`; trimmed `recommendation-style`'s re-derivation to a citation. CE∧ME PASS.
- **fresh-optimization-pass** (`6bc95b5`) — resolved via a **bounded 8-auditor CE∧ME sweep over all 155 cells**
  (not a 147-agent rewrite, which the sweep proved unwarranted): ZERO fusions warranted (every candidate cleared
  as genuine MECE), `anchor ≡ signum aptissimum` canon, 3 high-confidence findings fixed (subject-binding defects,
  formalize prose-free, genuine-fork uncited recap), med-residue → `audit-residual-findings`.
- **audit-residual-findings** — **re-judged by direct read: all med findings are auditor over-claims, no
  defects** (self-sufficient-formalism's symbols are self-evident functionals — declaring them would
  over-formalize; provenance/regenerate share the three-way-merge _prior_; the cited glosses are normal style).
- **fix-harness-projection-test** — root cause was a **stale test, not a composer bug**: `exemplify`'s composition
  grew 3→7 + the check wrongly flagged cite-once bold mentions. Scoped the projection check to the provenance
  line; full toolkit suite **14/14 PASS**.

## Done (2026-06-17 — the rule-completion arc)

Through-line: the corpus enforced only **CE** (completeness — "it reconstructs"); we added the **ME**
(minimality — "and nothing redundant") half everywhere, then conformed the cells. The **CE ∧ ME dual gate** is
now the standing acceptance test (it caught 3 of Nico's own over-glosses). Landed:

- **prose-free end-state**, 6 pipeline cells (`552bf8f` signify + `489402c` the rest).
- **`self-sufficient-formalism` β/ι split** (`fa1a20e`) — four-source closure (table · defined-above · β
  composition · ι input); `composition ≜ {a|a∈β}`.
- **registry scope declared** (`051422c`) — standard ASCII math (dom/range/argmin) prior-assumed, not listed.
- **merge-dual** (`6d41aa7`) — `anchor-routing` fuse rule + exemplify `accept ⇔ reconstruct ≽ D ∧ minimal(F)`.
- **clause refinement** (`93299ae`) + **registry redesign** (`6f6c777`) + **set-builder │→|** (`8e504da`)
  - **recommendation-style → principal genus & verbatim-organ salience fix** (`66310e0`/`d46af93`).
