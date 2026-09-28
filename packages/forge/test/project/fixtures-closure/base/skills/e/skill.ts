// `e` is declared beside `a`, so it precedes everything `a` composes.
import type { Skill } from '@cratylus/schema';

export const e: Skill = {
  name: 'e',
  description: 'fixture skill e',
  formalBlock: 'E ≜ ⟨fixture⟩',
  composition: () => [],
};
