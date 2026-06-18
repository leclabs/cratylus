# fix-harness-projection-test

**State:** completed (2026-06-17) — **root cause = STALE TEST, not a composer bug** · **Lead:** Nico (driven by proxy under `/weitermachen`) · **Source:** discovered 2026-06-17 running the full toolkit test suite during the CITE-TWICE gate work.

**DONE.** Direct investigation showed the **composer is correct** — the provenance line already projects skill refs via `ref_text` (`/conceptualize` etc.). The test was stale on two counts: (1) `exemplify`'s composition grew 3→7 refs during the rule-completion arc, so the hardcoded `"...materialize."` string no longer matched; (2) check #2 wrongly flagged `exemplify`'s operative steps' **bold cite-once mentions** (`Invoke **conceptualize**`) as "unprojected refs" — but those are deliberate non-ref mentions (the anchors are cited once in Bindings). Fix: scoped the projection check to the **provenance line** (where composition refs live), asserting skills→/trigger + non-skills→bold there, tolerating cite-once bold mentions in operative prose. Full toolkit suite now **14/14 PASS**.

## Finding

`toolkit/test_harness_projection.py` **FAILs** with two assertions:

- `POSITIONS exemplify provenance: skill refs not projected`
- `POSITIONS exemplify body: a skill ref still rendered bold`

**Pre-existing** — confirmed FAILing on base `be9add5` (before any of this session's changes); `exemplify.md`
was not touched. The other 14 toolkit tests PASS. Not caused by the CITE-TWICE → FAIL change.

## Likely cause (unconfirmed — Mav to trace)

`exemplify.md` composes/references `kind: skill` cells (conceptualize · signify · materialize). The harness
ref-projection (`compose/harness.py` `ref_text`) appears to not project a skill ref the way the test expects
(a skill `[[ref]]` should become a `/trigger` link, not stay bold). Either the test's expectation drifted from
the composer, or the composer regressed on skill-ref projection inside a non-skill cell. Trace which.

## Done when

- `test_harness_projection.py` PASS (or the test corrected if its expectation is the stale side).
- Full toolkit suite green.
