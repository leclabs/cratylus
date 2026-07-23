import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { conceptualize } from '../conceptualize/skill.js';
import { elicit } from '../elicit/skill.js';
import { signify } from '../signify/skill.js';

const FORMAL_BLOCK =
  `R      ≜ reader whose priors are the instrument ⟨LLM ∨ well-read person⟩
D_R    ≜ R's distinction space ⟨structured knowledge R can draw on⟩
cl_R   ≜ R's closure ⟨smallest concept containing a set of priors⟩
C_R    ≜ R's concept lattice ⟨the cl_R-closed subsets of D_R⟩
latent-priors(w,R) ≜ understanding w carries in R before any definition ⟨associations · connotations · structured-knowledge R unpacks from the token alone, not its surface wording⟩
Names  ≜ the signifiers R can read
dec_R  : Names ⇀ ℘(D_R) @ signify
σ*     @ signify
w      ≜ a signifier under probe ⟨w ∈ Names⟩
C      ≜ a target concept ⟨C ∈ C_R⟩
precise-circumscription(w,C,R) ⇔ concept_R(w) = C
W(C)   ≜ experiment's finite candidate set for target C ⟨W(C) ⊆ Names⟩
probe : Names → ℘(D_R) × C_R
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
