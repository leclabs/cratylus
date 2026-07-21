# C1 — rename the genus axis STANCE/CONATUS → Persona/Constitution

**REVISED target (clean argmin re-probe `/tmp/cold-panel/min.txt`): `STANCE` → Persona · `CONATUS` → Constitution**
(was Presentation/Disposition — refuted as a leading-prompt artifact; see MAPPING §FLAGGED). Genus A `Persona`
couples to a persona-FIELD rename (`archetype`/`essence`) needing its own argmin probe, OR use `Posture` for the
genus to keep the field — open sub-fork.

**FOLDED INTO `C2`** — the genus rename is one facet of the single coherent core-vocabulary re-signification
(`organ`→`dimension` · genus→Persona/Constitution), executed as one sequenced pass. This file remains the
genus-specific execution detail (esp. the `stance-guardrail` exclusion trap — `Persona` does NOT touch it); C2 is
the umbrella decision + spec.

**GATE (why pending, not ready):** blocked on the Operator's decision to pull the genus rename into scope. It is
NOT blocked by a task-dep — it is orthogonal to the plugin-cli redesign (organ FILING vs CLI architecture), so it
may run independently once green-lit. Recommendation + cold-panel evidence: `MAPPING.md §FLAGGED`
(`Stance/Conatus` ranked 5/6 by isolated cold reads — jargon). Chosen signifier: **STANCE → Presentation ·
CONATUS → Disposition** (the unprimed cold favourite "Persona" collides with the `persona` organ; Presentation is
its non-colliding sibling). Punchier alternative on record: Demeanor / Drive.

**static (censused 2026-07):**

- CORE — `packages/agent-forge/src/anatomy/index.ts`: the `Genus` type (L26 `'STANCE' | 'CONATUS'`), the
  `axis: Genus` field (L141), and the ~24 `axis: 'STANCE'|'CONATUS'` per-organ metadata entries (L154–178) + the
  L25 doc-comment.
- PROSE — the 23 organ READMEs `packages/agent-anatomy/src/organs/*/README.md` (each opens
  `> **Organ — STANCE · X.**` / `> **Organ — CONATUS · X.**`) + `packages/agent-anatomy/src/toolkit/organ-docs.ts`
  (the STANCE/CONATUS gloss prose).
- TESTS asserting the axis: `packages/agent-forge/test/{anatomy/project-human,catalog/anatomy-descriptor,
catalog/enumerate,deploy/hooks,stories/E6/S3.agent-elevation}.test.ts` · `packages/agent-anatomy/test/{reader-reach.test.ts,reader-register.ts}` · the `ir-bridge` golden fixture (A2 also touches it — sequence/coordinate).
- `MAPPING.md §FLAGGED` (the decision + rationale).

**scope:** rename the genus axis VALUES `STANCE`→`Presentation`, `CONATUS`→`Disposition` (or `PRESENTATION`/
`DISPOSITION` if the enum stays upper-case — match the codebase convention) across the `Genus` type, the per-organ
`axis:` metadata, the organ-README headers, `organ-docs.ts`, and every asserting test + the golden fixture.

**CRITICAL EXCLUSIONS (census-surfaced — a naive `stance` sed CORRUPTS these):**

- **The `stance-guardrail` / `stance-judge` machinery is a DIFFERENT concept** (the principal-STANCE disposition —
  the intent-driven-expert guard), NOT the genus axis. Do NOT touch `packages/agent-anatomy/src/hooks/stance-guardrail*.ts`, `packages/agent-anatomy/src/toolkit/guardrail/{stance-guardrail*.sh,stance-judge*.sh,stance-judge-prompt.md,test-stance-guardrail.sh}`, or the `stance-guardrail` hook id/settings.json wiring. (If the Operator later wants that concept re-signified too, it is a SEPARATE task.)
- **The accept-gate palimpsest-token guard** (`agent-anatomy/src/toolkit/cold-oracle/policy.ts`: `conatus`,
  `stance-conatus`) STAYS — it guards the retired FOUNDING vocab in cell bodies; after the rename `conatus` no
  longer names a genus, so the guard only gets cleaner. Do NOT delete it.

**accept (falsifier):** `git grep -nE "'STANCE'|'CONATUS'|\bGenus =.*STANCE" -- packages/agent-forge/src/anatomy/index.ts` empty (axis renamed); `git grep -cE "Presentation|Disposition" packages/agent-forge/src/anatomy/index.ts`
≥ 24 (all organs re-filed); the `stance-guardrail` hook id + workers UNCHANGED (`git grep -l stance-guardrail packages/agent-anatomy/src/hooks` still present; projected settings.json still emits the 3 hooks incl.
`stance-guardrail`); `pnpm typecheck` green; `pnpm test` green (all axis-asserting tests + the golden fixture
updated); a cold Ω\* read of an organ-README header (`> **Organ — Presentation · Autonomy.**`) decodes "how the
agent comes across," and `Disposition` decodes "what it is inclined to do / its drive & method."

**dep:** GATE(Operator green-light). Coordinate the golden-fixture edit with vocab-depalimpsest `A2` (both touch
`ir-bridge/agent-anatomy.agent-forge.json`) — sequence, don't collide.
