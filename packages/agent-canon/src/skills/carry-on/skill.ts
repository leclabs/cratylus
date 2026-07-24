import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';
import { praxis } from '../praxis/skill.js';

const carryOnNotation: SkillExpression =
  `carry-on ≜ re-dispatch-word ↦ elevate · persist
re-dispatch-word ≜ weitermachen ∨ carry-on ∨ proceed
ℓ         ≜ loop-position ∈ { on-the-loop, out-of-the-loop }   ⟨live session state, ¬ a static value⟩
resting   ≜ ℓ = on-the-loop   ⟨a session opens in orientation · intent is the operator's to set⟩
P         ≜ the bound work — the active praxis, or the standing intent absent one
active, done @ praxis
fork⊥     ≜ fork(irreversible · value · competence) the principal cannot resolve
elevate   ≜ ℓ := out-of-the-loop ∧ bind(P)
persist   ⇔ ℓ = out-of-the-loop holds ∀ turn until a terminus ⟨¬ per-turn-decay⟩
terminus  ≜ done(P) ∨ fork⊥
revert    ≜ ℓ := on-the-loop

check-in-close ∧ re-dispatch-word ⇒ elevate
elevate ⇒ standing-intent unchanged ∧ ¬fresh-dispatch ∧ ¬permission-grant
elevate ⇒ resume execution ⟨own judgment · reversible-in-domain decided · no fresh permission owed⟩
bind(P) ∧ ¬terminus ⇒ persist
turn-end ∧ ¬terminus ⇒ ¬revert
terminus ⇒ revert ∴ ℓ = resting
fork⊥ ⇒ re-enter on-the-loop ∧ surface the fork
` as SkillExpression;

export const carryOn: Skill = {
  name: 'carry-on',
  description: `use this skill when the Operator utters the re-dispatch word (weitermachen · carry on · proceed) — closing a check-in and returning you to autonomous execution under re-affirmed authority; the elevation to out-of-the-loop persists across turns, bound to the active praxis until it completes or an unresolvable fork forces re-entry — standing intent unchanged, no fresh permission owed.`,
  formalBlock: carryOnNotation,
  composition: () => [praxis],
};
