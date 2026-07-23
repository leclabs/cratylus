import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { conceptualize } from '../conceptualize/skill.js';
import { elicit } from '../elicit/skill.js';
import { signify } from '../signify/skill.js';

const FORMAL_BLOCK = `D    ≜ distinction space ⟨structured knowledge to draw on⟩
cl   ≜ closure ⟨smallest concept containing a set of priors⟩
C    ≜ concept lattice ⟨the cl-closed subsets of D⟩
priors(w) ≜ understanding w carries before any definition ⟨associations · connotations · structured-knowledge unpacked from the token alone, not its surface wording⟩
Names  ≜ the readable signifiers
dec  : Names ⇀ ℘(D) @ signify
σ*     @ signify
w      ≜ a signifier under probe ⟨w ∈ Names⟩
c      ≜ a target concept ⟨c ∈ C⟩
W(c)   ≜ experiment's finite candidate set for target c ⟨W(c) ⊆ Names⟩
probe : Names → ℘(D) × C
fired : Names → ℘(D)
fired(w) ≜ priors(w)
fired(a) = dec(a) , a ∈ dom(dec)
concept(w) ≜ cl(fired(w))
probe(w) ≜ ⟨ fired(w) · concept(w) ⟩
experiment(c) ≜ { w ∈ W(c) | concept(w) = c }
coverage : { w ∈ Names | fired(w) ≠ ∅ ∧ concept(w) = c } ⊆ W(c)
crystallize : σ*(c) ∈ experiment(c)` as SkillExpression;

export const probe: Skill = {
  name: 'probe',
  description: `use this skill to probe a signifier — read out the priors a word, phrase, or candidate name fires in the reader (\`fired\`, signify's decoder \`dec\` generalized off its assigned anchors) and the concept they circumscribe; the forward, no-commit inverse of signify, for discovering the concept latent in a name or experimenting with candidate anchors before committing — a keeper crystallizes through signify.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [signify, elicit, conceptualize],
};
