import type { Ruleset } from '@cratylus/schema';

/** cratylus's departure from behaviour-driven development. */
export const behaviourDrivenDevelopment: Ruleset = {
  name: 'behaviour-driven-development',
  description:
    'Where each example lives and how its acceptance test is titled.',
  rules: [
    {
      name: 'behaviour-driven-development-examples',
      description:
        "Each example lives in its concept's record; its acceptance test is titled by the example's name.",
      statement:
        "Each example lives in its concept's record in design/model/, written as given–when–then, and its acceptance test, in the project's own test framework, is titled `<context>/<concept>: <example name>`.",
      why: 'The domain model stays the one source of meaning, and the model check binds every example to its test.',
    },
  ],
};
