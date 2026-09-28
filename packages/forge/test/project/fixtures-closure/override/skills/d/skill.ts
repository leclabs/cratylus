// The later plugin's `d`: same name, and it composes `f`, so projecting with this
// plugin in the set must change every closure that reaches `d`.
import type { Skill } from '@cratylus/schema';
import { f } from '../../../base/skills/f/skill.js';

export const d: Skill = {
  name: 'd',
  description: 'fixture skill d, overridden',
  formalBlock: 'D ≜ ⟨override⟩',
  composition: () => [f],
};
