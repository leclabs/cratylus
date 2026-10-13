// A large skill that remains available to OMP without a main-session hook.
import type { Skill } from '@cratylus/schema';

export const huge: Skill = {
  name: 'huge',
  description: 'fixture skill that does not fit',
  formalBlock: `HUGE ≜ ⟨${'does-not-fit '.repeat(1000)}⟩`,
  composition: () => [],
};
