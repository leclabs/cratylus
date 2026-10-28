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
// under `anyOf`, and fits when it fits any one. The business analyst's handovers are
// the product owner's: free-text intent in, a backbrief out, neither carrying a contract.
// ─────────────────────────────────────────────────────────────────────────────

import { type JsonSchema, termOf } from '@cratylus/schema';
import { examples } from './factors/assignment/examples.js';
import { reviewRequest } from './factors/assignment/review-request.js';
import { task } from './factors/assignment/task.js';
import { userStory } from './factors/assignment/user-story.js';
import { acceptanceTests } from './factors/deliverable/acceptance-tests.js';
import { change } from './factors/deliverable/change.js';
import { codeReview } from './factors/deliverable/code-review.js';
import { outcome } from './factors/deliverable/outcome.js';
import type { Assignment, Deliverable } from './manifest.js';

const text: JsonSchema = { type: 'string' };
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
    `${whose}, each as \`<context>/<concept>\` for all of a concept's examples or \`<context>/<concept>: <example name>\` for one (e.g. \`delivery/install: installs the industry roles\`).`,
  );
const meaningQuestions = said(
  texts,
  'Each question whose answer would change a concept or an example, for the business analyst to settle; empty when there is none.',
);

// The story and the task, each a form of its own: the tech lead takes either, a
// software engineer a task.
const storyForm = record(
  {
    story: storyField,
    slice: said(
      text,
      "The thin slice of behaviour a user can rely on, in the domain model's terms.",
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
    examples: exampleRefs(
      texts,
      'The concepts and examples the story adds or changes',
    ),
  },
  ['examples'],
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
      examples: exampleRefs(
        someTexts,
        'The examples to write acceptance tests for',
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
        joined: said(
          { type: 'string', enum: ['merged', 'dropped'] },
          'Whether the work was merged or dropped.',
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
                "Why it holds or does not, in the domain model's terms: what the code review and the acceptance tests showed, each file, function, path or command translated into the concept it bears on.",
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
      }),
      "The tech lead's outcome to the business analyst: whether the work was merged or dropped, each acceptance criterion with its evidence in the domain model's terms, the meaning questions raised and the follow-ups.",
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
    acceptanceTests,
    record({
      story: storyField,
      tests: {
        type: 'array',
        items: record(
          {
            example: exampleRefs(text, 'The example the test binds'),
            test: said(text, 'The acceptance test, by its file and title.'),
            seenFailing: said(
              flag,
              'Whether it was seen failing before the build.',
            ),
            passes: said(
              flag,
              'Whether the realization passes it; absent before the build.',
            ),
          },
          ['passes'],
        ),
      },
    }),
  ],
];

/** Each assignment value's contract, by the value's term. */
export const ASSIGNMENT_CONTRACTS: Readonly<Record<string, JsonSchema>> =
  Object.fromEntries(
    assignments.map(([value, schema]) => [termOf(value), schema]),
  );

/** Each deliverable value's contract, by the value's term. */
export const DELIVERABLE_CONTRACTS: Readonly<Record<string, JsonSchema>> =
  Object.fromEntries(
    deliverables.map(([value, schema]) => [termOf(value), schema]),
  );
