# C2 — DECISION + spec: re-signify the core anatomy vocabulary (`organ` → `dimension`)

**Status: DECIDED (nico, signification authority). Execution SEQUENCED, not gated-on-permission.** The signification
is settled below; the repo-wide rename is a large spine change that runs AFTER the in-flight design converges
(don't churn the spine mid-plugin-design). Reversible (git), not outward — so no push-reserved gate; sequenced by
nico. The ONE surface flagged for the Operator is the published BRAND name (below), a value-call, not the technical
decision.

## Evidence (isolated cold panels, `/tmp/cold-panel/`)

- `altitude.txt` (unprimed): `organ`/`anatomy` in **0 of 4** reads; natural terms module/primitive/**trait/fragment**;
  "organ" explicitly rejected for a shareable unit. → refuted the recalled "anatomy/organs" original signify as
  primed/biased, and refuted nico's altitude-defense of "organ" (`apparatus-under-zero-trust`: instrument overruled
  the warm prior; Operator forced the re-probe).
- `decide.txt` (head-to-head candidate compare, ×3 each): DIMENSION → **`dimension` 3/3** (organ 0); VALUE →
  `variant` 2/3 (`fragment` 0); CORPUS → `kit` 2/3 (`anatomy` 0).
- `min.txt` (**argmin σ\* re-probe — extension only, NO gloss, NO candidate list; the un-contaminated read**, ×3):
  DIMENSION → **`dimension` 3/3** — SURVIVES the clean prompt (organ never reappears; parameter/attribute alt), so
  it is robust, NOT an artifact of my leading candidate list. GENUS A → **Persona 3/3**; GENUS B → **Constitution
  2/3** — which REFUTED the earlier `Presentation/Disposition` genus decision (that came off a leading prompt).

## Decisions (cold-INFORMED, not cold-dictated — concept-fit + blast-radius weighed)

1. **`organ` → `dimension`. ADOPT (confirmed clean).** 3/3 in BOTH the candidate-compare AND the argmin re-probe —
   robust, the term of art for an independent config axis (categorical `role` + spectrum `formality`), and the
   project's VISION is signification fidelity so a refuted CORE term can't stand. The genus axis then classifies
   DIMENSIONS — revised to **Persona / Constitution** (see MAPPING §FLAGGED; the earlier Presentation/Disposition was
   contaminated). Genus A `Persona` couples to a persona-FIELD rename (`archetype`/`essence`) — its own argmin probe.
2. **VALUE — KEEP `fragment`.** OVERRIDE the cold winner `variant`: "variant" = one-of-fixed-alternatives, which
   misfits our OPEN dimensions (authored `role`/`persona` are not variants). `fragment` is the general MODEL term
   (`fragments : cell → ℘(fragment)`) and the plugin-reviewer endorsed it. Drop the `organ-value` compound → `fragment`.
3. **CORPUS — KEEP `anatomy`.** OVERRIDE the cold winner `kit`: "kit" is a product-assembly frame clashing with "a
   canonical SEMANTIC MODEL"; "anatomy" = "the structural model of an agent," coherent without the organ metaphor.
4. **BRAND (Operator value-call, flagged not punted):** the published package `agent-anatomy` vs a product framing
   `AgentKit` (cold corpus winner `kit`). nico RECOMMENDS keeping `agent-anatomy`; a product-marketing preference is
   legitimately the Operator's to override. Everything else above is decided regardless of this choice.

## Execution spec (sequenced — runs after plugin-cli design locks; the largest rename in the repo)

**static (blast radius, censused):** `packages/agent-forge/src/anatomy/index.ts` (`Organ` type · `ORGAN_NAMES` ·
`ANATOMY` map · the `Agent` interface `// STANCE/CONATUS` comments · `organField`/`organTitle`) ·
`core/anatomy-body.ts` (`agentBody` organ-walk) · `catalog/index.ts` + `catalog/enumerate` (per-organ scan) ·
`validate/` (accept-gate organ refs) · every `packages/agent-anatomy/src/organs/*/` DIRECTORY (24) + their READMEs ·
`toolkit/organ-docs.ts` · `MODEL.md`/`ENGINE.md`/`CANON.md` prose · the tests asserting organ/axis · the plugin
`definePlugin` field (NORTH-STAR — becomes `fragments`, filed by `dimension`).

**scope:** rename the DIMENSION concept `organ` → `dimension` across type/metadata/dirs/prose/tests; `organ-value`
→ `fragment`; fold C1 (genus STANCE/CONATUS → Presentation/Disposition) into the same pass (one coherent
re-signification). KEEP `anatomy` (corpus) + `fragment` (value) per the decisions. EXCLUDE `stance-guardrail`/
`stance-judge` (the principal-stance concept, a DIFFERENT sense — C1's census trap) + the accept-gate palimpsest
guard.

**accept (falsifier):** `git grep -nwE "organ|Organ|ORGAN" packages` returns only the `stance-guardrail` /
principal-stance exclusions + git-historical plan records — no live `organ`-as-dimension token; `Dimension` type +
`DIMENSION_NAMES` present; the 24 dirs renamed; `pnpm typecheck` + `pnpm test` green; the projected agents/skills
byte-diff only where the organ→dimension header text changed (intended); a cold Ω\* read of the renamed model decodes
"an agent as a point in a dimension-space," and the `stance-guardrail` machinery is untouched.

**dep:** SEQUENCED after plugin-cli design locks (§8). Folds in C1. The BRAND choice (agent-anatomy vs AgentKit) is
the sole Operator sign-off; the rest proceeds on nico's decision.
