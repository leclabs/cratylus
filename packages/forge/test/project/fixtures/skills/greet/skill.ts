// A minimal skill cell for the projection fixture plugin. It declares `runtime`
// so the fixture also covers the THIN SHIM leg of the artifact tree.

import type { Skill } from '@cratylus/schema';

export const greet: Skill = {
  name: 'greet',
  description: 'a fixture skill',
  formalBlock: 'G ≜ ⟨greeting⟩\n\n∀g ∈ G : g ≠ ∅',
  runtime: { capability: 'memory' },
  composition: () => [],
};
