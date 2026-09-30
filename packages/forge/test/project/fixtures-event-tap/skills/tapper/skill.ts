// A skill cell declaring the `eventTap` capability — the fixture for the tap's
// degradation on a harness whose runtime has no tap strategy.

import type { Skill } from '@cratylus/schema';

export const tapper: Skill = {
  name: 'tapper',
  description: 'a fixture skill that taps lifecycle events',
  formalBlock: 'T ≜ ⟨tap⟩\n\n∀t ∈ T : t ≠ ∅',
  runtime: { capability: 'eventTap' },
  composition: () => [],
};
