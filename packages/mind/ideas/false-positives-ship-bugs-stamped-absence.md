---
kind: principle
delineation: Absence of a signal is ambiguous — stamp it affirmatively at capture; treat unstamped absence as ERROR, never PASS. Three verdicts only (PASS/FAIL/ERROR), no SKIP; bias toward false negatives because false positives ship bugs.
---

# False Positives Ship Bugs: Stamp Absence

Absence is ambiguous: the test didn't run, ran and found nothing, or ran and the writer forgot to record. A pipeline that reads unstamped absence as PASS evolves, under selection pressure, to omit checks — omission is cheaper than passing. The discipline: **stamp absence affirmatively at capture; unstamped absence is ERROR, never PASS.** Bias toward false negatives — a false negative wastes one investigation, a false positive ships a bug.

**Three verdicts only**, no SKIP:

- **PASS** — held; positive evidence on record.
- **FAIL** — tested and did not hold.
- **ERROR** — could not run, or precondition unmet.

"Nothing found" is **PASS with `isEmpty: true`** — affirmative evidence of vacancy, distinct from "did not look." An empty list is stamped `{matched: [], filter, scanned: N}` so the reader distinguishes "queried, none" from "forgot to query."

**Implementation-gap-stamping** — a not-yet-built feature is stamped (`not-yet-implemented(<ref>)`, `NotImplementedError` + ticket) so the next reader (human or LLM) doesn't infer completion from the surrounding finished code.

## See also

- [[lossless-floor]] — the principle this operationalizes at the capture boundary.
- [[dimension-decomposed-validity]] — where the verdicts attach.
- [[claims-cite-verifiable-coordinates]] — stamped uncertainty travels with the claim.
