// ─────────────────────────────────────────────────────────────────────────────
// TYPED HANDOFFS — the JSON Schema each assignment and deliverable value carries.
//
// A role's assignment and deliverable are values of their factors; the contract a
// handoff is checked against is DATA those values carry, paired here with the very
// value it belongs to. Composition copies the pair onto the agent
// (`Agent.contract`), and every harness reads it from there: the assignment checked
// before the agent runs, the deliverable bound as the harness's output schema.
//
// Required fields are required, and an array takes `[]` unless it is marked
// `minItems: 1`. Free-text intent (the architect's assignment) and the architect's
// deliverable to the operator carry no contract.
// ─────────────────────────────────────────────────────────────────────────────

import { type JsonSchema, anchorOf } from '@cratylus/schema';
import { concepts } from './dimensions/assignment/concepts.js';
import { cutBrief } from './dimensions/assignment/cut-brief.js';
import { examples } from './dimensions/assignment/examples.js';
import { judgmentBrief } from './dimensions/assignment/judgment-brief.js';
import { workPackage } from './dimensions/assignment/work-package.js';
import { checksSeenRed } from './dimensions/deliverable/checks-seen-red.js';
import { doneOrFailingCase } from './dimensions/deliverable/done-or-failing-case.js';
import { examplesWithFlaggedTerms } from './dimensions/deliverable/examples-with-flagged-terms.js';
import { outcomeWithEfficiency } from './dimensions/deliverable/outcome-with-efficiency.js';
import { verdictPerConcept } from './dimensions/deliverable/verdict-per-concept.js';
import type { Assignment, Deliverable } from './manifest.js';

const text: JsonSchema = { type: 'string' };
const count: JsonSchema = { type: 'integer' };
const texts: JsonSchema = { type: 'array', items: text };
const someTexts: JsonSchema = { type: 'array', items: text, minItems: 1 };
const flag: JsonSchema = { type: 'boolean' };

const record = (
  properties: Record<string, JsonSchema>,
  optional: readonly string[] = [],
): JsonSchema => ({
  type: 'object',
  properties,
  required: Object.keys(properties).filter((f) => !optional.includes(f)),
});

const assignments: readonly (readonly [Assignment, JsonSchema])[] = [
  [
    cutBrief,
    record({
      cut: text,
      concepts: someTexts,
      examples: someTexts,
      decisions: someTexts,
    }),
  ],
  [
    workPackage,
    record({
      cut: text,
      workPackage: text,
      outputs: someTexts,
      concepts: someTexts,
      // A shared-output package owns no example, which a work package may do.
      examples: texts,
    }),
  ],
  [
    judgmentBrief,
    record({
      cut: text,
      workPackages: someTexts,
      examples: someTexts,
      decisions: texts,
    }),
  ],
  [examples, record({ cut: text, examples: someTexts })],
  [concepts, record({ cut: text, concepts: someTexts })],
];

const deliverables: readonly (readonly [Deliverable, JsonSchema])[] = [
  [
    outcomeWithEfficiency,
    record({
      cut: text,
      outcomes: {
        type: 'array',
        minItems: 1,
        items: record({
          example: text,
          concept: text,
          outcome: { type: 'string', enum: ['pass', 'fail'] },
          evidence: text,
        }),
      },
      verdicts: {
        type: 'array',
        items: record({
          assayer: text,
          verdict: { type: 'string', enum: ['accept', 'reject'] },
          findings: texts,
        }),
      },
      efficiency: record({
        agentRuns: record({
          total: count,
          byRole: { type: 'object', additionalProperties: count },
        }),
        rounds: count,
        wholeCheckRuns: count,
        tokens: count,
      }),
      hardeningNotes: texts,
    }),
  ],
  [
    doneOrFailingCase,
    record({ cut: text, workPackage: text, done: flag, failingCase: text }, [
      'failingCase',
    ]),
  ],
  [
    verdictPerConcept,
    record({
      cut: text,
      verdicts: {
        type: 'array',
        minItems: 1,
        items: record(
          {
            workPackage: text,
            concept: text,
            passes: flag,
            evidence: text,
            finding: text,
          },
          ['finding'],
        ),
      },
      hardeningNotes: texts,
    }),
  ],
  [
    checksSeenRed,
    record({
      cut: text,
      checks: {
        type: 'array',
        items: record({ example: text, check: text, seenRed: flag }),
      },
    }),
  ],
  [examplesWithFlaggedTerms, record({ examples: texts, flaggedTerms: texts })],
];

/** Each assignment value's contract, by the value's anchor. */
export const ASSIGNMENT_CONTRACTS: Readonly<Record<string, JsonSchema>> =
  Object.fromEntries(
    assignments.map(([value, schema]) => [anchorOf(value), schema]),
  );

/** Each deliverable value's contract, by the value's anchor. */
export const DELIVERABLE_CONTRACTS: Readonly<Record<string, JsonSchema>> =
  Object.fromEntries(
    deliverables.map(([value, schema]) => [anchorOf(value), schema]),
  );
