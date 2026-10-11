// Composition: a persona that removes `none` from action-scope widens its reach and is
// refused, while no composed agent is narrowed to read-only (0068); each role's typed
// handoff rides its agent as `contract`; every agent carries the per-turn persistence
// protocol; the architect composes bottom-line-up-front ordering held by the
// bottom-line guard, its decisiveness held by the hand-back guard, its elevation
// held by the descend guard, its stopping rule held by the past-objective guard and
// its deliverable held by the unrecorded guard; the guards whose judgment turns on
// whether the architect holds what an owned question needs read one rule, and
// past-objective never refuses settling one (0101); an
// optional slot may be left unfilled, never another.

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
import { bottomLine } from '../src/guards/bottom-line.js';
import { descend } from '../src/guards/descend.js';
import { handBack } from '../src/guards/hand-back.js';
import {
  holdsWhatItNeeds,
  ownedQuestion,
  rulingToDelegate,
} from '../src/guards/owned-question.js';
import { pastObjective } from '../src/guards/past-objective.js';
import { unrecorded } from '../src/guards/unrecorded.js';
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
  it('composes bottom-line-up-front ordering, fixed, held by the bottom-line guard on tool calls and at turn end, judged with the conversation and the decisions recorded that turn', () => {
    const held = architect.communicationStyle.find(
      (e) => e.slot === 'ordering',
    );
    expect(held?.level).toBe('fixed');
    expect(held && anchorOf(held.value)).toBe(anchorOf(bottomLineUpFront));
    expect(held && enforcing(held.value) && held.value).toMatchObject({
      realizedBy: bottomLine.id,
      events: ['turn.end', 'tool.use.pre'],
      substrate: 'harness',
    });
    expect(bottomLine.judge.conversation).toBe(true);
    expect(bottomLine.judge.recorded).toBe(true);
    // One action per topic holds over acts as over words: every act this turn takes
    // on a topic's matter is one of its actions, work a recorded decision sets for
    // someone included; support carries only the facts and reasons its conclusions
    // rest on.
    expect(bottomLine.judge.prompt).toContain(
      'One action per topic holds over what the agent does as over what it reports.',
    );
    expect(bottomLine.judge.prompt).toContain(
      "A topic's actions are every act this turn takes or recommends on its matter",
    );
    expect(bottomLine.judge.prompt).toContain(
      "Its consequences are part of the record, not an action: only what the reply itself directs, and the acts the turn takes, count as a topic's actions.",
    );
    expect(bottomLine.judge.prompt).not.toContain('sets work for someone');
    expect(bottomLine.judge.prompt).toContain(
      'Recording a decision is taking it',
    );
    expect(bottomLine.judge.prompt).toContain(
      'A tool call buries when it takes a second action on a topic this turn has already acted on',
    );
    expect(bottomLine.judge.prompt).toContain(
      'its support carries anything other than the facts and reasons its conclusions rest on',
    );
    expect(bottomLine.refusal).toMatch(
      /^burying: this buries your bottom line\. /,
    );
    // Recording mechanics are never support; a delegate's ruling is its topic's one
    // action and reaches that delegate; a candidate set aside gets no action.
    expect(bottomLine.judge.prompt).toContain(
      'That a decision was recorded is never support',
    );
    expect(bottomLine.judge.prompt).toContain(
      'it answers a question a delegate asked without addressing the ruling to that delegate',
    );
    expect(bottomLine.judge.prompt).toContain(
      'the decision it delivers, recorded this turn, is the same action, and reporting the ruling to the operator adds none',
    );
    expect(bottomLine.judge.prompt).toContain(
      'a candidate it set aside gets no action of its own',
    );
    // An act counts however the reply phrases or divides it, and a short answer
    // still gives its topic exactly one action.
    expect(bottomLine.judge.prompt).toContain(
      'however the reply divides, heads or names it',
    );
    expect(bottomLine.judge.prompt).toContain(
      'An act counts however it is phrased',
    );
    expect(bottomLine.judge.prompt).toContain(
      'A short direct answer on one topic needs no support, but still gives its topic exactly one action.',
    );
    for (const guard of [bottomLine, handBack])
      expect(guard.refusal, guard.id).toContain(rulingToDelegate);
    for (const [name, agent] of Object.entries(holders))
      if (name !== 'architect')
        expect(
          agent.communicationStyle.some((e) => enforcing(e.value)),
          `${name} composes no guard`,
        ).toBe(false);
  });

  it('composes its decisiveness held by the hand-back guard at turn end', () => {
    const held = architect.stance.find((e) => anchorOf(e.value) === 'decisive');
    expect(held?.level).toBe('fixed');
    expect(held && enforcing(held.value) && held.value).toMatchObject({
      realizedBy: handBack.id,
      events: ['turn.end'],
      substrate: 'harness',
    });
    expect(handBack.refusal).toMatch(
      /^hand-back: this reply returns a decision you own to the operator\. /,
    );
    for (const [name, agent] of Object.entries(holders))
      if (name !== 'architect')
        expect(
          agent.stance.some((e) => enforcing(e.value)),
          `${name} composes no guard`,
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

  it('composes its deliverable held by the unrecorded guard at turn end, judged with the decisions recorded that turn', () => {
    const [held] = architect.deliverable;
    expect(held && anchorOf(held.value)).toBe('decisions-with-reasons');
    expect(held && enforcing(held.value) && held.value).toMatchObject({
      realizedBy: unrecorded.id,
      events: ['turn.end'],
      substrate: 'harness',
    });
    expect(unrecorded.tell).toBe('holding open');
    expect(unrecorded.judge.recorded).toBe(true);
    expect(unrecorded.refusal).toBe(
      'holding open: a decision is taken when it is recorded. Record it, then report it.',
    );
    for (const [name, agent] of Object.entries(holders))
      if (name !== 'architect')
        expect(
          agent.deliverable.some((e) => enforcing(e.value)),
          `${name} composes no guard`,
        ).toBe(false);
  });

  it('judges whether it holds what an owned question needs by one rule, read by every guard turning on it, and never refuses settling one as past its objective (0101)', () => {
    const count = (text: string, part: string) => text.split(part).length - 1;
    // The operator's silence is never a lack: the rule names the one kind of ruling
    // the agent lacks, and a practice common in the industry is settled from it.
    expect(holdsWhatItNeeds).toContain(
      'The operator not having spoken to a question is never a lack',
    );
    expect(holdsWhatItNeeds).toContain(
      'whether a context permits a practice common in its industry is settled from that practice',
    );
    expect(holdsWhatItNeeds).toContain(
      "only when, with all of those, the ruling would still choose what the product is for, a priority between the operator's goals, or a fork that is irreversible, about value or beyond the agent's competence",
    );
    expect(holdsWhatItNeeds).toContain(
      "never by the agent's own claim that it lacks something",
    );
    // 0102: priority is the operator's, recommended by the agent, never owned.
    expect(ownedQuestion).toContain(
      "Priority is not: which work comes next is the operator's to decide and the agent's to recommend",
    );
    expect(ownedQuestion).toContain('on a check ruling');
    expect(handBack.judge.prompt).toContain(
      'it is not a hand-back to give one recommendation on priority',
    );
    expect(unrecorded.judge.prompt).toContain(
      'when it gives a recommendation on priority, which is no decision the agent owns and is never recorded',
    );
    expect(holdsWhatItNeeds).toContain(
      'never taking it only on a condition; approving examples judges only whether they express the design',
    );
    for (const guard of [handBack, bottomLine, unrecorded]) {
      expect(count(guard.judge.prompt, ownedQuestion), guard.id).toBe(1);
      expect(count(guard.judge.prompt, holdsWhatItNeeds), guard.id).toBe(1);
      // No guard phrases the rule's grounds of its own beside the shared one.
      expect(count(guard.judge.prompt, 'known practice'), guard.id).toBe(1);
    }
    expect(count(pastObjective.judge.prompt, ownedQuestion)).toBe(1);
    expect(pastObjective.judge.prompt).not.toContain(holdsWhatItNeeds);
    expect(pastObjective.judge.prompt).not.toContain('known practice');
    expect(pastObjective.judge.prompt).toContain(
      'a call that takes or records a decision on a question the agent owns is never past the objective, whatever the conversation shows met and whatever the latest message asked',
    );
    expect(pastObjective.judge.prompt).toContain(
      'Whether the agent held what that decision needed is not yours to judge',
    );
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
