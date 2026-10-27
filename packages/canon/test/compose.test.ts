// Composition: a persona that removes `none` from action-scope or weakens a guardrail
// is made, and warned of, never refused (0142(2)), while no composed agent is narrowed
// to read-only (0068); each role's typed handoff rides its agent as `contract`; every
// agent states it is evaluated in real use; no value of any agent is held by a guard
// (0142(1)); an optional slot may be left unfilled, never another.

import { setImmediate } from 'node:timers/promises';
import { type JsonSchema, enforcing, termOf } from '@cratylus/schema';
import { describe, expect, it } from 'vitest';
import { businessAnalyst } from '../src/agents/business-analyst.js';
import { codeReviewer } from '../src/agents/code-reviewer.js';
import { kino } from '../src/agents/kino.js';
import { mav } from '../src/agents/mav.js';
import { nico } from '../src/agents/nico.js';
import { softwareEngineer } from '../src/agents/software-engineer.js';
import { techLead } from '../src/agents/tech-lead.js';
import { testEngineer } from '../src/agents/test-engineer.js';
import { CompositionRefusal, holder, persona } from '../src/compose.js';
import { none } from '../src/factors/action-scope/none.js';
import { bottomLineUpFront } from '../src/factors/communication-style/bottom-line-up-front.js';
import { honesty } from '../src/factors/guardrails/honesty.js';
import { codeReviewerRole } from '../src/roles/code-reviewer.js';
import { softwareEngineerRole } from '../src/roles/software-engineer.js';

const mark = { emoji: '🧷', hue: 'cyan' } as const;
const holders = {
  businessAnalyst,
  techLead,
  softwareEngineer,
  testEngineer,
  codeReviewer,
};
const agents = { ...holders, kino, mav, nico };

describe('composition over action-scope', () => {
  it('makes a persona that removes none from action-scope or weakens a guardrail, and warns', async () => {
    const warned: string[] = [];
    const listen = (w: Error) => warned.push(w.message);
    process.on('warning', listen);
    const widened = persona(codeReviewerRole, {
      name: 'widener',
      description: 'A code reviewer that would act.',
      mark,
      removes: { actionScope: [none] },
      values: { guardrails: [{ value: honesty, level: 'advisory' }] },
    });
    expect(widened.actionScope.map((e) => termOf(e.value))).toEqual([]);
    // Node emits a warning on a later tick.
    await setImmediate();
    process.off('warning', listen);
    expect(warned).toEqual([
      'persona widener weakens the guardrail honesty from firm to advisory',
    ]);
  });

  it('still refuses a persona removing a value its role does not hold', () => {
    expect(() =>
      persona(softwareEngineerRole, {
        name: 'remover',
        description: 'A software engineer removing what it lacks.',
        mark,
        removes: { actionScope: [none] },
      }),
    ).toThrow(CompositionRefusal);
  });

  it('narrows no composed agent to read-only, the code reviewer included', () => {
    for (const [name, agent] of Object.entries(agents))
      expect(agent, name).not.toHaveProperty('readOnly');
  });
});

describe('typed handoffs', () => {
  it('carries the assignment and deliverable schema of each delegated role', () => {
    const required = (name: keyof typeof holders) => ({
      assignment: holders[name].contract?.assignment?.required,
      deliverable: holders[name].contract?.deliverable?.required,
    });
    expect(required('techLead')).toEqual({
      assignment: undefined,
      deliverable: [
        'story',
        'joined',
        'criteria',
        'meaningQuestions',
        'followUps',
      ],
    });
    expect(
      techLead.contract?.assignment?.anyOf?.map((form) => form.required),
      'the tech lead takes a story, or a task with no story',
    ).toEqual([
      ['story', 'slice', 'why', 'acceptanceCriteria', 'outOfScope'],
      softwareEngineer.contract?.assignment?.required,
    ]);
    expect(required('softwareEngineer')).toEqual({
      assignment: ['task', 'goal', 'changes', 'done'],
      deliverable: ['change', 'tests', 'verified'],
    });
    expect(required('codeReviewer')).toEqual({
      assignment: ['change'],
      deliverable: ['verdict', 'findings', 'meaningQuestions'],
    });
    expect(required('testEngineer')).toEqual({
      assignment: ['story', 'examples'],
      deliverable: ['story', 'tests'],
    });
  });

  it("states each handover's optional parts as properties it does not require", () => {
    const optional = (schema: JsonSchema | undefined) =>
      Object.keys(schema?.properties ?? {}).filter(
        (field) => !schema?.required?.includes(field),
      );
    const [story, task] = techLead.contract?.assignment?.anyOf ?? [];
    expect(optional(story)).toEqual(['examples']);
    expect(optional(task)).toEqual(['story']);
    expect(optional(softwareEngineer.contract?.assignment)).toEqual(['story']);
    expect(optional(codeReviewer.contract?.assignment)).toEqual([
      'story',
      'acceptanceCriteria',
      'examples',
    ]);
    expect(
      optional(testEngineer.contract?.deliverable?.properties?.tests?.items),
    ).toEqual(['passes']);
  });

  it("gives the business analyst, whose handovers are the product owner's, no contract", () => {
    expect(businessAnalyst).not.toHaveProperty('contract');
  });
});

describe('the business analyst', () => {
  it("composes its ordering, decisiveness and elevation as plain values at their factor's default level", () => {
    const ordering = businessAnalyst.communicationStyle.find(
      (e) => e.slot === 'ordering',
    );
    expect(ordering?.level).toBe('firm');
    expect(ordering && termOf(ordering.value)).toBe(termOf(bottomLineUpFront));
    const decisive = businessAnalyst.stance.find(
      (e) => termOf(e.value) === 'decisive',
    );
    expect(decisive?.level).toBe('firm');
    const elevation = businessAnalyst.stance.find(
      (e) => termOf(e.value) === 'conceptual-elevation',
    );
    expect(elevation?.level).toBe('firm');
    const [deliverable] = businessAnalyst.deliverable;
    expect(deliverable && termOf(deliverable.value)).toBe('report');
  });
});

describe('every agent', () => {
  it('holds no value by a guard (0142(1))', () => {
    for (const [name, agent] of Object.entries(agents))
      for (const [field, entries] of Object.entries(agent))
        if (Array.isArray(entries))
          for (const e of entries as { value?: unknown }[])
            if (e !== null && typeof e === 'object' && 'value' in e)
              expect(
                enforcing(e.value as never),
                `${name} ${field} ${termOf(e.value as never)}`,
              ).toBe(false);
  });

  it('is evaluated in real use, and by nothing else (0142(1))', () => {
    for (const [name, agent] of Object.entries(agents))
      expect(
        agent.evaluation.map((e) => termOf(e.value)),
        name,
      ).toEqual(['in-use']);
  });

  it('carries its own mark, shared with no other agent', () => {
    const marks = Object.fromEntries(
      Object.entries(agents).map(([name, agent]) => [name, agent.mark]),
    );
    expect(marks).toEqual({
      businessAnalyst: { emoji: '📋', hue: 'white' },
      techLead: { emoji: '🧭', hue: 'blue' },
      softwareEngineer: { emoji: '🔨', hue: 'yellow' },
      testEngineer: { emoji: '🧪', hue: 'green' },
      codeReviewer: { emoji: '🔍', hue: 'red' },
      kino: { emoji: '🎬', hue: 'magenta' },
      mav: { emoji: '✈️', hue: 'green' },
      nico: { emoji: '📐', hue: 'cyan' },
    });
    const emojis = Object.values(agents).map((agent) => agent.mark?.emoji);
    expect(new Set(emojis).size).toBe(emojis.length);
  });
});

describe('optional slots', () => {
  it('leaves an unfilled optional slot out, and a persona may fill it', () => {
    expect(softwareEngineer.communicationStyle.map((e) => e.slot)).toEqual([
      'register',
      'density',
      'rationale',
    ]);
    const ordered = persona(softwareEngineerRole, {
      name: 'brief',
      description: 'A software engineer that leads with its conclusion.',
      mark,
      values: {
        communicationStyle: [{ value: bottomLineUpFront, slot: 'ordering' }],
      },
    });
    expect(ordered.communicationStyle.map((e) => e.slot)).toEqual([
      'register',
      'density',
      'rationale',
      'ordering',
    ]);
  });

  it('still refuses a role that leaves a required slot unfilled', () => {
    expect(() =>
      holder({
        ...softwareEngineerRole,
        values: {
          ...softwareEngineerRole.values,
          communicationStyle:
            softwareEngineerRole.values.communicationStyle.filter(
              (s) =>
                typeof s !== 'object' || !('slot' in s) || s.slot !== 'density',
            ),
        },
      }),
    ).toThrow(/slot density 0 times/);
  });
});
