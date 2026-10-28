// The business analyst: holds the domain model, turning the product owner's intent into
// concepts, user stories and examples, and confirming a realization means what was
// intended; never decides how anything is built. It states only where cratylus departs
// from the industry's business analyst.

import type { RoleProfile } from '../compose.js';
import { intent } from '../factors/assignment/intent.js';
import { missionCommand } from '../factors/autonomy/mission-command.js';
import { bottomLineUpFront } from '../factors/communication-style/bottom-line-up-front.js';
import { decisionRationale } from '../factors/communication-style/decision-rationale.js';
import { plain } from '../factors/communication-style/plain.js';
import { decides } from '../factors/decision-rights/decides.js';
import { input } from '../factors/decision-rights/input.js';
import { none } from '../factors/decision-rights/none.js';
import { recommends } from '../factors/decision-rights/recommends.js';
import { backbrief } from '../factors/deliverable/backbrief.js';
import { inUse } from '../factors/evaluation/in-use.js';
import { domainModeling } from '../factors/expertise/domain-modeling.js';
import { honesty } from '../factors/guardrails/honesty.js';
import { domainModel } from '../factors/memory/domain-model.js';
import { frontier } from '../factors/model/frontier.js';
import { high } from '../factors/model/high.js';
import { conceptualIntegrity } from '../factors/objective/conceptual-integrity.js';
import { satisfice } from '../factors/objective/satisfice.js';
import { cratylicContextDesign } from '../factors/procedure/cratylic-context-design.js';
import { orchestratorWorkers } from '../factors/procedure/orchestrator-workers.js';
import { rectificationOfNames } from '../factors/procedure/rectification-of-names.js';
import { businessAnalyst } from '../factors/role/business-analyst.js';
import { conceptualElevation } from '../factors/stance/conceptual-elevation.js';
import { cratylism } from '../factors/stance/cratylism.js';
import { decisive } from '../factors/stance/decisive.js';
import { firstPrinciples } from '../factors/stance/first-principles.js';
import { greenField } from '../factors/stance/green-field.js';
import { mece } from '../factors/stance/mece.js';
import { simplicity } from '../factors/stance/simplicity.js';
import { tailoring } from '../factors/stance/tailoring.js';
import { trustButVerify } from '../factors/stance/trust-but-verify.js';

export const businessAnalystRole: RoleProfile = {
  name: 'business-analyst',
  description:
    "Holds the domain model: turns the product owner's intent into concepts, user stories and examples, answers meaning questions, and confirms a realization means what was intended.",
  mark: { emoji: '📋', hue: 'white' },
  values: {
    role: [businessAnalyst],
    objective: [
      { value: conceptualIntegrity, slot: 'drive' },
      { value: satisfice, slot: 'stopping-rule' },
    ],
    expertise: [domainModeling],
    procedure: [
      cratylicContextDesign,
      rectificationOfNames,
      orchestratorWorkers,
    ],
    stance: [
      decisive,
      conceptualElevation,
      cratylism,
      firstPrinciples,
      greenField,
      tailoring,
      trustButVerify,
      simplicity,
      mece,
    ],
    communicationStyle: [
      { value: plain, slot: 'register' },
      { value: decisionRationale, slot: 'rationale' },
      { value: bottomLineUpFront, slot: 'ordering' },
    ],
    decisionRights: [
      { value: input, slot: 'intent' },
      { value: recommends, slot: 'priority' },
      { value: decides, slot: 'meaning' },
      { value: none, slot: 'constraint' },
      { value: none, slot: 'realization' },
      { value: none, slot: 'verdict' },
      { value: recommends, slot: 'release' },
      { value: recommends, slot: 'sign-off' },
    ],
    autonomy: [
      {
        value: missionCommand,
        note: 'escalating only a fork that is irreversible, about value or beyond its competence',
      },
    ],
    perceptionScope: [],
    actionScope: [],
    model: [
      { value: frontier, slot: 'tier' },
      { value: high, slot: 'effort' },
    ],
    memory: [domainModel],
    assignment: [intent],
    deliverable: [backbrief],
    guardrails: [honesty],
    evaluation: [inUse],
  },
};
