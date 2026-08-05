import type { Skill, SkillExpression } from '@cratylus/schema';
import { conceptualize } from '../conceptualize/skill.js';
import { materialize } from '../materialize/skill.js';
import { signify } from '../signify/skill.js';

const FORMAL_BLOCK = `concept-record     ≜ ⟨ gloss , anchor? , factorization? ⟩
sources            ≜ input material @ conceptualize ⟨the corpus D is drawn OVER, ¬ D itself⟩
C                  ≜ concept lattice @ conceptualize
produce            : sources → concept-record @ conceptualize
name               : concept-record → concept-record @ signify
realize            : concept-record → concept-record @ materialize
REC                : concept-record → concept-record @ materialize
R_cold(f)          ≜ the isolated cold-blind decode of fragment f (a naive reader, zero project-K, from f's signifiers + inline ≜ alone)
body(k)            ≜ cell k's authored surface ⟨front-matter excluded⟩
decode_warm(f | K) ≜ fragment f's warm decode, reader free to consult K
K                  ≜ project-K, the warm knowledge (project corpus) a reader already holds
R_cold, decode_warm, coldpass, K @ cold-decode-oracle
minimal            @ signify
conform            @ signify
Cells              ≜ every authored cell, self included
fragment_digest(f) ≜ digest( trim( collapse-whitespace( NFC(f) ) ) )
manifest           ≜ { source , exemplified_at , reader , routes[⟨fragment_digest, idea_gloss, home_slug, disposition, rank⟩] , delta[⟨fragment_digest, idea_gloss⟩] }

realized(k) ⇔ factorization(k) ≠ ⊥
coldpass(k) ⇔ R_cold(body(k)) ≅ gloss(k) ∧ decode_warm(body(k) | K) ≅ R_cold(body(k))
valid(k)    ⇔ REC(k) ≽ k ∧ minimal(k) ∧ conform(k) ∧ coldpass(k)
produce ↦ gloss ; name ↦ anchor ; realize ↦ factorization
∀ k ∈ Cells : accept(k) defined
disposition ∈ { reuse, mint }
∀ c ∈ C : c ∈ routes ⊻ c ∈ delta
accept(F(sources)) = F(sources) ⇒ manifest @ .manifests/<source>.json

F(sources)   ≜ realize( name( produce(sources) ) )
exemplify(sources) ≜ accept( F(sources) )
accept(k)    ≜ ⊥ , ¬realized(k)
accept(k)    ≜ k , valid(k)
accept(k)    ≜ ⊥ , ¬valid(k)` as SkillExpression;

export const exemplify: Skill = {
  name: 'exemplify',
  description: `optimize a context corpus into a canonical semantic factorization — compose produce → name → realize over the one concept-record, then gate on accept; emits the R3 routing manifest that catches the dropped idea.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [conceptualize, signify, materialize],
};
