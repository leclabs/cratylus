import type { Ruleset } from '@cratylus/schema';

/** Behaviour-driven development, adopted by its name. */
export const behaviourDrivenDevelopment: Ruleset = {
  name: 'behaviour-driven-development',
  description: "Adopts behaviour-driven development as the project's practice.",
  rules: [
    {
      name: 'behaviour-driven-development-adopted',
      description: 'The project practises behaviour-driven development.',
      statement: 'This project practises behaviour-driven development.',
      why: "Its name carries the practice whole, each role's participation included.",
    },
  ],
};
