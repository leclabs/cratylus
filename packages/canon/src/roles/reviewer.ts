// The reviewer role: reviews one change it did not write, before or after it joins as
// its story's risk calls for, and hands over one review, never building or repairing
// the work, and never reviewing a change the operator has asked to review itself, whose
// review is the operator's (workflow: reviewer; agents 0272; workflow 0267, 0292). It
// runs on another model family than the builders where one is available (0225, 0244),
// and takes held-out examples directly from where the architect keeps them (0254).

import type { RoleCell } from '../compose.js';
import { none } from '../dimensions/action-scope/none.js';
import { reviewRequest } from '../dimensions/assignment/review-request.js';
import { handoff } from '../dimensions/autonomy/handoff.js';
import { principal } from '../dimensions/autonomy/principal.js';
import { decisionRationale } from '../dimensions/communication-style/decision-rationale.js';
import { maintenance } from '../dimensions/communication-style/maintenance.js';
import { plain } from '../dimensions/communication-style/plain.js';
import { decides } from '../dimensions/decision-rights/decides.js';
import { input } from '../dimensions/decision-rights/input.js';
import { review } from '../dimensions/deliverable/review.js';
import { inUse } from '../dimensions/evaluation/in-use.js';
import { softwareEngineering } from '../dimensions/expertise/software-engineering.js';
import { testDesign } from '../dimensions/expertise/test-design.js';
import { honesty } from '../dimensions/guardrails/honesty.js';
import { neverRepairs } from '../dimensions/guardrails/never-repairs.js';
import { noImplementation } from '../dimensions/guardrails/no-implementation.js';
import { sourceOfTruth } from '../dimensions/memory/source-of-truth.js';
import { working } from '../dimensions/memory/working.js';
import { frontierOtherFamily } from '../dimensions/model/frontier-other-family.js';
import { xhigh } from '../dimensions/model/xhigh.js';
import { optimize } from '../dimensions/objective/optimize.js';
import { reviewAccuracy } from '../dimensions/objective/review-accuracy.js';
import { conceptJournal } from '../dimensions/perception-scope/concept-journal.js';
import { examples } from '../dimensions/perception-scope/examples.js';
import { heldOutExamples } from '../dimensions/perception-scope/held-out-examples.js';
import { work } from '../dimensions/perception-scope/work.js';
import { codeReview } from '../dimensions/procedure/code-review.js';
import { reviewer } from '../dimensions/role/reviewer.js';
import { adversarial } from '../dimensions/stance/adversarial.js';
import { impartial } from '../dimensions/stance/impartial.js';
import { trustButVerify } from '../dimensions/stance/trust-but-verify.js';

export const reviewerRole: RoleCell = {
  name: 'reviewer',
  description:
    'Reviews one change it did not write, before or after it joins, and hands over one review; never builds or repairs the work it reviews, and never reviews a change the operator has asked to review itself.',
  mark: null,
  values: {
    role: [reviewer],
    objective: [
      { value: reviewAccuracy, slot: 'drive' },
      { value: optimize, slot: 'stopping-rule' },
    ],
    expertise: [softwareEngineering, testDesign],
    procedure: [codeReview],
    stance: [impartial, trustButVerify, adversarial],
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
      { value: input, slot: 'realization' },
      { value: decides, slot: 'verdict' },
      { value: input, slot: 'release' },
    ],
    autonomy: [{ value: principal, note: 'in its review' }, handoff],
    perceptionScope: [
      conceptJournal,
      examples,
      {
        value: heldOutExamples,
        note: 'taken directly from design/held-out/, never through the lead',
      },
      work,
    ],
    actionScope: [none],
    model: [
      { value: frontierOtherFamily, slot: 'tier' },
      { value: xhigh, slot: 'effort' },
    ],
    memory: [sourceOfTruth, working],
    assignment: [
      {
        value: reviewRequest,
        note: 'its held-out examples taken directly from design/held-out/, never through the lead',
      },
    ],
    deliverable: [review],
    guardrails: [honesty, noImplementation, neverRepairs],
    evaluation: [inUse],
  },
};
