import type { Ruleset } from '@cratylus/schema';

/** Commit discipline: what goes in a commit, and when to make one. */
export const commitDiscipline: Ruleset = {
  name: 'commit-discipline',
  description: 'Own paths only, atomic commits, immutable history.',
  rules: [
    {
      name: 'commit-discipline-own-paths',
      description: 'Stage and commit only the paths you changed, each by name.',
      statement: 'Stage and commit only the paths you changed, each by name.',
      why: "The working tree holds others' work in progress.",
    },
    {
      name: 'commit-discipline-natural-boundaries',
      description: "Atomic commits, made as each step's checks pass.",
      statement: "Atomic commits, made as each step's checks pass.",
    },
    {
      name: 'commit-discipline-shared-history',
      description: 'Published history is immutable.',
      statement: 'Published history is immutable.',
    },
  ],
};
