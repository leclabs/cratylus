import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { conceptualize } from './conceptualize.js';
import { elicit } from './elicit.js';
import { signify } from './signify.js';

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
W(C) — experiment's finite candidate set, weighed against target C ; W(C) ⊆ Names

LAWS

fired_R : Names → ℘(D_R)
fired_R(w) ≜ latent-priors(w,R)
fired_R(a) = dec_R(a) , a ∈ dom(dec_R)
concept_R(w) ≜ cl_R(fired_R(w))
probe(w) ≜ ⟨ fired_R(w) · concept_R(w) ⟩
experiment(C) ≜ { w ∈ W(C) | precise-circumscription(w,C,R) }
coverage : { w ∈ Names | fired_R(w) ≠ ∅ ∧ precise-circumscription(w,C,R) } ⊆ W(C)
crystallize : σ*(C) ∈ experiment(C)` as SkillExpression;

export const probe: Skill = {
  name: 'probe',
  description: `use this skill to probe a signifier — read out the latent priors a word, phrase, or candidate name fires in the reader (\`fired_R\`, signify's decoder \`dec_R\` generalized off its assigned anchors) and the concept they circumscribe; the forward, no-commit inverse of signify, for discovering the concept latent in a name or experimenting with candidate anchors before committing — a keeper crystallizes through signify.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [signify, elicit, conceptualize],
};
