import type { SkillCell } from '../toolkit/skill-cell.js';

export const signify: SkillCell = {
  name: 'signify',
  trigger: `/signify`,
  delineation: `use this skill to name a concept set — assign each concept its injective canonical anchor \`α(c) = σ*_R(c)\` (the reader-relative fittest sign, whose latent priors circumscribe exactly it; one name ⇔ one concept), then coalesce concepts that resolve to the same anchor; emits the shortlex order \`≺\` and the decoder \`dec_R\`; stage 2 of exemplify, independently invocable (every naming review is a bare /signify).`,
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
      several c collapse to one name yet D_R(cᵢ) ≠ D_R(cⱼ) ⇒ the cut was wrong — return to conceptualize (re-cut)`,
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
\`\`\`
`,
};
