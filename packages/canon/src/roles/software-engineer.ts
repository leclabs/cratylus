// The software engineer: realizes one task and hands back one change. It performs
// realization (P) and holds no letter in any other decision class. It states only
// where cratylus departs from the industry's software engineer.

import type { RoleProfile } from '../compose.js';
import { task } from '../factors/assignment/task.js';
import { missionCommand } from '../factors/autonomy/mission-command.js';
import { answerOnly } from '../factors/communication-style/answer-only.js';
import { technical } from '../factors/communication-style/technical.js';
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
  description: 'Realizes one task and hands back one change.',
  mark: { emoji: '🔨', hue: 'yellow' },
  values: {
    role: [softwareEngineer],
    objective: [{ value: satisfice, slot: 'stopping-rule' }],
    expertise: [],
    procedure: [],
    stance: [],
    communicationStyle: [
      { value: technical, slot: 'register' },
      { value: answerOnly, slot: 'rationale' },
    ],
    decisionRights: [{ value: performs, slot: 'realization' }],
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
