// Composition: a persona that removes `none` from action-scope widens its reach and is
// refused, while no composed agent is narrowed to read-only (0068); each role's typed
// handoff rides its agent as `contract`; every agent carries the per-turn persistence
// protocol; the architect composes bottom-line-up-front ordering and its decisiveness
// held by the hand-back guard; an optional slot may be left unfilled, never another.

import { anchorOf, enforcing } from '@cratylus/schema';
import { describe, expect, it } from 'vitest';
import { architect } from '../src/agents/architect.js';
import { assayer } from '../src/agents/assayer.js';
import { builder } from '../src/agents/builder.js';
import { checkWriter } from '../src/agents/check-writer.js';
import { illustrator } from '../src/agents/illustrator.js';
import { kino } from '../src/agents/kino.js';
import { lead } from '../src/agents/lead.js';
import { mav } from '../src/agents/mav.js';
import { nico } from '../src/agents/nico.js';
import { CompositionRefusal, holder, persona } from '../src/compose.js';
import { none } from '../src/dimensions/action-scope/none.js';
import { bottomLineUpFront } from '../src/dimensions/communication-style/bottom-line-up-front.js';
import { handBack } from '../src/guards/hand-back.js';
import { assayerRole } from '../src/roles/assayer.js';
import { builderRole } from '../src/roles/builder.js';

const mark = { emoji: '🧪', hue: 'cyan' } as const;
const holders = { architect, assayer, builder, checkWriter, illustrator, lead };
const agents = { ...holders, kino, mav, nico };

describe('composition over action-scope', () => {
  it('refuses a persona that removes none from action-scope', () => {
    const compose = () =>
      persona(assayerRole, {
        name: 'widener',
        description: 'An assayer that would act.',
        mark,
        removes: { actionScope: [none] },
      });
    expect(compose).toThrow(CompositionRefusal);
    expect(compose).toThrow(/action-scope/);
    expect(compose).toThrow(/\bnone\b/);
  });

  it('narrows no composed agent to read-only, the assayer included', () => {
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
      assignment: ['cut', 'concepts', 'examples', 'decisions'],
      deliverable: [
        'cut',
        'outcomes',
        'verdicts',
        'efficiency',
        'hardeningNotes',
      ],
    });
    expect(required('builder')).toEqual({
      assignment: ['cut', 'workPackage', 'outputs', 'concepts', 'examples'],
      deliverable: ['cut', 'workPackage', 'done'],
    });
    expect(required('assayer')).toEqual({
      assignment: ['cut', 'workPackages', 'examples', 'decisions'],
      deliverable: ['cut', 'verdicts', 'hardeningNotes'],
    });
    expect(required('checkWriter')).toEqual({
      assignment: ['cut', 'examples'],
      deliverable: ['cut', 'checks'],
    });
    expect(required('illustrator')).toEqual({
      assignment: ['cut', 'concepts'],
      deliverable: ['examples', 'flaggedTerms'],
    });
  });

  it('gives the architect, whose intent is free text, no contract', () => {
    expect(architect).not.toHaveProperty('contract');
  });
});

describe('the architect', () => {
  it('composes bottom-line-up-front ordering, fixed', () => {
    expect(
      architect.communicationStyle.find((e) => e.slot === 'ordering'),
    ).toEqual({ value: bottomLineUpFront, level: 'fixed', slot: 'ordering' });
  });

  it('composes its decisiveness held by the hand-back guard at turn end', () => {
    const held = architect.stance.find((e) => anchorOf(e.value) === 'decisive');
    expect(held?.level).toBe('fixed');
    expect(held && enforcing(held.value) && held.value).toMatchObject({
      realizedBy: handBack.id,
      events: ['turn.end'],
      substrate: 'harness',
    });
    for (const [name, agent] of Object.entries(holders))
      if (name !== 'architect')
        expect(
          agent.stance.some((e) => enforcing(e.value)),
          `${name} composes no guard`,
        ).toBe(false);
  });

  it('carries every drift tell in the persistence protocol, as every agent does', () => {
    for (const tell of [
      'answerable question',
      'hand-back',
      'menu',
      'transcribing',
      'descending',
      'prescribing',
      'procedure past objective',
    ])
      expect(architect.persistence).toContain(`**${tell}**`);
    for (const [name, agent] of Object.entries(agents))
      expect(agent.persistence, name).toBe(architect.persistence);
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
