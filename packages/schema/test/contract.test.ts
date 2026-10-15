// The one assignment check every handoff runs: it names each missing and each
// ill-typed field, and an assignment that fits passes untouched.

import { describe, expect, it } from 'vitest';
import {
  type JsonSchema,
  assignmentIn,
  checkAssignment,
} from '../src/index.js';

const brief: JsonSchema = {
  type: 'object',
  properties: {
    cut: { type: 'string' },
    concepts: { type: 'array', items: { type: 'string' }, minItems: 1 },
    examples: { type: 'array', items: { type: 'string' }, minItems: 1 },
    decisions: { type: 'array', items: { type: 'string' } },
    efficiency: {
      type: 'object',
      properties: {
        byRole: { type: 'object', additionalProperties: { type: 'integer' } },
      },
      required: ['byRole'],
    },
    outcomes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          outcome: { type: 'string', enum: ['pass', 'fail'] },
          evidence: { type: 'string' },
        },
        required: ['outcome', 'evidence'],
      },
    },
  },
  required: ['cut', 'concepts', 'examples', 'decisions'],
};
const fitting = {
  cut: 'film',
  concepts: ['approval'],
  examples: ['film-production/1'],
  decisions: [],
};

describe('checkAssignment', () => {
  it('passes an assignment that fits, an explicitly empty array included', () => {
    expect(checkAssignment('lead', brief, fitting)).toEqual({
      missing: [],
      illTyped: [],
    });
  });

  it('names the agent and each missing field', () => {
    const { examples: _, decisions: __, ...partial } = fitting;
    const check = checkAssignment('lead', brief, partial);
    expect(check.missing).toEqual(['examples', 'decisions']);
    expect(check.problem).toBe(
      'lead assignment is missing: examples, decisions',
    );
  });

  it('is missing every required field when no assignment is given', () => {
    expect(checkAssignment('lead', brief, undefined).missing).toEqual([
      'cut',
      'concepts',
      'examples',
      'decisions',
    ]);
  });

  it('names each ill-typed field with what was expected, never coercing', () => {
    const check = checkAssignment('lead', brief, {
      ...fitting,
      examples: 'film-production/1',
      concepts: [],
      decisions: null,
      cut: 7,
    });
    expect(check.missing).toEqual([]);
    expect(check.illTyped).toEqual([
      'cut (expected string)',
      'concepts (expected at least 1 item)',
      'examples (expected array)',
      'decisions (expected array)',
    ]);
    expect(check.problem).toMatch(/^lead assignment is ill-typed: cut/);
  });

  it('reaches nested fields, allowed values and additional properties', () => {
    const check = checkAssignment('lead', brief, {
      ...fitting,
      efficiency: { byRole: { builder: 1, assayer: 'two' } },
      outcomes: [{ outcome: 'maybe' }],
    });
    expect(check.missing).toEqual(['outcomes[0].evidence']);
    expect(check.illTyped).toEqual([
      'efficiency.byRole.assayer (expected integer)',
      'outcomes[0].outcome (expected one of pass, fail)',
    ]);
  });

  it('names a whole assignment that is not an object', () => {
    expect(checkAssignment('builder', brief, 'build it').problem).toBe(
      'builder assignment is ill-typed: assignment (expected object)',
    );
  });

  it('references nothing outside itself, so a harness module may carry its source', () => {
    const carried = new Function(`return (${String(checkAssignment)})`)();
    expect(carried('lead', brief, {}).missing).toEqual(
      checkAssignment('lead', brief, {}).missing,
    );
  });
});

describe('checkAssignment over alternative forms', () => {
  const task: JsonSchema = {
    type: 'object',
    properties: { task: { type: 'string' }, done: { type: 'string' } },
    required: ['task', 'done'],
  };
  const either: JsonSchema = { anyOf: [brief, task] };

  it('passes an assignment that fits any one form', () => {
    expect(checkAssignment('lead', either, fitting).problem).toBeUndefined();
    expect(
      checkAssignment('lead', either, { task: 'tidy', done: 'tidied' }),
    ).toEqual({ missing: [], illTyped: [] });
  });

  it('reports the problems of the closest form when none fits', () => {
    expect(checkAssignment('lead', either, { task: 'tidy' }).problem).toBe(
      'lead assignment is missing: done',
    );
    const { decisions: _, ...partial } = fitting;
    expect(checkAssignment('lead', either, partial).problem).toBe(
      'lead assignment is missing: decisions',
    );
  });

  it('reports the first form when no assignment is given', () => {
    expect(checkAssignment('lead', either, undefined).missing).toEqual([
      'cut',
      'concepts',
      'examples',
      'decisions',
    ]);
  });

  it('carries its alternatives in the source a harness module copies', () => {
    const carried = new Function(`return (${String(checkAssignment)})`)();
    expect(carried('lead', either, { task: 'tidy', done: 'x' }).problem).toBe(
      undefined,
    );
  });
});

describe('assignmentIn', () => {
  it('reads the first fenced assignment block of a dispatch text', () => {
    const text = `Realize the cut.\n\n\`\`\`assignment\n${JSON.stringify(fitting)}\n\`\`\`\n`;
    expect(assignmentIn(text)).toEqual(fitting);
  });

  it('is undefined without a block, and the raw text when the block is not JSON', () => {
    expect(assignmentIn('Realize the cut.')).toBeUndefined();
    expect(assignmentIn('```assignment\nnot json\n```')).toBe('not json');
  });
});
