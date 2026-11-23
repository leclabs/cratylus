import type { Ruleset } from '@cratylus/schema';

/** Green-field: existing work constrains only where a constraint is declared. */
export const greenField: Ruleset = {
  name: 'green-field',
  description: 'Existing work constrains only where declared.',
  rules: [
    {
      name: 'green-field',
      description: 'Existing work constrains only where declared.',
      statement: 'Green-field: existing work constrains only where declared.',
      why: 'What exists is history; read as a constraint, it carries its accidents into new work.',
    },
  ],
};
