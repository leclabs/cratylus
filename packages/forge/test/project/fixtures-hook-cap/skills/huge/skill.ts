// A skill whose launch-hook output is over claude's 10,000-character per-hook cap.
import type { Skill } from '@cratylus/schema';

export const huge: Skill = {
  name: 'huge',
  description: 'fixture skill that does not fit',
  formalBlock: `HUGE ≜ ⟨${'does-not-fit '.repeat(1000)}⟩`,
  composition: () => [],
};
