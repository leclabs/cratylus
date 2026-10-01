// A fixture skill: `stray` composes nothing.
import type { Skill } from '@cratylus/schema';

export const stray: Skill = {
  name: 'stray',
  description: 'fixture skill stray',
  formalBlock: 'stray ≜ ⟨fixture⟩',
  composition: () => [],
};
