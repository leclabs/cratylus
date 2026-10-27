import type { Ruleset } from '@cratylus/schema';

/** Git flow, as Vincent Driessen published it in "A successful Git branching model". */
export const gitflow: Ruleset = {
  name: 'gitflow',
  description:
    'Git flow: develop and main, with feature, release and hotfix branches, features merged into develop with --no-ff.',
  rules: [
    {
      name: 'gitflow-main-and-develop',
      description:
        'main holds released states; develop is the integration line.',
      statement:
        'The repository keeps two long-lived branches. `main` holds production-ready state: every commit on it is a release, tagged with its version. `develop` holds the latest delivered development changes for the next release, and is where every feature is integrated.',
      why: 'main then always shows exactly what is released, and develop always shows what the next release will be, so neither has to be reconstructed from history.',
    },
    {
      name: 'gitflow-feature-branches',
      description:
        'Feature branches branch from develop and merge back into it with --no-ff.',
      statement:
        'Develop each feature on its own branch, branched from `develop` and named for the feature. When the feature is finished, merge it back into `develop` with `git merge --no-ff`, then delete the feature branch. Feature branches interact with `develop` only.',
      why: '`--no-ff` always makes a merge commit, so the feature stays visible in history as one group of commits and can be reverted whole; work in progress stays off develop until it is finished.',
    },
    {
      name: 'gitflow-release-branches',
      description:
        'Release branches branch from develop, then merge into main (tagged) and back into develop.',
      statement:
        'When `develop` holds what the next release should contain, branch `release-<version>` from it and give the release its version number there. The release branch takes only bug fixes, the version bump and release metadata. To finish it, merge it into `main` with `--no-ff`, tag that merge commit with the version, merge it back into `develop` with `--no-ff`, and delete it.',
      why: 'The release is prepared and stabilised on its own branch while develop goes on taking features for the release after it; merging back into develop keeps the release fixes there too.',
    },
    {
      name: 'gitflow-hotfix-branches',
      description:
        'Hotfix branches branch from main, then merge into main (tagged) and into develop.',
      statement:
        'To fix a critical bug in a released version, branch `hotfix-<version>` from the tag on `main`, bump the patch version and fix the bug there. To finish it, merge it into `main` with `--no-ff` and tag that merge commit with the new version, then merge it into `develop` with `--no-ff` (or into the current release branch, where one exists), and delete it.',
      why: 'The fix ships from the released state without taking the unreleased work on develop, and merging it back keeps the fix in every later release.',
    },
  ],
};
