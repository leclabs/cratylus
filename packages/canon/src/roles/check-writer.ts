// The check-writer role: a specialist called in for a story's risk, writing the checks
// that bind its examples before the build (workflow: check-writer; agents 0243, 0244).

import type { RoleCell } from '../compose.js';
import { commitOwnPaths } from '../dimensions/action-scope/commit-own-paths.js';
import { runChecks } from '../dimensions/action-scope/run-checks.js';
import { writeChecks } from '../dimensions/action-scope/write-checks.js';
import { examples as examplesToBind } from '../dimensions/assignment/examples.js';
import { handoff } from '../dimensions/autonomy/handoff.js';
import { decisionRationale } from '../dimensions/communication-style/decision-rationale.js';
import { maintenance } from '../dimensions/communication-style/maintenance.js';
import { plain } from '../dimensions/communication-style/plain.js';
import { decides } from '../dimensions/decision-rights/decides.js';
import { input } from '../dimensions/decision-rights/input.js';
import { checksSeenRed } from '../dimensions/deliverable/checks-seen-red.js';
import { inUse } from '../dimensions/evaluation/in-use.js';
import { evaluationDesign } from '../dimensions/expertise/evaluation-design.js';
import { testDesign } from '../dimensions/expertise/test-design.js';
import { honesty } from '../dimensions/guardrails/honesty.js';
import { noImplementation } from '../dimensions/guardrails/no-implementation.js';
import { sourceOfTruth } from '../dimensions/memory/source-of-truth.js';
import { working } from '../dimensions/memory/working.js';
import { frontierOtherFamily } from '../dimensions/model/frontier-other-family.js';
import { high } from '../dimensions/model/high.js';
import { optimize } from '../dimensions/objective/optimize.js';
import { testValidity } from '../dimensions/objective/test-validity.js';
import { conceptJournal } from '../dimensions/perception-scope/concept-journal.js';
import { examples } from '../dimensions/perception-scope/examples.js';
import { work } from '../dimensions/perception-scope/work.js';
import { testFirst } from '../dimensions/procedure/test-first.js';
import { checkWriter } from '../dimensions/role/check-writer.js';
import { adversarial } from '../dimensions/stance/adversarial.js';
import { simplicity } from '../dimensions/stance/simplicity.js';

export const checkWriterRole: RoleCell = {
  name: 'check-writer',
  description:
    "Called in for a story's risk: writes the checks binding its examples, each seen failing before the build.",
  mark: null,
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
    perceptionScope: [conceptJournal, examples, work],
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
