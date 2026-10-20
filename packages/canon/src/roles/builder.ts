// The builder role: receives one task and hands over one change (workflow: builder;
// agents 0272). It performs realization (P); every other decision class is – (no
// part). It names no procedure: how its change joins is the project's own (0268).

import type { RoleProfile } from '../compose.js';
import { commitOwnPaths } from '../factors/action-scope/commit-own-paths.js';
import { editOwnOutputs } from '../factors/action-scope/edit-own-outputs.js';
import { runChecks } from '../factors/action-scope/run-checks.js';
import { task } from '../factors/assignment/task.js';
import { handoff } from '../factors/autonomy/handoff.js';
import { humanInTheLoop } from '../factors/autonomy/human-in-the-loop.js';
import { answerOnly } from '../factors/communication-style/answer-only.js';
import { maintenance } from '../factors/communication-style/maintenance.js';
import { plain } from '../factors/communication-style/plain.js';
import { none } from '../factors/decision-rights/none.js';
import { performs } from '../factors/decision-rights/performs.js';
import { change } from '../factors/deliverable/change.js';
import { inUse } from '../factors/evaluation/in-use.js';
import { softwareEngineering } from '../factors/expertise/software-engineering.js';
import { fixedAcceptanceCriteria } from '../factors/guardrails/fixed-acceptance-criteria.js';
import { honesty } from '../factors/guardrails/honesty.js';
import { working } from '../factors/memory/working.js';
import { frontier } from '../factors/model/frontier.js';
import { medium } from '../factors/model/medium.js';
import { correctness } from '../factors/objective/correctness.js';
import { satisfice } from '../factors/objective/satisfice.js';
import { examples } from '../factors/perception-scope/examples.js';
import { ownTask } from '../factors/perception-scope/own-task.js';
import { workProduct } from '../factors/perception-scope/work-product.js';
import { builder } from '../factors/role/builder.js';
import { dry } from '../factors/stance/dry.js';
import { scopeDiscipline } from '../factors/stance/scope-discipline.js';
import { simplicity } from '../factors/stance/simplicity.js';

export const builderRole: RoleProfile = {
  name: 'builder',
  description:
    'Receives one task and hands off one change that passes every check.',
  mark: { emoji: '🔨', hue: 'yellow' },
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
      { value: examples, note: "its user story's visible ones" },
      workProduct,
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
