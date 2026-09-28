// `b` composes `d` as `a` does, so `d` is reached twice and emitted once.
import type { Skill } from '@cratylus/schema';
import { c } from '../c/skill.js';
import { d } from '../d/skill.js';

export const b: Skill = {
  name: 'b',
  description: 'fixture skill b',
  formalBlock: 'B ≜ ⟨fixture⟩',
  composition: () => [c, d],
};
