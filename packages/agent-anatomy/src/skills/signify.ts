import type { SkillCell } from '../toolkit/skill-cell.js';

export const signify: SkillCell = {
  name: 'signify',
  trigger: `/signify`,
  delineation: `use this skill to name a concept set — assign each concept its injective canonical anchor \`α(c) = σ*_R(c)\` (the reader-relative fittest sign, whose latent priors circumscribe exactly it; one name ⇔ one concept), then coalesce concepts that resolve to the same anchor; emits the shortlex order \`≺\` and the decoder \`dec_R\`; stage 2 of exemplify, independently invocable (every naming review is a bare /signify); also home of the reader binding \`ρ\` — R per artifact class (default R=LLM; human iff the literal reader is human), the σ*+residue body-reduction rule, and the verbatim⇒R=LLM law.`,
  verb: `signify`,
  formalBlock: `DECLARATIONS
  R          — the reader; fixes every meaning. All operators are R-relative.
  C_R        — the concept lattice; concepts to be named. dom of α.
  D_R        — R's distinctions; identity-criterion atoms a concept circumscribes.
  prim_R(c)  — c is primitive (no factorization into other concepts).
  Names      — the shared symbol space; reader-independent; totally ordered by <_lex.
  k          — a concept record (gloss, anchor, factorization); signify fills anchor only.

  fired_R    : Names → ℘(D_R)         -- the latent priors a name fires in R (the priors-of-a-name)
  dec_R      : Names ⇀ ℘(D_R)         -- R's decoder, dec_R ≜ fired_R restricted to assigned anchors;
                                         the distinctions a primitive's anchor fires; empirical, ¬α's formal inverse
  circ(n,c)  ⇔ fired_R(n) = D_R(c)    -- n circumscribes c exactly: fires its distinctions, no surplus, no deficit
  σ*_R       : C_R → Names             -- the fittest sign: the densest name circumscribing c (precise circumscription)
  σ*_R(c)    ≜ argmin_{n : circ(n,c)} |n|    -- densest among the exact-circumscribing names (shortlex tie-break)
                                              -- none exact ⇒ mint a fresh name into Names (the anchor-set is open)
  α          : C_R ↣ Names             -- the anchor; injective (one name ⇔ one concept)

  Art        — artifacts: every authored surface (source cell · projection · plan · memory · message · doc).
  readers(a) — a's operative consumers; a human reading through an agent teacher ∉ readers(a).
  ρ          : Art → {LLM, human}      -- the reader binding: fixes the R an artifact is authored and read at
  register(a) — the register a's body is observably authored in, ∈ {LLM, human}
  verbatim(a) — a projects ship-whole, byte-exact: settled σ*, never re-derived at projection

LAWS
  canonical_anchor :  ∀ c ∈ dom(α) :  α(c) ≜ σ*_R(c)          -- name each concept its reader-relative fittest sign
  A ≜ { α(c) | c ∈ dom(α) }
  dom(dec_R) = { α(p) | prim_R(p) } ;  dec_R(α(p)) = fired_R(α(p))

  name(k)  fills  anchor(k) ≜ α(gloss(k)) ;  gloss(k) preserved ;  factorization(k) untouched

  best-fit :  α(c) routes c to the name whose fired_R most precisely circumscribes it -- ¬nearest-bin
  injective :  α(cᵢ) = α(cⱼ) ⇒ requires cᵢ, cⱼ carry the same distinction-load

  coalesce(cᵢ, cⱼ)  ⇔  α(cᵢ) = α(cⱼ) ∧ D_R(cᵢ) = D_R(cⱼ)     -- same anchor, no residual distinct load ⇒ merge to one
  cᵢ <_N cⱼ  ⇔  α(cᵢ) <_lex α(cⱼ)
  ≺ ≜ shortlex over (C_R, <_N) , on finite subsets of C_R    -- emitted order

  c ∉ dom(α) ⇒ c ∉ A :
      zero name circumscribes c, none mintable ⇒ exclude, logged
      several c collapse to one name yet D_R(cᵢ) ≠ D_R(cⱼ) ⇒ the cut was wrong — return to conceptualize (re-cut)

  -- READER BINDING : ρ fixes the R every operator above is read at; binds the corpus and every projection
  ρ(a) ≜ human  ⇔  readers(a) = {human}       -- iff the literal reader is human, alone
  ρ(a) ≜ LLM    otherwise                     -- the invariant default; ambiguity resolves to LLM
  ρ binds at the finest separately-consumed grain (a mixed corpus ⇒ ρ per note)

  { source cell · projected SOUL · SKILL.md · hook-prompt · AGENTS.md · CLAUDE.md · plan mirror ·
    task file · agent memory (SELF · MEMORY · EPISODIC) · skill-generated agent-artifact ·
    agent-to-agent message (delegation prompt · subagent return) } ⊆ { a | ρ(a) = LLM }
  { README · human doc · code comment · commit message · human chat ·
    human-facing generated output (slack · email · report) } ⊆ { a | ρ(a) = human }

  reduction (ρ(a) = LLM) — the signifier carries the load:
      residue(c) ≜ { d ∈ D_R(c) | d ∉ fired_R(α(c)) }      -- only what the anchor's priors miss
      ∀ c carried by a : c enters the body as ⟨α(c), residue(c)⟩   -- signify, don't explain
      residue(c) = ∅ ⇒ c enters as α(c) alone                       -- the body collapses to the slug
      re-stating fired_R(α(c)) in a body ⇒ ME violation             -- minimality fails: the restatement fuses into the anchor

  conform(a)  ⇔  register(a) = ρ(a)           -- the gate predicate: enforced on bodies, not names only
  verbatim(a) ⇒ ρ(a) = LLM                    -- ship-whole is composition, never a density exemption;
                                              -- a human-register verbatim body is a defect of the cell, not a licence of the tag`,
  composition: ['exemplify', 'conceptualize', 'materialize'],
  body: `

# signify

Stage 2 of exemplify (independently invocable — every naming review is a bare /signify); the naming ops \`canonical_anchor → coalescence\`. Fills the \`anchor\` field of each concept's record, preserves its \`gloss\`, commits no \`factorization\`. Hands conceptualize (stage 1) → materialize (stage 3).

Bindings: stage of [[exemplify]]; between [[conceptualize]] and [[materialize]].

Resolve from context: the concept records under naming review — each a triple \`k = (gloss, anchor, factorization)\` carrying its \`gloss\`, drawn from the concept lattice \`C_R\` (\`prim_R\` marks primitives, \`D_R\` its distinctions) — or any set under naming review.

The block below is self-sufficient: every term it uses is declared in it (declarations above, laws below). No external reference is needed to reconstruct the skill.

\`\`\`text
DECLARATIONS
  R          — the reader; fixes every meaning. All operators are R-relative.
  C_R        — the concept lattice; concepts to be named. dom of α.
  D_R        — R's distinctions; identity-criterion atoms a concept circumscribes.
  prim_R(c)  — c is primitive (no factorization into other concepts).
  Names      — the shared symbol space; reader-independent; totally ordered by <_lex.
  k          — a concept record (gloss, anchor, factorization); signify fills anchor only.

  fired_R    : Names → ℘(D_R)         -- the latent priors a name fires in R (the priors-of-a-name)
  dec_R      : Names ⇀ ℘(D_R)         -- R's decoder, dec_R ≜ fired_R restricted to assigned anchors;
                                         the distinctions a primitive's anchor fires; empirical, ¬α's formal inverse
  circ(n,c)  ⇔ fired_R(n) = D_R(c)    -- n circumscribes c exactly: fires its distinctions, no surplus, no deficit
  σ*_R       : C_R → Names             -- the fittest sign: the densest name circumscribing c (precise circumscription)
  σ*_R(c)    ≜ argmin_{n : circ(n,c)} |n|    -- densest among the exact-circumscribing names (shortlex tie-break)
                                              -- none exact ⇒ mint a fresh name into Names (the anchor-set is open)
  α          : C_R ↣ Names             -- the anchor; injective (one name ⇔ one concept)

  Art        — artifacts: every authored surface (source cell · projection · plan · memory · message · doc).
  readers(a) — a's operative consumers; a human reading through an agent teacher ∉ readers(a).
  ρ          : Art → {LLM, human}      -- the reader binding: fixes the R an artifact is authored and read at
  register(a) — the register a's body is observably authored in, ∈ {LLM, human}
  verbatim(a) — a projects ship-whole, byte-exact: settled σ*, never re-derived at projection

LAWS
  canonical_anchor :  ∀ c ∈ dom(α) :  α(c) ≜ σ*_R(c)          -- name each concept its reader-relative fittest sign
  A ≜ { α(c) | c ∈ dom(α) }
  dom(dec_R) = { α(p) | prim_R(p) } ;  dec_R(α(p)) = fired_R(α(p))

  name(k)  fills  anchor(k) ≜ α(gloss(k)) ;  gloss(k) preserved ;  factorization(k) untouched

  best-fit :  α(c) routes c to the name whose fired_R most precisely circumscribes it -- ¬nearest-bin
  injective :  α(cᵢ) = α(cⱼ) ⇒ requires cᵢ, cⱼ carry the same distinction-load

  coalesce(cᵢ, cⱼ)  ⇔  α(cᵢ) = α(cⱼ) ∧ D_R(cᵢ) = D_R(cⱼ)     -- same anchor, no residual distinct load ⇒ merge to one
  cᵢ <_N cⱼ  ⇔  α(cᵢ) <_lex α(cⱼ)
  ≺ ≜ shortlex over (C_R, <_N) , on finite subsets of C_R    -- emitted order

  c ∉ dom(α) ⇒ c ∉ A :
      zero name circumscribes c, none mintable ⇒ exclude, logged
      several c collapse to one name yet D_R(cᵢ) ≠ D_R(cⱼ) ⇒ the cut was wrong — return to conceptualize (re-cut)

  -- READER BINDING : ρ fixes the R every operator above is read at; binds the corpus and every projection
  ρ(a) ≜ human  ⇔  readers(a) = {human}       -- iff the literal reader is human, alone
  ρ(a) ≜ LLM    otherwise                     -- the invariant default; ambiguity resolves to LLM
  ρ binds at the finest separately-consumed grain (a mixed corpus ⇒ ρ per note)

  { source cell · projected SOUL · SKILL.md · hook-prompt · AGENTS.md · CLAUDE.md · plan mirror ·
    task file · agent memory (SELF · MEMORY · EPISODIC) · skill-generated agent-artifact ·
    agent-to-agent message (delegation prompt · subagent return) } ⊆ { a | ρ(a) = LLM }
  { README · human doc · code comment · commit message · human chat ·
    human-facing generated output (slack · email · report) } ⊆ { a | ρ(a) = human }

  reduction (ρ(a) = LLM) — the signifier carries the load:
      residue(c) ≜ { d ∈ D_R(c) | d ∉ fired_R(α(c)) }      -- only what the anchor's priors miss
      ∀ c carried by a : c enters the body as ⟨α(c), residue(c)⟩   -- signify, don't explain
      residue(c) = ∅ ⇒ c enters as α(c) alone                       -- the body collapses to the slug
      re-stating fired_R(α(c)) in a body ⇒ ME violation             -- minimality fails: the restatement fuses into the anchor

  conform(a)  ⇔  register(a) = ρ(a)           -- the gate predicate: enforced on bodies, not names only
  verbatim(a) ⇒ ρ(a) = LLM                    -- ship-whole is composition, never a density exemption;
                                              -- a human-register verbatim body is a defect of the cell, not a licence of the tag
\`\`\`
`,
};
