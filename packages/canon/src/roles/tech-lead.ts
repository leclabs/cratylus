// The tech lead: holds a user story's realization, deciding how it is built, handing its
// tasks to software engineers and its examples to the test engineer, joining the changes
// and handing back the outcome; never decides what anything means.

import type { RoleProfile } from '../compose.js';
import { commitOwnPaths } from '../factors/action-scope/commit-own-paths.js';
import { integrate } from '../factors/action-scope/integrate.js';
import { runChecks } from '../factors/action-scope/run-checks.js';
import { userStory } from '../factors/assignment/user-story.js';
import { handoff } from '../factors/autonomy/handoff.js';
import { humanInTheLoop } from '../factors/autonomy/human-in-the-loop.js';
import { humanOnTheLoop } from '../factors/autonomy/human-on-the-loop.js';
import { managementByException } from '../factors/autonomy/management-by-exception.js';
import { missionCommand } from '../factors/autonomy/mission-command.js';
import { principal } from '../factors/autonomy/principal.js';
import { decisionRationale } from '../factors/communication-style/decision-rationale.js';
import { maintenance } from '../factors/communication-style/maintenance.js';
import { plain } from '../factors/communication-style/plain.js';
import { decides } from '../factors/decision-rights/decides.js';
import { input } from '../factors/decision-rights/input.js';
import { outcome } from '../factors/deliverable/outcome.js';
import { inUse } from '../factors/evaluation/in-use.js';
import { softwareDelivery } from '../factors/expertise/software-delivery.js';
import { softwareEngineering } from '../factors/expertise/software-engineering.js';
import { fixedAcceptanceCriteria } from '../factors/guardrails/fixed-acceptance-criteria.js';
import { honesty } from '../factors/guardrails/honesty.js';
import { scopeOfAuthority } from '../factors/guardrails/scope-of-authority.js';
import { reconstitution } from '../factors/memory/reconstitution.js';
import { sourceOfTruth } from '../factors/memory/source-of-truth.js';
import { working } from '../factors/memory/working.js';
import { frontier } from '../factors/model/frontier.js';
import { high } from '../factors/model/high.js';
import { delivery } from '../factors/objective/delivery.js';
import { satisfice } from '../factors/objective/satisfice.js';
import { domainModel } from '../factors/perception-scope/domain-model.js';
import { reports } from '../factors/perception-scope/reports.js';
import { workProduct } from '../factors/perception-scope/work-product.js';
import { behaviourDrivenDevelopment } from '../factors/procedure/behaviour-driven-development.js';
import { orchestratorWorkers } from '../factors/procedure/orchestrator-workers.js';
import { shipShowAsk } from '../factors/procedure/ship-show-ask.js';
import { techLead } from '../factors/role/tech-lead.js';
import { decisive } from '../factors/stance/decisive.js';
import { separationOfConcerns } from '../factors/stance/separation-of-concerns.js';
import { simplicity } from '../factors/stance/simplicity.js';
import { tailoring } from '../factors/stance/tailoring.js';

export const techLeadRole: RoleProfile = {
  name: 'tech-lead',
  description:
    "Holds a user story's realization: decides how it is built, hands its tasks to software engineers and its examples to the test engineer, joins the changes, and hands back the outcome.",
  mark: { emoji: '🧭', hue: 'blue' },
  values: {
    role: [techLead],
    objective: [
      { value: delivery, slot: 'drive' },
      { value: satisfice, slot: 'stopping-rule' },
    ],
    expertise: [softwareDelivery, softwareEngineering],
    procedure: [behaviourDrivenDevelopment, orchestratorWorkers, shipShowAsk],
    stance: [decisive, tailoring, separationOfConcerns, simplicity],
    communicationStyle: [
      { value: plain, slot: 'register' },
      { value: maintenance, slot: 'density' },
      { value: decisionRationale, slot: 'rationale' },
    ],
    decisionRights: [
      { value: input, slot: 'intent' },
      { value: input, slot: 'priority' },
      { value: input, slot: 'meaning' },
      { value: decides, slot: 'constraint' },
      { value: decides, slot: 'realization' },
      { value: input, slot: 'verdict' },
      { value: input, slot: 'release' },
    ],
    autonomy: [
      principal,
      { value: humanInTheLoop, note: 'at a sign-off it does not hold' },
      { value: humanOnTheLoop, note: 'otherwise' },
      missionCommand,
      managementByException,
      handoff,
    ],
    perceptionScope: [domainModel, reports, workProduct],
    actionScope: [integrate, commitOwnPaths, runChecks],
    model: [
      { value: frontier, slot: 'tier' },
      { value: high, slot: 'effort' },
    ],
    memory: [sourceOfTruth, working, reconstitution],
    assignment: [userStory],
    deliverable: [outcome],
    guardrails: [honesty, scopeOfAuthority, fixedAcceptanceCriteria],
    evaluation: [inUse],
  },
};
