# E7 — R7: delete the dead citation apparatus

**static:** `packages/agent-anatomy/test/skill-shape.test.ts` (`REF_RE`, `hasProseFormula`, CITE-TWICE) ·
any `docs:check` wikilink references (grep) · `../census/C3-citation-memory-prose.md` · `../NORTH-STAR.md §2 R7`.
**scope:** delete the orphaned `[[…]]` parser (`REF_RE`) + the `hasProseFormula`/CITE-TWICE test arm (matches
zero live cells; its mirrored composer helpers no longer exist) and the unimplemented `docs:check` wikilink
gate. KEEP the bare-σ* skill `≜`-composition formula (the LIVE model; Ω*-confirmed self-sufficient).
**accept:** `git grep "REF_RE" packages` = empty; no `[[…]]`-parser or wikilink docs:check remains; the
`skill-shape` suite passes (adjusted, still non-vacuous on a real violation); repo typecheck green.
**dep:** none.
