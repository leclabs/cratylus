// The builder role: master design §3, the builder column. The design states only its
// realization right (P); every other decision class is – (no part), as confirmed by
// the architect.

import type { RoleCell } from '../compose.js';
import { commitOwnPaths } from '../dimensions/action-scope/commit-own-paths.js';
import { editOwnOutputs } from '../dimensions/action-scope/edit-own-outputs.js';
import { runChecks } from '../dimensions/action-scope/run-checks.js';
import { workPackage } from '../dimensions/assignment/work-package.js';
import { handoff } from '../dimensions/autonomy/handoff.js';
import { humanInTheLoop } from '../dimensions/autonomy/human-in-the-loop.js';
import { answerOnly } from '../dimensions/communication-style/answer-only.js';
import { maintenance } from '../dimensions/communication-style/maintenance.js';
import { plain } from '../dimensions/communication-style/plain.js';
import { none } from '../dimensions/decision-rights/none.js';
import { performs } from '../dimensions/decision-rights/performs.js';
import { doneOrFailingCase } from '../dimensions/deliverable/done-or-failing-case.js';
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
import { ownWorkPackage } from '../dimensions/perception-scope/own-work-package.js';
import { work } from '../dimensions/perception-scope/work.js';
import { build } from '../dimensions/procedure/build.js';
import { builder } from '../dimensions/role/builder.js';
import { dry } from '../dimensions/stance/dry.js';
import { scopeDiscipline } from '../dimensions/stance/scope-discipline.js';
import { simplicity } from '../dimensions/stance/simplicity.js';

export const builderRole: RoleCell = {
  name: 'builder',
  description: 'Builds one work package until its visible examples pass.',
  mark: null,
  values: {
    role: [builder],
    objective: [
      { value: correctness, slot: 'drive' },
      { value: satisfice, slot: 'stopping-rule' },
    ],
    expertise: [softwareEngineering],
    procedure: [build],
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
      { value: none, slot: 'check-ruling' },
      { value: none, slot: 'verdict' },
      { value: none, slot: 'release' },
    ],
    autonomy: [{ value: humanInTheLoop, note: 'of the lead' }, handoff],
    perceptionScope: [
      ownWorkPackage,
      { value: examples, note: 'its own' },
      work,
    ],
    actionScope: [editOwnOutputs, runChecks, commitOwnPaths],
    model: [
      { value: frontier, slot: 'tier' },
      { value: medium, slot: 'effort' },
    ],
    memory: [working],
    assignment: [workPackage],
    deliverable: [doneOrFailingCase],
    guardrails: [honesty, fixedAcceptanceCriteria],
    evaluation: [inUse],
  },
};
