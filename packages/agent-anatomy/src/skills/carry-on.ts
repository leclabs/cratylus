import type { Skill, SkillExpression } from '@leclabs/agent-forge/anatomy';

const carryOnNotation: SkillExpression = `carry-on ≜
  re-dispatch-word(weitermachen ∨ proceed)
    · check-in-close ↦ human-on-the-loop → human-out-of-the-loop
    · standing-intent unchanged
` as SkillExpression;

export const carryOn: Skill = {
  name: 'carry-on',
  description: `use to signal "weitermachen"; to persist in an ongoing activity, especially after an interruption, hesitation, pause, or obstacle.`,
  formalBlock: carryOnNotation,
  composition: () => [],
};
