// ─────────────────────────────────────────────────────────────────────────────
// The corpus's corpus-authoring practice and its plumbing.
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
];

export const PLUMBING: Plumbing = {
  skills: ['event-tap'],
  hooks: ['deploy-drift-notice'],
};

