import type { SkillCell } from '../toolkit/skill-cell.js';

const FORMAL_BLOCK = `DECLARATIONS

R — reader whose priors are the instrument (an LLM ∨ a well-read person)
D_R — R's distinction space: the structured knowledge R can draw on
℘(D_R) — powerset of D_R; a set of fired priors is a region of D_R
cl_R — R's closure: the smallest concept containing a set of priors
C_R — R's concept lattice: the cl_R-closed subsets of D_R
latent-priors(w,R) — understanding w carries in R BEFORE any definition: associations · connotations · structured-knowledge R unpacks from the token alone; a region of D_R
read-by-priors-not-surface — recognition rule: resolve w by the form its priors evoke, not by surface wording; noise is trace, not the meaning
anchor-to-readers-priors — fit is reader-relative: w's fired priors are R-indexed; precise for one R may be opaque for another
precise-circumscription(w,C,R) — w fits C ⇔ latent-priors(w,R) circumscribe C: cover C's full extent ∧ reach nothing beyond (too-broad ⇒ false inclusion; too-narrow ⇒ fails to cover)
Names — the signifiers R can read
dec_R — signify's decoder: dec_R(a) = the priors anchor a fires, dom(dec_R) ⊆ Names
w — a signifier under probe; w ∈ Names, need not lie in dom(dec_R)

LAWS

fired_R : Names → ℘(D_R)
fired_R(w) ≜ latent-priors(w,R)                        -- the priors w evokes in R
fired_R(a) = dec_R(a) , a ∈ dom(dec_R)                 -- agrees with signify on assigned anchors
concept_R(w) ≜ cl_R(fired_R(w))                        -- the concept w circumscribes in R
probe(w) ≜ ⟨ fired_R(w) · concept_R(w) ⟩              -- readout only; nothing committed; α ∧ C_R unchanged
-- discover : read concept_R(w) latent in a given name w
-- experiment : weigh candidate names {w_i} against a target C by precise-circumscription(w_i,C,R); a keeper crystallizes through signify`;

export const probe: SkillCell = {
  name: 'probe',
  delineation: `probe(w) ↦ ⟨fired_R(w) · concept_R(w)⟩ · no-commit-inverse(signify) · discover ∨ experiment(candidate-anchors)`,
  formalBlock: FORMAL_BLOCK,
  composition: ['signify', 'elicit', 'conceptualize'],
  body: `

# probe

Forward, no-commit inverse of signify: read a signifier \`w\` already given and return the priors it fires plus the concept it circumscribes, committing nothing — the active counterpart elicit instead queries an oracle for a target not yet signified. Resolve from context: \`w\` — the signifier under probe (a word, phrase, or candidate name); \`R\` — the reader whose priors are the instrument. \`fired_R\` generalizes signify's decoder \`dec_R\` off its assigned anchors; the lattice \`C_R\`, the closure \`cl_R\`, and the distinction space \`D_R\` come from conceptualize. Symbol table: \`src/toolkit/operator-lexicon.ts\`.

Bindings: inverse of signify; counterpart to elicit; draws the lattice from conceptualize.

\`\`\`text
${FORMAL_BLOCK}
\`\`\`
`,
};
