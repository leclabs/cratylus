// The `note` capability, driven at its verb surface over temporary git
// repositories this file builds itself: owed rulings taking units and plans off
// the frontier and releasing them, a diverged note blocking what either version
// blocks and keeping its place in the notebook, the notebook grouped by kind
// and topic and addressed by title, and a title held twice after a merge. The plan lifecycle arrives through
// `$AGENT_RUNTIME_CONFIG`, in states invented here.

import { describe, expect, it } from 'vitest';
import { dispatchDesign } from '../src/capabilities/design/dispatch.js';
import { dispatchNote } from '../src/capabilities/note/dispatch.js';
import { dispatchPlan } from '../src/capabilities/plan/dispatch.js';
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

/** A plan `pl` of units `a` and `b`, and a plan `other` of unit `o`. */
function plans(repo: string): void {
  dispatchDesign(['define', 'c', '--gloss', 'a concept', ...BY], {
    from: repo,
  });
  const add = (unit: string, into: string, ...more: string[]) =>
    plan(repo, 'add', unit, '--plan', into, '--realizes', 'c', ...more, ...BY);
  add('a', 'pl', '--plan-realizes', 'c');
  add('b', 'pl');
  add('o', 'other', '--plan-realizes', 'c');
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
    capture(repo, 'hold the plan', '--blocks', 'pl');
    expect(frontier(repo, 'pl')).toEqual([]);
    expect(frontier(repo, 'other')).toEqual(['o']);
    expect(refused(plan, repo, 'bind', 'pl', ...BY)).toMatch(
      /an owed ruling names plan pl/,
    );
    plan(repo, 'bind', 'other', ...BY);
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
    expect(frontier(repo, 'other')).toEqual(['o']);
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
    plan(repo, 'retract', 'a', ...BY);
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
    expect(one.match(/unit: a /g)).toHaveLength(1);
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
