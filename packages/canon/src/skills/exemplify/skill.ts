import { primePrinciple } from '../../genus/prime-principle.js';
import type { Skill, SkillExpression } from '../../manifest.js';

// COMPOSES NOTHING, and that is the repair.
//
// This skill used to declare `composition: () => [conceptualize, signify, materialize]` and import those
// modules to do it. The thunk's only consumer is the trailing `Composed from …`
// line of the projected SKILL.md (`forge/src/core/exemplify/skill-body.ts`), so each
// import bought one sentence of provenance and cost a module-level cycle: the four
// signification skills each claimed to be composed from the other three, and no one of
// them could be read, taken or deployed alone.
//
// The relation those edges named is CITATION, not dependency: these skills RESTATE each
// other's terms in different registers (prose here, signature there). A citation
// belongs inside the block, at the term that borrows it (`@ <skill>`), where it needs
// no import and cannot cycle. Composition is the caller's: an agent pipes these skills
// in whatever order the work wants.

const FORMAL_BLOCK = `concept-record     ≜ ⟨ meaning , term? , factorization? ⟩
sources            ≜ input material @ conceptualize ⟨the material D is drawn OVER, ¬ D itself⟩
C                  ≜ concept lattice @ conceptualize
produce            : sources → concept-record @ conceptualize
name               : concept-record → concept-record @ signify ⟨each concept takes its Cratylic name, the established term where its domain already names it⟩
realize            : concept-record → concept-record @ materialize
REC                : concept-record → concept-record @ materialize
R_fresh(f)         ≜ a fresh model's reading of fragment f (zero project-K, given f's terms + inline ≜ with its bounded context's name and subject, nothing of intent(f))
body(k)            ≜ piece k's authored surface ⟨front-matter excluded⟩
decode_warm(f | K) ≜ fragment f's warm decode, reader free to consult K
K                  ≜ project-K, the warm knowledge (the project's own texts) a reader already holds
minimal            @ signify
conform            @ signify
Pieces             ≜ the authored pieces of the source exemplified, self included
fragment_digest(f) ≜ digest( trim( collapse-whitespace( NFC(f) ) ) )
manifest           ≜ { source , exemplified_at , reader , routes[⟨fragment_digest, idea_meaning, home_slug, disposition, rank⟩] , delta[⟨fragment_digest, idea_meaning⟩] }

realized(k) ⇔ factorization(k) ≠ ⊥
freshpass(k) ⇔ R_fresh(body(k)) ≅ meaning(k) ∧ decode_warm(body(k) | K) ≅ R_fresh(body(k))
valid(k)    ⇔ REC(k) ≽ k ∧ minimal(k) ∧ conform(k) ∧ freshpass(k)
produce ↦ meaning ; name ↦ term ; realize ↦ factorization
∀ k ∈ Pieces : accept(k) defined
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
  description: `Restate a body of context, an agent, a skill or a document, in Cratylic names — find its concepts, give each its term with its precising definition, and write it back built from them, keeping each piece only when its fresh reading gives the meaning intended and every idea of the source has a place. Reach for it when context written as freeform prose should carry its concepts by name, shorter and meaning nothing beyond what is intended.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [],
  preamble: primePrinciple,
};
