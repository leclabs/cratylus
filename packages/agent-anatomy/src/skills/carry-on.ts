import type { SkillCell, SkillExpression } from '../toolkit/skill-cell.js';

export const carryOnNotation: SkillExpression = `carry-on ≜
  re-dispatch-word(weitermachen ∨ proceed)
    · check-in-close ↦ human-on-the-loop → human-out-of-the-loop
    · standing-intent unchanged
` as SkillExpression;

export const carryOn: SkillCell = {
  name: 'carry-on',
  description: `use to signal "weitermachen"; to persist in an ongoing activity, especially after an interruption, hesitation, pause, or obstacle.`,
  composition: [],
  body: `
# carry-on

\`\`\`text
${carryOnNotation}
\`\`\`
`,
};
