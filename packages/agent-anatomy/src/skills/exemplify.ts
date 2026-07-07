import type { SkillCell } from '../toolkit/skill-cell.js';

const FORMAL_BLOCK = `-- Concept-contract: the one record the pipeline programs to (the narrow waist) --
Concept     ≜ ⟨ gloss , anchor? , factorization? ⟩       -- meaning by value; anchor, factorization optional
produce     : D → Concept                                 -- conceptualize: fills gloss   (cut at meaning joints)
name        : Concept → Concept                           -- signify:       fills anchor  (each concept → its σ*_R)
realize     : Concept → Concept                           -- materialize:   fills factorization (bipartite normal form)
realized(k) ⇔ factorization(k) ≠ ⊥

-- Reader binding (home: signify READER BINDING): the realized body's register follows its reader --
readers(k)  — the realized artifact's operative consumers
ρ(k)        ≜ human ⇔ readers(k) = {human} ; LLM otherwise -- a generated agent-artifact defaults to LLM
register(k) — the register the realized body is authored in
conform(k)  ⇔ register(k) = ρ(k)                          -- a human-register agent-artifact is invalid

-- Cold-decode gate (home: cold-decode-oracle; instrument: the isolated oracle harness — a PROCESS
--   (scratch cwd + credentials-only config, tool-less, mood-neutral prompt), never a subagent (a subagent is warm)) --
R_cold(f)   ≜ the isolated cold-blind decode of fragment f (a naive reader, zero project-K, from f's signifiers + inline ≜ alone)
coldpass(k) ⇔ R_cold(body(k)) ≅_R gloss(k)  ∧  decode_warm(body(k) | K) ≅_R R_cold(body(k))
                                                          -- m1 self-sufficient (cold ≅_R intent) ∧ m2 no competing home (warm ≅_R cold)
                                                          --   divergence ⇒ project defect: realign project→cold-truth, never bend body→K

-- Canonical-semantic-factorization: the model a valid factorization must satisfy --
valid(k)    ⇔ REC_R(k) ≽ k  ∧  minimal(k)  ∧  conform(k)  ∧  coldpass(k)
                                                          -- round-trips equivalent-or-better from anchors, no two concepts fuse,
                                                          --   the body holds its reader's register, AND the body cold-decodes to intent
                                                          --   REC_R = reconstruction from anchors (by value if primitive, by reference if composite)

-- No-permissive-defaults: an unnamed strategy refuses, never waves through --
s = ∅ ⇒ ⊥                                                 -- ρ_s must be total over the kinds in scope, else ⊥

-- The pipeline --
F(D)         ≜ realize( name( produce(D) ) )              -- each stage fills one field of the Concept record
exemplify(D) ≜ accept( F(D) )

-- Accept: the gate; self-application is mandatory (the corpus's own test, no anchor grandfathered) --
accept(k)   ≜ ⊥          ,  ¬realized(k)                  -- cannot judge an unrealized concept
accept(k)   ≜ k          ,  valid(k)                      -- pass: verdict carries the work forward unchanged
accept(k)   ≜ ⊥          ,  ¬valid(k)                     -- refuse: loud, never a silent drop`;

export const exemplify: SkillCell = {
  name: 'exemplify',
  delineation: `optimize a context corpus into a canonical semantic factorization — compose produce → name → realize over the one concept-contract record, then gate on accept; emits the R3 routing manifest that catches the dropped idea.`,
  formalBlock: FORMAL_BLOCK,
  composition: ['conceptualize', 'signify', 'materialize'],
  body: `

# Exemplify

The CSF pipeline as one composition: three stages each fill one field of a single record, then a gate reads the realized record and refuses unless it is valid — including \`conform\`: an emitted agent-artifact (\`ρ = LLM\`) authored at human register fails accept. Accept also **executes** the isolated cold oracle (cold-decode-oracle) on the realized body — \`coldpass\`: m1 \`R_cold ≅_R gloss\` ∧ m2 \`warm ≅_R R_cold\` — and refuses on divergence; the oracle is a PROCESS (isolated cwd + config, tool-less), never a subagent (a subagent inherits project-K and reads warm). This is the law's teeth in the authoring path. Composes the three sibling stages — each a function over the same record, naming no peer. The symbol table is \`references/formal-symbolic-notation.md\`.

Bindings: composes conceptualize (\`produce\`) · signify (\`name\`) · materialize (\`realize\`).

Resolve from context: \`D\` — the input corpus (multi-modal); \`R\` — the reader whose priors fix every meaning; \`s\` — the strategy ∈ { file, document }.

The fenced block declares every term it uses; no term is borrowed by reference.

\`\`\`text
${FORMAL_BLOCK}
\`\`\`

On accept, emit the **R3 routing manifest** — \`.manifests/<source>.json\`, one entry per concept \`c ∈ C_R\` keyed by \`fragment_digest\` (\`toolkit/core/digest.fragment_digest\`: NFC + whitespace-collapse + trim), each in \`routes[]\` (\`α\` · \`reuse\` | \`mint\`) or \`delta[]\`, exactly one. An unrouted concept is the dropped idea R3 catches.

\`\`\`jsonc
{
  "source": "...", "exemplified_at": "...Z", "reader": "...",
  "routes": [ { "fragment_digest": "sha256:...", "idea_gloss": "...", "home_slug": "...", "disposition": "reuse", "rank": 0.0 } ],
  "delta":  [ { "fragment_digest": "sha256:...", "idea_gloss": "..." } ]
}
\`\`\`
`,
};
