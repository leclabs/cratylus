// The assayer role: master design §3, the assayer column ("others I" expanded). The
// second assayer is the assayer dispatched at frontier-other-family · max: a dispatch
// choice, not a value of the role.

import type { RoleCell } from '../compose.js';
import { none } from '../dimensions/action-scope/none.js';
import { judgmentBrief } from '../dimensions/assignment/judgment-brief.js';
import { principal } from '../dimensions/autonomy/principal.js';
import { decisionRationale } from '../dimensions/communication-style/decision-rationale.js';
import { maintenance } from '../dimensions/communication-style/maintenance.js';
import { plain } from '../dimensions/communication-style/plain.js';
import { decides } from '../dimensions/decision-rights/decides.js';
import { input } from '../dimensions/decision-rights/input.js';
import { verdictPerConcept } from '../dimensions/deliverable/verdict-per-concept.js';
import { heldOut } from '../dimensions/evaluation/held-out.js';
import { evaluationDesign } from '../dimensions/expertise/evaluation-design.js';
import { testDesign } from '../dimensions/expertise/test-design.js';
import { honesty } from '../dimensions/guardrails/honesty.js';
import { neverRepairs } from '../dimensions/guardrails/never-repairs.js';
import { noImplementation } from '../dimensions/guardrails/no-implementation.js';
import { sourceOfTruth } from '../dimensions/memory/source-of-truth.js';
import { working } from '../dimensions/memory/working.js';
import { frontier } from '../dimensions/model/frontier.js';
import { xhigh } from '../dimensions/model/xhigh.js';
import { optimize } from '../dimensions/objective/optimize.js';
import { verdictAccuracy } from '../dimensions/objective/verdict-accuracy.js';
import { conceptJournal } from '../dimensions/perception-scope/concept-journal.js';
import { examples } from '../dimensions/perception-scope/examples.js';
import { heldOutExamples } from '../dimensions/perception-scope/held-out-examples.js';
import { work } from '../dimensions/perception-scope/work.js';
import { judgment } from '../dimensions/procedure/judgment.js';
import { assayer } from '../dimensions/role/assayer.js';
import { adversarial } from '../dimensions/stance/adversarial.js';
import { impartial } from '../dimensions/stance/impartial.js';
import { trustButVerify } from '../dimensions/stance/trust-but-verify.js';

export const assayerRole: RoleCell = {
  name: 'assayer',
  description: 'Judges a cut once against its examples and held-out results.',
  mark: null,
  values: {
    role: [assayer],
    objective: [
      { value: verdictAccuracy, slot: 'drive' },
      { value: optimize, slot: 'stopping-rule' },
    ],
    expertise: [evaluationDesign, testDesign],
    procedure: [judgment],
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
      { value: input, slot: 'check-ruling' },
      { value: decides, slot: 'verdict' },
      { value: input, slot: 'release' },
    ],
    autonomy: [{ value: principal, note: 'in verdict' }],
    perceptionScope: [conceptJournal, examples, heldOutExamples, work],
    actionScope: [none],
    handoffs: [],
    model: [
      { value: frontier, slot: 'tier' },
      { value: xhigh, slot: 'effort' },
    ],
    memory: [sourceOfTruth, working],
    assignment: [judgmentBrief],
    deliverable: [verdictPerConcept],
    guardrails: [honesty, noImplementation, neverRepairs],
    evaluation: [heldOut],
  },
};
