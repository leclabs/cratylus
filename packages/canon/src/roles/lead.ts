// The lead role: master design §3, the lead column ("others I" expanded).

import type { RoleCell } from '../compose.js';
import { commitOwnPaths } from '../dimensions/action-scope/commit-own-paths.js';
import { integrate } from '../dimensions/action-scope/integrate.js';
import { runChecks } from '../dimensions/action-scope/run-checks.js';
import { cutBrief } from '../dimensions/assignment/cut-brief.js';
import { handoff } from '../dimensions/autonomy/handoff.js';
import { humanOnTheLoop } from '../dimensions/autonomy/human-on-the-loop.js';
import { missionCommand } from '../dimensions/autonomy/mission-command.js';
import { principal } from '../dimensions/autonomy/principal.js';
import { decisionRationale } from '../dimensions/communication-style/decision-rationale.js';
import { maintenance } from '../dimensions/communication-style/maintenance.js';
import { plain } from '../dimensions/communication-style/plain.js';
import { decides } from '../dimensions/decision-rights/decides.js';
import { input } from '../dimensions/decision-rights/input.js';
import { outcomeWithEfficiency } from '../dimensions/deliverable/outcome-with-efficiency.js';
import { behavioralExamples } from '../dimensions/evaluation/behavioral-examples.js';
import { softwareDelivery } from '../dimensions/expertise/software-delivery.js';
import { softwareEngineering } from '../dimensions/expertise/software-engineering.js';
import { fixedAcceptanceCriteria } from '../dimensions/guardrails/fixed-acceptance-criteria.js';
import { honesty } from '../dimensions/guardrails/honesty.js';
import { scopeOfAuthority } from '../dimensions/guardrails/scope-of-authority.js';
import { assayer } from '../dimensions/handoffs/assayer.js';
import { builder } from '../dimensions/handoffs/builder.js';
import { checkWriter } from '../dimensions/handoffs/check-writer.js';
import { researcher } from '../dimensions/handoffs/researcher.js';
import { sourceOfTruth } from '../dimensions/memory/source-of-truth.js';
import { working } from '../dimensions/memory/working.js';
import { frontier } from '../dimensions/model/frontier.js';
import { high } from '../dimensions/model/high.js';
import { delivery } from '../dimensions/objective/delivery.js';
import { satisfice } from '../dimensions/objective/satisfice.js';
import { conceptJournal } from '../dimensions/perception-scope/concept-journal.js';
import { examples } from '../dimensions/perception-scope/examples.js';
import { reports } from '../dimensions/perception-scope/reports.js';
import { work } from '../dimensions/perception-scope/work.js';
import { build } from '../dimensions/procedure/build.js';
import { judgment } from '../dimensions/procedure/judgment.js';
import { wholeCheck } from '../dimensions/procedure/whole-check.js';
import { lead } from '../dimensions/role/lead.js';
import { decisive } from '../dimensions/stance/decisive.js';
import { proportionate } from '../dimensions/stance/proportionate.js';
import { separationOfConcerns } from '../dimensions/stance/separation-of-concerns.js';
import { simplicity } from '../dimensions/stance/simplicity.js';

export const leadRole: RoleCell = {
  name: 'lead',
  description: "Owns a cut's realization in the example-driven workflow.",
  mark: null,
  values: {
    role: [lead],
    objective: [
      { value: delivery, slot: 'drive' },
      { value: satisfice, slot: 'stopping-rule' },
    ],
    expertise: [softwareDelivery, softwareEngineering],
    procedure: [build, judgment, wholeCheck],
    stance: [decisive, proportionate, separationOfConcerns, simplicity],
    communicationStyle: [
      { value: plain, slot: 'register' },
      { value: maintenance, slot: 'density' },
      { value: decisionRationale, slot: 'rationale' },
    ],
    decisionRights: [
      { value: input, slot: 'intent' },
      { value: input, slot: 'priority' },
      { value: input, slot: 'meaning' },
      { value: input, slot: 'constraint' },
      { value: decides, slot: 'realization' },
      { value: input, slot: 'check-ruling' },
      { value: input, slot: 'verdict' },
      { value: input, slot: 'release' },
    ],
    autonomy: [
      { value: principal, note: 'in realization' },
      humanOnTheLoop,
      missionCommand,
      handoff,
    ],
    perceptionScope: [conceptJournal, examples, reports, work],
    actionScope: [integrate, commitOwnPaths, runChecks],
    handoffs: [builder, checkWriter, assayer, researcher],
    model: [
      { value: frontier, slot: 'tier' },
      { value: high, slot: 'effort' },
    ],
    memory: [sourceOfTruth, working],
    assignment: [cutBrief],
    deliverable: [outcomeWithEfficiency],
    guardrails: [honesty, scopeOfAuthority, fixedAcceptanceCriteria],
    evaluation: [behavioralExamples],
  },
};
