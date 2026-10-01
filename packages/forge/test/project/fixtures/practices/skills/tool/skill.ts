// A fixture skill: `tool` composes nothing.
import type { Skill } from '@cratylus/schema';

export const tool: Skill = {
  name: 'tool',
  description: 'fixture skill tool',
  formalBlock: 'tool ≜ ⟨fixture⟩',
  composition: () => [],
};
