// The illustrator role: a specialist called in for a story's risk, writing its examples
// cold from its concepts alone (workflow: illustrator; agents 0243, 0244).

import type { RoleCell } from '../compose.js';
import { writeExamples } from '../dimensions/action-scope/write-examples.js';
import { concepts } from '../dimensions/assignment/concepts.js';
import { handoff } from '../dimensions/autonomy/handoff.js';
import { answerOnly } from '../dimensions/communication-style/answer-only.js';
import { convergence } from '../dimensions/communication-style/convergence.js';
import { plain } from '../dimensions/communication-style/plain.js';
import { input } from '../dimensions/decision-rights/input.js';
import { recommends } from '../dimensions/decision-rights/recommends.js';
import { examplesWithFlaggedTerms } from '../dimensions/deliverable/examples-with-flagged-terms.js';
import { inUse } from '../dimensions/evaluation/in-use.js';
import { specificationByExample } from '../dimensions/expertise/specification-by-example.js';
import { honesty } from '../dimensions/guardrails/honesty.js';
import { working } from '../dimensions/memory/working.js';
import { frontierOtherFamily } from '../dimensions/model/frontier-other-family.js';
import { high } from '../dimensions/model/high.js';
import { satisfice } from '../dimensions/objective/satisfice.js';
import { specificationCoverage } from '../dimensions/objective/specification-coverage.js';
import { conceptJournal } from '../dimensions/perception-scope/concept-journal.js';
import { illustration } from '../dimensions/procedure/illustration.js';
import { illustrator } from '../dimensions/role/illustrator.js';
import { coldReader } from '../dimensions/stance/cold-reader.js';
import { mece } from '../dimensions/stance/mece.js';

export const illustratorRole: RoleCell = {
  name: 'illustrator',
  description:
    "Called in for a story's risk: writes its examples cold from its concepts alone.",
  mark: null,
  values: {
    role: [illustrator],
    objective: [
      { value: specificationCoverage, slot: 'drive' },
      { value: satisfice, slot: 'stopping-rule' },
    ],
    expertise: [specificationByExample],
    procedure: [illustration],
    stance: [coldReader, mece],
    communicationStyle: [
      { value: plain, slot: 'register' },
      { value: convergence, slot: 'density' },
      { value: answerOnly, slot: 'rationale' },
    ],
    decisionRights: [
      { value: input, slot: 'intent' },
      { value: input, slot: 'priority' },
      { value: recommends, slot: 'meaning' },
      { value: input, slot: 'constraint' },
      { value: input, slot: 'realization' },
      { value: input, slot: 'verdict' },
      { value: input, slot: 'release' },
    ],
    autonomy: [handoff],
    perceptionScope: [
      { value: conceptJournal, note: "the story's concepts only" },
    ],
    actionScope: [writeExamples],
    model: [
      { value: frontierOtherFamily, slot: 'tier' },
      { value: high, slot: 'effort' },
    ],
    memory: [working],
    assignment: [concepts],
    deliverable: [examplesWithFlaggedTerms],
    guardrails: [honesty],
    evaluation: [inUse],
  },
};
