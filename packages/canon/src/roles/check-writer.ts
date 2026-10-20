// The check-writer role: a specialist called in for a story's risk, writing the checks
// that bind its examples before the build (workflow: check-writer; agents 0243, 0244).

import type { RoleProfile } from '../compose.js';
import { commitOwnPaths } from '../factors/action-scope/commit-own-paths.js';
import { runChecks } from '../factors/action-scope/run-checks.js';
import { writeChecks } from '../factors/action-scope/write-checks.js';
import { examples as examplesToBind } from '../factors/assignment/examples.js';
import { handoff } from '../factors/autonomy/handoff.js';
import { decisionRationale } from '../factors/communication-style/decision-rationale.js';
import { maintenance } from '../factors/communication-style/maintenance.js';
import { plain } from '../factors/communication-style/plain.js';
import { decides } from '../factors/decision-rights/decides.js';
import { input } from '../factors/decision-rights/input.js';
import { checksSeenRed } from '../factors/deliverable/checks-seen-red.js';
import { inUse } from '../factors/evaluation/in-use.js';
import { evaluationDesign } from '../factors/expertise/evaluation-design.js';
import { testDesign } from '../factors/expertise/test-design.js';
import { honesty } from '../factors/guardrails/honesty.js';
import { noImplementation } from '../factors/guardrails/no-implementation.js';
import { sourceOfTruth } from '../factors/memory/source-of-truth.js';
import { working } from '../factors/memory/working.js';
import { frontierOtherFamily } from '../factors/model/frontier-other-family.js';
import { high } from '../factors/model/high.js';
import { optimize } from '../factors/objective/optimize.js';
import { testValidity } from '../factors/objective/test-validity.js';
import { conceptJournal } from '../factors/perception-scope/concept-journal.js';
import { examples } from '../factors/perception-scope/examples.js';
import { workProduct } from '../factors/perception-scope/work-product.js';
import { testFirst } from '../factors/procedure/test-first.js';
import { checkWriter } from '../factors/role/check-writer.js';
import { adversarial } from '../factors/stance/adversarial.js';
import { simplicity } from '../factors/stance/simplicity.js';

export const checkWriterRole: RoleProfile = {
  name: 'check-writer',
  description:
    "Called in for a user story's risk: writes the checks binding its examples, each seen failing before the build.",
  mark: { emoji: '🧪', hue: 'green' },
  values: {
    role: [checkWriter],
    objective: [
      { value: testValidity, slot: 'drive' },
      { value: optimize, slot: 'stopping-rule' },
    ],
    expertise: [testDesign, evaluationDesign],
    procedure: [testFirst],
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
      { value: decides, slot: 'realization', note: 'its checks' },
      { value: input, slot: 'verdict' },
      { value: input, slot: 'release' },
    ],
    autonomy: [handoff],
    perceptionScope: [conceptJournal, examples, workProduct],
    actionScope: [writeChecks, runChecks, commitOwnPaths],
    model: [
      { value: frontierOtherFamily, slot: 'tier' },
      { value: high, slot: 'effort' },
    ],
    memory: [sourceOfTruth, working],
    assignment: [examplesToBind],
    deliverable: [checksSeenRed],
    guardrails: [honesty, noImplementation],
    evaluation: [inUse],
  },
};
