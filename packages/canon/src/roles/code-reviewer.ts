// The code reviewer: reviews one change it did not write against its user story's
// acceptance criteria and examples, and hands back one code review naming each finding;
// software engineers build and repair the work. It runs on another model family than the
// software engineers where one is available.

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
import { domainModel } from '../factors/perception-scope/domain-model.js';
import { workProduct } from '../factors/perception-scope/work-product.js';
import { behaviourDrivenDevelopment } from '../factors/procedure/behaviour-driven-development.js';
import { codeReview } from '../factors/procedure/code-review.js';
import { codeReviewer } from '../factors/role/code-reviewer.js';
import { adversarial } from '../factors/stance/adversarial.js';
import { impartial } from '../factors/stance/impartial.js';
import { trustButVerify } from '../factors/stance/trust-but-verify.js';

export const codeReviewerRole: RoleProfile = {
  name: 'code-reviewer',
  description:
    "Reviews one change it did not write against its user story's acceptance criteria and examples, and hands back one code review naming each finding.",
  mark: { emoji: '🔍', hue: 'red' },
  values: {
    role: [codeReviewer],
    objective: [
      { value: reviewAccuracy, slot: 'drive' },
      { value: optimize, slot: 'stopping-rule' },
    ],
    expertise: [softwareEngineering, testDesign],
    procedure: [behaviourDrivenDevelopment, codeReview],
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
      {
        value: decides,
        slot: 'verdict',
        note: 'whether the code review approves the change',
      },
      { value: input, slot: 'release' },
    ],
    autonomy: [principal, handoff],
    perceptionScope: [domainModel, workProduct],
    actionScope: [none],
    model: [
      { value: frontierOtherFamily, slot: 'tier' },
      { value: xhigh, slot: 'effort' },
    ],
    memory: [sourceOfTruth, working],
    assignment: [reviewRequest],
    deliverable: [deliverableCodeReview],
    guardrails: [honesty, noImplementation, neverRepairs],
    evaluation: [inUse],
  },
};
