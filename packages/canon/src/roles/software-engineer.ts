// The software engineer: realizes one task and hands back one change. It performs
// realization (P); every other decision class is – (no part). It states only where
// cratylus departs from the industry's software engineer.

import type { RoleProfile } from '../compose.js';
import { task } from '../factors/assignment/task.js';
import { missionCommand } from '../factors/autonomy/mission-command.js';
import { answerOnly } from '../factors/communication-style/answer-only.js';
import { maintenance } from '../factors/communication-style/maintenance.js';
import { plain } from '../factors/communication-style/plain.js';
import { none } from '../factors/decision-rights/none.js';
import { performs } from '../factors/decision-rights/performs.js';
import { change } from '../factors/deliverable/change.js';
import { inUse } from '../factors/evaluation/in-use.js';
import { honesty } from '../factors/guardrails/honesty.js';
import { frontier } from '../factors/model/frontier.js';
import { medium } from '../factors/model/medium.js';
import { satisfice } from '../factors/objective/satisfice.js';
import { softwareEngineer } from '../factors/role/software-engineer.js';

export const softwareEngineerRole: RoleProfile = {
  name: 'software-engineer',
  description:
    'Realizes one task and hands back one change; never writes the acceptance tests its work is judged by.',
  mark: { emoji: '🔨', hue: 'yellow' },
  values: {
    role: [softwareEngineer],
    objective: [{ value: satisfice, slot: 'stopping-rule' }],
    expertise: [],
    procedure: [],
    stance: [],
    communicationStyle: [
      { value: plain, slot: 'register' },
      { value: maintenance, slot: 'density' },
      { value: answerOnly, slot: 'rationale' },
    ],
    decisionRights: [
      { value: none, slot: 'intent' },
      { value: none, slot: 'priority' },
      { value: none, slot: 'meaning' },
      { value: none, slot: 'constraint' },
      { value: performs, slot: 'realization' },
      { value: none, slot: 'verdict' },
      { value: none, slot: 'release' },
    ],
    autonomy: [missionCommand],
    perceptionScope: [],
    actionScope: [],
    model: [
      { value: frontier, slot: 'tier' },
      { value: medium, slot: 'effort' },
    ],
    memory: [],
    assignment: [task],
    deliverable: [change],
    guardrails: [honesty],
    evaluation: [inUse],
  },
};
