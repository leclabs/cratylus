// A fixture skill: `extra` composes nothing.
import type { Skill } from '@cratylus/schema';

export const extra: Skill = {
  name: 'extra',
  description: 'fixture skill extra',
  formalBlock: 'extra ≜ ⟨fixture⟩',
  composition: () => [],
};
