// The `plan` capability, driven at its verb surface over temporary git
// repositories this file builds itself: a plan proposed by its first unit, bound,
// revised and closed; the plan and unit laws refusing a write on one branch;
// incoherence a merge leaves, repaired one write at a time; pins, drift and
// suspicion; readiness and the lifecycle's one step. The lifecycle arrives through
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
import { dispatchPlan } from '../src/capabilities/plan/dispatch.js';
import { RUNTIME_CONFIG_ENV } from '../src/runtime-config.js';

const BY = [
  '--author',
  'test',
  '--reason',
  'a fixture',
  '--cause',
  'plan.test',
];
const IDENTITY = /[0-9A-HJKMNP-TV-Z]{26}/g;

const configDir = mkdtempSync(join(tmpdir(), 'plan-config-'));
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
          unit: {
            states: ['u-new', 'u-mid', 'u-done', 'u-past'],
            satisfies: 'u-done',
          },
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
  const dir = mkdtempSync(join(tmpdir(), 'plan-'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'commit', '-q', '--allow-empty', '-m', 'root');
  return dir;
}

function records(repo: string, domain: string): string[] {
  try {
    return readdirSync(join(repo, 'records', domain));
  } catch {
    return [];
  }
}

/** Commit what `main` holds, run `left` and `right` each on its own branch
 *  forked from it, merge `right` into `left`, and return the payloads each
 *  branch newly wrote into `domain`. */
function merge(
  repo: string,
  domain: string,
  left: () => void,
  right: () => void,
): { left: string[]; right: string[] } {
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '--allow-empty', '-m', 'base');
  const on = (name: string, write: () => void): string[] => {
    git(repo, 'checkout', '-q', '-b', name, 'main');
    const before = new Set(records(repo, domain));
    write();
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '--allow-empty', '-m', name);
    return records(repo, domain)
      .filter((f) => !before.has(f))
      .map((f) =>
        JSON.stringify(
          JSON.parse(readFileSync(join(repo, 'records', domain, f), 'utf8'))
            .payload,
        ),
      );
  };
  const written = { left: on('left', left), right: on('right', right) };
  git(repo, 'checkout', '-q', 'left');
  git(repo, 'merge', '-q', '--no-edit', 'right');
  return written;
}

/** The entities of `domain` whose first version's payload `name` picks as
 *  `value`, in record-id order. */
function entitiesNamed(
  repo: string,
  domain: string,
  name: (payload: { name?: string; spec?: { name: string } }) => string,
  value: string,
): string[] {
  return records(repo, domain)
    .sort()
    .map((f) =>
      JSON.parse(readFileSync(join(repo, 'records', domain, f), 'utf8')),
    )
    .filter(
      (r) => r.envelope.operation === 'create' && name(r.payload) === value,
    )
    .map((r) => r.envelope.entity);
}

const plan = (repo: string, ...argv: string[]): string =>
  dispatchPlan(argv, { from: repo });
const design = (repo: string, ...argv: string[]): string =>
  dispatchDesign(argv, { from: repo });

function refused(repo: string, ...argv: string[]): string {
  try {
    plan(repo, ...argv);
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error(`plan ${argv.join(' ')} did not refuse`);
}

/** `plan show`, held to the view's contract: no records root path, and an
 *  identity only beside one of `shared`, the names held more than once. */
function show(repo: string, shared: readonly string[] = [], ...argv: string[]) {
  const out = plan(repo, 'show', ...argv);
  expect(out).not.toContain(join(repo, 'records'));
  for (const match of out.matchAll(IDENTITY)) {
    const before = out.slice(0, match.index);
    expect(
      shared.some((a) => before.endsWith(`${a} (identity `)),
      `identity ${match[0]} printed beside no shared name:\n${out}`,
    ).toBe(true);
  }
  return out;
}

/** Concepts `c1`, `c2`, and `leaf` standing on `base`. */
function concepts(repo: string): void {
  design(repo, 'define', 'c1', '--gloss', 'one', ...BY);
  design(repo, 'define', 'c2', '--gloss', 'two', ...BY);
  design(repo, 'define', 'base', '--gloss', 'beneath', ...BY);
  design(
    repo,
    'define',
    'leaf',
    '--gloss',
    'above',
    '--factors',
    'base',
    ...BY,
  );
}

/** Add `unit` to `into`, realizing `concept`, proposing `into` when it is new. */
function add(
  repo: string,
  unit: string,
  into: string,
  concept = 'c1',
  ...more: string[]
): string {
  const proposing = entitiesNamed(repo, 'plan', (p) => p.name ?? '', into)
    .length
    ? []
    : ['--plan-realizes', concept];
  return plan(
    repo,
    'add',
    unit,
    '--plan',
    into,
    '--realizes',
    concept,
    ...proposing,
    ...more,
    ...BY,
  );
}

describe('plan — proposed by its first unit, bound, revised and closed', () => {
  it('the first add proposes a plan with its concepts; binding another returns it; close keeps it readable', () => {
    const repo = repository();
    concepts(repo);
    const first = plan(
      repo,
      'add',
      'u1',
      '--plan',
      'alpha',
      '--realizes',
      'c1',
      '--plan-realizes',
      'c2',
      '--plan-realizes',
      'c1',
      ...BY,
    );
    expect(first.split('\n')[0]).toMatch(/^plan alpha \(p-draft\) at /);
    expect(show(repo, [], 'alpha')).toContain(
      'plan: alpha (p-draft)\n  realizes:\n    - c1\n    - c2',
    );
    expect(plan(repo, 'bind', 'alpha', ...BY).split('\n')[0]).toMatch(
      /^plan alpha \(p-held\) at /,
    );
    add(repo, 'v1', 'beta', 'c2');
    expect(plan(repo, 'bind', 'beta', ...BY).split('\n')[0]).toMatch(
      /^plan beta \(p-held\) at /,
    );
    expect(show(repo, [], '--plan', 'alpha').split('\n')[0]).toMatch(
      /^plan alpha \(p-draft\) at /,
    );
    plan(repo, 'close', 'alpha', ...BY);
    expect(show(repo, [], 'alpha')).toContain('plan: alpha (p-over)');
  });

  it('REFUSES a second live plan or a second live unit of one plan under a name; one unit name in two plans stands', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'u1', 'alpha');
    add(repo, 'u1', 'beta');
    expect(
      refused(
        repo,
        'add',
        'u2',
        '--plan',
        'alpha',
        '--realizes',
        'c1',
        '--plan-realizes',
        'c1',
        ...BY,
      ),
    ).toMatch(/plan "alpha" exists, and only its first add proposes it/);
    expect(refused(repo, 'revise', 'beta', '--name', 'alpha', ...BY)).toMatch(
      /another live plan is named alpha/,
    );
    expect(
      refused(repo, 'add', 'u1', '--plan', 'alpha', '--realizes', 'c1', ...BY),
    ).toMatch(/would share the name u1 in one plan/);
    expect(show(repo, [], '--plan', 'beta')).toContain('u1 — u-new');
  });

  it('revise renames a plan and changes its concepts, its state unchanged; REFUSES a state, a taken name, and a closed plan', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'u1', 'gamma');
    const revised = plan(
      repo,
      'revise',
      'gamma',
      '--name',
      'delta',
      '--realizes',
      'c2',
      '--realizes',
      'c1',
      ...BY,
    );
    expect(revised).toContain(
      'plan: delta (p-draft)\n  realizes:\n    - c1\n    - c2',
    );
    expect(
      refused(repo, 'revise', 'delta', '--state', 'p-held', ...BY),
    ).toMatch(/revise never sets a state — `plan bind` and `plan close`/);
    add(repo, 'x1', 'closed-one');
    plan(repo, 'close', 'closed-one', ...BY);
    expect(
      refused(repo, 'revise', 'delta', '--name', 'closed-one', ...BY),
    ).toMatch(/another live plan is named closed-one/);
    expect(
      refused(repo, 'revise', 'closed-one', '--name', 'renamed', ...BY),
    ).toMatch(/p-over, which is final/);
    expect(refused(repo, 'bind', 'closed-one', ...BY)).toMatch(
      /p-held is a move backwards/,
    );
    expect(
      refused(
        repo,
        'add',
        'x2',
        '--plan',
        'closed-one',
        '--realizes',
        'c1',
        '--plan-realizes',
        'c1',
        ...BY,
      ),
    ).toMatch(/only its first add proposes it/);
    expect(
      refused(
        repo,
        'add',
        'x2',
        '--plan',
        'closed-one',
        '--realizes',
        'c1',
        ...BY,
      ),
    ).toMatch(/p-over, which is final/);
  });

  it('retract withdraws a unit nothing depends on, and REFUSES one another unit depends on', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'a', 'pl');
    add(repo, 'b', 'pl', 'c1', '--deps', 'a');
    expect(refused(repo, 'retract', 'a', ...BY)).toMatch(
      /b would reference withdrawn a/,
    );
    expect(plan(repo, 'retract', 'b', ...BY)).toContain(
      'unit: b — u-new, withdrawn',
    );
    plan(repo, 'retract', 'a', ...BY);
    expect(show(repo, [], '--plan', 'pl')).toMatch(/0 units/);
  });
});

describe('plan — incoherence, repaired one write at a time', () => {
  it('a dependency cycle a merge left: unrelated and repairing writes pass, a new cycle REFUSES', () => {
    const repo = repository();
    concepts(repo);
    for (const u of ['A', 'B', 'C', 'D', 'E']) add(repo, u, 'r');
    merge(
      repo,
      'unit',
      () => {
        plan(repo, 'revise', 'A', '--deps', 'B', ...BY);
        plan(repo, 'revise', 'B', '--deps', 'C', ...BY);
      },
      () => plan(repo, 'revise', 'C', '--deps', 'A', ...BY),
    );
    expect(show(repo, [], '--plan', 'r')).toContain(
      'incoherent: cycle among A, B, C',
    );
    plan(repo, 'revise', 'D', '--intent', 'unrelated', ...BY);
    plan(repo, 'revise', 'D', '--deps', 'E', ...BY);
    expect(refused(repo, 'revise', 'E', '--deps', 'D', ...BY)).toMatch(
      /D, E would form a dependency cycle/,
    );
    plan(repo, 'revise', 'A', '--deps', '', ...BY);
    expect(show(repo, [], '--plan', 'r')).toMatch(/0 incoherent/);
  });

  it('two branches binding different plans: listed with each plan counted apart, and binding the one to keep resolves it', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'a1', 'one');
    add(repo, 'b1', 'two');
    add(repo, 'b2', 'two');
    merge(
      repo,
      'plan',
      () => plan(repo, 'bind', 'one', ...BY),
      () => plan(repo, 'bind', 'two', ...BY),
    );
    const out = show(repo);
    const header = out.split('\n')[0] as string;
    expect(header).toMatch(/^plans one \(p-held\), two \(p-held\) at /);
    expect(header).toContain(
      'one: 1 unit, 1 frontier, 0 unplaced, 0 drifted, 0 suspect',
    );
    expect(header).toContain(
      'two: 2 units, 2 frontier, 0 unplaced, 0 drifted, 0 suspect',
    );
    expect(out).toContain(
      'incoherent: 2 plans in p-held, which admits one: one, two',
    );
    plan(repo, 'bind', 'one', ...BY);
    const settled = show(repo);
    expect(settled.split('\n')[0]).toMatch(
      /^plan one \(p-held\) at .*0 incoherent/,
    );
  });

  it('a dependency on a unit another branch withdrew is listed by its relation', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'A', 'pl');
    add(repo, 'B', 'pl');
    merge(
      repo,
      'unit',
      () => plan(repo, 'retract', 'B', ...BY),
      () => plan(repo, 'revise', 'A', '--deps', 'B', ...BY),
    );
    expect(show(repo, [], '--plan', 'pl')).toContain(
      'incoherent: A references withdrawn B by its dependency',
    );
    plan(repo, 'revise', 'A', '--deps', '', ...BY);
    expect(show(repo, [], '--plan', 'pl')).toMatch(/0 incoherent/);
  });

  it('two units given one name in one plan: each identity beside the name, and retracting one by identity resolves it', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'first', 'pl');
    merge(
      repo,
      'unit',
      () => add(repo, 'dup', 'pl'),
      () => add(repo, 'dup', 'pl', 'c2'),
    );
    const [left, right] = entitiesNamed(
      repo,
      'unit',
      (p) => p.spec?.name ?? '',
      'dup',
    );
    const out = show(repo, ['dup'], '--plan', 'pl');
    expect(out).toContain(
      `incoherent: dup is held by 2 items: dup (identity ${left}) live, dup (identity ${right}) live`,
    );
    expect(refused(repo, 'retract', 'dup', ...BY)).toMatch(
      /held by 2 items .*identity/,
    );
    plan(repo, 'retract', `dup (identity ${left})`, ...BY);
    const settled = show(repo, [], '--plan', 'pl');
    expect(settled).toMatch(/0 incoherent/);
    expect(settled).not.toMatch(IDENTITY);
    const [first] = entitiesNamed(
      repo,
      'unit',
      (p) => p.spec?.name ?? '',
      'first',
    );
    expect(
      refused(
        repo,
        'advance',
        `first (identity ${first})`,
        '--to',
        'u-mid',
        ...BY,
      ),
    ).toMatch(/alone names it; drop the identity/);
  });
});

describe('plan — pins, drift and suspicion', () => {
  it('add pins, and REFUSES a concept withdrawn or a closure diverged; show marks waves and the frontier, design show each standing plan', () => {
    const repo = repository();
    concepts(repo);
    design(repo, 'define', 'gone', '--gloss', 'to withdraw', ...BY);
    design(repo, 'retract', 'gone', ...BY);
    expect(
      refused(
        repo,
        'add',
        'x',
        '--plan',
        'pl',
        '--realizes',
        'gone',
        '--plan-realizes',
        'c1',
        ...BY,
      ),
    ).toMatch(/pin: take on gone refused — it is withdrawn/);
    add(repo, 'a', 'pl', 'leaf');
    add(repo, 'b', 'pl', 'c1', '--deps', 'a');
    plan(repo, 'bind', 'pl', ...BY);
    const out = show(repo);
    expect(out).toContain(
      [
        '  wave 0:',
        '    a — u-new, frontier · realizes leaf',
        '  wave 1:',
        '    b — u-new · realizes c1 · deps a',
      ].join('\n'),
    );
    expect(design(repo, 'show')).toContain(
      'leaf — above · factors base · realized in pl (p-held): a (u-new, frontier)',
    );
    merge(
      repo,
      'design',
      () => design(repo, 'amend', 'base', '--gloss', 'left', ...BY),
      () => design(repo, 'amend', 'base', '--gloss', 'right', ...BY),
    );
    expect(
      refused(repo, 'add', 'c', '--plan', 'pl', '--realizes', 'leaf', ...BY),
    ).toMatch(/pin: take on leaf refused — base in its closure has diverged/);
  });

  it('amending, retracting or diverging the realized concept drifts the unit; amending one beneath it makes it suspect, never both', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'u', 'pl', 'leaf');
    const marks = () =>
      (show(repo, [], '--plan', 'pl').match(/ {4}u — (.*) · realizes/) ??
        [])[1];
    expect(marks()).toBe('u-new, frontier');
    design(repo, 'amend', 'base', '--gloss', 'beneath, amended', ...BY);
    expect(marks()).toBe('u-new, frontier, suspect');
    plan(repo, 'revise', 'u', ...BY);
    expect(marks()).toBe('u-new, frontier');
    design(repo, 'amend', 'leaf', '--gloss', 'above, amended', ...BY);
    expect(marks()).toBe('u-new, frontier, drifted');
    plan(repo, 'revise', 'u', ...BY);
    merge(
      repo,
      'design',
      () => design(repo, 'amend', 'leaf', '--gloss', 'left', ...BY),
      () => design(repo, 'amend', 'leaf', '--gloss', 'right', ...BY),
    );
    expect(marks()).toBe('u-new, frontier, drifted');
    design(repo, 'reconcile', 'leaf', '--gloss', 'settled', ...BY);
    plan(repo, 'revise', 'u', ...BY);
    design(repo, 'retract', 'leaf', ...BY);
    expect(marks()).toBe('u-new, frontier, drifted');
    expect(show(repo, [], '--plan', 'pl')).toMatch(/0 incoherent/);
  });
});

describe('plan — dependencies and the lifecycle', () => {
  it('REFUSES a dependency on another plan or closing a cycle; past completion satisfies; advance moves one step; reconcile settles a unit', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'a', 'pl');
    add(repo, 'b', 'pl', 'c1', '--deps', 'a');
    add(repo, 'o', 'other');
    expect(
      refused(
        repo,
        'add',
        'x',
        '--plan',
        'other',
        '--realizes',
        'c1',
        '--deps',
        'a',
        ...BY,
      ),
    ).toMatch(
      /dependency "a" is a unit of plan pl, and a dependency names a unit of its own plan/,
    );
    expect(refused(repo, 'revise', 'a', '--deps', 'b', ...BY)).toMatch(
      /would form a dependency cycle/,
    );
    expect(refused(repo, 'advance', 'a', '--to', 'u-done', ...BY)).toMatch(
      /the one step is "u-mid", not "u-done"/,
    );
    plan(repo, 'advance', 'a', '--to', 'u-mid', ...BY);
    expect(refused(repo, 'advance', 'a', '--to', 'u-new', ...BY)).toMatch(
      /the one step is "u-done", not "u-new"/,
    );
    plan(repo, 'advance', 'a', '--to', 'u-done', ...BY);
    plan(repo, 'advance', 'a', '--to', 'u-past', ...BY);
    expect(show(repo, [], '--plan', 'pl')).toContain(
      '    b — u-new, frontier · realizes c1 · deps a',
    );
    merge(
      repo,
      'unit',
      () => plan(repo, 'revise', 'b', '--intent', 'left', ...BY),
      () => plan(repo, 'revise', 'b', '--intent', 'right', ...BY),
    );
    expect(refused(repo, 'revise', 'b', '--intent', 'third', ...BY)).toMatch(
      /has diverged; `plan reconcile` settles it/,
    );
    plan(repo, 'reconcile', 'b', '--intent', 'settled', ...BY);
    const settled = show(repo, [], 'b', '--plan', 'pl');
    expect(settled).toMatch(/0 diverged/);
    expect(settled).toContain('  intent: settled');
  });

  it('a plan’s concepts and a unit’s dependencies written in two orders converge, byte for byte', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'a', 'pl');
    add(repo, 'b', 'pl');
    add(repo, 'c', 'pl');
    const realizes = merge(
      repo,
      'plan',
      () =>
        plan(
          repo,
          'revise',
          'pl',
          '--realizes',
          'c1',
          '--realizes',
          'c2',
          ...BY,
        ),
      () =>
        plan(
          repo,
          'revise',
          'pl',
          '--realizes',
          'c2',
          '--realizes',
          'c1',
          ...BY,
        ),
    );
    expect(realizes.left).toHaveLength(1);
    expect(realizes.left).toEqual(realizes.right);
    git(repo, 'checkout', '-q', 'main');
    git(repo, 'merge', '-q', '--no-edit', 'left');
    git(repo, 'branch', '-q', '-D', 'left', 'right');
    const deps = merge(
      repo,
      'unit',
      () => plan(repo, 'revise', 'c', '--deps', 'a', '--deps', 'b', ...BY),
      () => plan(repo, 'revise', 'c', '--deps', 'b', '--deps', 'a', ...BY),
    );
    expect(deps.left).toHaveLength(1);
    expect(deps.left).toEqual(deps.right);
    const out = show(repo, [], '--plan', 'pl');
    expect(out).toMatch(/0 diverged/);
    expect(out).not.toContain('diverged:');
    plan(repo, 'revise', 'pl', '--name', 'pl2', ...BY);
    plan(repo, 'revise', 'c', '--intent', 'onward', ...BY);
  });

  it('REFUSES every verb when the plan lifecycle is absent or malformed, naming the deploy', () => {
    const repo = repository();
    concepts(repo);
    const refusedUnder = (config: unknown, ...argv: string[]): string => {
      const path = join(configDir, `${Math.random()}.json`);
      if (config !== undefined) writeFileSync(path, JSON.stringify(config));
      process.env[RUNTIME_CONFIG_ENV] = path;
      try {
        return refused(repo, ...argv);
      } finally {
        process.env[RUNTIME_CONFIG_ENV] = CONFIG;
      }
    };
    expect(refusedUnder(undefined, 'show')).toMatch(
      /plan lifecycle is absent .*`cratylus deploy`/,
    );
    expect(
      refusedUnder(
        { configuration: { other: {} } },
        'add',
        'a',
        '--plan',
        'pl',
        '--realizes',
        'c1',
        '--plan-realizes',
        'c1',
        ...BY,
      ),
    ).toMatch(/plan lifecycle is absent/);
    expect(
      refusedUnder(
        {
          configuration: {
            plan: { plan: { states: ['s'], exclusive: 'x', final: 's' } },
          },
        },
        'show',
      ),
    ).toMatch(/plan lifecycle is malformed: .*`cratylus deploy`/);
    expect(records(repo, 'plan')).toEqual([]);
  });
});
