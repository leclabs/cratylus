import type { Ruleset } from '@cratylus/schema';

/** Commit discipline: what goes in a commit, and when to make one. */
export const commitDiscipline: Ruleset = {
  name: 'commit-discipline',
  description:
    'Commit only the paths you changed, at natural boundaries, adding to the shared history.',
  rules: [
    {
      name: 'commit-discipline-own-paths',
      description: 'Stage and commit the paths you changed, by name.',
      statement:
        'Stage and commit the paths you changed yourself, naming each one, and leave every other change in the working tree as it is.',
      why: 'The working tree may hold other people’s work in progress; naming your own paths keeps each commit to exactly the change it describes.',
    },
    {
      name: 'commit-discipline-natural-boundaries',
      description:
        'Commit each coherent step once it is done and its checks pass.',
      statement:
        'Commit at each natural boundary — a coherent step finished and its checks passing — as you go, without waiting to be asked.',
      why: 'Each commit is then one reviewable, revertable step, and finished work is never held only in a working tree.',
    },
    {
      name: 'commit-discipline-shared-history',
      description:
        'Add new commits to shared history; published commits stay as they are.',
      statement:
        'Add to the shared history with new commits, and keep the commits others have already received as they are.',
      why: 'Everyone working from the shared history can rely on what they have pulled; rewriting it breaks their clones and loses the record.',
    },
  ],
};
