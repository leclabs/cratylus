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

/** `schema`, with what its field means to the agent that fills it. */
const said = (schema: JsonSchema, description: string): JsonSchema => ({
  ...schema,
  description,
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
    said(
      record({
        cut: said(text, 'The cut this report is for, by its name.'),
        outcomes: said(
          {
            type: 'array',
            minItems: 1,
            items: record({
              example: said(
                text,
                'The visible example, as `<context>/<number>`.',
              ),
              concept: said(
                text,
                'The concept the example shows, by its name in the design.',
              ),
              outcome: said(
                { type: 'string', enum: ['pass', 'fail'] },
                'Whether the example holds in the delivered work.',
              ),
              evidence: said(
                text,
                "Why the outcome holds, named by the example and by the check that binds it, in the design's concepts: what the check showed of the concept. Never a file, function, path or command, even where a verdict cites one: translate it into the concept it bears on.",
              ),
            }),
          },
          "One outcome per visible example of the cut, each in the design's concepts.",
        ),
        verdicts: said(
          {
            type: 'array',
            items: record({
              assayer: said(text, 'The assayer that judged, by its run.'),
              verdict: said(
                { type: 'string', enum: ['accept', 'reject'] },
                "The assayer's verdict on the cut, as it returned it.",
              ),
              findings: said(
                texts,
                "The assayer's findings, each restated in the design's concepts; empty when it found none.",
              ),
            }),
          },
          "Each assayer's verdict, as it returned it.",
        ),
        efficiency: said(
          record({
            agentRuns: said(
              record({
                total: said(count, 'Every agent run the cut took.'),
                byRole: said(
                  { type: 'object', additionalProperties: count },
                  'The agent runs by role.',
                ),
              }),
              'The agent runs the harness reports for the cut.',
            ),
            rounds: said(count, 'The rounds of build and judgment.'),
            wholeCheckRuns: said(count, 'The runs of the whole check.'),
            tokens: said(count, 'The tokens the runs reported, summed.'),
          }),
          "The cut's figures, as the ledger computes them.",
        ),
        hardeningNotes: said(
          texts,
          "What would make the cut's examples or checks harder to pass by accident, each in the design's concepts; empty when there is none.",
        ),
      }),
      "The lead's report of the cut to whoever dispatched it, in the design's concepts: each example's outcome with its evidence, the assayers' verdicts, the figures and the hardening notes.",
    ),
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
