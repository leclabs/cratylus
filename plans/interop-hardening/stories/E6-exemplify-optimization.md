# E6 · exemplify-optimization — raw user context → the exemplify pipeline → reader=LLM artifacts

Floor: **F6** (import raw context → conceptualize→signify→materialize (= exemplify) → clean
R=LLM output for any harness that supports it; skills as self-sufficient set-builder cells,
agents as anatomy organ-vectors; ambiguity about organ values → `ELICIT:` marker, never an
invented answer). ρ=LLM. Contracts: `~/.claude/skills/exemplify/SKILL.md` (accept gate: REC_R ≽,
minimal, conform; R3 routing manifest), anatomy types
`packages/agent-forge/src/anatomy/index.ts` (`Agent` = 24-organ vector, `Skill` = formal cell).
Reach fork (skills-bearing harnesses only vs rule-only harnesses too) = `ELICIT-4`; anatomy-vs-
config-IR agent shape for foreign agents = `ELICIT-6`.

---

## E6.S1 · raw human-register context optimizes to conforming R=LLM artifacts

A: CURATOR · G: a verbose human CLAUDE.md becomes a canonical semantic factorization.
P: fixture: a real-world-shaped CLAUDE.md (~200 lines human prose, redundant, narrative).
✓:

- Pipeline output passes the exemplify `accept` gate: `REC_R(k) ≽ k` (round-trip
  equivalent-or-better, judged against the gloss set from conceptualize), `minimal` (no two
  concepts share an anchor), `conform` (`register = ρ = LLM`; a human-register emission FAILS).
- The R3 routing manifest `.manifests/<source>.json` exists; every concept in `C_R` appears in
  exactly one of `routes[]`/`delta[]`; an artificially withheld concept (mutation fixture) makes
  the gate refuse — the refusal is the test.

## E6.S2 · prose procedure → self-sufficient set-builder skill cell

A: CURATOR · G: a raw how-to becomes a well-formed skill cell.
P: fixture: prose description of a multi-step procedure (no structure).
✓:

- Output is a `SKILL.md` with frontmatter `name`+`description` (spec-valid: `skills-ref validate`
  passes [S6]), a verb H1, and a fenced set-builder formal block: declarations-above /
  laws-below, every symbol declared in-block (self-sufficiency check: no undeclared term used in
  a law — mechanically greppable symbol table).
- Round-trip: the formal block alone (no source prose) suffices for a blind reader to re-derive
  the procedure's steps (equivalence spot-check against a pinned answer key).

## E6.S3 · raw agent description → 24-organ anatomy vector

A: CURATOR · G: a free-text "I want an agent that…" becomes a typed organ-selection vector.
P: fixture: a paragraph describing a reviewer-ish agent with explicit persona, objective, and
tooling cues; anatomy package importable.
✓:

- Output is a TS module exporting `Agent` (anatomy shape) that **tsc-compiles** against
  `@leclabs/agent-forge/anatomy`; all 24 organ keys present; each value a `Fragment` of the
  correct organ literal or `null`.
- Every non-null organ value carries a provenance note tracing to input evidence (a quoted span
  or an explicit inference tag); an organ value with no trace = FAIL.

## E6.S4 · ambiguous organ value ⇒ `ELICIT:` marker, never an invented answer

A: CURATOR + OPERATOR · G: silence in the input becomes a question for the Operator, not a guess.
P: fixture: agent description silent on `autonomy`, `satisficing`, and `memory`.
✓:

- The emitted vector carries `ELICIT:` markers (machine-greppable literal) at exactly those
  organs (as the null-with-marker form or a sidecar list); zero enum values appear for them.
- A companion elicitation script exists per marker: candidate values + the bisecting question
  (per `/elicit`'s information-gain law) — assertable as: each marker has ≥2 candidates and 1
  question.
- Negative: a pipeline run that emits a concrete value for a silent organ fails the story.

## E6.S5 · optimization is idempotent

A: CURATOR · G: re-optimizing optimized output is a no-op.
P: E6.S1's accepted output as input.
✓:

- Second run's accept passes with `routes[]` all `reuse`, `delta[] = ∅`, and byte-identical
  artifacts (or a semantically-empty diff per the pinned equivalence checker).

## E6.S6 · optimized artifacts project to every supporting harness

A: FLEET · G: the optimized cell/vector rides the normal compile path to each harness that
supports the resource.
P: E6.S2 skill + E6.S3 vector (composed to a config-IR agent via the anatomy→IR projection);
targets = all adapters declaring skills/agents ≥ partial.
✓:

- Compile succeeds; each emitted SKILL.md remains spec-valid at destination (`skills-ref
validate` on every emitted copy); agent bodies preserve the organ-vector projection verbatim
  (R=LLM register survives — no adapter "humanizes" content).
- Harnesses not supporting the resource follow E4.S2/E5.S7 loudness (skip named).

## E6.S7 · optimization is opt-in and lossless-by-the-ledger

A: OWNER · G: an owner can import raw config, optimize, and still prove nothing was semantically
dropped between raw and optimized.
P: E1.S1 import → E6.S1 optimize.
✓:

- A documented flow (`import` → optimize → `compile`) exists end-to-end in one session; the R3
  manifest's `routes ∪ delta` covers every concept the conceptualize stage extracted from the raw
  import (coverage equation checked mechanically).
- Raw, un-optimized compile remains available unchanged (optimization never becomes a forced
  pass).
