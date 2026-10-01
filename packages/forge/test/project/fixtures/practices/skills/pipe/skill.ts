// A fixture skill: `pipe` composes `conduit`.
import type { Skill } from '@cratylus/schema';
import { conduit } from '../conduit/skill.js';

export const pipe: Skill = {
  name: 'pipe',
  description: 'fixture skill pipe',
  formalBlock: 'pipe ≜ ⟨fixture⟩',
  composition: () => [conduit],
};
