import type { SkillCell } from '../toolkit/skill-cell.js';

export const conceptualize: SkillCell = {
  name: 'conceptualize',
  trigger: `/conceptualize`,
  delineation: `use this skill to conceptualize a corpus — read a multi-modal source and resolve it to the reader's concept lattice (the closed distinction-sets \`C_R\`, which of them are primitive, each primitive's gloss, and each concept's candidate factorizations), deciding nothing about names or material form; stage 1 of exemplify, independently invocable.`,
  verb: `conceptualize`,
  formalBlock: `-- ENTITIES ---------------------------------------------------------------
R                 — the reader; priors fix every meaning
sources           — input material, multi-modal; carries substrate boundaries
D_R               — the distinctions R draws over sources; identity-criterion atoms; finite
cl_R              — R's closure operator on ℘(D_R); fixed points are the concepts
C_R               — the concept lattice; the closed distinction-sets
G                 — gloss space; a meaning stored by value
TRIPLE            — contract record ⟨ gloss , anchor , factorization ⟩ ; the pipeline's narrow waist,
                    fields filled by stage: conceptualize→gloss, signify→anchor, materialize→factorization;
                    an unfilled field is ⊥ and a consumer tolerates its absence

-- substrate-vs-meaning: file/cell/front-matter/layout boundaries are projections of an
-- earlier cut, not meaning — dissolve them; cut at meaning joints, grandfather no boundary
-- palimpsest: an artifact bearing strata of its own superseded states (abandoned names,
-- narrated removals, changelog residue); net-green = those strata stripped, only live content survives
-- densest-faithful-point: the gloss optimum — removing a token lowers fidelity, adding one does not raise it

-- OPERATIONS --------------------------------------------------------------
resolve(sources)  ≜ ⋃ { content(s) | s ∈ sources }        -- the mass, prior boundaries dissolved
D_R               ≜ { d | d a distinction R draws over resolve(sources) }
boundaries(sources) ∉ D_R                                 -- ∵ substrate, not meaning
depalimpsest(d)    drops superseded strata of d           -- only live current content survives to net-green
partition(D_R)    ⊆ ℘(D_R)                                -- cut the mass at meaning joints

cl_R : ℘(D_R) → ℘(D_R)
cl_R(X)           ⊇ X
X ⊆ Y             ⇒ cl_R(X) ⊆ cl_R(Y)
cl_R(cl_R(X))     = cl_R(X)
∀ d ∈ D_R         : d ∉ cl_R(D_R \\ {d})                   -- each atom independent

C_R               ≜ { X ⊆ D_R | cl_R(X) = X }            -- the concepts: closed sets
intent(c)         ≜ c
⊔ P               ≜ cl_R(⋃ { intent(c) | c ∈ P })   ,  P ⊆ C_R

prim_R(c)         ⇔ ∄ P ⊆ C_R \\ {c} : ⊔ P = intent(c)    -- primitive: no factoring covers it
gloss(c)          ≜ intent(c)                        ,  prim_R(c)   -- stored at densest-faithful-point
fac_R(m)          ≜ { P ⊆ C_R \\ {m} | ⊔ P = intent(m) ∧ ∄ Q ⊊ P : ⊔ Q = intent(m) }   -- deepest faithful factorizations
distill(c)        ≜ prim_R(c) ∨ fac_R(c) ≠ ∅             -- each concept is primitive or has a deepest faithful factorization

produce(sources)  ≜ { ( gloss(c), ⊥, ⊥ ) | c ∈ C_R }    -- TRIPLE per concept: gloss filled, anchor & factorization ⊥

-- LAWS -------------------------------------------------------------------
MECE(C_R)         ⇔ ( ∀ c≠c' ∈ C_R : intent(c) ≠ intent(c') )   -- mutually exclusive: distinct closed sets
                    ∧ ( cl_R(D_R) = ⊔ C_R )                     -- collectively exhaustive: closure spans D_R
-- MECE is forced by the cl_R axioms over C_R: idempotent closure ⇒ no overlap, ⊔ C_R = cl_R(D_R) ⇒ no gap
C_R = ∅           ⇒ ⊥                                            -- empty lattice is a malfunction, refuse loudly`,
  composition: ['exemplify', 'signify', 'materialize'],
  body: `

# conceptualize

Stage 1 of exemplify (independently invocable); the front of the op-chain \`resolve → partition → depalimpsest → distill\`. Emits the concept lattice \`C_R\` with each concept's \`gloss\` filled, deciding nothing about names or material form: produces the contract record with \`gloss\` set and \`anchor\`, \`factorization\` left \`⊥\`. Hands off to signify (stage 2) → materialize (stage 3).

Bindings: stage of [[exemplify]]; hands off to [[signify]] · [[materialize]].

Resolve from context: \`sources\` — input material (multi-modal); \`R\` — the reader whose priors fix every meaning.

The block below is self-sufficient: every term is declared above the law that uses it; symbol table at \`references/formal-symbolic-notation.md\`.

\`\`\`text
-- ENTITIES ---------------------------------------------------------------
R                 — the reader; priors fix every meaning
sources           — input material, multi-modal; carries substrate boundaries
D_R               — the distinctions R draws over sources; identity-criterion atoms; finite
cl_R              — R's closure operator on ℘(D_R); fixed points are the concepts
C_R               — the concept lattice; the closed distinction-sets
G                 — gloss space; a meaning stored by value
TRIPLE            — contract record ⟨ gloss , anchor , factorization ⟩ ; the pipeline's narrow waist,
                    fields filled by stage: conceptualize→gloss, signify→anchor, materialize→factorization;
                    an unfilled field is ⊥ and a consumer tolerates its absence

-- substrate-vs-meaning: file/cell/front-matter/layout boundaries are projections of an
-- earlier cut, not meaning — dissolve them; cut at meaning joints, grandfather no boundary
-- palimpsest: an artifact bearing strata of its own superseded states (abandoned names,
-- narrated removals, changelog residue); net-green = those strata stripped, only live content survives
-- densest-faithful-point: the gloss optimum — removing a token lowers fidelity, adding one does not raise it

-- OPERATIONS --------------------------------------------------------------
resolve(sources)  ≜ ⋃ { content(s) | s ∈ sources }        -- the mass, prior boundaries dissolved
D_R               ≜ { d | d a distinction R draws over resolve(sources) }
boundaries(sources) ∉ D_R                                 -- ∵ substrate, not meaning
depalimpsest(d)    drops superseded strata of d           -- only live current content survives to net-green
partition(D_R)    ⊆ ℘(D_R)                                -- cut the mass at meaning joints

cl_R : ℘(D_R) → ℘(D_R)
cl_R(X)           ⊇ X
X ⊆ Y             ⇒ cl_R(X) ⊆ cl_R(Y)
cl_R(cl_R(X))     = cl_R(X)
∀ d ∈ D_R         : d ∉ cl_R(D_R \\ {d})                   -- each atom independent

C_R               ≜ { X ⊆ D_R | cl_R(X) = X }            -- the concepts: closed sets
intent(c)         ≜ c
⊔ P               ≜ cl_R(⋃ { intent(c) | c ∈ P })   ,  P ⊆ C_R

prim_R(c)         ⇔ ∄ P ⊆ C_R \\ {c} : ⊔ P = intent(c)    -- primitive: no factoring covers it
gloss(c)          ≜ intent(c)                        ,  prim_R(c)   -- stored at densest-faithful-point
fac_R(m)          ≜ { P ⊆ C_R \\ {m} | ⊔ P = intent(m) ∧ ∄ Q ⊊ P : ⊔ Q = intent(m) }   -- deepest faithful factorizations
distill(c)        ≜ prim_R(c) ∨ fac_R(c) ≠ ∅             -- each concept is primitive or has a deepest faithful factorization

produce(sources)  ≜ { ( gloss(c), ⊥, ⊥ ) | c ∈ C_R }    -- TRIPLE per concept: gloss filled, anchor & factorization ⊥

-- LAWS -------------------------------------------------------------------
MECE(C_R)         ⇔ ( ∀ c≠c' ∈ C_R : intent(c) ≠ intent(c') )   -- mutually exclusive: distinct closed sets
                    ∧ ( cl_R(D_R) = ⊔ C_R )                     -- collectively exhaustive: closure spans D_R
-- MECE is forced by the cl_R axioms over C_R: idempotent closure ⇒ no overlap, ⊔ C_R = cl_R(D_R) ⇒ no gap
C_R = ∅           ⇒ ⊥                                            -- empty lattice is a malfunction, refuse loudly
\`\`\`
`,
};
