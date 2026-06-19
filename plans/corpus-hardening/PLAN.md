# corpus-hardening — PLAN

Post-founding refinement backlog. Status mirror; task files live under state folders.

## Status — COMPLETE (2026-06-18); retirement-eligible pending one batched deploy

All exit criteria met AND the headline sweep is genuinely run: (1) cite-once convention enforced
(CITE-TWICE→hard FAIL); (2) verbatim-salience rule canon (homed in `reader-prior-projection`); (3) salience fix
deployed fleet-wide (6 hosts, sha256-verified); (4) markdown formatting no longer produces spurious diffs.

**The headline `fresh-optimization-pass` (the full corpus sweep) is now DONE for real** (`5042653`): all 151
`ideas/` cells re-conceptualized as one source — **zero** structural candidates (partition sound), 27 redundant-
recap trims applied CE∧ME-blind-judged (119 already clean, 5 over-trims correctly rejected), `verify.py` PASS +
toolkit 14/14. One residual: `arch-doc-writer`'s rendered def drifted and **rides the next fleet deploy** (batched;
a single cosmetic trim does not warrant a standalone 6-host cycle). Retire this plan once that deploy lands.

## Frontier (ready)

_(none — the corpus sweep is done; see Completed.)_

## Backlog (pending)

_(none.)_

## Completed (2026-06-17 — corpus-hardening execution session, under `/goal complete plan execution`)

- **cite-once-sweep** (`e5dcb4f`) — cells 6/6 prose-free + CITE-TWICE promoted NOTE → hard FAIL in `verify.py`;
  `test_bindings.py` flipped to assert FAIL. The single-citation-home law is now mechanically enforced.
- **plan-retirement-principle** (`6106f1d`) — minted `ideas/plan-retirement.md` (transient scaffold; retire on
  result-homed ∧ rationale-homed; git = recovery net). CE∧ME blind-judge PASS.
- **crystallize-verbatim-salience** (`6106f1d`) — homed the competing-prior ⇒ verbatim-salience rule in
  `reader-prior-projection`; trimmed `recommendation-style`'s re-derivation to a citation. CE∧ME PASS.
- **fresh-optimization-pass** (`5042653`) — **DONE for real** (`completed/fresh-optimization-pass.md`). The
  agreed corpus-as-one-source sweep: multi-agent Workflow over all 151 cells, **zero** structural candidates
  (no fusion/homeless/MECE — partition sound), 27 redundant-recap trims applied, each blind-judged **CE∧ME**
  (`reconstruct ≽ D ∧ minimal`); 119 already clean, 5 over-trims correctly rejected by the judge. Gate
  Nico-reverified: `verify.py` PASS (round-trip+reconstruct R1+R2+R3), toolkit 14/14, prettier clean. The earlier
  bounded audit (`6bc95b5`: the axiom + 3 fixes) stands as a prior; this is the deliverable it was not. Residual:
  `arch-doc-writer` projection drift rides the next batched fleet deploy.
- **audit-residual-findings** — **re-judged by direct read: all med findings are auditor over-claims, no
  defects** (self-sufficient-formalism's symbols are self-evident functionals — declaring them would
  over-formalize; provenance/regenerate share the three-way-merge _prior_; the cited glosses are normal style).
- **fix-harness-projection-test** — root cause was a **stale test, not a composer bug**: `exemplify`'s composition
  grew 3→7 + the check wrongly flagged cite-once bold mentions. Scoped the projection check to the provenance
  line; full toolkit suite **14/14 PASS**.
- **prettier-markdown-adoption** (`f659a23`+`a8ad719`) — FULLY landed: `.prettierrc`
  (`proseWrap:preserve`+`embeddedLanguageFormatting:off`) + `.prettierignore`, 39 md normalized to fixpoint
  (deploy-neutral), **+ pre-commit hook** (`prettier@3` devDep + `.husky/pre-commit` staged-md gate) verified
  end-to-end and committed with the hook ACTIVE. Markdown formatting no longer produces spurious diffs.
- **full-fleet-redeploy** (2026-06-18) — fleet returned; deployed **forge/spark/ash/upgoose** at HEAD, joining
  fire+upmav: **6/6 hosts, every `nico.md` sha256-matched the render**, salience fix present, sidecars preserved.
  ash needed a host-key refresh (reimaged); upgoose needed `--user lcaraccioli`. The exit criterion
  "deployed fleet-wide" is met.

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
