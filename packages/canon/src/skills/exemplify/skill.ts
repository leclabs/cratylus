import type { Skill, SkillExpression } from '../../manifest.js';

// COMPOSES NOTHING, and that is the repair.
//
// This cell used to declare `composition: () => [conceptualize, signify, materialize]` and import those
// modules to do it. The thunk's only consumer is the trailing `Composed from …`
// line of the projected SKILL.md (`forge/src/core/exemplify/skill-cell.ts`), so each
// import bought one sentence of provenance and cost a module-level cycle: the four
// signification cells each claimed to be composed from the other three, and no one of
// them could be read, taken or deployed alone.
//
// The relation those edges named is CITATION, not dependency: `symbol-altitude`'s
// LEDGER records these cells RESTATING each other's signs in different registers
// (prose here, signature there), which is what a REFERENCE row means. A citation
// belongs inside the block, at the sign that borrows it (`@ <cell>`), where it needs
// no import and cannot cycle. Composition is the caller's: an agent pipes these cells
// in whatever order the work wants.

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
  composition: () => [],
};
