# 0004 — skills-flatten: acceptance met; asset-mechanism collapse deferred

- **Status:** Accepted (scope ruling)
- **Date:** 2026-06-20
- **Deciders:** Mav (principal-ic lead) — conatus session

## Context

`skills/flatten-skills-and-assets` operations: (1) move dir-form skill cells to flat + relocate
their `assets:`; (2) drop the dir-form branch from `cells.py` / `resolve._stage_assets` (front-matter
path only); (3) byte-identity.

Discovery on the live corpus: there are **no dir-form skill cells** and **no `assets:` (dir-form)
users** — the only companion mechanism in use is `memory`'s `bundle:` (a front-matter ROOT-relative
path). Skills are already flat (the `migration` slice moved them). Therefore:

- op1 is a **no-op** (nothing to move or relocate).
- The task's **acceptance end-state** — "no `ideas/<slug>/<slug>.md` dir-form remains; every skill
  renders its prior SKILL.md + assets byte-identically; `test_place.py` green" — is **already
  satisfied** (confirmed: byte-identical fleet, 17/17 tests).

## Decision

The structural flatten's skills half is **complete by acceptance**. **op2** — collapsing the two
companion mechanisms (retire dir-form `cell_dir` / co-located `assets:` in favor of `bundle:`-style
front-matter paths) — is a separable code-simplification with **zero current users** and **no
byte-identity safety net** (its only guard is `test_place.py §1`, which the refactor itself rewrites).
It is **deferred as a focused follow-on**, not rushed at a session tail: retiring tested capability
warrants the test rewrite serving as the safety net, in a pass where that is the focus.

## Follow-on (tracked)

**`asset-mechanism-collapse`** — make `assets:` a ROOT-relative front-matter path like `bundle:`;
remove `cell_dir` + the dir-form branches in `cells.py` (`_cell_text` / `exists` / `cell_path` /
`corpus_slugs`) and `resolve._stage_assets`; rewrite `test_place.py §1` to exercise the path-based
mechanism. Byte-identity holds trivially (no users); correctness rests on the new test.
