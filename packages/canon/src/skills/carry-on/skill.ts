import type { Skill, SkillExpression } from '../../manifest.js';

// WHAT THIS CELL IS ABOUT, and what it deliberately does not name.
//
// carry-on is AUTONOMY: the operator closing a check-in and re-affirming the
// decision authority already granted, over the context already in hand. It is not a
// plan operator. It used to be one — it imported `praxis`, projected canon's plan
// layout onto a runtime command line, and derived its terminus by reading plan state
// off disk — and that conflation made the cell refuse every context that was not a
// plan. "Carry on with what we just discussed" is the same utterance doing the same
// work over a discussion, and a cell bound to `praxis` cannot serve it.
//
// The COMPOSITION is the operator's, at the utterance: "carry on with the plan
// execution" is carry-on ∘ plan, and the pairing lives in what was said, not in
// this module's import list. A cell that names one context forecloses the rest.
//
// THE MECHANISM WENT WITH THE COUPLING, and that is a real loss recorded rather than
// hidden. The old `runtime: { capability: 'carryOn' }` installed a turn-end gate, on
// the correct argument that an elevation asserted in prose is advisory. But every
// verb it offered took the plan layout as arguments and read terminus from plan state
// on disk, so the mechanism WAS the coupling. A context-neutral gate would need a
// context-neutral terminus, which nothing on disk can answer; until one exists, the
// turn-end refusal this corpus does own is the stance guardrail, which binds every
// turn regardless of which word opened it.

const carryOnNotation: SkillExpression =
  `carry-on ≜ re-dispatch-word ↦ elevate · persist · revert
re-dispatch-word ≜ weitermachen ∨ carry-on ∨ proceed
context   ≜ the standing intent already in hand ⟨whatever established it : a plan · a discussion · a review · a defect in the path⟩
loop-position ∈ { on-the-loop, out-of-the-loop } ⟨live session state, ¬ a static value⟩
resting   ≜ loop-position = on-the-loop ⟨a session opens in orientation · intent is the operator's to set⟩
authority ≜ decision-right over the acts context admits
reversible-in-domain ≜ an act whose undo is available to the same principal
fork⊥     ≜ fork(irreversible · value · competence) the principal cannot resolve
satisfied(context) ⇔ what was asked is delivered ∨ withdrawn
elevate   ≜ loop-position := out-of-the-loop ∧ authority ↾ context := principal-self
revert    ≜ loop-position := resting

check-in-close ∧ re-dispatch-word ⇒ elevate
elevate ⇒ context unchanged ∧ ¬fresh-dispatch ∧ ¬permission-grant ∧ ¬scope-widen ⟨re-affirmation of authority already given, ¬ a new mandate⟩
elevate ⇒ resume execution ⟨own judgment · reversible-in-domain decided · ∄ fresh permission owed⟩
elevate ⇒ persist ∀ turn until revert ⟨¬ per-turn-decay : an affirmation uttered ONCE is ¬ re-owed every turn⟩
elevate defined ⇔ ¬ satisfied(context) ⟨at a satisfied context there is nothing to stay out of the loop FOR⟩
fork⊥ ⇒ surface ∧ revert ⟨authority to decide ≠ authority to decide THIS · a fork the principal cannot resolve is the operator's by construction⟩
satisfied(context) ⇒ revert
operator-redirect ⇒ revert ⟨the grant is the operator's to withdraw at any turn⟩
¬ (context @ this cell) ⟨carry-on names no plan · no discussion · no artifact : the operator composes it with a context AT THE UTTERANCE, and a cell naming one forecloses the rest⟩
` as SkillExpression;

export const carryOn: Skill = {
  name: 'carry-on',
  description: `use this skill when the Operator utters the re-dispatch word (weitermachen · carry on · proceed) — closing a check-in and returning you to autonomous execution under authority already granted, over whatever context is already in hand; the elevation persists across turns rather than decaying each turn, and it lifts when the context is satisfied, when the Operator redirects, or at a fork the principal cannot resolve, which is surfaced rather than decided. The context is the Operator's to name in the same breath ("carry on with the plan execution", "carry on with what we just discussed"); this skill supplies the authority, never the subject.`,
  formalBlock: carryOnNotation,
  composition: () => [],
};
