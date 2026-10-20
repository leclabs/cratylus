// The illustrator role: a specialist called in for a story's risk, writing its examples
// cold from its concepts alone (workflow: illustrator; agents 0243, 0244).

import type { RoleProfile } from '../compose.js';
import { writeExamples } from '../factors/action-scope/write-examples.js';
import { concepts } from '../factors/assignment/concepts.js';
import { handoff } from '../factors/autonomy/handoff.js';
import { answerOnly } from '../factors/communication-style/answer-only.js';
import { convergence } from '../factors/communication-style/convergence.js';
import { plain } from '../factors/communication-style/plain.js';
import { input } from '../factors/decision-rights/input.js';
import { recommends } from '../factors/decision-rights/recommends.js';
import { examplesWithFlaggedTerms } from '../factors/deliverable/examples-with-flagged-terms.js';
import { inUse } from '../factors/evaluation/in-use.js';
import { specificationByExample } from '../factors/expertise/specification-by-example.js';
import { honesty } from '../factors/guardrails/honesty.js';
import { working } from '../factors/memory/working.js';
import { frontierOtherFamily } from '../factors/model/frontier-other-family.js';
import { high } from '../factors/model/high.js';
import { satisfice } from '../factors/objective/satisfice.js';
import { specificationCoverage } from '../factors/objective/specification-coverage.js';
import { conceptJournal } from '../factors/perception-scope/concept-journal.js';
import { illustration } from '../factors/procedure/illustration.js';
import { illustrator } from '../factors/role/illustrator.js';
import { coldReader } from '../factors/stance/cold-reader.js';
import { mece } from '../factors/stance/mece.js';

export const illustratorRole: RoleProfile = {
  name: 'illustrator',
  description:
    "Called in for a user story's risk: writes its examples cold from its concepts alone.",
  mark: { emoji: '🖍️', hue: 'magenta' },
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
      { value: conceptJournal, note: "the user story's concepts only" },
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
