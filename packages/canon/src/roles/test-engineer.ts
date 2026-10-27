// The test engineer: writes an acceptance test for each example before the build, sees
// it fail, and gives the verdict whether the realization passes.

import type { RoleProfile } from '../compose.js';
import { commitOwnPaths } from '../factors/action-scope/commit-own-paths.js';
import { runChecks } from '../factors/action-scope/run-checks.js';
import { writeAcceptanceTests } from '../factors/action-scope/write-acceptance-tests.js';
import { examples } from '../factors/assignment/examples.js';
import { handoff } from '../factors/autonomy/handoff.js';
import { decisionRationale } from '../factors/communication-style/decision-rationale.js';
import { maintenance } from '../factors/communication-style/maintenance.js';
import { plain } from '../factors/communication-style/plain.js';
import { decides } from '../factors/decision-rights/decides.js';
import { input } from '../factors/decision-rights/input.js';
import { acceptanceTests } from '../factors/deliverable/acceptance-tests.js';
import { inUse } from '../factors/evaluation/in-use.js';
import { testDesign } from '../factors/expertise/test-design.js';
import { honesty } from '../factors/guardrails/honesty.js';
import { noImplementation } from '../factors/guardrails/no-implementation.js';
import { sourceOfTruth } from '../factors/memory/source-of-truth.js';
import { working } from '../factors/memory/working.js';
import { frontierOtherFamily } from '../factors/model/frontier-other-family.js';
import { high } from '../factors/model/high.js';
import { optimize } from '../factors/objective/optimize.js';
import { testValidity } from '../factors/objective/test-validity.js';
import { domainModel } from '../factors/perception-scope/domain-model.js';
import { workProduct } from '../factors/perception-scope/work-product.js';
import { behaviourDrivenDevelopment } from '../factors/procedure/behaviour-driven-development.js';
import { testFirst } from '../factors/procedure/test-first.js';
import { testEngineer } from '../factors/role/test-engineer.js';
import { adversarial } from '../factors/stance/adversarial.js';
import { simplicity } from '../factors/stance/simplicity.js';

export const testEngineerRole: RoleProfile = {
  name: 'test-engineer',
  description:
    'Writes an acceptance test for each example before the build, sees it fail, and reports whether the realization passes.',
  mark: { emoji: '🧪', hue: 'green' },
  values: {
    role: [testEngineer],
    objective: [
      { value: testValidity, slot: 'drive' },
      { value: optimize, slot: 'stopping-rule' },
    ],
    expertise: [testDesign],
    procedure: [behaviourDrivenDevelopment, testFirst],
    stance: [adversarial, simplicity],
    communicationStyle: [
      { value: plain, slot: 'register' },
      { value: maintenance, slot: 'density' },
      { value: decisionRationale, slot: 'rationale' },
    ],
    decisionRights: [
      { value: input, slot: 'intent' },
      { value: input, slot: 'priority' },
      { value: input, slot: 'meaning' },
      { value: input, slot: 'constraint' },
      { value: decides, slot: 'realization', note: 'its acceptance tests' },
      {
        value: decides,
        slot: 'verdict',
        note: 'whether the realization passes its acceptance tests',
      },
      { value: input, slot: 'release' },
    ],
    autonomy: [handoff],
    perceptionScope: [domainModel, workProduct],
    actionScope: [writeAcceptanceTests, runChecks, commitOwnPaths],
    model: [
      { value: frontierOtherFamily, slot: 'tier' },
      { value: high, slot: 'effort' },
    ],
    memory: [sourceOfTruth, working],
    assignment: [examples],
    deliverable: [acceptanceTests],
    guardrails: [honesty, noImplementation],
    evaluation: [inUse],
  },
};
