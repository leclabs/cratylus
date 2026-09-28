// `d` composes nothing here; the `override` plugin's `d` composes `f`.
import type { Skill } from '@cratylus/schema';

export const d: Skill = {
  name: 'd',
  description: 'fixture skill d',
  formalBlock: 'D ≜ ⟨fixture⟩',
  composition: () => [],
};
