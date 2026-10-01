// A fixture skill: `base` composes nothing.
import type { Skill } from '@cratylus/schema';

export const base: Skill = {
  name: 'base',
  description: 'fixture skill base',
  formalBlock: 'base ≜ ⟨fixture⟩',
  composition: () => [],
};
