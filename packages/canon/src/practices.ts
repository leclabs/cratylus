// ─────────────────────────────────────────────────────────────────────────────
// The corpus's practices.
// ─────────────────────────────────────────────────────────────────────────────

import type { Practice } from '@cratylus/schema';

export const PRACTICES: readonly Practice[] = [
  {
    name: 'corpus-authoring',
    description:
      'Author the corpus of named concepts itself: discover the signs a model already holds, canonize them, and write the agents and skills that carry them.',
    agents: [],
    skills: [
      'signify',
      'probe',
      'elicit',
      'conceptualize',
      'exemplify',
      'materialize',
      'formalize',
      'create-agent',
      'create-skill',
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
