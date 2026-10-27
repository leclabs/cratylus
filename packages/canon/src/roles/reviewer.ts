// The reviewer role: reviews one change it did not write, before or after it joins as
// its story's risk calls for, and hands over one review naming each finding; builders
// build and repair the work, and a change the operator has asked to review is the
// operator's to review (intent-based delegation: reviewer; agent design 0272;
// intent-based delegation 0267, 0292). It runs on another model family than the
// builders where one is available (0225, 0244), and takes held-out examples directly
// from where the architect keeps them (0254).

import type { RoleProfile } from '../compose.js';
import { none } from '../factors/action-scope/none.js';
import { reviewRequest } from '../factors/assignment/review-request.js';
import { handoff } from '../factors/autonomy/handoff.js';
import { principal } from '../factors/autonomy/principal.js';
import { decisionRationale } from '../factors/communication-style/decision-rationale.js';
import { maintenance } from '../factors/communication-style/maintenance.js';
import { plain } from '../factors/communication-style/plain.js';
import { decides } from '../factors/decision-rights/decides.js';
import { input } from '../factors/decision-rights/input.js';
import { codeReview as deliverableCodeReview } from '../factors/deliverable/code-review.js';
import { inUse } from '../factors/evaluation/in-use.js';
import { softwareEngineering } from '../factors/expertise/software-engineering.js';
import { testDesign } from '../factors/expertise/test-design.js';
import { honesty } from '../factors/guardrails/honesty.js';
import { neverRepairs } from '../factors/guardrails/never-repairs.js';
import { noImplementation } from '../factors/guardrails/no-implementation.js';
import { sourceOfTruth } from '../factors/memory/source-of-truth.js';
import { working } from '../factors/memory/working.js';
import { frontierOtherFamily } from '../factors/model/frontier-other-family.js';
import { xhigh } from '../factors/model/xhigh.js';
import { optimize } from '../factors/objective/optimize.js';
import { reviewAccuracy } from '../factors/objective/review-accuracy.js';
import { conceptJournal } from '../factors/perception-scope/concept-journal.js';
import { examples } from '../factors/perception-scope/examples.js';
import { heldOutExamples } from '../factors/perception-scope/held-out-examples.js';
import { workProduct } from '../factors/perception-scope/work-product.js';
import { codeReview } from '../factors/procedure/code-review.js';
import { reviewer } from '../factors/role/reviewer.js';
import { adversarial } from '../factors/stance/adversarial.js';
import { impartial } from '../factors/stance/impartial.js';
import { trustButVerify } from '../factors/stance/trust-but-verify.js';

export const reviewerRole: RoleProfile = {
  name: 'reviewer',
  description:
    "Reviews one change it did not write, before or after it joins, and hands off one code review naming each finding; a change the operator has asked to review is the operator's to review.",
  mark: { emoji: '🔍', hue: 'red' },
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
    autonomy: [{ value: principal, note: 'in its code review' }, handoff],
    perceptionScope: [
      conceptJournal,
      examples,
      {
        value: heldOutExamples,
        note: 'taken directly from design/held-out/',
      },
      workProduct,
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
        note: 'its held-out examples taken directly from design/held-out/',
      },
    ],
    deliverable: [deliverableCodeReview],
    guardrails: [honesty, noImplementation, neverRepairs],
    evaluation: [inUse],
  },
};
