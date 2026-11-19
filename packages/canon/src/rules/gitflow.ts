import type { Ruleset } from '@cratylus/schema';

/** Git flow adopted by its name, precised only by the project's integration branch. */
export const gitflow: Ruleset = {
  name: 'gitflow',
  description:
    "Adopts gitflow as the project's branching model, its integration branch develop unless the project's AGENTS.md names another.",
  rules: [
    {
      name: 'gitflow-adopted',
      description:
        "The project follows gitflow, its integration branch develop unless the project's AGENTS.md names another.",
      statement:
        "This project follows gitflow. Its integration branch is `develop` unless the project's AGENTS.md names another; a missing integration branch is escalated to the product owner.",
      why: "Its name carries the branching model whole; only the integration branch is the project's own, and naming a missing one is the product owner's decision.",
    },
  ],
};
