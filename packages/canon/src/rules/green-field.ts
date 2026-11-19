import type { Ruleset } from '@cratylus/schema';

/** Green-field: existing work constrains only where a constraint is declared. */
export const greenField: Ruleset = {
  name: 'green-field',
  description: 'Existing work constrains only where declared.',
  rules: [
    {
      name: 'green-field',
      description: 'Existing work constrains only where declared.',
      statement:
        'Treat existing code, records and docs as constraints only where a constraint is explicitly declared; everywhere else, shape the work by what it is for.',
      why: 'What happens to exist is history; reading it as a constraint carries its accidents into every new piece of work.',
    },
  ],
};
