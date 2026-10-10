// ─────────────────────────────────────────────────────────────────────────────
// The corpus's practices and their plumbing.
// ─────────────────────────────────────────────────────────────────────────────

import type { Plumbing, Practice } from '@cratylus/schema';

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
      'introspect',
    ],
  },
  {
    name: 'example-driven-workflow',
    description:
      'Build against a design: the architect, lead, builders, assayer, illustrator and check-writer of the example-driven workflow, and the personas kino, nico and mav.',
    agents: [
      'architect',
      'lead',
      'builder',
      'assayer',
      'illustrator',
      'check-writer',
      'kino',
      'nico',
      'mav',
    ],
    preselected: true,
  },
];

export const PLUMBING: Plumbing = {
  skills: ['event-tap'],
  hooks: ['deploy-drift-notice'],
};
