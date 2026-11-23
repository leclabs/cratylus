import type { Ruleset } from '@cratylus/schema';

/** Clean cutover: compatibility with earlier forms is kept only where declared. */
export const cleanCutover: Ruleset = {
  name: 'clean-cutover',
  description: 'Compatibility with earlier forms is kept only where declared.',
  rules: [
    {
      name: 'clean-cutover',
      description:
        'Compatibility with earlier forms is kept only where declared.',
      statement:
        'Clean cutover: compatibility with earlier forms is kept only where declared.',
    },
  ],
};
