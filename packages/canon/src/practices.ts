// ─────────────────────────────────────────────────────────────────────────────
// The corpus's practices.
// ─────────────────────────────────────────────────────────────────────────────

import type { Practice } from '@cratylus/schema';

export const PRACTICES: readonly Practice[] = [
  {
    name: 'corpus-authoring',
    description:
      'Author the corpus of named concepts itself: discover the signs a model already holds and canonize them.',
    agents: [],
    skills: [
      'signify',
      'probe',
      'elicit',
      'conceptualize',
      'exemplify',
      'materialize',
      'formalize',
    ],
  },
  {
    name: 'intent-based-delegation',
    description:
      "Build against a design by intent-based delegation: the architect, lead, builder and reviewer, the illustrator and check-writer called in for a user story's risk, and the personas kino, nico and mav over the architect.",
    agents: [
      'architect',
      'lead',
      'builder',
      'reviewer',
      'illustrator',
      'check-writer',
      'kino',
      'nico',
      'mav',
    ],
    preselected: true,
  },
];
