import type { Ruleset } from '@cratylus/schema';

/** Established libraries: a well-known problem is solved by a library already solving it. */
export const establishedLibraries: Ruleset = {
  name: 'established-libraries',
  description:
    'For a well-known problem, use a maintained, widely used open library with a small API, behind your own interface.',
  rules: [
    {
      name: 'established-libraries-first',
      description:
        'Use a maintained, widely used open library with a small API before writing your own.',
      statement:
        'For a well-known problem, use an actively maintained, widely used open library with a small API before writing your own solution.',
      why: 'Such a library already handles the edge cases its many users have met, and its maintainers keep fixing it; bespoke code leaves all of that to you.',
    },
    {
      name: 'established-libraries-wrapped',
      description: 'Wrap the library behind the project’s own interface.',
      statement:
        'Wrap the library behind the project’s own interface, and have the rest of the code use that interface.',
      why: 'The project then learns one small API of its own, and replacing or upgrading the library changes one place.',
    },
  ],
};
