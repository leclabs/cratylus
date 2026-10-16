// ─────────────────────────────────────────────────────────────────────────────
// TYPED HANDOVERS — the JSON Schema each assignment and deliverable value carries.
//
// A role's assignment and deliverable are values of their factors; the contract a
// handover is checked against is DATA those values carry, paired here with the very
// value it belongs to. Composition copies the pair onto the agent
// (`Agent.contract`), and every harness reads it from there: the assignment checked
// before the agent runs, the deliverable bound as the harness's output schema.
//
// Each handover states what it must contain, so one passed without a part shows
// what is missing: its required fields are its contents. An array takes `[]` unless
// it is marked `minItems: 1`. An assignment taking alternative forms states each
// under `anyOf`, and fits when it fits any one. The architect's handovers are a
// person's: free-text intent in, a read-back to the operator out, neither of them
// JSON, so neither carries a contract.
// ─────────────────────────────────────────────────────────────────────────────

import { type JsonSchema, anchorOf } from '@cratylus/schema';
import { concepts } from './dimensions/assignment/concepts.js';
import { examples } from './dimensions/assignment/examples.js';
import { reviewRequest } from './dimensions/assignment/review-request.js';
import { task } from './dimensions/assignment/task.js';
import { userStory } from './dimensions/assignment/user-story.js';
import { change } from './dimensions/deliverable/change.js';
import { checksSeenRed } from './dimensions/deliverable/checks-seen-red.js';
import { codeReview } from './dimensions/deliverable/code-review.js';
import { examplesWithFlaggedTerms } from './dimensions/deliverable/examples-with-flagged-terms.js';
import { outcome } from './dimensions/deliverable/outcome.js';
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

// What a field of a handover names, said once for every handover that holds it.
const storyField = said(text, 'The user story, by its name (a kebab-case id).');
const exampleRefs = (schema: JsonSchema, whose: string): JsonSchema =>
  said(
    schema,
    `${whose}, each as \`<context>/<number>\` (e.g. \`booking/1\`).`,
  );
const meaningQuestions = said(
  texts,
  'Each question whose answer would change a concept or an example, for the architect to settle; empty when there is none.',
);

// The story and the task, each a form of its own: the lead takes either, a builder a task.
const storyForm = record(
  {
    story: storyField,
    slice: said(
      text,
      "The thin slice of behaviour a user can rely on, in the design's own terms.",
    ),
    why: said(text, 'Why the slice is wanted.'),
    acceptanceCriteria: said(
      someTexts,
      'What must hold in merged work for the story to be done, each criterion on its own.',
    ),
    outOfScope: said(
      texts,
      'What the story does not cover; empty when nothing needs saying.',
    ),
    path: said(
      { type: 'string', enum: ['plain', 'scaled-up'] },
      'The path the story takes: plain, broken into tasks each built by one builder, or scaled up with specialists for its risk.',
    ),
    review: said(
      text,
      "How the story's changes are reviewed, as its risk picks: Ship (joined with no code review), Show (joined, then reviewed) or Ask (reviewed before it joins); and, where the operator has asked to review a change before it joins, that approval gate: the operator's review is that change's code review, under Ask, and no agent reviews it.",
    ),
    cost: said(
      text,
      'Roughly what the story will cost, which its effort is weighed against.',
    ),
    examples: exampleRefs(
      texts,
      "The story's visible examples, where misunderstanding is likely",
    ),
    decisions: said(
      texts,
      'The decisions in force for the story, by their ids (e.g. `0081`).',
    ),
    contexts: said(texts, 'The bounded contexts the story touches.'),
  },
  ['examples', 'decisions', 'contexts'],
);
const taskForm = record(
  {
    task: said(text, 'The task, by its name (a kebab-case id).'),
    story: said(
      text,
      'The user story the task serves, by its name; absent for a change that alters no meaning, a task with no story.',
    ),
    goal: said(text, "What the task is for, in its user story's terms."),
    changes: said(text, 'What the task changes.'),
    decisions: said(
      texts,
      'The technical decisions that bind the task; empty when there are none.',
    ),
    done: said(text, 'What done means for the task.'),
  },
  ['story'],
);

const assignments: readonly (readonly [Assignment, JsonSchema])[] = [
  [
    userStory,
    {
      anyOf: [
        said(storyForm, 'A user story.'),
        said(
          taskForm,
          'A task with no story: a change that alters no meaning.',
        ),
      ],
    },
  ],
  [task, taskForm],
  [
    reviewRequest,
    record(
      {
        change: said(text, 'The change to review, by its reference.'),
        story: said(
          text,
          'The user story the change serves, by its name; absent for a task with no story.',
        ),
        acceptanceCriteria: said(
          texts,
          "The story's acceptance criteria the change is reviewed against, where they apply.",
        ),
        examples: exampleRefs(
          texts,
          'The examples the change is reviewed against, where they apply',
        ),
      },
      ['story', 'acceptanceCriteria', 'examples'],
    ),
  ],
  [
    examples,
    record({
      story: storyField,
      examples: exampleRefs(someTexts, 'The examples to bind checks to'),
    }),
  ],
  [
    concepts,
    record({
      story: storyField,
      concepts: said(
        someTexts,
        'The concepts to illustrate with examples, by name.',
      ),
    }),
  ],
];

const deliverables: readonly (readonly [Deliverable, JsonSchema])[] = [
  [
    outcome,
    said(
      record({
        story: said(
          text,
          'The user story, or for a task with no story the task, by name.',
        ),
        criteria: said(
          {
            type: 'array',
            minItems: 1,
            items: record({
              criterion: said(
                text,
                'The acceptance criterion, as the story states it.',
              ),
              holds: said(flag, 'Whether the criterion holds in merged work.'),
              evidence: said(
                text,
                "Why it holds or does not, in the design's own terms: what the code review and the checks showed of the concept. Never a file, function, path or command: translate it into the concept it bears on.",
              ),
            }),
          },
          'The acceptance criteria, or for a task with no story what done means, each with whether it holds and its evidence.',
        ),
        meaningQuestions,
        followUps: said(
          texts,
          'What the story leaves unfinished, each as work to take up later; empty when there is none.',
        ),
        cost: said(
          record({
            agentRuns: said(
              record({
                total: said(count, 'Every agent run the story took.'),
                byRole: said(
                  { type: 'object', additionalProperties: count },
                  'The agent runs by role.',
                ),
              }),
              'The agent runs the harness reports for the story.',
            ),
            tokens: said(count, 'The tokens the runs reported, summed.'),
            elapsed: said(
              text,
              'The time the story took, from its start to its end.',
            ),
          }),
          'What the story cost, as the agent harness records it.',
        ),
      }),
      "The lead's outcome of the user story to the architect, in the design's own terms: which acceptance criteria hold with their evidence, the meaning questions it raised, the follow-ups it leaves and what it cost.",
    ),
  ],
  [
    change,
    record({
      change: said(text, 'What the change does and why, by area.'),
      tests: said(text, 'The tests added, changed or deleted.'),
      verified: said(text, 'What was verified, and how.'),
    }),
  ],
  [
    codeReview,
    record({
      verdict: said(
        { type: 'string', enum: ['approve', 'changes'] },
        'Whether the code review approves the change or asks for changes.',
      ),
      findings: said(
        texts,
        'Each finding, naming what must change and why; empty when there is none.',
      ),
      meaningQuestions,
    }),
  ],
  [
    checksSeenRed,
    record({
      story: storyField,
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
