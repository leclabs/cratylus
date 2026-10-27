import type { Ruleset } from '@cratylus/schema';

/** Green field: work proceeds from what is declared, not from what happens to exist. */
export const greenField: Ruleset = {
  name: 'green-field',
  description:
    'Existing code and docs constrain work only where explicitly declared; compatibility is a goal only where declared.',
  rules: [
    {
      name: 'green-field-declared-constraints',
      description:
        'Existing code and docs constrain work only where explicitly declared.',
      statement:
        'Treat existing code, records and docs as constraints only where a constraint is explicitly declared; everywhere else, shape the work by what it is for.',
      why: 'What happens to exist is history, not requirement; reading it as a constraint carries its accidents into every new piece of work.',
    },
    {
      name: 'green-field-clean-cutover',
      description: 'Compatibility is a goal only where it is declared.',
      statement:
        'Make the change the work calls for and migrate every caller with it, removing what it makes obsolete; keep compatibility with earlier forms only where it is declared a goal.',
      why: 'Each shim or alias kept by default is a second way to do one thing that every later reader must understand; a clean cutover leaves one.',
    },
  ],
};
