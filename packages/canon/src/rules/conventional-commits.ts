import type { Ruleset } from '@cratylus/schema';

/** Conventional Commits 1.0.0, adopted by its name. */
export const conventionalCommits: Ruleset = {
  name: 'conventional-commits',
  description: 'Adopts Conventional Commits 1.0.0.',
  rules: [
    {
      name: 'conventional-commits-adopted',
      description: 'Commit messages follow Conventional Commits 1.0.0.',
      statement: 'Commit messages follow Conventional Commits 1.0.0.',
    },
  ],
};
