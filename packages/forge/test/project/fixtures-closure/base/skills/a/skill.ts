// `a` heads the chain: it composes `b`, which composes `c`.
import type { Skill } from '@cratylus/schema';
import { b } from '../b/skill.js';
import { d } from '../d/skill.js';

export const a: Skill = {
  name: 'a',
  description: 'fixture skill a',
  formalBlock: 'A ≜ ⟨fixture⟩',
  composition: () => [b, d],
};
