# T6 rename-carry-on

R=LLM. lead: Nico. dep: none (independent; gated only by T8 deploy).

obj ≜ rename the skill `weitermachen → carry-on`, keeping **weitermachen** as a recognized trigger word in the
delineation + body (it is the evocative origin word, not the anchor).

do ≜ `git mv packages/mind/skill/weitermachen.md packages/mind/skill/carry-on.md`; set H1 `# carry-on`; keep
`trigger: /carry-on` (already set); ensure the delineation + body still name `weitermachen` (and "carry on",
"proceed") as trigger words. Update any `[[weitermachen]]` refs across the corpus to `[[carry-on]]`. Grep for
stragglers (`weitermachen` should survive ONLY as a trigger word, never as the anchor/slug).

acc ⊨ cell is `skill/carry-on.md`, anchor `carry-on`, weitermachen present only as trigger-word prose; no
dangling `[[weitermachen]]`; `resolve → verify` PASS; skill projects with `/carry-on` trigger. → `completed/`.

## Outcome (done 2026-06-23)

Renamed `skill/weitermachen.md → skill/carry-on.md` (H1 `# carry-on`, formula `carry-on ≜ …`); `weitermachen` retained as a trigger word in delineation + body + trigger-weight. Swapped `[[weitermachen]] → [[carry-on]]` in wake.md + handoff.md. Renamed manifest `weitermachen.json → carry-on.json` (+ source field) and fixed `home_slug` in wake.json + handoff.json. resolve→glossary→verify PASS (R1+R2+R3).
