---
'@cratylus/runtime': minor
'@cratylus/forge': patch
'cratylus': minor
---

The record's views show what stands, assayers' verdicts are recorded, and a development build says its commit (decision 0212).

- **Deprecation.** `concepts deprecate <id> --reason` records that a standing decision no longer applies and has no replacement. `concepts decide --cut <name>` names the cut a decision is about; once the ledger records that cut integrated, the decision reads as deprecated with no entry. `decide --keeps <context>/<cut>` keeps that cut's example file standing past its integration.
- **Views show what stands.** `concepts decisions` lists only standing decisions (open or accepted); `concepts state` lists them by entry, id, title and kind, their whole text being the decisions reading's; `concepts overview` tells only standing open ones; `concepts leakage` reads only standing decisions and the examples of cuts not integrated, or kept. `--history` on `decisions`, `state` and `leakage` adds every superseded and deprecated decision, each with what replaced it or why it no longer applies, and the examples that are history.
- **Verdicts.** The omp extension now records an assayer's verdict, and a lead's report, when the deliverable comes back as text: whole JSON, or the last fenced JSON block after prose, and for a background item from its `.md` output when no `.json` one exists. Judged work shows approved or failing, not only returned.
- **Build identity.** A `cratylus` run from the source tree it was built in reports its version with the commit it was built from as build metadata (`0.13.0+62c7b190`, `.modified` when built from uncommitted changes), in `cratylus --version` and so in `versionSkew report`; a release installed as a package reports its version alone.
