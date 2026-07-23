import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { conceptualize } from '../conceptualize/skill.js';
import { materialize } from '../materialize/skill.js';
import { signify } from '../signify/skill.js';

const FORMAL_BLOCK = `Concept            ≜ ⟨ gloss , anchor? , factorization? ⟩
D                  ≜ the source corpus
produce            : D → Concept @ conceptualize
name               : Concept → Concept @ signify
realize            : Concept → Concept @ materialize
readers            : Concept → ℘({ LLM, human })
ρ, register        : Concept → { LLM, human }
REC_R              : Concept → Concept @ materialize
R_cold(f)          ≜ the isolated cold-blind decode of fragment f (a naive reader, zero project-K, from f's signifiers + inline ≜ alone)
R_cold, coldpass   @ cold-decode-oracle
s                  ≜ realize's named strategy
Cells              ≜ every authored cell, self included
fragment_digest(f) ≜ digest( trim( collapse-whitespace( NFC(f) ) ) )
manifest           ≜ { source , exemplified_at , reader , routes[⟨fragment_digest, idea_gloss, home_slug, disposition, rank⟩] , delta[⟨fragment_digest, idea_gloss⟩] }

realized(k) ⇔ factorization(k) ≠ ⊥
conform(k)  ⇔ register(k) = ρ(k)
ρ(k)        ≜ human ⇔ readers(k) = { human } ; LLM otherwise
coldpass(k) ⇔ R_cold(body(k)) ≅ gloss(k) ∧ decode_warm(body(k) | K) ≅ R_cold(body(k))
valid(k)    ⇔ REC_R(k) ≽ k ∧ minimal(k) ∧ conform(k) ∧ coldpass(k)
produce ↦ gloss ; name ↦ anchor ; realize ↦ factorization
s = ∅ ⇒ ⊥
∀ k ∈ Cells : accept(k) defined
disposition ∈ { reuse, mint }
∀ c ∈ C_R : c ∈ routes ⊻ c ∈ delta
accept(F(D)) = F(D) ⇒ manifest @ .manifests/<source>.json

F(D)         ≜ realize( name( produce(D) ) )
exemplify(D) ≜ accept( F(D) )
accept(k)    ≜ ⊥ , ¬realized(k)
accept(k)    ≜ k , valid(k)
accept(k)    ≜ ⊥ , ¬valid(k)` as SkillExpression;

export const exemplify: Skill = {
  name: 'exemplify',
  description: `optimize a context corpus into a canonical semantic factorization — compose produce → name → realize over the one concept-contract record, then gate on accept; emits the R3 routing manifest that catches the dropped idea.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [conceptualize, signify, materialize],
};
