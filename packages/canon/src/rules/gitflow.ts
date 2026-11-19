import type { Ruleset } from '@cratylus/schema';

// Each rule is projected and taken on its own, so each one that integrates names the
// integration branch in this one sentence.
const integrationBranch =
  "The integration branch is the branch the project's AGENTS.md names as its integration branch, or `develop` where it names none; where that branch does not exist, escalate to the product owner, who names it, before branching or merging.";

/**
 * Git flow, as Vincent Driessen published it in "A successful Git branching model",
 * its integration branch `develop` unless the project's AGENTS.md names another.
 */
export const gitflow: Ruleset = {
  name: 'gitflow',
  description:
    "Git flow: main and an integration branch, develop unless the project's AGENTS.md names another, with feature, release and hotfix branches, features merged into the integration branch with --no-ff.",
  rules: [
    {
      name: 'gitflow-main-and-integration-branch',
      description:
        "main holds released states; the integration branch, develop unless the project's AGENTS.md names another, is where features integrate.",
      statement: `The repository keeps two long-lived branches. \`main\` holds production-ready state: every commit on it is a release, tagged with its version. The integration branch holds the latest delivered development changes for the next release, and is where every feature is integrated. ${integrationBranch}`,
      why: "main then always shows exactly what is released, and the integration branch always shows what the next release will be, so neither has to be reconstructed from history. A project names its integration branch once, in the file every agent reads; where the branch so named does not exist, which branch integrates is the product owner's decision.",
    },
    {
      name: 'gitflow-feature-branches',
      description:
        'Feature branches branch from the integration branch and merge back into it with --no-ff.',
      statement: `Develop each feature on its own branch, branched from the integration branch and named for the feature. When the feature is finished, merge it back into the integration branch with \`git merge --no-ff\`, then delete the feature branch. Feature branches interact with the integration branch only. ${integrationBranch}`,
      why: '`--no-ff` always makes a merge commit, so the feature stays visible in history as one group of commits and can be reverted whole; work in progress stays off the integration branch until it is finished.',
    },
    {
      name: 'gitflow-release-branches',
      description:
        'Release branches branch from the integration branch, then merge into main (tagged) and back into the integration branch.',
      statement: `When the integration branch holds what the next release should contain, branch \`release-<version>\` from it and give the release its version number there. The release branch takes only bug fixes, the version bump and release metadata. To finish it, merge it into \`main\` with \`--no-ff\`, tag that merge commit with the version, merge it back into the integration branch with \`--no-ff\`, and delete it. ${integrationBranch}`,
      why: 'The release is prepared and stabilised on its own branch while the integration branch goes on taking features for the release after it; merging back into the integration branch keeps the release fixes there too.',
    },
    {
      name: 'gitflow-hotfix-branches',
      description:
        'Hotfix branches branch from main, then merge into main (tagged) and into the integration branch.',
      statement: `To fix a critical bug in a released version, branch \`hotfix-<version>\` from the tag on \`main\`, bump the patch version and fix the bug there. To finish it, merge it into \`main\` with \`--no-ff\` and tag that merge commit with the new version, then merge it into the integration branch with \`--no-ff\` (or into the current release branch, where one exists), and delete it. ${integrationBranch}`,
      why: 'The fix ships from the released state without taking the unreleased work on the integration branch, and merging it back keeps the fix in every later release.',
    },
  ],
};
