// The `note` capability, driven at its verb surface over temporary git
// repositories this file builds itself: owed rulings taking units and plans off
// the frontier and releasing them, a diverged note blocking what either version
// blocks and keeping its place in the notebook, the notebook grouped by kind
// and topic and addressed by title, and a title held twice after a merge. The plan lifecycle arrives through
// `$AGENT_RUNTIME_CONFIG`, in states invented here.

import { describe, expect, it } from 'vitest';
import { dispatchDesign } from '../src/capabilities/design/dispatch.js';
import { VERBS, dispatchNote } from '../src/capabilities/note/dispatch.js';
import { dispatchPlan } from '../src/capabilities/plan/dispatch.js';
import * as verbFlags from '../src/verb-flags.js';
import {
  BY,
  IDENTITY,
  configured,
  merge,
  records,
  refusal,
  repository,
  spoken,
  stored,
} from './verb-surface.js';

configured();

const note = (repo: string, ...argv: string[]): string =>
  dispatchNote(argv, { from: repo });
const plan = (repo: string, ...argv: string[]): string =>
  dispatchPlan(argv, { from: repo });

function refused(
  run: (repo: string, ...argv: string[]) => string,
  repo: string,
  ...argv: string[]
): string {
  return refusal(repo, () => run(repo, ...argv));
}

/** `note show`, held to what a reader may be shown; `shared` are the titles
 *  held more than once. */
const show = (
  repo: string,
  shared: readonly string[] = [],
  ...argv: string[]
) => spoken(repo, note(repo, 'show', ...argv), shared);

/** A plan `pl` of units `a` and `b`, bound so its units are worked, and a
 *  plan `other` of unit `o`. */
function plans(repo: string): void {
  dispatchDesign(['define', 'c', '--gloss', 'a concept', ...BY], {
    from: repo,
  });
  const add = (unit: string, into: string, ...more: string[]) =>
    plan(repo, 'add', unit, '--plan', into, '--realizes', 'c', ...more, ...BY);
  add('a', 'pl', '--plan-realizes', 'c');
  add('b', 'pl');
  add('o', 'other', '--plan-realizes', 'c');
  plan(repo, 'bind', 'pl', ...BY);
}

/** The frontier of plan `of`, by unit name. */
function frontier(repo: string, of: string): string[] {
  return [...plan(repo, 'show', of).matchAll(/ {4}(\S+) — [^·]*frontier/g)]
    .map((m) => m[1] as string)
    .sort();
}

function capture(repo: string, title: string, ...more: string[]): string {
  return note(
    repo,
    'capture',
    title,
    '--kind',
    'ask',
    '--topic',
    'scope',
    '--body',
    `about ${title}`,
    ...more,
    ...BY,
  );
}

describe('note — owed rulings', () => {
  it('a note blocking a unit takes it off the frontier until it is retracted, or revised to block nothing', () => {
    const repo = repository();
    plans(repo);
    expect(frontier(repo, 'pl')).toEqual(['a', 'b']);
    capture(repo, 'hold a', '--blocks', 'a');
    expect(frontier(repo, 'pl')).toEqual(['b']);
    note(repo, 'retract', 'hold a', ...BY);
    expect(frontier(repo, 'pl')).toEqual(['a', 'b']);
    capture(repo, 'hold b', '--blocks', 'b');
    expect(frontier(repo, 'pl')).toEqual(['a']);
    note(repo, 'revise', 'hold b', '--blocks', '', ...BY);
    expect(frontier(repo, 'pl')).toEqual(['a', 'b']);
  });

  it('a note blocking a plan REFUSES binding it and takes every unit of it off the frontier', () => {
    const repo = repository();
    plans(repo);
    expect(frontier(repo, 'pl')).toEqual(['a', 'b']);
    capture(repo, 'hold the plan', '--blocks', 'pl');
    expect(frontier(repo, 'pl')).toEqual([]);
    plan(repo, 'bind', 'other', ...BY);
    expect(refused(plan, repo, 'bind', 'pl', ...BY)).toMatch(
      /an owed ruling names plan pl/,
    );
  });

  it('a diverged note blocks what either version blocks: revise REFUSES naming reconcile, and reconcile settles it', () => {
    const repo = repository();
    plans(repo);
    capture(repo, 'split', '--blocks', 'a');
    merge(
      repo,
      'notebook',
      () => note(repo, 'revise', 'split', '--blocks', 'b', ...BY),
      () => note(repo, 'revise', 'split', '--body', 'still a', ...BY),
    );
    const out = show(repo);
    expect(out).toContain('  diverged: split');
    expect(out).toContain('    scope:\n      split — diverged, 2 versions');
    expect(frontier(repo, 'pl')).toEqual([]);
    expect(
      refused(note, repo, 'revise', 'split', '--body', 'x', ...BY),
    ).toMatch(/has diverged; reconcile it/);
    note(
      repo,
      'reconcile',
      'split',
      '--body',
      'settled',
      '--blocks',
      '',
      ...BY,
    );
    expect(show(repo)).toMatch(/0 diverged/);
    expect(frontier(repo, 'pl')).toEqual(['a', 'b']);
  });
});

describe('note — owed rulings on a concept', () => {
  /** Concept `base`, concept `top` factoring it, and concept `apart`; plan
   *  `pt` realizing `top` with unit `early`, bound, and plan `pa` realizing
   *  `apart` with unit `lone`. */
  function design(repo: string): void {
    const define = (name: string, ...more: string[]) =>
      dispatchDesign(
        ['define', name, '--gloss', `the ${name}`, ...more, ...BY],
        {
          from: repo,
        },
      );
    define('base');
    define('top', '--factors', 'base');
    define('apart');
    plan(
      repo,
      'add',
      'early',
      '--plan',
      'pt',
      '--realizes',
      'top',
      '--plan-realizes',
      'top',
      ...BY,
    );
    plan(
      repo,
      'add',
      'lone',
      '--plan',
      'pa',
      '--realizes',
      'apart',
      '--plan-realizes',
      'apart',
      ...BY,
    );
    plan(repo, 'bind', 'pt', ...BY);
    plan(repo, 'bind', 'pa', ...BY);
  }

  it('REFUSES binding a plan whose closure holds the concept, naming the note and the concept, until the note is retracted or revised to block nothing', () => {
    const repo = repository();
    design(repo);
    capture(repo, 'rethink base', '--blocks', 'base');
    const why = refused(plan, repo, 'bind', 'pt', ...BY);
    expect(why).toMatch(/note rethink base blocks concept base/);
    note(repo, 'retract', 'rethink base', ...BY);
    plan(repo, 'bind', 'pt', ...BY);
    plan(repo, 'bind', 'pa', ...BY);
    capture(repo, 'again', '--blocks', 'concept base');
    expect(refused(plan, repo, 'bind', 'pt', ...BY)).toMatch(
      /note again blocks concept base/,
    );
    note(repo, 'revise', 'again', '--blocks', '', ...BY);
    plan(repo, 'bind', 'pt', ...BY);
  });

  it('REFUSES adding a unit whose concept closure holds it, while a unit authored before stays ready on the frontier', () => {
    const repo = repository();
    design(repo);
    plan(repo, 'bind', 'pt', ...BY);
    capture(repo, 'rethink base', '--blocks', 'base');
    expect(
      refused(
        plan,
        repo,
        'add',
        'late',
        '--plan',
        'pt',
        '--realizes',
        'top',
        ...BY,
      ),
    ).toMatch(
      /note rethink base blocks concept base, in the closure of concept top/,
    );
    expect(frontier(repo, 'pt')).toEqual(['early']);
    expect(plan(repo, 'show', 'pt')).toContain('early — u-new, frontier');
  });

  it('a concept outside the closure refuses neither binding nor adding', () => {
    const repo = repository();
    design(repo);
    capture(repo, 'rethink apart', '--blocks', 'apart');
    plan(repo, 'bind', 'pt', ...BY);
    plan(repo, 'add', 'late', '--plan', 'pt', '--realizes', 'top', ...BY);
    expect(frontier(repo, 'pt')).toEqual(['early', 'late']);
  });

  it('names a concept bare where no plan or unit holds its anchor, else as concept <anchor>, and prints it qualified', () => {
    const repo = repository();
    design(repo);
    dispatchDesign(['define', 'pa', '--gloss', 'a namesake', ...BY], {
      from: repo,
    });
    capture(repo, 'held', '--blocks', 'pa');
    expect(show(repo)).toContain(
      'owed ruling: held — about held · blocks pa ·',
    );
    capture(repo, 'ruled', '--blocks', 'concept pa', '--blocks', 'base');
    expect(show(repo)).toContain(
      'owed ruling: ruled — about ruled · blocks concept base; concept pa',
    );
    expect(plan(repo, 'show', 'pt')).toContain(
      'owed ruling: ruled — about ruled · blocks concept base; concept pa',
    );
    expect(
      refused(note, repo, 'revise', 'ruled', '--blocks', 'nowhere', ...BY),
    ).toMatch(/no plan, unit or concept is named "nowhere"/);
  });
});

describe('note — what a note blocks, named so it addresses one', () => {
  it('prints a unit with its plan, and that printed form is the input that blocks it', () => {
    const repo = repository();
    plans(repo);
    plan(repo, 'add', 'a', '--plan', 'other', '--realizes', 'c', ...BY);
    expect(
      refused(
        note,
        repo,
        'capture',
        'hold',
        '--kind',
        'k',
        '--topic',
        't',
        '--body',
        'b',
        '--blocks',
        'a',
        ...BY,
      ),
    ).toMatch(/name it with its plan, as "a of plan pl" or "a of plan other"/);
    capture(repo, 'hold', '--blocks', 'a of plan other');
    expect(show(repo)).toContain('hold — about hold · blocks a of plan other');
    expect(frontier(repo, 'pl')).toEqual(['a', 'b']);
    note(
      repo,
      'revise',
      'hold',
      '--blocks',
      'a of plan pl',
      '--blocks',
      'other',
      ...BY,
    );
    expect(show(repo)).toContain('blocks a of plan pl; other');
    expect(frontier(repo, 'pl')).toEqual(['b']);
  });
});

describe('note — a blocked unit that is withdrawn', () => {
  it('prints it marked withdrawn, the mark part of its name, so it addresses it alone beside a live namesake; an identity only where two withdrawn units share it', () => {
    const repo = repository();
    plans(repo);
    capture(repo, 'hold', '--blocks', 'a of plan pl');
    expect(plan(repo, 'show', 'a of plan pl')).toContain('unit: a — u-new\n');
    plan(repo, 'retract', 'a', ...BY);
    plan(repo, 'add', 'a', '--plan', 'pl', '--realizes', 'c', ...BY);
    expect(show(repo)).toContain('blocks a of plan pl (withdrawn)');
    const drilled = plan(repo, 'show', 'a of plan pl (withdrawn)');
    expect(drilled).toContain('unit: a (withdrawn) — u-new');
    expect(drilled).not.toContain('unit: a — ');
    expect(drilled).not.toMatch(IDENTITY);
    // A second withdrawn `a` shares the marked name: now, and only now, each
    // carries its identity.
    // The retract's own view drills by the name as it stands after the write.
    const after = spoken(repo, plan(repo, 'retract', 'a', ...BY), ['a']);
    expect(
      after.match(
        /^unit: a \(identity [0-9A-Z]{26}\) \(withdrawn\) — u-new$/gm,
      ),
    ).toHaveLength(1);
    expect(after).not.toContain('nothing live, withdrawn or diverged');
    const retracted = records(repo, 'unit')
      .map((f) => stored(repo, 'unit', f).envelope)
      .filter((e) => e.operation === 'retract')
      .map((e) => e.entity);
    const [first] = retracted;
    const printedForm = `a (identity ${first}) of plan pl (withdrawn)`;
    expect(show(repo, ['a'])).toContain(`blocks ${printedForm}`);
    const one = spoken(repo, plan(repo, 'show', printedForm), ['a']);
    expect(one).toContain(`unit: a (identity ${first}) (withdrawn) — u-new`);
    expect(
      plan(repo, 'show', `a (identity ${first}) (withdrawn)`, '--plan', 'pl'),
    ).toContain(`unit: a (identity ${first}) (withdrawn) — u-new`);
    // The marked name alone now addresses two: it refuses through the one
    // name home, listing each in the form that addresses it.
    const [, second] = retracted;
    const held = refusal(
      repo,
      () => plan(repo, 'show', 'a of plan pl (withdrawn)'),
      ['a'],
    );
    expect(held).toBe(
      `the withdrawn unit name "a" is held by 2 withdrawn units — "a (identity ${first}) of plan pl (withdrawn)"; "a (identity ${second}) of plan pl (withdrawn)"; name one of them with its identity`,
    );
    expect(
      refusal(repo, () => plan(repo, 'show', 'a (withdrawn)', '--plan', 'pl'), [
        'a',
      ]),
    ).toBe(held);
    expect(one.match(/unit: a /g)).toHaveLength(1);
  });
});

describe('note — reconcile', () => {
  it('REFUSES a note that has not diverged in the notebook’s words, never as a concurrent change', () => {
    const repo = repository();
    capture(repo, 'settled');
    const said = refused(
      note,
      repo,
      'reconcile',
      'settled',
      '--body',
      'x',
      ...BY,
    );
    expect(said).toMatch(
      /has not diverged; only competing versions are reconciled/,
    );
    expect(said).not.toMatch(/changed while this write was being made/);
  });
});

describe('note — the notebook by title', () => {
  it('show groups by kind then topic, addresses a note by title, and REFUSES a second live note under a title', () => {
    const repo = repository();
    capture(repo, 'first');
    note(
      repo,
      'capture',
      'second',
      '--kind',
      'hunch',
      '--topic',
      'naming',
      '--body',
      'a hunch',
      ...BY,
    );
    capture(repo, 'third', '--topic', 'later');
    const out = show(repo);
    expect(out).toContain(
      [
        'notes by kind, then topic:',
        '  ask:',
        '    scope:',
        '      first — about first',
        '    later:',
        '      third — about third',
        '  hunch:',
        '    naming:',
        '      second — a hunch',
      ].join('\n'),
    );
    expect(show(repo, [], 'second')).toContain(
      'note: second\n  kind: hunch\n  topic: naming\n  body: a hunch',
    );
    expect(
      refused(
        note,
        repo,
        'capture',
        'first',
        '--kind',
        'k',
        '--topic',
        't',
        '--body',
        'b',
        ...BY,
      ),
    ).toMatch(/title "first" is already held/);
    expect(
      refused(note, repo, 'revise', 'second', '--title', 'first', ...BY),
    ).toMatch(/title "first" is already held/);
  });

  it('one title captured on two branches: listed, each identity beside it, and retracting one by identity resolves it', () => {
    const repo = repository();
    merge(
      repo,
      'notebook',
      () => capture(repo, 'same'),
      () => capture(repo, 'same', '--body', 'the other'),
    );
    const [left, right] = records(repo, 'notebook').map(
      (f) => stored(repo, 'notebook', f).envelope.entity,
    );
    const out = show(repo, ['same']);
    expect(out).toContain(
      `incoherent: same is held by 2 items: same (identity ${left}) live, same (identity ${right}) live`,
    );
    expect(out).toContain(`      same (identity ${left}) — about same`);
    const held = refusal(repo, () => note(repo, 'retract', 'same', ...BY), [
      'same',
    ]);
    expect(held).toMatch(/the note name "same" is held by 2 notes/);
    const [printedForm] = held.match(/same \(identity [0-9A-Z]{26}\)/) ?? [];
    expect(printedForm).toBe(`same (identity ${left})`);
    note(repo, 'retract', printedForm as string, ...BY);
    const settled = show(repo);
    expect(settled).toMatch(/0 incoherent/);
    expect(settled).not.toMatch(IDENTITY);
    expect(
      refusal(
        repo,
        () =>
          note(
            repo,
            'revise',
            `same (identity ${right})`,
            '--body',
            'x',
            ...BY,
          ),
        ['same'],
      ),
    ).toMatch(/alone addresses it; drop the identity/);
  });

  it('what a note blocks, written in two orders, converges byte for byte', () => {
    const repo = repository();
    plans(repo);
    capture(repo, 'both');
    const written = merge(
      repo,
      'notebook',
      () =>
        note(repo, 'revise', 'both', '--blocks', 'a', '--blocks', 'b', ...BY),
      () =>
        note(repo, 'revise', 'both', '--blocks', 'b', '--blocks', 'a', ...BY),
    );
    expect(written.left).toHaveLength(1);
    expect(written.left).toEqual(written.right);
    expect(show(repo)).not.toContain('diverged:');
    note(repo, 'revise', 'both', '--body', 'onward', ...BY);
  });
});

describe('note — the flags each verb takes', () => {
  it('REFUSES, on every verb, each flag it does not take, a single-dash one too, in one refusal naming its nearest and every flag it takes, and writes nothing', () => {
    const repo = repository();
    capture(repo, 'n1');
    const calls: [keyof typeof VERBS, string, ...string[]][] = [
      ['show', 'kind', 'n1'],
      [
        'capture',
        'title',
        'n2',
        '--kind',
        'ask',
        '--topic',
        'scope',
        '--body',
        'b',
        ...BY,
      ],
      ['revise', 'bdy', 'n1', '--body', 'more', ...BY],
      ['retract', 'body', 'n1', ...BY],
      ['reconcile', 'topics', 'n1', ...BY],
    ];
    expect(calls.map(([verb]) => verb)).toEqual(Object.keys(VERBS));
    for (const [verb, flag, ...rest] of calls) {
      expect(refused(note, repo, verb, ...rest, `--${flag}`, '- a list')).toBe(
        verbFlags.refused('note', verb, [`--${flag}`], VERBS[verb]),
      );
      expect(
        refused(
          note,
          repo,
          verb,
          ...rest,
          `-${flag}`,
          '--zzzz',
          'x',
          `--${flag}`,
        ),
      ).toBe(
        verbFlags.refused(
          'note',
          verb,
          [`-${flag}`, '--zzzz', `--${flag}`],
          VERBS[verb],
        ),
      );
    }
  });
});
