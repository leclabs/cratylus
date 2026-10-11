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
  ownedQuestionJudgment,
  readsOwnedQuestion,
  rulingToDelegate,
  whatFollows,
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
  it('composes bottom-line-up-front ordering, fixed, held by the bottom-line guard at turn end only, judged with the conversation and the decisions recorded that turn', () => {
    const held = architect.communicationStyle.find(
      (e) => e.slot === 'ordering',
    );
    expect(held?.level).toBe('fixed');
    expect(held && anchorOf(held.value)).toBe(anchorOf(bottomLineUpFront));
    // Ordering is the sequence a reply presents its content in (0078): a reply is
    // judged, never a tool call; an act counts through the reply that reports it (0103).
    expect(held && enforcing(held.value) && held.value).toMatchObject({
      realizedBy: bottomLine.id,
      events: ['turn.end'],
      substrate: 'harness',
    });
    expect(bottomLine.judge.conversation).toBe(true);
    expect(bottomLine.judge.recorded).toBe(true);
    expect(bottomLine.judge.prompt).not.toContain('tool call');
    // 0100: what a topic is and what support carries.
    expect(bottomLine.judge.prompt).toContain(
      "A topic is a matter the operator asked about, or an outcome that calls for someone's action; a question no one raised is no topic. Support states facts and reasons, never instructions: a topic's one action is its only instruction",
    );
    // 0090, 0097, 0103(3): a decision or other act taken in the turn and reported is
    // the topic's one action; 0102(2): a record's consequences are no action.
    expect(bottomLine.judge.prompt).toContain(
      "A topic's actions are what the reply itself directs on it and the acts this turn took on it that the reply reports.",
    );
    expect(bottomLine.judge.prompt).toContain(
      'a separate follow-on action on that topic is a second action, even when it does not compete',
    );
    expect(bottomLine.judge.prompt).toContain(
      "A recorded decision's consequences are part of its record, not an action of the reply.",
    );
    // 0078: never a menu or a question it can answer itself.
    expect(bottomLine.judge.prompt).toContain(
      'it offers a menu of options in place of its one recommendation, or asks a question the agent can answer itself',
    );
    // 0097: a decision from before the turn is no action of it; 0086: an outcome
    // calling for action has that step, directed to whoever takes it.
    expect(bottomLine.judge.prompt).toContain(
      'A decision taken before this turn is no action of this turn',
    );
    expect(bottomLine.judge.prompt).toContain(
      "An outcome that calls for someone's action has, as its one action, that step, directed to whoever takes it or taken by the agent in the turn",
    );
    // Honesty guardrail: facts as the records show them, inferences as inferred.
    expect(bottomLine.judge.prompt).toContain(
      "A fact is what the records and the delegates' reports show, stated no stronger than they show it",
    );
    expect(bottomLine.refusal).toMatch(
      /^burying: this reply buries its bottom line\. /,
    );
    // 0103: no sentence states a case; the clauses the held-out runs shaped are gone.
    for (const gone of [
      'a candidate it set aside',
      'An act counts however it is phrased',
      'however the reply divides, heads or names it',
      'That a decision was recorded is never support',
      'only on a condition',
      'permits a practice',
    ])
      for (const text of [
        bottomLine.judge.prompt,
        bottomLine.refusal,
        handBack.judge.prompt,
        holdsWhatItNeeds,
        whatFollows,
        ownedQuestion,
      ])
        expect(text).not.toContain(gone);
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

  it('judges whether it holds what an owned question needs once, by one rule, in one judgment every guard turning on it reads, and never refuses settling one as past its objective (0101)', () => {
    const count = (text: string, part: string) => text.split(part).length - 1;
    // The rule states the decision rights (0086) and the operator concept: the
    // operator's silence is not by itself a lack, and the agent's own word decides nothing.
    expect(holdsWhatItNeeds).toContain(
      'the operator not having spoken to a question is not, by itself, something the agent lacks',
    );
    expect(holdsWhatItNeeds).toContain(
      'The operator is asked nothing between stating intent and release unless a fork is irreversible, about value, or beyond the agent',
    );
    expect(holdsWhatItNeeds).toContain(
      "The agent lacks what a question needs only when every answer it could reason from all of those would still choose what the product is for or a priority between the operator's goals",
    );
    expect(holdsWhatItNeeds).toContain(
      "turning it into what each concept includes, allows or excludes is the agent's work, never the operator's",
    );
    // 0081, 0086: realization, branch use among it, is never an owned question.
    expect(ownedQuestion).toContain(
      'Realization is not either: the lead decides it within the agent',
    );
    expect(holdsWhatItNeeds).toContain(
      "never by the agent's own word that it does or does not",
    );
    // 0102: priority is the operator's, recommended by the agent, never owned.
    expect(ownedQuestion).toContain(
      "Priority is not an owned question: which work comes next is the operator's to decide and the agent's to recommend",
    );
    expect(ownedQuestion).toContain(
      'on a check ruling (whether a frozen check may change)',
    );
    // 0090, 0101: only an open owned question is judged, settled or recorded; applying
    // the design is no new decision, and no guard raises a question itself.
    expect(ownedQuestion).toContain(
      'Such a question is open only when the design records it as open, or the operator or a delegate raises it and the design does not already answer it.',
    );
    expect(ownedQuestion).toContain(
      'applying the design to a report or a request is reporting that answer, never a new decision to take or record',
    );
    expect(readsOwnedQuestion).toContain(
      'Never raise an owned question yourself, and never require a ruling, a record or an approval on one the judgment does not list.',
    );
    expect(handBack.judge.prompt).toContain(
      'It is not a hand-back to give one recommendation on priority',
    );
    expect(unrecorded.judge.prompt).toContain(
      'when it gives a recommendation on priority, which is no decision the agent owns and is never recorded',
    );
    // 0090: settled in whatever turn, recorded with its reason; else one action.
    expect(whatFollows).toContain(
      'it records the decision with its reason and reports it settled',
    );
    expect(whatFollows).toContain(
      'reports the one action it is taking to get what it lacks',
    );
    expect(holdsWhatItNeeds).toContain(
      'Approving examples is deciding whether they express the concepts of the context they illustrate',
    );
    // The rule lives in the one judgment, made at turn end, and nowhere else.
    expect(ownedQuestionJudgment.events).toEqual(['turn.end']);
    expect(count(ownedQuestionJudgment.prompt, holdsWhatItNeeds)).toBe(1);
    expect(count(ownedQuestionJudgment.prompt, ownedQuestion)).toBe(1);
    expect(ownedQuestionJudgment.carries).toBe('questions');
    expect(ownedQuestionJudgment.conversation).toBe(true);
    for (const guard of [handBack, bottomLine, unrecorded]) {
      expect(guard.judge.reads, guard.id).toBe(ownedQuestionJudgment);
      expect(count(guard.judge.prompt, ownedQuestion), guard.id).toBe(1);
      expect(count(guard.judge.prompt, readsOwnedQuestion), guard.id).toBe(1);
      expect(count(guard.judge.prompt, whatFollows), guard.id).toBe(1);
      // No guard states the rule's grounds: it reads the judgment made by them.
      expect(guard.judge.prompt, guard.id).not.toContain(holdsWhatItNeeds);
      expect(guard.judge.prompt, guard.id).not.toContain('known practice');
    }
    expect(readsOwnedQuestion).toContain(
      'Whether the agent holds what an owned question needs is never yours to judge',
    );
    expect(readsOwnedQuestion).toContain(
      'When the judgment says none could be made, or does not list a question, refuse nothing on whether the agent held what that question needs.',
    );
    expect(pastObjective.judge.reads).toBeUndefined();
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
