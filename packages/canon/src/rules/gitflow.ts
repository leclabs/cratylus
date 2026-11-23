import type { Ruleset } from '@cratylus/schema';

/** Git flow adopted by its name, precised only by the project's integration branch. */
export const gitflow: Ruleset = {
  name: 'gitflow',
  description: "Adopts gitflow as the project's branching model.",
  rules: [
    {
      name: 'gitflow-adopted',
      description:
        'This project follows gitflow, its integration branch `develop` unless AGENTS.md names another.',
      statement:
        "This project follows gitflow, its integration branch `develop` unless the project's AGENTS.md names another; a missing one is escalated to the product owner.",
    },
  ],
};
