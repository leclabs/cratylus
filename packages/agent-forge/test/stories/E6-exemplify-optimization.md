# E6 · exemplify-optimization — raw user context → the exemplify pipeline → reader=LLM artifacts

Floor: **F6** (import raw context → conceptualize→signify→materialize (= exemplify) → clean
R=LLM output for any harness that supports it; skills as self-sufficient set-builder cells,
agents as anatomy dimension-vectors; ambiguity about dimension values → `ELICIT:` marker, never an
invented answer). ρ=LLM. Contracts: `~/.claude/skills/exemplify/SKILL.md` (accept gate: REC_R ≽,
minimal, conform; R3 routing manifest), anatomy types
`packages/agent-forge/src/anatomy/index.ts` (`Agent` = 24-dimension vector, `Skill` = formal cell).
Operator rulings in force: **rules are a first-class resource through the pipeline** — the most
generic context fragment, heavy overlap with AGENTS.md bodies — and optimization reaches ALL
targets including rule-only harnesses (S6, S8). **Two-step agent law**: step 1 = raw import maps
foreign agent NL verbatim onto the `archetype` dimension (E1.S8); step 2 = exemplify+elicit elevates to
the full 24-dimension vector, which then REPLACES the config-IR agent as the single source of truth
(S3; round-trip consequence in E4.S8).

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

## E6.S3 · agent elevation — step-1 archetype form → full 24-dimension vector, which replaces the config-IR agent

A: CURATOR · G: a step-1 agent (archetype dimension carrying the raw NL verbatim, E1.S8 — or a fresh
free-text description) is elevated by exemplify+elicit to a typed dimension-selection vector; the
accepted vector becomes the agent's single source of truth.
P: fixture: E1.S8's imported step-1 agent AND a paragraph describing a reviewer-ish agent with
explicit archetype, objective, and tooling cues; anatomy package importable.
✓:

- Output is a TS module exporting `Agent` (anatomy shape) that **tsc-compiles** against
  `@leclabs/agent-forge/anatomy`; all 24 dimension keys present; each value a `Fragment` of the
  correct dimension literal or `null`.
- Every non-null dimension value carries a provenance note tracing to input evidence (a quoted span
  or an explicit inference tag); a dimension value with no trace = FAIL.
- **Replacement semantics**: on accept, the vector REPLACES the config-IR agent — post-elevation
  repo state holds exactly one source form per agent (the vector; a lingering config-IR twin =
  FAIL). The replacement is additive/no-loss: the step-1 archetype content is fully recoverable
  from the vector (REC ≽ against the step-1 form, checked by the exemplify gate).

## E6.S4 · ambiguous dimension value ⇒ `ELICIT:` marker, never an invented answer

A: CURATOR + OPERATOR · G: silence in the input becomes a question for the Operator, not a guess.
P: fixture: agent description silent on `autonomy`, `satisficing`, and `memory`.
✓:

- The emitted vector carries `ELICIT:` markers (machine-greppable literal) at exactly those
  dimensions (as the null-with-marker form or a sidecar list); zero enum values appear for them.
- A companion elicitation script exists per marker: candidate values + the bisecting question
  (per `/elicit`'s information-gain law) — assertable as: each marker has ≥2 candidates and 1
  question.
- Negative: a pipeline run that emits a concrete value for a silent dimension fails the story.

## E6.S5 · optimization is idempotent

A: CURATOR · G: re-optimizing optimized output is a no-op.
P: E6.S1's accepted output as input.
✓:

- Second run's accept passes with `routes[]` all `reuse`, `delta[] = ∅`, and byte-identical
  artifacts (or a semantically-empty diff per the pinned equivalence checker).

## E6.S6 · optimized artifacts project to EVERY target — rule-only harnesses included

A: FLEET · G: the optimized cell/vector/rule-set rides the normal compile path to ALL targets;
the vector is the source, projected per-target (never a parallel config-IR copy).
P: E6.S2 skill + E6.S3 accepted vector + E6.S8 optimized rules; targets = every manifest target,
including rule-only harnesses (aider, second-tier AGENTS.md readers).
✓:

- Compile succeeds; each emitted SKILL.md remains spec-valid at destination (`skills-ref
validate` on every emitted copy); agent bodies are per-target PROJECTIONS of the vector
  (projection pinned; R=LLM register survives — no adapter "humanizes" content).
- Rule-only targets receive the exemplify-optimized R=LLM rule bodies through their rules
  surface; coverage check: **zero targets are excluded from optimization** on the ground of
  lacking skill/agent support.
- Per-resource unsupport still follows E4.S2/E5.S7 loudness (skip named), but never excludes the
  target from the resources it does read.

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

## E6.S8 · rules through exemplify — first-class, to every rule-bearing target

A: CURATOR · G: rules — the most generic context fragment — ride the same pipeline as
agents/skills/hooks: raw rule prose → exemplify → R=LLM rule bodies emitted to every target that
reads rules, including rule-only harnesses.
P: raw human-register rule prose (the E6.S1 fixture routed to Rule resources); targets = every
adapter with rules ≥ partial + the E7 standards outputs (AGENTS.md/CLAUDE.md class).
✓:

- Optimized Rule bodies pass the exemplify accept gate (conform: register = ρ = LLM) and compile
  into each dialect's rules surface (AGENTS.md, CLAUDE.md-projection, GEMINI.md, aider
  conventions+`read:` wiring, `.continue/rules/`); emitted bodies are the optimized text verbatim
  (byte-check — no adapter re-humanizes).
- Rule-only targets (no skills/agents support) receive the optimized bodies; assertion: the set
  {targets receiving optimized rules} = {targets with rules ≥ partial} exactly.
- Activation/placement metadata (E9.S2) survives optimization untouched (optimization rewrites
  bodies, never scoping).
