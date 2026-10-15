// Composition: a persona that removes `none` from action-scope or weakens a guardrail
// is made, and warned of, never refused (0142(2)), while no composed agent is narrowed
// to read-only (0068); each role's typed handoff rides its agent as `contract`; every
// agent carries the per-turn persistence protocol and states it is evaluated in real
// use; no value of any agent is held by a guard (0142(1)); an optional slot may be left
// unfilled, never another.

import { setImmediate } from 'node:timers/promises';
import { type JsonSchema, anchorOf, enforcing } from '@cratylus/schema';
import { describe, expect, it } from 'vitest';
import { architect } from '../src/agents/architect.js';
import { builder } from '../src/agents/builder.js';
import { checkWriter } from '../src/agents/check-writer.js';
import { illustrator } from '../src/agents/illustrator.js';
import { kino } from '../src/agents/kino.js';
import { lead } from '../src/agents/lead.js';
import { mav } from '../src/agents/mav.js';
import { nico } from '../src/agents/nico.js';
import { reviewer } from '../src/agents/reviewer.js';
import { CompositionRefusal, holder, persona } from '../src/compose.js';
import { none } from '../src/dimensions/action-scope/none.js';
import { bottomLineUpFront } from '../src/dimensions/communication-style/bottom-line-up-front.js';
import { honesty } from '../src/dimensions/guardrails/honesty.js';
import { builderRole } from '../src/roles/builder.js';
import { reviewerRole } from '../src/roles/reviewer.js';

const mark = { emoji: '🧪', hue: 'cyan' } as const;
const holders = {
  architect,
  builder,
  checkWriter,
  illustrator,
  lead,
  reviewer,
};
const agents = { ...holders, kino, mav, nico };

describe('composition over action-scope', () => {
  it('makes a persona that removes none from action-scope or weakens a guardrail, and warns', async () => {
    const warned: string[] = [];
    const listen = (w: Error) => warned.push(w.message);
    process.on('warning', listen);
    const widened = persona(reviewerRole, {
      name: 'widener',
      description: 'A reviewer that would act.',
      mark,
      removes: { actionScope: [none] },
      values: { guardrails: [{ value: honesty, level: 'advisory' }] },
    });
    expect(widened.actionScope.map((e) => anchorOf(e.value))).toEqual([]);
    // Node emits a warning on a later tick.
    await setImmediate();
    process.off('warning', listen);
    expect(warned).toEqual([
      'persona widener weakens the guardrail honesty from fixed to advisory',
    ]);
  });

  it('still refuses a persona removing a value its role does not hold', () => {
    expect(() =>
      persona(builderRole, {
        name: 'remover',
        description: 'A builder removing what it lacks.',
        mark,
        removes: { actionScope: [none] },
      }),
    ).toThrow(CompositionRefusal);
  });

  it('narrows no composed agent to read-only, the reviewer included', () => {
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
    expect(required('lead')).toEqual({
      assignment: undefined,
      deliverable: [
        'story',
        'criteria',
        'meaningQuestions',
        'followUps',
        'cost',
      ],
    });
    expect(
      lead.contract?.assignment?.anyOf?.map((form) => form.required),
      'the lead takes a story, or a task with no story',
    ).toEqual([
      [
        'story',
        'slice',
        'why',
        'acceptanceCriteria',
        'outOfScope',
        'path',
        'review',
        'cost',
      ],
      builder.contract?.assignment?.required,
    ]);
    expect(required('builder')).toEqual({
      assignment: ['task', 'goal', 'changes', 'decisions', 'done'],
      deliverable: ['change', 'tests', 'verified'],
    });
    expect(required('reviewer')).toEqual({
      assignment: ['pullRequest'],
      deliverable: ['verdict', 'findings', 'meaningQuestions'],
    });
    expect(required('checkWriter')).toEqual({
      assignment: ['story', 'examples'],
      deliverable: ['story', 'checks'],
    });
    expect(required('illustrator')).toEqual({
      assignment: ['story', 'concepts'],
      deliverable: ['examples', 'flaggedTerms'],
    });
  });

  it("states each handover's optional parts as properties it does not require", () => {
    const optional = (schema: JsonSchema | undefined) =>
      Object.keys(schema?.properties ?? {}).filter(
        (field) => !schema?.required?.includes(field),
      );
    const [story, task] = lead.contract?.assignment?.anyOf ?? [];
    expect(optional(story)).toEqual(['examples', 'decisions', 'contexts']);
    expect(optional(task)).toEqual(['story']);
    expect(optional(builder.contract?.assignment)).toEqual(['story']);
    expect(optional(reviewer.contract?.assignment)).toEqual([
      'story',
      'acceptanceCriteria',
      'examples',
    ]);
  });

  it("gives the architect, whose handovers are a person's, no contract", () => {
    expect(architect).not.toHaveProperty('contract');
  });
});

describe('the architect', () => {
  it('composes its ordering, decisiveness and elevation as plain values at their levels', () => {
    const ordering = architect.communicationStyle.find(
      (e) => e.slot === 'ordering',
    );
    expect(ordering?.level).toBe('fixed');
    expect(ordering && anchorOf(ordering.value)).toBe(
      anchorOf(bottomLineUpFront),
    );
    const decisive = architect.stance.find(
      (e) => anchorOf(e.value) === 'decisive',
    );
    expect(decisive?.level).toBe('fixed');
    const elevation = architect.stance.find(
      (e) => anchorOf(e.value) === 'conceptual-elevation',
    );
    expect(elevation?.level).toBe('fixed');
    const [deliverable] = architect.deliverable;
    expect(deliverable && anchorOf(deliverable.value)).toBe('read-back');
  });

  it('carries every drift tell in the persistence protocol, as every agent does', () => {
    for (const tell of [
      'answerable question',
      'hand-back',
      'unrecommended options',
      'transcribing',
      'descending',
      'prescribing',
      'holding open',
      'procedure past objective',
    ])
      expect(architect.persistence).toContain(`**${tell}**`);
    for (const [name, agent] of Object.entries(agents))
      expect(agent.persistence, name).toBe(architect.persistence);
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
                `${name} ${field} ${anchorOf(e.value as never)}`,
              ).toBe(false);
  });

  it('is evaluated in real use, and by nothing else (0142(1))', () => {
    for (const [name, agent] of Object.entries(agents))
      expect(
        agent.evaluation.map((e) => anchorOf(e.value)),
        name,
      ).toEqual(['in-use']);
  });
});

describe('optional slots', () => {
  it('leaves an unfilled optional slot out, and a persona may fill it', () => {
    expect(builder.communicationStyle.map((e) => e.slot)).toEqual([
      'register',
      'density',
      'rationale',
    ]);
    const ordered = persona(builderRole, {
      name: 'brief',
      description: 'A builder that leads with its conclusion.',
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
        ...builderRole,
        values: {
          ...builderRole.values,
          communicationStyle: builderRole.values.communicationStyle.filter(
            (s) =>
              typeof s !== 'object' || !('slot' in s) || s.slot !== 'density',
          ),
        },
      }),
    ).toThrow(/slot density 0 times/);
  });
});
