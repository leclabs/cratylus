import type { Ruleset } from '@cratylus/schema';

/** Established libraries: a well-known problem is solved by a library already solving it. */
export const establishedLibraries: Ruleset = {
  name: 'established-libraries',
  description:
    "Adopts established libraries, behind the project's own adapter.",
  rules: [
    {
      name: 'established-libraries',
      description:
        "A well-known problem is solved by an established library, behind the project's adapter.",
      statement:
        "A well-known problem is solved by an actively maintained, widely used library with a small API, behind an adapter of the project's own.",
    },
  ],
};
