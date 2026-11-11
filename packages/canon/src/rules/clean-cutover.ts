import type { Ruleset } from '@cratylus/schema';

/** Clean cutover: a change migrates every caller and leaves one way to do each thing. */
export const cleanCutover: Ruleset = {
  name: 'clean-cutover',
  description:
    'Compatibility with earlier forms is a goal only where declared.',
  rules: [
    {
      name: 'clean-cutover',
      description: 'Compatibility is a goal only where it is declared.',
      statement:
        'Make the change the work calls for and migrate every caller with it, removing what it makes obsolete; keep compatibility with earlier forms only where it is declared a goal.',
      why: 'Each shim or alias kept by default is a second way to do one thing that every later reader must understand; a clean cutover leaves one.',
    },
  ],
};
