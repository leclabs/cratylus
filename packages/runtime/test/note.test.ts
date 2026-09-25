// The `note` capability, driven at its verb surface over temporary git
// repositories this file builds itself: owed rulings taking units and plans off
// the frontier and releasing them, a diverged note blocking what either version
// blocks, the notebook grouped by kind and topic and addressed by title, and a
// title held twice after a merge. The plan lifecycle arrives through
// `$AGENT_RUNTIME_CONFIG`, in states invented here.

import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { dispatchDesign } from '../src/capabilities/design/dispatch.js';
import { dispatchNote } from '../src/capabilities/note/dispatch.js';
import { dispatchPlan } from '../src/capabilities/plan/dispatch.js';
import { RUNTIME_CONFIG_ENV } from '../src/runtime-config.js';

const BY = [
  '--author',
  'test',
  '--reason',
  'a fixture',
  '--cause',
  'note.test',
];
const IDENTITY = /[0-9A-HJKMNP-TV-Z]{26}/g;

const configDir = mkdtempSync(join(tmpdir(), 'note-config-'));
const CONFIG = join(configDir, 'runtime.json');
let prior: string | undefined;

beforeAll(() => {
  prior = process.env[RUNTIME_CONFIG_ENV];
  writeFileSync(
    CONFIG,
    JSON.stringify({
      configuration: {
        plan: {
          plan: {
            states: ['p-draft', 'p-held', 'p-over'],
            exclusive: 'p-held',
            final: 'p-over',
          },
          unit: { states: ['u-new', 'u-mid', 'u-done'], satisfies: 'u-done' },
        },
      },
    }),
  );
  process.env[RUNTIME_CONFIG_ENV] = CONFIG;
});

afterAll(() => {
  if (prior === undefined) delete process.env[RUNTIME_CONFIG_ENV];
  else process.env[RUNTIME_CONFIG_ENV] = prior;
  rmSync(configDir, { recursive: true, force: true });
});

function git(cwd: string, ...args: string[]): string {
  return execFileSync(
    'git',
    [
      '-c',
      'user.name=test',
      '-c',
      'user.email=test@example.com',
      '-c',
      'commit.gpgsign=false',
      ...args,
    ],
    { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

function repository(): string {
  const dir = mkdtempSync(join(tmpdir(), 'note-'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'commit', '-q', '--allow-empty', '-m', 'root');
  return dir;
}

function records(repo: string): string[] {
  try {
    return readdirSync(join(repo, 'records', 'notebook'));
  } catch {
    return [];
  }
}

/** Commit what `main` holds, run `left` and `right` each on its own branch
 *  forked from it, merge `right` into `left`, and return the note payloads each
 *  branch newly wrote. */
function merge(
  repo: string,
  left: () => void,
  right: () => void,
): { left: string[]; right: string[] } {
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '--allow-empty', '-m', 'base');
  const on = (name: string, write: () => void): string[] => {
    git(repo, 'checkout', '-q', '-b', name, 'main');
    const before = new Set(records(repo));
    write();
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '--allow-empty', '-m', name);
    return records(repo)
      .filter((f) => !before.has(f))
      .map((f) =>
        JSON.stringify(
          JSON.parse(readFileSync(join(repo, 'records', 'notebook', f), 'utf8'))
            .payload,
        ),
      );
  };
  const written = { left: on('left', left), right: on('right', right) };
  git(repo, 'checkout', '-q', 'left');
  git(repo, 'merge', '-q', '--no-edit', 'right');
  return written;
}

const note = (repo: string, ...argv: string[]): string =>
  dispatchNote(argv, { from: repo });
const plan = (repo: string, ...argv: string[]): string =>
  dispatchPlan(argv, { from: repo });

function refused(
  run: (repo: string, ...argv: string[]) => string,
  repo: string,
  ...argv: string[]
): string {
  try {
    run(repo, ...argv);
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error(`${argv.join(' ')} did not refuse`);
}

/** `note show`, held to the view's contract: no records root path, and an
 *  identity only beside one of `shared`, the titles held more than once. */
function show(repo: string, shared: readonly string[] = [], ...argv: string[]) {
  const out = note(repo, 'show', ...argv);
  expect(out).not.toContain(join(repo, 'records'));
  for (const match of out.matchAll(IDENTITY)) {
    const before = out.slice(0, match.index);
    expect(
      shared.some((a) => before.endsWith(`${a} (identity `)),
      `identity ${match[0]} printed beside no shared title:\n${out}`,
    ).toBe(true);
  }
  return out;
}

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
  return [
    ...plan(repo, 'show', '--plan', of).matchAll(/ {4}(\S+) — [^·]*frontier/g),
  ]
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
      () => note(repo, 'revise', 'split', '--blocks', 'b', ...BY),
      () => note(repo, 'revise', 'split', '--body', 'still a', ...BY),
    );
    expect(show(repo)).toContain('  diverged: split');
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
      () => capture(repo, 'same'),
      () => capture(repo, 'same', '--body', 'the other'),
    );
    const [left, right] = records(repo)
      .sort()
      .map(
        (f) =>
          JSON.parse(readFileSync(join(repo, 'records', 'notebook', f), 'utf8'))
            .envelope.entity as string,
      );
    const out = show(repo, ['same']);
    expect(out).toContain(
      `incoherent: same is held by 2 items: same (identity ${left}) live, same (identity ${right}) live`,
    );
    expect(out).toContain(`      same (identity ${left}) — about same`);
    expect(refused(note, repo, 'retract', 'same', ...BY)).toMatch(
      /held by 2 items .*identity/,
    );
    note(repo, 'retract', `same (identity ${left})`, ...BY);
    const settled = show(repo);
    expect(settled).toMatch(/0 incoherent/);
    expect(settled).not.toMatch(IDENTITY);
    expect(
      refused(
        note,
        repo,
        'revise',
        `same (identity ${right})`,
        '--body',
        'x',
        ...BY,
      ),
    ).toMatch(/alone names it; drop the identity/);
  });

  it('what a note blocks, written in two orders, converges byte for byte', () => {
    const repo = repository();
    plans(repo);
    capture(repo, 'both');
    const written = merge(
      repo,
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
