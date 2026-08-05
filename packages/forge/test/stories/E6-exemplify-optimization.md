# E6 · exemplify-optimization — raw user context → the exemplify pipeline → reader=LLM artifacts

Floor: **F6** (import raw context → conceptualize→signify→materialize (= exemplify) → clean
R=LLM output for any harness that supports it; skills as self-sufficient set-builder cells,
agents as anatomy dimension-vectors; ambiguity about dimension values → `ELICIT:` marker, never an
invented answer). ρ=LLM. Contracts: `~/.claude/skills/exemplify/SKILL.md` (accept gate: REC_R ≽,
minimal, conform; R3 routing manifest), anatomy types
`packages/schema/src/index.ts` (`Agent` = 24-dimension vector, `Skill` = formal cell).

**depalimpsest-ir-intake S6 (2026-07).** The IR-intake lineage was excised. Two Operator rulings
this epic carried were rulings ABOUT that lineage and lapse with it: "rules are a first-class
resource through the pipeline, reaching ALL compile targets including rule-only harnesses"
(S6, S8 — both RETIRED below), and the two-step agent law's step 1 ("raw import maps foreign
agent NL verbatim onto the `archetype` dimension", E1.S8, with its round-trip consequence in
E4.S8). What survives of the two-step law is step 2, which no longer depends on step 1: exemplify

- elicit elevates a free-text description to the full 24-dimension vector, and the accepted vector
  is the agent's single source of truth (S3).

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

## E6.S3 · agent elevation — free-text description → full 24-dimension vector, which is the agent's source of truth

A: CURATOR · G: a free-text agent description is elevated by exemplify+elicit to a typed
dimension-selection vector; the accepted vector becomes the agent's single source of truth.
P: fixture: a paragraph describing a reviewer-ish agent with explicit archetype, objective, and
tooling cues; anatomy package importable.
✓:

- Output is a TS module exporting `Agent` (anatomy shape) that **tsc-compiles** against
  `@cratylus/schema`; all 24 dimension keys present; each value a `Fragment` of the
  correct dimension literal or `null`.
- Every non-null dimension value carries a provenance note tracing to input evidence (a quoted span
  or an explicit inference tag); a dimension value with no trace = FAIL.
- **Replacement semantics**: on accept, the vector is the agent's one source form — post-elevation
  repo state holds exactly one source form per agent (a lingering parallel twin = FAIL). The
  replacement is additive/no-loss: the source description's content is fully recoverable from the
  vector (REC ≽ against the source form, checked by the exemplify gate).

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

## E6.S6 · RETIRED — optimized artifacts project to EVERY target

**RETIRED (depalimpsest-ir-intake S6).** This story asserted that the optimized cell/vector/rule
set rides the `compile` path to every adapter target, rule-only harnesses included. `compile`, the
IR, and the 16-adapter roster were excised; the story has no subject left and no test may reference
its id. It also carried `projectVector` (anatomy vector → IR agent), a dead vestige swept in the
same shard.

## E6.S7 · optimization is lossless-by-the-ledger

A: OWNER · G: an owner can optimize raw context and still prove nothing was semantically dropped
between raw and optimized.
P: E6.S1 optimize over a raw human-register source.
✓:

- The R3 manifest's `routes ∪ delta` covers every concept the conceptualize stage extracted
  (coverage equation `routes ∪ delta = C_R` checked mechanically, digest-exact, via
  `checkCoverage`); a consciously delta'd concept appears on the ledger as delta, never silently
  dropped.

**Narrowed (depalimpsest-ir-intake S6).** This story also asserted a documented
`import` → optimize → `compile` flow end-to-end in one session, and that the raw, un-optimized
`compile` remained available unchanged (optimization never a forced pass). Both legs asserted the
excised IR pipeline. The ledger leg above is the half whose subject survives and is kept with its
assertions intact.

## E6.S8 · RETIRED — rules through exemplify

**RETIRED (depalimpsest-ir-intake S6).** This story asserted `optimizeRules` rewriting IR `Rule`
bodies and compiling them into each dialect's rules surface. The IR `Rule`, its only producer
(`import`), its only consumer (`compile`), and `optimizeRules` itself are all gone. No test may
reference this id.
