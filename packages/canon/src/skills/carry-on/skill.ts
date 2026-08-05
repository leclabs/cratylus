import type { Skill, SkillExpression } from '../../manifest.js';
import { praxis } from '../praxis/skill.js';

const carryOnNotation: SkillExpression =
  `carry-on ≜ re-dispatch-word ↦ elevate · persist
re-dispatch-word ≜ weitermachen ∨ carry-on ∨ proceed
loop-position ∈ { on-the-loop, out-of-the-loop }   ⟨live session state, ¬ a static value⟩
resting   ≜ loop-position = on-the-loop   ⟨a session opens in orientation · intent is the operator's to set⟩
P         ≜ the bound praxis ⟨∨ the standing intent, absent one⟩
bound, done, triage, file, defect, impedes @ praxis
fork⊥     ≜ fork(irreversible · value · competence) the principal cannot resolve
elevate   ≜ loop-position := out-of-the-loop ∧ bind(P)
persist   ⇔ loop-position = out-of-the-loop holds ∀ turn until a terminus ⟨¬ per-turn-decay⟩
terminus  ≜ done(P) ∨ fork⊥
regression ≜ defect d : impedes(d, t) for the shard t in hand
revert    ≜ loop-position := on-the-loop

check-in-close ∧ re-dispatch-word ⇒ elevate
elevate ⇒ standing-intent unchanged ∧ ¬fresh-dispatch ∧ ¬permission-grant
elevate ⇒ resume execution ⟨own judgment · reversible-in-domain decided · no fresh permission owed⟩
bind(P) ∧ ¬terminus ⇒ persist
turn-end ∧ ¬terminus ⇒ ¬revert
terminus ⇒ revert ∴ loop-position = resting
fork⊥ ⇒ re-enter on-the-loop ∧ surface the fork
regression ⇒ fix ∧ ¬check-in ⟨repair in the path is execution, ¬ a new fork⟩
defect ∧ ¬regression ⇒ file ∧ ¬fix ⟨out-of-path defects are recorded, ¬ chased⟩
` as SkillExpression;

export const carryOn: Skill = {
  name: 'carry-on',
  description: `use this skill when the Operator utters the re-dispatch word (weitermachen · carry on · proceed) — closing a check-in and returning you to autonomous execution under re-affirmed authority; the elevation to out-of-the-loop persists across turns, bound to the bound praxis until it completes or an unresolvable fork forces re-entry — standing intent unchanged, no fresh permission owed.`,
  formalBlock: carryOnNotation,
  composition: () => [praxis],
};
