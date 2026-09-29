// A skill whose launch-hook output is far under any cap.
import type { Skill } from '@cratylus/schema';

export const small: Skill = {
  name: 'small',
  description: 'fixture skill that fits',
  formalBlock: 'SMALL ≜ ⟨fits⟩',
  composition: () => [],
};
