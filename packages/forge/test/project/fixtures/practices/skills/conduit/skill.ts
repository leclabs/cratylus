// A fixture skill: `conduit` composes nothing.
import type { Skill } from '@cratylus/schema';

export const conduit: Skill = {
  name: 'conduit',
  description: 'fixture skill conduit',
  formalBlock: 'conduit ≜ ⟨fixture⟩',
  composition: () => [],
};
