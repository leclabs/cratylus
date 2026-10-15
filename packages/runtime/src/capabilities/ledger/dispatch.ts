// ─────────────────────────────────────────────────────────────────────────────
// The ledger capability's VERB SURFACE — `ledger <verb> [args]`.
//
//   state   every story and task in flight, every one ended with how, each
//           with what it cost
//   story   record a story in flight, with the bounded contexts it touches
//   task    record a task in flight, with the story it belongs to
//   end     record how a story or a task ended: merged or dropped
//
// Stories and tasks share one namespace: a name records one story or one task,
// once. A dispatch and its return reach the ledger only from the harness's own
// events, through `cratylus lifecycle` (`../../lifecycle/`), never through a
// verb; a dispatch naming a story or a task not yet recorded records it in
// flight, as its verb would (`inFlightDrafts`). Every appending verb's checks
// read the ledger under its append lock, so they see what is there when the
// entry is written.
//
// Every answer is JSON; `state` also carries `uninterpreted` when it read past
// entries of kinds this runtime does not know, written by a newer one. Every
// refusal opens with `ledger <verb>:` and is thrown before anything is
// appended.
//
// The capability EXPLAINS ITSELF from the declarations below, as the concept
// journal does: its name and when, and for each verb its concept, purpose,
// when, effect and every parameter it takes.
// ─────────────────────────────────────────────────────────────────────────────

import { CAPABILITY_SUMMARIES } from '../../capability.js';
import type { CapabilityInterface, ExplainedVerb } from '../../explanation.js';
import { type VerbFlags, readArgv, valueFlag } from '../../verb-flags.js';
import { journalAt } from '../concepts/journal.js';
import { Folded } from '../concepts/views.js';
import { verbOf } from '../plan/argv.js';
import { foldWork } from './fold.js';
import { topOf } from './git.js';
import {
  type LedgerDraft,
  type LedgerReading,
  OUTCOMES,
  type Outcome,
  ledgerAt,
} from './store.js';

/** A story's or a task's name: a kebab id. */
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** The ledger capability's verbs, the query first. */
export const VERBS = {
  state: {
    concept: 'ledger',
    effect: 'reads',
    purpose:
      'Tell every story and task in flight and every one ended with how it ended, merged or dropped, each with what it cost: its agent runs in total and by role, the tokens its runs reported (null when none did) and its elapsed time, from when it was recorded to its end, or to now while it is in flight; a task’s runs also count toward its story',
    when: 'At the start of a session, or after it was compacted, to see what work is in flight and how the work before it ended, and whenever a story’s or a task’s cost matters: each answer is worked out afresh from the entries',
    positional: null,
    flags: {},
  },
  story: {
    concept: 'story',
    effect: 'appends',
    purpose:
      'Record a story in flight: one thin slice of behaviour, by its name, with the bounded contexts it touches; a story recorded without contexts touches every context; refused for a name already recorded, as a story or a task',
    when: 'When a story is handed down to be realized, before its tasks are dispatched; a dispatch naming a story not yet recorded records it',
    positional: {
      name: 'name',
      description:
        'The story, by its name: a kebab id (lowercase letters and digits, joined by single hyphens)',
    },
    flags: {
      context: valueFlag(
        'A bounded context the story touches, one recorded in the concept journal; repeat once per context, none when it touches every context',
        { repeats: true },
      ),
    },
  },
  task: {
    concept: 'task',
    effect: 'appends',
    purpose:
      'Record a task in flight: one change ending in one pull request, by its name, with the story it belongs to, none for a task with no story; refused for a name already recorded, as a story or a task, and for a story not recorded',
    when: 'When a task is handed to its builder; a dispatch naming a task not yet recorded records it',
    positional: {
      name: 'name',
      description:
        'The task, by its name: a kebab id (lowercase letters and digits, joined by single hyphens)',
    },
    flags: {
      story: valueFlag('The story the task belongs to, by its name'),
    },
  },
  end: {
    concept: 'outcome',
    effect: 'appends',
    purpose:
      'Record how a story or a task ended, merged or dropped, which takes it out of flight and stops its elapsed time; refused for a name not recorded and for one already ended',
    when: 'When a task’s pull request is merged or the task is dropped, and when a story is done or dropped',
    positional: {
      name: 'name',
      description: 'The story or task that ended, by its name',
    },
    flags: {
      outcome: valueFlag('How it ended', {
        required: true,
        values: OUTCOMES,
      }),
    },
  },
} as const satisfies VerbFlags<string, ExplainedVerb>;

type LedgerVerb = keyof typeof VERBS;

/** The ledger capability, as it explains itself. */
export const LEDGER: CapabilityInterface = {
  name: 'ledger',
  purpose: CAPABILITY_SUMMARIES.ledger,
  when: 'Whenever work is handed down or ends: to record each story and task in flight and how each ended, and to see what is in flight and what the work cost',
  verbs: VERBS,
};

/** The entries recording in flight the `story` and `task` a dispatch names
 *  that `reading` does not yet hold: the story before the task when both are
 *  new; none for one already recorded. Refused for a name that is no kebab id,
 *  or a story named as a task or a task as a story. Made under the ledger's
 *  lock (`appendAfter`), so dispatches racing to name one new story record it
 *  once and each is still recorded. */
export function inFlightDrafts(
  reading: LedgerReading,
  named: { readonly story?: string; readonly task?: string },
  refuse: (message: string) => Error,
): LedgerDraft[] {
  const { stories, tasks } = foldWork(reading.entries, Date.now());
  const isStory = (name: string) => stories.some((s) => s.story === name);
  const isTask = (name: string) => tasks.some((t) => t.task === name);
  for (const name of [named.story, named.task])
    if (name !== undefined && !NAME.test(name))
      throw refuse(
        `'${name}' is no name of a story or a task: a kebab id, lowercase letters and digits joined by single hyphens`,
      );
  if (named.story !== undefined && isTask(named.story))
    throw refuse(`'${named.story}' is recorded as a task, not a story`);
  if (named.task !== undefined && isStory(named.task))
    throw refuse(`'${named.task}' is recorded as a story, not a task`);
  return [
    ...(named.story === undefined || isStory(named.story)
      ? []
      : [
          {
            kind: 'story',
            transition: `story:${named.story}`,
            story: named.story,
          } as const,
        ]),
    ...(named.task === undefined || isTask(named.task)
      ? []
      : [
          {
            kind: 'task',
            transition: `task:${named.task}`,
            task: named.task,
            ...(named.story === undefined ? {} : { story: named.story }),
          } as const,
        ]),
  ];
}

/** Route `ledger <verb> [args]` to the ledger of the git repository holding
 *  `from`, its elapsed times measured to `now`; returns what the verb prints
 *  as JSON. */
export function dispatchLedger(
  argv: readonly string[],
  opts: { readonly from?: string; readonly now?: number } = {},
): unknown {
  const verb: LedgerVerb = verbOf(argv, 'ledger', VERBS);
  const args = readArgv(argv.slice(1), 'ledger', verb, VERBS[verb]);
  const refuse = (message: string) => new Error(`ledger ${verb}: ${message}`);
  const from = opts.from ?? process.cwd();
  const top = topOf(from);
  if (top === undefined)
    throw refuse(
      `${from} is not inside a git repository; the ledger is kept in one`,
    );

  /** Each value given for `flag`, refusing an empty one. */
  const values = (flag: string): string[] => {
    const given = [...(args.flags.get(flag) ?? [])];
    if (given.some((v) => v.trim() === ''))
      throw refuse(`--${flag} is given empty; give it a value`);
    return given;
  };
  /** The value given once for `flag`, if given. */
  const once = (flag: string): string | undefined => {
    const given = values(flag);
    if (given.length > 1)
      throw refuse(`--${flag} is given ${given.length} times; give it once`);
    return given[0];
  };
  /** The name the verb acts on, a kebab id. */
  const name = (): string => {
    const given = args.positionals[0];
    if (given === undefined || !NAME.test(given))
      throw refuse(
        `name the ${verb === 'end' ? 'story or task' : verb} as a kebab id: lowercase letters and digits joined by single hyphens`,
      );
    return given;
  };

  const ledger = ledgerAt(top, refuse);
  const now = opts.now ?? Date.now();
  /** The work `reading` records, and lookups of its stories and tasks. */
  const workOf = (reading: LedgerReading) => {
    const work = foldWork(reading.entries, now);
    return {
      work,
      story: (n: string) => work.stories.find((s) => s.story === n),
      task: (n: string) => work.tasks.find((t) => t.task === n),
    };
  };
  /** The one entry `plan` makes of what the ledger holds, appended under its
   *  lock, so its checks read what is there when it is written. */
  const appendOne = (plan: (reading: LedgerReading) => LedgerDraft) =>
    ledger.appendAfter((reading) => [plan(reading)])[0];
  /** Refuse a name `reading` already records, as a story or a task. */
  const unrecorded = (reading: LedgerReading, n: string): string => {
    const { story, task } = workOf(reading);
    if (story(n) !== undefined)
      throw refuse(`'${n}' is already recorded as a story`);
    if (task(n) !== undefined)
      throw refuse(`'${n}' is already recorded as a task`);
    return n;
  };

  switch (verb) {
    case 'state': {
      const reading = ledger.read();
      const { work } = workOf(reading);
      const inFlight = {
        stories: work.stories.filter((s) => s.ended === undefined),
        tasks: work.tasks.filter((t) => t.ended === undefined),
      };
      const ended = {
        stories: work.stories.filter((s) => s.ended !== undefined),
        tasks: work.tasks.filter((t) => t.ended !== undefined),
      };
      const report = reading.readPast.report();
      return {
        inFlight,
        ended,
        ...(report === undefined ? {} : { uninterpreted: report }),
      };
    }
    case 'story': {
      const named = name();
      const contexts = [...new Set(values('context'))];
      if (contexts.length > 0) {
        const known = new Folded(journalAt(top, refuse).entries()).contexts;
        const absent = contexts.filter((c) => !known.has(c));
        if (absent.length > 0)
          throw refuse(
            `the journal has no bounded context ${absent.map((c) => `'${c}'`).join(', ')}; record it with concepts context first`,
          );
      }
      return appendOne((reading) => ({
        kind: 'story',
        transition: `story:${named}`,
        story: unrecorded(reading, named),
        ...(contexts.length === 0 ? {} : { contexts }),
      }));
    }
    case 'task': {
      const named = name();
      const of = once('story');
      return appendOne((reading) => {
        if (of !== undefined && workOf(reading).story(of) === undefined)
          throw refuse(
            `the ledger records no story '${of}'; record it with ledger story first`,
          );
        return {
          kind: 'task',
          transition: `task:${named}`,
          task: unrecorded(reading, named),
          ...(of === undefined ? {} : { story: of }),
        };
      });
    }
    case 'end': {
      const ending = name();
      const outcome = once('outcome');
      if (outcome === undefined || !OUTCOMES.some((o) => o === outcome))
        throw refuse(
          `give how it ended with --outcome ${OUTCOMES.join(' or ')}`,
        );
      return appendOne((reading) => {
        const { story, task } = workOf(reading);
        const endingStory = story(ending);
        const held = endingStory ?? task(ending);
        if (held === undefined)
          throw refuse(`the ledger records no story or task '${ending}'`);
        if (held.ended !== undefined)
          throw refuse(
            `'${ending}' already ended, ${held.ended.outcome}, at ${held.ended.at}`,
          );
        return {
          kind: 'end',
          transition: `end:${ending}`,
          ...(endingStory === undefined ? { task: ending } : { story: ending }),
          outcome: outcome as Outcome,
        };
      });
    }
  }
}
