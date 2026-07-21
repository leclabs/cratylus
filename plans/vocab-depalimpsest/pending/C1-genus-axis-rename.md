# C1 — rename the genus axis STANCE/CONATUS → Persona/Constitution

**Net-current decision (MAPPING §FLAGGED, the authority): `STANCE` → `Persona` · `CONATUS` → `Constitution`.**
Evidence: the argmin re-probe (`/tmp/cold-panel/min.txt`, extension-only, no candidate list) gave Family A →
`Persona` 3/3, Family B → `Constitution` 2/3 — robust, un-primed. This SUPERSEDES the earlier
`Presentation`/`Disposition` decision, which the retraction (MAPPING §FLAGGED) showed rested on a contaminated
candidate-listing prompt. **This file is de-palimpsested to that decision — no `Presentation`/`Disposition` as a
live target survives below.**

**FOLDED INTO `C2`** — the genus rename is one facet of the single coherent core-vocabulary re-signification
(`organ`→`dimension` · genus→`Persona`/`Constitution`), executed as one sequenced pass. This file is the
genus-specific execution detail (esp. the `stance-guardrail` exclusion trap — `Persona` does NOT touch it); C2 is
the umbrella decision + spec.

**⚠ ONE OPEN SUB-FORK — the `Persona`/`persona` collision (coupled to the genus name).** Family A contains a member
organ literally named `persona` (the archetype/essence field). Naming the genus `Persona` breaks one-name-one-concept
unless the MEMBER is renamed. Two coherent resolutions, gated with the genus rename:

- **(a) `Persona` genus + rename the member `persona` → `archetype` / `essence`** (needs its own argmin probe on
  the member) — keeps the argmin-fittest genus name; costs a member rename.
- **(b) `Presentation` genus + keep the member `persona`** — a 2026-07-21 collision-framed cold read favored
  `Presentation` as the fittest NON-colliding superordinate (covers role/formality/audience/transparency/persona)
  when the member is kept; `Posture`/`Demeanor` read as narrower sub-senses.

Recommendation (nico): **(a)** — the argmin gave `Persona` as the concept's fittest sign; a collision is resolved
by re-naming the less-central concept (the member field, for which `archetype`/`essence` is a strong fit), not by
degrading the genus to its second choice. The member-rename probe settles it. Both the genus rename and the member
rename sit behind the same Operator gate below.

**GATE (why pending, not ready):** blocked on the Operator's decision to pull the genus rename into scope — NOT a
task-dep (orthogonal to the plugin-cli redesign: organ FILING vs CLI architecture), so it runs independently once
green-lit. `Stance/Conatus` ranked 5/6 by isolated cold reads (jargon) → the rename is well-grounded.

**static (censused 2026-07 — RE-VERIFY at dispatch per `pin-by-grep`; coordinate with C2's 825-token sweep):**

- CORE — `packages/agent-forge/src/anatomy/index.ts`: the `Genus` type (`'STANCE' | 'CONATUS'`), the `axis: Genus`
  field, the ~24 `axis: 'STANCE'|'CONATUS'` per-organ metadata entries + the doc-comment.
- PROSE — the 23 organ READMEs `packages/agent-anatomy/src/organs/*/README.md` (each opens
  `> **Organ — STANCE · X.**` / `> **Organ — CONATUS · X.**`) + `packages/agent-anatomy/src/toolkit/organ-docs.ts`
  (the STANCE/CONATUS gloss prose).
- TESTS asserting the axis: `packages/agent-forge/test/{anatomy/project-human,catalog/anatomy-descriptor,
catalog/enumerate,deploy/hooks,stories/E6/S3.agent-elevation}.test.ts` ·
  `packages/agent-anatomy/test/{reader-reach.test.ts,reader-register.ts}` · the `ir-bridge` golden fixture
  (A2 also touches it — sequence/coordinate).
- `MAPPING.md §FLAGGED` (the decision + rationale).

**scope:** rename the genus axis VALUES `STANCE`→`Persona`, `CONATUS`→`Constitution` (match the codebase enum case
convention) across the `Genus` type, per-organ `axis:` metadata, organ-README headers, `organ-docs.ts`, and every
asserting test + the golden fixture. IF resolution (a): also rename the `persona` member organ → `archetype`/
`essence` in the same pass (its own dir + type + metadata + READMEs). Fold into C2's one coherent sweep.

**CRITICAL EXCLUSIONS (census-surfaced — a naive `stance` sed CORRUPTS these):**

- **The `stance-guardrail` / `stance-judge` machinery is a DIFFERENT concept** (the principal-STANCE disposition —
  the intent-driven-expert guard), NOT the genus axis. Do NOT touch
  `packages/agent-anatomy/src/hooks/stance-guardrail*.ts`,
  `packages/agent-anatomy/src/toolkit/guardrail/{stance-guardrail*.sh,stance-judge*.sh,stance-judge-prompt.md,
test-stance-guardrail.sh}`, or the `stance-guardrail` hook id / settings.json wiring. (Re-signifying THAT concept
  is a SEPARATE task if ever wanted.)
- **The accept-gate palimpsest-token guard** (`agent-anatomy/src/toolkit/cold-oracle/policy.ts`: `conatus`,
  `stance-conatus`) STAYS — it guards the retired FOUNDING vocab in cell bodies; after the rename `conatus` no
  longer names a genus, so the guard only gets cleaner. Do NOT delete it.

**accept (falsifier):** `git grep -nE "'STANCE'|'CONATUS'|Genus =.*STANCE" -- packages/agent-forge/src/anatomy/index.ts`
empty (axis renamed); `git grep -cE "Persona|Constitution" packages/agent-forge/src/anatomy/index.ts` ≥ 24 (all
organs re-filed); IF resolution (a): no live `persona` member-organ dir remains (renamed); the `stance-guardrail`
hook id + workers UNCHANGED (still present; projected settings.json still emits the 3 hooks incl.
`stance-guardrail`); `pnpm typecheck` + `pnpm test` green; a cold Ω\* read of an organ-README header
(`> **Organ — Persona · Autonomy.**`) decodes "how the agent comes across," `Constitution` decodes "its governing
objectives + guardrails."

**dep:** GATE(Operator green-light) — genus rename + (if (a)) the member rename. Coordinate the golden-fixture edit
with `A2` (both touch `ir-bridge/agent-anatomy.agent-forge.json`) — sequence, don't collide.
