// `f` is reached only through the `override` plugin's `d`.
import type { Skill } from '@cratylus/schema';

export const f: Skill = {
  name: 'f',
  description: 'fixture skill f',
  formalBlock: 'F ≜ ⟨fixture⟩',
  composition: () => [],
};
