// The architect role: master design §3, the architect column, with the client's
// principal architect restored (0070) and its communication ordered bottom line up
// front (0078). Its decisiveness, elevation, ordering and stopping rule are the values
// its behavioral examples showed drifting, so a guard holds each.

import { type RoleCell, guarded } from '../compose.js';
import { appendJournal } from '../dimensions/action-scope/append-journal.js';
import { writeExamples } from '../dimensions/action-scope/write-examples.js';
import { intent } from '../dimensions/assignment/intent.js';
import { humanOnTheLoop } from '../dimensions/autonomy/human-on-the-loop.js';
import { missionCommand } from '../dimensions/autonomy/mission-command.js';
import { principal } from '../dimensions/autonomy/principal.js';
import { bottomLineUpFront } from '../dimensions/communication-style/bottom-line-up-front.js';
import { convergence } from '../dimensions/communication-style/convergence.js';
import { decisionRationale } from '../dimensions/communication-style/decision-rationale.js';
import { plain } from '../dimensions/communication-style/plain.js';
import { decides } from '../dimensions/decision-rights/decides.js';
import { input } from '../dimensions/decision-rights/input.js';
import { none } from '../dimensions/decision-rights/none.js';
import { recommends } from '../dimensions/decision-rights/recommends.js';
import { decisionsWithReasons } from '../dimensions/deliverable/decisions-with-reasons.js';
import { behavioralExamples } from '../dimensions/evaluation/behavioral-examples.js';
import { neverAssertions } from '../dimensions/evaluation/never-assertions.js';
import { domainModeling } from '../dimensions/expertise/domain-modeling.js';
import { researchInvestigation } from '../dimensions/expertise/research-investigation.js';
import { specificationByExample } from '../dimensions/expertise/specification-by-example.js';
import { systemDesign } from '../dimensions/expertise/system-design.js';
import { appendOnly } from '../dimensions/guardrails/append-only.js';
import { honesty } from '../dimensions/guardrails/honesty.js';
import { noImplementation } from '../dimensions/guardrails/no-implementation.js';
import { scopeOfAuthority } from '../dimensions/guardrails/scope-of-authority.js';
import { illustrator } from '../dimensions/handoffs/illustrator.js';
import { lead } from '../dimensions/handoffs/lead.js';
import { researcher } from '../dimensions/handoffs/researcher.js';
import { reconstitution as memoryReconstitution } from '../dimensions/memory/reconstitution.js';
import { sourceOfTruth } from '../dimensions/memory/source-of-truth.js';
import { working } from '../dimensions/memory/working.js';
import { frontier } from '../dimensions/model/frontier.js';
import { high } from '../dimensions/model/high.js';
import { conceptualIntegrity } from '../dimensions/objective/conceptual-integrity.js';
import { optimize } from '../dimensions/objective/optimize.js';
import { conceptJournal } from '../dimensions/perception-scope/concept-journal.js';
import { examples } from '../dimensions/perception-scope/examples.js';
import { heldOutExamples } from '../dimensions/perception-scope/held-out-examples.js';
import { outsideResearch } from '../dimensions/perception-scope/outside-research.js';
import { reports } from '../dimensions/perception-scope/reports.js';
import { freeze } from '../dimensions/procedure/freeze.js';
import { illustration } from '../dimensions/procedure/illustration.js';
import { reconstitution } from '../dimensions/procedure/reconstitution.js';
import { rectify } from '../dimensions/procedure/rectify.js';
import { architect } from '../dimensions/role/architect.js';
import { conceptualElevation } from '../dimensions/stance/conceptual-elevation.js';
import { cratylism } from '../dimensions/stance/cratylism.js';
import { decisive } from '../dimensions/stance/decisive.js';
import { firstPrinciples } from '../dimensions/stance/first-principles.js';
import { greenField } from '../dimensions/stance/green-field.js';
import { mece } from '../dimensions/stance/mece.js';
import { proportionate } from '../dimensions/stance/proportionate.js';
import { simplicity } from '../dimensions/stance/simplicity.js';
import { systemsThinking } from '../dimensions/stance/systems-thinking.js';
import { trustButVerify } from '../dimensions/stance/trust-but-verify.js';
import { bottomLine } from '../guards/bottom-line.js';
import { descend } from '../guards/descend.js';
import { handBack } from '../guards/hand-back.js';
import { pastObjective } from '../guards/past-objective.js';

export const architectRole: RoleCell = {
  name: 'architect',
  description:
    "The client's principal architect, owning the conceptual design and delivery of the product, in cratylus's example-driven workflow.",
  mark: null,
  values: {
    role: [architect],
    objective: [
      { value: conceptualIntegrity, slot: 'drive' },
      { value: guarded(optimize, pastObjective), slot: 'stopping-rule' },
    ],
    expertise: [
      domainModeling,
      specificationByExample,
      systemDesign,
      researchInvestigation,
    ],
    procedure: [rectify, illustration, freeze, reconstitution],
    // Decision 0052: the architect's decisiveness and elevation hold without exception.
    stance: [
      { value: guarded(decisive, handBack), level: 'fixed' },
      { value: guarded(conceptualElevation, descend), level: 'fixed' },
      cratylism,
      firstPrinciples,
      greenField,
      proportionate,
      trustButVerify,
      simplicity,
      mece,
      systemsThinking,
    ],
    communicationStyle: [
      { value: plain, slot: 'register' },
      { value: convergence, slot: 'density' },
      { value: decisionRationale, slot: 'rationale' },
      {
        value: guarded(bottomLineUpFront, bottomLine),
        slot: 'ordering',
        level: 'fixed',
      },
    ],
    decisionRights: [
      { value: input, slot: 'intent' },
      { value: recommends, slot: 'priority' },
      { value: decides, slot: 'meaning' },
      { value: decides, slot: 'constraint' },
      { value: none, slot: 'realization' },
      { value: decides, slot: 'check-ruling' },
      { value: none, slot: 'verdict' },
      { value: recommends, slot: 'release' },
    ],
    autonomy: [principal, humanOnTheLoop, missionCommand],
    perceptionScope: [
      conceptJournal,
      examples,
      heldOutExamples,
      reports,
      outsideResearch,
    ],
    actionScope: [appendJournal, writeExamples],
    handoffs: [illustrator, lead, researcher],
    model: [
      { value: frontier, slot: 'tier' },
      { value: high, slot: 'effort' },
    ],
    memory: [sourceOfTruth, working, memoryReconstitution],
    assignment: [intent],
    deliverable: [decisionsWithReasons],
    guardrails: [honesty, scopeOfAuthority, appendOnly, noImplementation],
    evaluation: [behavioralExamples, neverAssertions],
  },
};
