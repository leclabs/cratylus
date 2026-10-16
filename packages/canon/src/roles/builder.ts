// The builder role: receives one task and hands over one change (workflow: builder;
// agents 0272). It performs realization (P); every other decision class is – (no
// part). It names no procedure: how its change joins is the project's own (0268).

import type { RoleCell } from '../compose.js';
import { commitOwnPaths } from '../dimensions/action-scope/commit-own-paths.js';
import { editOwnOutputs } from '../dimensions/action-scope/edit-own-outputs.js';
import { runChecks } from '../dimensions/action-scope/run-checks.js';
import { task } from '../dimensions/assignment/task.js';
import { handoff } from '../dimensions/autonomy/handoff.js';
import { humanInTheLoop } from '../dimensions/autonomy/human-in-the-loop.js';
import { answerOnly } from '../dimensions/communication-style/answer-only.js';
import { maintenance } from '../dimensions/communication-style/maintenance.js';
import { plain } from '../dimensions/communication-style/plain.js';
import { none } from '../dimensions/decision-rights/none.js';
import { performs } from '../dimensions/decision-rights/performs.js';
import { change } from '../dimensions/deliverable/change.js';
import { inUse } from '../dimensions/evaluation/in-use.js';
import { softwareEngineering } from '../dimensions/expertise/software-engineering.js';
import { fixedAcceptanceCriteria } from '../dimensions/guardrails/fixed-acceptance-criteria.js';
import { honesty } from '../dimensions/guardrails/honesty.js';
import { working } from '../dimensions/memory/working.js';
import { frontier } from '../dimensions/model/frontier.js';
import { medium } from '../dimensions/model/medium.js';
import { correctness } from '../dimensions/objective/correctness.js';
import { satisfice } from '../dimensions/objective/satisfice.js';
import { examples } from '../dimensions/perception-scope/examples.js';
import { ownTask } from '../dimensions/perception-scope/own-task.js';
import { work } from '../dimensions/perception-scope/work.js';
import { builder } from '../dimensions/role/builder.js';
import { dry } from '../dimensions/stance/dry.js';
import { scopeDiscipline } from '../dimensions/stance/scope-discipline.js';
import { simplicity } from '../dimensions/stance/simplicity.js';

export const builderRole: RoleCell = {
  name: 'builder',
  description:
    'Receives one task and hands over one change that passes every check.',
  mark: null,
  values: {
    role: [builder],
    objective: [
      { value: correctness, slot: 'drive' },
      { value: satisfice, slot: 'stopping-rule' },
    ],
    expertise: [softwareEngineering],
    procedure: [],
    stance: [scopeDiscipline, simplicity, dry],
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
    autonomy: [{ value: humanInTheLoop, note: 'of the lead' }, handoff],
    perceptionScope: [
      ownTask,
      { value: examples, note: "its story's visible ones" },
      work,
    ],
    actionScope: [editOwnOutputs, runChecks, commitOwnPaths],
    model: [
      { value: frontier, slot: 'tier' },
      { value: medium, slot: 'effort' },
    ],
    memory: [working],
    assignment: [task],
    deliverable: [change],
    guardrails: [honesty, fixedAcceptanceCriteria],
    evaluation: [inUse],
  },
};
