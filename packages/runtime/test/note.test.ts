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
  commit,
  configured,
  git,
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

/** Release plan `name`'s line into the branch `repo` is on, as closing the plan
 *  and merging its line does: its records joined to this checkout's, its
 *  worktree and branch gone, so the plan's writes land where they run and a
 *  branch merge can make them diverge. */
function released(repo: string, name: string): void {
  const line = `${repo}.plan-${name}`;
  commit(repo, 'before release');
  commit(line, 'the line');
  git(repo, 'merge', '-q', '--no-edit', `plan/${name}`);
  git(repo, 'worktree', 'remove', line);
  git(repo, 'branch', '-q', '-d', `plan/${name}`);
}

/** Diverge what plan `name`'s line holds, as a merge of two branches of it
 *  does: `left` and `right` each write from the state the line held, and the
 *  line's history is merged. Returns the payloads each side newly wrote into
 *  `domain`, as written. */
function diverged(
  repo: string,
  name: string,
  domain: string,
  left: () => void,
  right: () => void,
): { left: string[]; right: string[] } {
  const line = `${repo}.plan-${name}`;
  commit(line, 'base');
  const base = git(line, 'rev-parse', 'HEAD').trim();
  const side = (write: () => void): { commit: string; wrote: string[] } => {
    const before = new Set(records(line, domain));
    write();
    commit(line, 'side');
    return {
      commit: git(line, 'rev-parse', 'HEAD').trim(),
      wrote: records(line, domain)
        .filter((f) => !before.has(f))
        .map((f) => JSON.stringify(stored(line, domain, f).payload)),
    };
  };
  const first = side(left);
  git(line, 'reset', '-q', '--hard', base);
  const second = side(right);
  git(line, 'merge', '-q', '--no-edit', first.commit);
  return { left: first.wrote, right: second.wrote };
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
    diverged(
      repo,
      'pl',
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
    const line = `${repo}.plan-pl`;
    const retracted = records(line, 'unit')
      .map((f) => stored(line, 'unit', f).envelope)
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
    const written = diverged(
      repo,
      'pl',
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

describe('note — a note about a bound plan is written on its line', () => {
  const status = (repo: string): string =>
    git(repo, 'status', '--porcelain', '--untracked-files=all', 'records/');

  /** A plan `pl` of units `a` and `b`, bound from a checkout holding its
   *  concept committed; returns the checkout and the line's worktree. */
  function lined() {
    const repo = repository();
    dispatchDesign(['define', 'c', '--gloss', 'a concept', ...BY], {
      from: repo,
    });
    commit(repo, 'design');
    plan(
      repo,
      'add',
      'a',
      '--plan',
      'pl',
      '--realizes',
      'c',
      '--plan-realizes',
      'c',
      ...BY,
    );
    plan(repo, 'add', 'b', '--plan', 'pl', '--realizes', 'c', ...BY);
    plan(repo, 'bind', 'pl', ...BY);
    return { repo, line: `${repo}.plan-pl` };
  }

  it('a capture, a revise and a retract naming the plan or one of its units land on the line from the main checkout, and each says where', () => {
    const { repo, line } = lined();
    const before = status(repo);
    const wrote = `wrote to plan/pl, worktree ${line}`;
    expect(capture(repo, 'hold', '--blocks', 'pl')).toContain(wrote);
    expect(note(repo, 'revise', 'hold', '--blocks', 'a', ...BY)).toContain(
      wrote,
    );
    expect(note(repo, 'retract', 'hold', ...BY)).toContain(wrote);
    expect(capture(repo, 'release', '--blocks', 'b')).toContain(wrote);
    expect(note(repo, 'revise', 'release', '--blocks', '', ...BY)).toContain(
      wrote,
    );
    expect(status(repo)).toBe(before);
    expect(records(line, 'notebook')).toHaveLength(5);
    expect(records(repo, 'notebook')).toHaveLength(0);
  });

  it('a note naming no bound plan lands where it runs', () => {
    const { repo } = lined();
    const said = capture(repo, 'free');
    expect(said).not.toContain('wrote to');
    expect(records(repo, 'notebook')).toHaveLength(1);
  });

  it('the notebook prints the same from the main checkout, the line and a branch cut from it', () => {
    const { repo, line } = lined();
    capture(repo, 'hold', '--blocks', 'pl');
    commit(line, 'the line');
    const work = `${repo}.work`;
    git(repo, 'worktree', 'add', '-q', '-b', 'work', work, 'plan/pl');
    const main = note(repo, 'show');
    expect(note(line, 'show')).toBe(main);
    expect(note(work, 'show')).toBe(main);
  });

  it('REFUSES a note naming the plan when no worktree holds its line, and one naming plans on two lines, writing nothing', () => {
    const { repo, line } = lined();
    plan(
      repo,
      'add',
      'o',
      '--plan',
      'other',
      '--realizes',
      'c',
      '--plan-realizes',
      'c',
      ...BY,
    );
    // Each plan is bound on a line of its own: what a merge of two lines that
    // each bound a plan leaves.
    commit(line, 'pl bound');
    plan(repo, 'bind', 'other', ...BY);
    git(line, 'clean', '-fdq');
    const two = refused(
      note,
      repo,
      'capture',
      'both',
      '--kind',
      'k',
      '--topic',
      't',
      '--body',
      'b',
      '--blocks',
      'pl',
      '--blocks',
      'other',
      ...BY,
    );
    expect(two).toContain('plan/other');
    expect(two).toContain('plan/pl');
    commit(line, 'the line');
    git(repo, 'worktree', 'remove', line);
    const said = refused(
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
      'pl',
      ...BY,
    );
    expect(said).toContain('the line of plan pl has no worktree');
    expect(said).not.toContain('git');
    expect(capture(repo, 'free')).not.toContain('wrote to');
  });

  it('REFUSES a note naming a bound plan whose line does not exist, saying the line is missing and teaching no git command, and writes nothing', () => {
    const { repo } = lined();
    released(repo, 'pl');
    const said = refused(
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
    );
    expect(said).toContain('its line does not exist');
    expect(said).not.toContain('git');
    expect(records(repo, 'notebook')).toEqual([]);
  });
});
