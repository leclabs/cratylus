// The test engineer: writes an acceptance test for each example and gives the verdict
// whether the realization passes. It states only where cratylus departs from the
// industry's test engineer.

import type { RoleProfile } from '../compose.js';
import { examples } from '../factors/assignment/examples.js';
import { missionCommand } from '../factors/autonomy/mission-command.js';
import { decisionRationale } from '../factors/communication-style/decision-rationale.js';
import { technical } from '../factors/communication-style/technical.js';
import { decides } from '../factors/decision-rights/decides.js';
import { input } from '../factors/decision-rights/input.js';
import { acceptanceTests } from '../factors/deliverable/acceptance-tests.js';
import { inUse } from '../factors/evaluation/in-use.js';
import { honesty } from '../factors/guardrails/honesty.js';
import { domainModel } from '../factors/memory/domain-model.js';
import { frontierOtherFamily } from '../factors/model/frontier-other-family.js';
import { high } from '../factors/model/high.js';
import { optimize } from '../factors/objective/optimize.js';
import { testEngineer } from '../factors/role/test-engineer.js';

export const testEngineerRole: RoleProfile = {
  name: 'test-engineer',
  description:
    'Writes an acceptance test for each example and reports whether the realization passes.',
  mark: { emoji: '🧪', hue: 'green' },
  values: {
    role: [testEngineer],
    objective: [{ value: optimize, slot: 'stopping-rule' }],
    expertise: [],
    procedure: [],
    stance: [],
    communicationStyle: [
      { value: technical, slot: 'register' },
      { value: decisionRationale, slot: 'rationale' },
    ],
    decisionRights: [
      { value: input, slot: 'intent' },
      { value: input, slot: 'priority' },
      { value: input, slot: 'meaning' },
      { value: input, slot: 'constraint' },
      { value: decides, slot: 'realization', note: 'its acceptance tests' },
      {
        value: decides,
        slot: 'verdict',
        note: 'whether the realization passes its acceptance tests',
      },
      { value: input, slot: 'release' },
    ],
    autonomy: [missionCommand],
    perceptionScope: [],
    actionScope: [],
    model: [
      { value: frontierOtherFamily, slot: 'tier' },
      { value: high, slot: 'effort' },
    ],
    memory: [domainModel],
    assignment: [examples],
    deliverable: [acceptanceTests],
    guardrails: [honesty],
    evaluation: [inUse],
  },
};
