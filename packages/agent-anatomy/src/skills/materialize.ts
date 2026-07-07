import type { SkillCell } from '../toolkit/skill-cell.js';

export const materialize: SkillCell = {
  name: 'materialize',
  delineation: `use this skill to realize a concept lattice as artifacts — select each concept's canonical factorization \`F_R\`, emit the bipartite normal form \`CSF_R\` (a primitive by value as ⟨anchor, gloss⟩, a composite by reference as ⟨anchor, factor-anchors⟩), then realize under an explicitly named strategy whose kind-consumption table ρ refuses loudly when unnamed; stage 3 of exemplify, independently invocable.`,
  formalBlock: `-- DECLARATIONS ----------------------------------------------------------
C_R              the reader's concept lattice
prim_R : C_R → 𝔹 c is primitive (irreducible at R) vs composite
fac_R(c)         the candidate factorizations of c (sets of factor-concepts)
≺                the shortlex order over factorizations
anchor : C_R → sign ∪ {⊥}   the assigned sign; ⊥ = unnamed
gloss : C_R → text          a primitive's stored meaning
kind : C_R → K              the cell's kind
K                the closed kind set

concept-contract ≜ record(gloss, anchor, factorization)   -- the unit threaded through the chain
dfp(g) ≜ densest-faithful-point(g)                         -- minimal text recovering g w/o loss; a primitive's stored gloss
cite-by-ref ≜ a composite stores factor-anchors, never restates factor content (one home, cited once)
CSF ≜ bipartite-normal-form: primitive↦⟨anchor,gloss⟩ by value ; composite↦⟨anchor,factor-anchors⟩ by reference
realize ≜ dispatch artifact-form per kind through a named strategy s
loud-refusal ≜ s unnamed ∨ ρ_s not total over live kinds ⇒ ⊥   -- no permissive default, refuse don't guess

-- LAWS -------------------------------------------------------------------
F_R(m) ≜ min_≺ fac_R(m)
CSF_R(c) ≜ ( anchor(c) , dfp(gloss(c)) )              ,  prim_R(c)     -- anchor read from the record, not recomputed
CSF_R(c) ≜ ( anchor(c) , { anchor(p) | p ∈ F_R(c) } ) ,  ¬prim_R(c)   -- cite-by-ref: factor-anchors, never factor content
realize(k) fills factorization(k) ≜ CSF_R(k) ; gloss(k), anchor(k) preserved
anchor(k) = ⊥ ⇒ realize(k) = ⊥                        -- cannot realize an unnamed concept

prose(c) ≜ render(CSF_R(c), R)
prose(c) is a projection, never stored beside CSF_R(c)

Φ ≜ { (anchor(c), kind(c), CSF_R(c)) | c ∈ C_R }
S ≜ { file, document, … }
σ : Φ × S → artifacts
ρ_s : K → form_s
σ requires ρ_s total over kinds(Φ)                    -- loud-refusal:
s unnamed ∨ s ∉ S ⇒ ⊥
∃ k ∈ kinds(Φ) : k ∉ dom(ρ_s) ⇒ ⊥

σ(Φ, file) ≜ { \${OUTPUT_DIR}/anchor(c).md | (anchor(c), k, x) ∈ Φ }
ρ_file(k) ≜ front-matter (kind: k, delineation) + body
∀ f ∈ σ(Φ, file) : ∃! (a, k, x) ∈ Φ : content(f) = x

σ(Φ, document) ≜ one recomposed document
ρ_document(k) ≜ rhetorical role:
    concept        ↦ definition
    process        ↦ ordered steps
    principle      ↦ constraint
    structure      ↦ table
    classification ↦ membership test
    utility        ↦ instrument`,
  composition: ['exemplify', 'signify', 'conceptualize'],
  body: `

# Materialize Skill

The chain's emit op: \`CSF → realize\`. Select each concept's canonical factorization, emit the bipartite normal form \`CSF_R\`, and realize it as artifacts under an explicitly named strategy. Stage 3 of exemplify — consumes the \`name\`d records signify emitted, which conceptualize first populated. This stage \`realize\`s the concept-contract record: it fills the \`factorization\` field, preserving \`gloss\` and \`anchor\` — an unnamed concept (\`anchor = ⊥\`) cannot be realized.

Bindings: stage of exemplify; consumes records from signify · conceptualize.

Resolve from context: the \`name\`d concept-contract records — each carrying its \`gloss\` and \`anchor\`, drawn from the lattice \`C_R\` (with \`prim_R\`, \`fac_R\`, the order \`≺\`); \`s\` — the strategy, REQUIRED from the caller; \`\${OUTPUT_DIR}\` — file strategy only. The symbol table is \`references/formal-symbolic-notation.md\`.

\`\`\`text
-- DECLARATIONS ----------------------------------------------------------
C_R              the reader's concept lattice
prim_R : C_R → 𝔹 c is primitive (irreducible at R) vs composite
fac_R(c)         the candidate factorizations of c (sets of factor-concepts)
≺                the shortlex order over factorizations
anchor : C_R → sign ∪ {⊥}   the assigned sign; ⊥ = unnamed
gloss : C_R → text          a primitive's stored meaning
kind : C_R → K              the cell's kind
K                the closed kind set

concept-contract ≜ record(gloss, anchor, factorization)   -- the unit threaded through the chain
dfp(g) ≜ densest-faithful-point(g)                         -- minimal text recovering g w/o loss; a primitive's stored gloss
cite-by-ref ≜ a composite stores factor-anchors, never restates factor content (one home, cited once)
CSF ≜ bipartite-normal-form: primitive↦⟨anchor,gloss⟩ by value ; composite↦⟨anchor,factor-anchors⟩ by reference
realize ≜ dispatch artifact-form per kind through a named strategy s
loud-refusal ≜ s unnamed ∨ ρ_s not total over live kinds ⇒ ⊥   -- no permissive default, refuse don't guess

-- LAWS -------------------------------------------------------------------
F_R(m) ≜ min_≺ fac_R(m)
CSF_R(c) ≜ ( anchor(c) , dfp(gloss(c)) )              ,  prim_R(c)     -- anchor read from the record, not recomputed
CSF_R(c) ≜ ( anchor(c) , { anchor(p) | p ∈ F_R(c) } ) ,  ¬prim_R(c)   -- cite-by-ref: factor-anchors, never factor content
realize(k) fills factorization(k) ≜ CSF_R(k) ; gloss(k), anchor(k) preserved
anchor(k) = ⊥ ⇒ realize(k) = ⊥                        -- cannot realize an unnamed concept

prose(c) ≜ render(CSF_R(c), R)
prose(c) is a projection, never stored beside CSF_R(c)

Φ ≜ { (anchor(c), kind(c), CSF_R(c)) | c ∈ C_R }
S ≜ { file, document, … }
σ : Φ × S → artifacts
ρ_s : K → form_s
σ requires ρ_s total over kinds(Φ)                    -- loud-refusal:
s unnamed ∨ s ∉ S ⇒ ⊥
∃ k ∈ kinds(Φ) : k ∉ dom(ρ_s) ⇒ ⊥

σ(Φ, file) ≜ { \${OUTPUT_DIR}/anchor(c).md | (anchor(c), k, x) ∈ Φ }
ρ_file(k) ≜ front-matter (kind: k, delineation) + body
∀ f ∈ σ(Φ, file) : ∃! (a, k, x) ∈ Φ : content(f) = x

σ(Φ, document) ≜ one recomposed document
ρ_document(k) ≜ rhetorical role:
    concept        ↦ definition
    process        ↦ ordered steps
    principle      ↦ constraint
    structure      ↦ table
    classification ↦ membership test
    utility        ↦ instrument
\`\`\`
`,
};
