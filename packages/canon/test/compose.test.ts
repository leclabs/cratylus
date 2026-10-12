// Composition: a persona that removes `none` from action-scope widens its reach and is
// refused, while no composed agent is narrowed to read-only (0068); each role's typed
// handoff rides its agent as `contract`; every agent carries the per-turn persistence
// protocol; the architect composes its elevation held by the descend guard and its
// stopping rule held by the past-objective guard, which never refuses settling an
// owned question (0101), while its bottom-line-up-front ordering, decisiveness and
// deliverable are plain values no guard holds, since a reply shown has taken effect
// (0106); an optional slot may be left unfilled, never another.

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
import { descend } from '../src/guards/descend.js';
import { pastObjective } from '../src/guards/past-objective.js';
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
  it('composes its ordering, decisiveness and deliverable as plain values at their levels, held by no guard (0106)', () => {
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
    const [deliverable] = architect.deliverable;
    expect(deliverable && anchorOf(deliverable.value)).toBe(
      'decisions-with-reasons',
    );
    for (const held of [ordering, decisive, deliverable])
      expect(held && enforcing(held.value), held && anchorOf(held.value)).toBe(
        false,
      );
    for (const [name, agent] of Object.entries(holders))
      for (const entries of [agent.communicationStyle, agent.deliverable])
        expect(
          entries.some((e) => enforcing(e.value)),
          `${name} composes no reply guard`,
        ).toBe(false);
  });

  it('composes its conceptual elevation held by the descend guard on tool calls', () => {
    const held = architect.stance.find(
      (e) => anchorOf(e.value) === 'conceptual-elevation',
    );
    expect(held?.level).toBe('fixed');
    expect(held && enforcing(held.value) && held.value).toMatchObject({
      realizedBy: descend.id,
      events: ['tool.use.pre'],
      substrate: 'harness',
    });
    for (const [name, agent] of Object.entries(holders))
      if (name !== 'architect')
        expect(
          agent.stance.some((e) => enforcing(e.value)),
          `${name} composes no guard`,
        ).toBe(false);
  });

  it('composes its stopping rule held by the past-objective guard on tool calls, judged with the conversation', () => {
    const held = architect.objective.find((e) => e.slot === 'stopping-rule');
    expect(held && anchorOf(held.value)).toBe('optimize');
    expect(held && enforcing(held.value) && held.value).toMatchObject({
      realizedBy: pastObjective.id,
      events: ['tool.use.pre'],
      substrate: 'harness',
    });
    expect(pastObjective.tell).toBe('procedure past objective');
    expect(pastObjective.judge.conversation).toBe(true);
    expect(pastObjective.refusal).toBe(
      'procedure past objective: your objective is met; report the outcome and stop.',
    );
    for (const [name, agent] of Object.entries(holders))
      if (name !== 'architect')
        expect(
          agent.objective.some((e) => enforcing(e.value)),
          `${name} composes no guard`,
        ).toBe(false);
  });

  it('states in the past-objective prompt what an owned question is, and never refuses settling one as past its objective (0090, 0101, 0102)', () => {
    const prompt = pastObjective.judge.prompt;
    // 0081, 0086: realization, branch use among it, is never an owned question.
    expect(prompt).toContain(
      'Realization is not either: the lead decides it within the agent',
    );
    // 0102: priority is the operator's, recommended by the agent, never owned.
    expect(prompt).toContain(
      "Priority is not an owned question: which work comes next is the operator's to decide and the agent's to recommend",
    );
    expect(prompt).toContain(
      'on a check ruling (whether a frozen check may change)',
    );
    // 0090, 0101: only an open owned question is settled; a ruling applying the
    // design is still recorded before it is reported (0116).
    expect(prompt).toContain(
      'Such a question is open only when the design records it as open, or the operator or a delegate raises it and the design does not already answer it.',
    );
    expect(prompt).toContain(
      "the ruling that applies the design to it is still the agent's own decision, recorded before it is reported (0116)",
    );
    expect(prompt).toContain(
      'a call that takes or records a decision on a question the agent owns is never past the objective, whatever the conversation shows met and whatever the latest message asked',
    );
    // It never weighs whether the agent held what a decision needed.
    expect(prompt).toContain(
      'Whether the agent held what that decision needed is not yours to judge',
    );
    expect(prompt).not.toContain('known practice');
  });

  it('carries every drift tell in the persistence protocol, as every agent does', () => {
    for (const tell of [
      'answerable question',
      'hand-back',
      'menu',
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
