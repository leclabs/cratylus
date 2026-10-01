// A fixture skill: `brief` composes `base`.
import type { Skill } from '@cratylus/schema';
import { base } from '../base/skill.js';

export const brief: Skill = {
  name: 'brief',
  description: 'fixture skill brief',
  formalBlock: 'brief ≜ ⟨fixture⟩',
  composition: () => [base],
};
