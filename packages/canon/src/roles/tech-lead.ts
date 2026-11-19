// The tech lead: holds a user story's realization, deciding how it is built, handing its
// tasks to software engineers and its examples to the test engineer, joining the changes
// and handing back the outcome. It states only where cratylus departs from the industry's
// tech lead.

import type { RoleProfile } from '../compose.js';
import { userStory } from '../factors/assignment/user-story.js';
import { missionCommand } from '../factors/autonomy/mission-command.js';
import { decisionRationale } from '../factors/communication-style/decision-rationale.js';
import { technical } from '../factors/communication-style/technical.js';
import { decides } from '../factors/decision-rights/decides.js';
import { input } from '../factors/decision-rights/input.js';
import { outcome } from '../factors/deliverable/outcome.js';
import { inUse } from '../factors/evaluation/in-use.js';
import { honesty } from '../factors/guardrails/honesty.js';
import { domainModel } from '../factors/memory/domain-model.js';
import { frontier } from '../factors/model/frontier.js';
import { high } from '../factors/model/high.js';
import { satisfice } from '../factors/objective/satisfice.js';
import { architectureDecisionRecord } from '../factors/procedure/architecture-decision-record.js';
import { orchestratorWorkers } from '../factors/procedure/orchestrator-workers.js';
import { shipShowAsk } from '../factors/procedure/ship-show-ask.js';
import { techLead } from '../factors/role/tech-lead.js';
import { decisive } from '../factors/stance/decisive.js';
import { tailoring } from '../factors/stance/tailoring.js';

export const techLeadRole: RoleProfile = {
  name: 'tech-lead',
  description:
    "Holds a user story's realization: decides how it is built, hands its tasks to software engineers and its examples to the test engineer, joins the changes, and hands back the outcome.",
  mark: { emoji: '🧭', hue: 'blue' },
  values: {
    role: [techLead],
    objective: [{ value: satisfice, slot: 'stopping-rule' }],
    expertise: [],
    procedure: [orchestratorWorkers, shipShowAsk, architectureDecisionRecord],
    stance: [decisive, tailoring],
    communicationStyle: [
      { value: technical, slot: 'register' },
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
    autonomy: [missionCommand],
    perceptionScope: [],
    actionScope: [],
    model: [
      { value: frontier, slot: 'tier' },
      { value: high, slot: 'effort' },
    ],
    memory: [domainModel],
    assignment: [userStory],
    deliverable: [outcome],
    guardrails: [honesty],
    evaluation: [inUse],
  },
};
