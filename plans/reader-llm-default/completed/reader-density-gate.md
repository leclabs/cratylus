# reader-density-gate

**Depends on** `formalize-reader-model`. The **durable fix**: a gate that FAILS reader=human prose in an
R=LLM artifact — `codify ⇒ lint ⇒ conform`, so the degradation cannot recur (the same enforcement leg THE
INVARIANT still owes). Lane: Nico (rule) + Mav (mechanism).

## Inputs (read these — blind-dispatchable; paths from `packages/agent-anatomy/`)

- Acceptance-bar runbook (where gates wire in, beside projection-stability + `skill-shape`/`symbols`):
  `src/toolkit/AGENTS.md`.
- Pass exemplars (the proven bar): `src/organs/role/curate.ts` · `objective/parsimony.ts` ·
  `transparency/decision-rationale.ts` · `capabilities/research-investigation.ts`.
- Fail corpus (seed material): any not-yet-densified definiens in `src/organs/` + the `ideas/{memory,persona}.md`
  prose blocks — pre-remediation state is itself the seed.
- ⊳ `formalize-reader-model` — the declared-R-per-class model the gate enforces (dep output).

## Scope

- A check — lint pass and/or blind LLM judge — over R=LLM artifacts (definiens · genus · SOULs · skill
  cells) that flags reader=human prose (hedge/connective prose, re-explanation of a firing σ\*, human-gloss
  register). Wire into the standard acceptance bar (build/CI) beside projection-stability + THE INVARIANT.
- **R-aware exemption:** artifacts whose declared R is human (README / docs / commits / human-facing
  generated) are exempt by their R, not special-cased.

## Acceptance

- A seeded reader=human prose in an R=LLM cell FAILS the gate; a compliant cell passes; R=human artifacts exempt.
- Gate runs green in the standard bar; documented in the corpus rules (`ideas/AGENTS.md`).

## Deliverable (accepted 2026-07-01; falsifier re-proven by judge with an independent seed)

Gate = `packages/agent-anatomy/test/reader-density.test.ts` — deterministic vitest lint (no LLM judge
needed). Enforces `conform(a) ⇔ register(a) = ρ(a)` one-sided (ρ=LLM ⇒ register=LLM; human-register
witness convicts, never certifies; ρ=human abstains BY MODEL — RHO mirrors signify's READER BINDING).
Signal classes (calibrated full-corpus, provenance in file header): HEDGE ≥2 · SECOND-PERSON ≥2 ∧ ≥4/100w ·
FPP-WALKTHROUGH ≥2. REGISTER ≠ DENSITY (glue-ratio does not separate — density stays judge territory).
Cross-organ: `llm-native` ∧ `natural-language` in one vector = fail. Ratchets (shrink-only; a healed pin
FAILS the suite until removed): REGISTER_RATCHET = {memory ## Protocol, persona ## Protocol};
CONTRADICTION_RATCHET = {principal-ic}. Surfaces: 130+ definiens · 15 skills · genus per-##-section ·
11 vectors. Docs: `ideas/AGENTS.md` bullet + toolkit acceptance-bar list. 23/23 green.
