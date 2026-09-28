// `c` composes `a` back: the cycle the closure must terminate on.
import type { Skill } from '@cratylus/schema';
import { a } from '../a/skill.js';

export const c: Skill = {
  name: 'c',
  description: 'fixture skill c',
  formalBlock: 'C ≜ ⟨fixture⟩',
  composition: () => [a],
};
