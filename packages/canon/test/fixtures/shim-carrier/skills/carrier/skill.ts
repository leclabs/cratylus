// A fixture skill cell declaring a runtime capability: the projected thin shim's
// carrier for the gates that read one out of a real render tree. No canon cell
// declares a capability, so the witness is this fixture's.

import type { Skill } from '@cratylus/schema';

export const carrier: Skill = {
  name: 'carrier',
  description: 'a fixture skill that carries a runtime shim',
  formalBlock: 'C ≜ ⟨carrier⟩\n\n∀c ∈ C : c ≠ ∅',
  runtime: { capability: 'versionSkew' },
  composition: () => [],
};
