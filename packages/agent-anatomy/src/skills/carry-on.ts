import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';

const carryOnNotation: SkillExpression = `carry-on ≜
  re-dispatch-word(weitermachen ∨ proceed)
    · check-in-close ↦ human-on-the-loop → human-out-of-the-loop
    · standing-intent unchanged
    · resume execution ⟨own judgment · reversible-in-domain decided · no fresh permission owed⟩
    · permission-is-not-the-act — the word ends the pause ; ¬fresh-dispatch ∧ ¬permission-grant
` as SkillExpression;

export const carryOn: Skill = {
  name: 'carry-on',
  description: `use this skill when the Operator utters the re-dispatch word (weitermachen · carry on · proceed) — closing a check-in and returning you to autonomous execution under re-affirmed authority; standing intent unchanged, no fresh permission owed.`,
  formalBlock: carryOnNotation,
  composition: () => [],
};
