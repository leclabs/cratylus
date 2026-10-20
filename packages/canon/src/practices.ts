// ─────────────────────────────────────────────────────────────────────────────
// The canon's practices.
// ─────────────────────────────────────────────────────────────────────────────

import type { Practice } from '@cratylus/schema';

export const PRACTICES: readonly Practice[] = [
  {
    name: 'cratylic-context-design',
    formerNames: ['corpus-authoring'],
    description:
      'Practise cratylic context design: find the concepts a design needs, give each its Cratylic name, the term the model already reads closest to the meaning, with only the correction its reading needs, confirmed by a cold read.',
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
