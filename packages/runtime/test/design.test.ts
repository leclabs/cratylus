// The `design` capability, driven at its verb surface over temporary git
// repositories this file builds itself: the lattice shown root to primitive, the
// design's laws refusing a write on one branch, a concept's trace, divergence and
// convergence across a real merge, incoherence and its repair by ordinary writes,
// and identities shown and accepted only beside an anchor held more than once.
// The plan lifecycle arrives through `$AGENT_RUNTIME_CONFIG`, in states invented
// here.

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
  'design.test',
];
const IDENTITY = /[0-9A-HJKMNP-TV-Z]{26}/g;

const configDir = mkdtempSync(join(tmpdir(), 'design-config-'));
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
  const dir = mkdtempSync(join(tmpdir(), 'design-'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'commit', '-q', '--allow-empty', '-m', 'root');
  return dir;
}

/** Commit what `main` holds, run `left` and `right` each on its own branch
 *  forked from it, merge `right` into `left`, and return each branch's newly
 *  written design payloads. */
function merge(
  repo: string,
  left: () => void,
  right: () => void,
): { left: string[]; right: string[] } {
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '--allow-empty', '-m', 'base');
  const on = (name: string, write: () => void): string[] => {
    git(repo, 'checkout', '-q', '-b', name, 'main');
    const before = new Set(files(repo));
    write();
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '--allow-empty', '-m', name);
    return files(repo)
      .filter((f) => !before.has(f))
      .map((f) =>
        JSON.stringify(
          JSON.parse(readFileSync(join(repo, 'records', 'design', f), 'utf8'))
            .payload,
        ),
      );
  };
  const written = { left: on('left', left), right: on('right', right) };
  git(repo, 'checkout', '-q', 'left');
  git(repo, 'merge', '-q', '--no-edit', 'right');
  return written;
}

function files(repo: string): string[] {
  try {
    return readdirSync(join(repo, 'records', 'design'));
  } catch {
    return [];
  }
}

/** Every design record's entity, by the anchor its first version carried. */
function entities(repo: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const f of files(repo).sort()) {
    const r = JSON.parse(
      readFileSync(join(repo, 'records', 'design', f), 'utf8'),
    );
    if (r.envelope.operation !== 'create') continue;
    out.set(r.payload.anchor, [
      ...(out.get(r.payload.anchor) ?? []),
      r.envelope.entity,
    ]);
  }
  return out;
}

const design = (repo: string, ...argv: string[]): string =>
  dispatchDesign(argv, { from: repo });

function refused(repo: string, ...argv: string[]): string {
  try {
    design(repo, ...argv);
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error(`design ${argv.join(' ')} did not refuse`);
}

/** `design show`, held to the view's contract: no records root path, and an
 *  identity only beside one of `shared`, the anchors held more than once. */
function show(repo: string, shared: readonly string[] = [], ...argv: string[]) {
  const out = design(repo, 'show', ...argv);
  expect(out).not.toContain(join(repo, 'records'));
  for (const match of out.matchAll(IDENTITY)) {
    const before = out.slice(0, match.index);
    expect(
      shared.some((a) => before.endsWith(`${a} (identity `)),
      `identity ${match[0]} printed beside no shared anchor:\n${out}`,
    ).toBe(true);
  }
  return out;
}

function lattice(repo: string): void {
  design(repo, 'define', 'prim', '--gloss', 'a primitive', ...BY);
  design(
    repo,
    'define',
    'mid',
    '--gloss',
    'the middle',
    '--factors',
    'prim',
    ...BY,
  );
  design(
    repo,
    'define',
    'top',
    '--gloss',
    'the root',
    '--factors',
    'mid',
    '--factors',
    'prim',
    ...BY,
  );
}

describe('design — the lattice at the verb surface', () => {
  it('define, show root to primitive, amend, show one concept in full', () => {
    const repo = repository();
    const head = git(repo, 'rev-parse', '--short', 'HEAD').trim();
    expect(show(repo).split('\n')[0]).toBe(
      `design at ${head}: 0 concepts · 0 unplaced · 0 diverged · 0 incoherent`,
    );
    lattice(repo);
    const whole = show(repo).split('\n');
    const at = (anchor: string) =>
      whole.findIndex((l) => l.startsWith(`  ${anchor} — `));
    expect(at('top')).toBeLessThan(at('mid'));
    expect(at('mid')).toBeLessThan(at('prim'));
    design(repo, 'amend', 'mid', '--gloss', 'the middle, amended', ...BY);
    expect(show(repo, [], 'mid')).toContain(
      [
        'concept: mid',
        '  gloss: the middle, amended',
        '  factors:',
        '    - prim',
      ].join('\n'),
    );
  });

  it('REFUSES each write that would break a design law on one branch', () => {
    const repo = repository();
    lattice(repo);
    design(repo, 'define', 'gone', '--gloss', 'to withdraw', ...BY);
    design(repo, 'retract', 'gone', ...BY);
    expect(refused(repo, 'define', 'mid', '--gloss', 'again', ...BY)).toMatch(
      /anchor "mid" is held/,
    );
    expect(refused(repo, 'define', 'gone', '--gloss', 'again', ...BY)).toMatch(
      /anchor "gone" is held .*withdrawn/,
    );
    expect(refused(repo, 'define', 'x', '--gloss', '', ...BY)).toMatch(
      /a concept has a gloss/,
    );
    expect(
      refused(
        repo,
        'define',
        'x',
        '--gloss',
        'g',
        '--author',
        't',
        '--reason',
        '',
        '--cause',
        'c',
      ),
    ).toMatch(/every write gives its reason/);
    expect(
      refused(repo, 'define', 'x', '--gloss', 'g', '--factors', 'gone', ...BY),
    ).toMatch(/factor "gone" is withdrawn/);
    expect(
      refused(
        repo,
        'define',
        'x',
        '--gloss',
        'g',
        '--factors',
        'prim',
        '--factors',
        'prim',
        ...BY,
      ),
    ).toMatch(/twice; factors form a set/);
    expect(refused(repo, 'amend', 'prim', '--factors', 'top', ...BY)).toMatch(
      /factor cycle/,
    );
    expect(refused(repo, 'retract', 'prim', ...BY)).toMatch(
      /"mid" factors on it/,
    );
  });

  it('trace prints versions with reasons, what the concept stands on and what stands on it, and no plan', () => {
    const repo = repository();
    lattice(repo);
    design(
      repo,
      'amend',
      'mid',
      '--gloss',
      'the middle, twice',
      '--author',
      'test',
      '--reason',
      'sharper',
      '--cause',
      'design.test',
    );
    dispatchPlan(
      [
        'add',
        'u1',
        '--plan',
        'standing-plan',
        '--realizes',
        'mid',
        '--plan-realizes',
        'mid',
        ...BY,
      ],
      { from: repo },
    );
    const trace = design(repo, 'trace', 'mid');
    expect(trace).toMatch(
      /- define by test at \S+ — a fixture — mid — the middle/,
    );
    expect(trace).toMatch(
      /- amend by test at \S+ — sharper — mid — the middle, twice/,
    );
    expect(trace).toContain('  closure, what it stands on:\n    - prim');
    expect(trace).toContain('  blast, what stands on it:\n    - top');
    expect(trace).not.toContain('standing-plan');
    expect(trace).not.toContain('u1');
    expect(show(repo, [], 'mid')).toContain('standing-plan (p-draft): u1');
  });
});

describe('design — divergence and convergence across a merge', () => {
  it('two amendments diverge: listed before the body, amend refuses naming reconcile, reconcile settles', () => {
    const repo = repository();
    lattice(repo);
    merge(
      repo,
      () => design(repo, 'amend', 'mid', '--gloss', 'left', ...BY),
      () => design(repo, 'amend', 'mid', '--gloss', 'right', ...BY),
    );
    const out = show(repo).split('\n');
    const diverged = out.indexOf('  diverged: mid');
    expect(diverged).toBeGreaterThan(0);
    expect(out[0]).toMatch(/1 diverged/);
    expect(diverged).toBeLessThan(out.indexOf('lattice, root to primitive:'));
    expect(refused(repo, 'amend', 'mid', '--gloss', 'third', ...BY)).toMatch(
      /reconcile/,
    );
    expect(refused(repo, 'reconcile', 'mid', ...BY)).toMatch(
      /disagree on gloss; give --gloss/,
    );
    design(repo, 'reconcile', 'mid', '--gloss', 'settled', ...BY);
    expect(show(repo)).toMatch(/0 diverged/);
    expect(show(repo, [], 'mid')).toContain('  gloss: settled');
  });

  it('the same amendment on two branches converges: no divergence listed', () => {
    const repo = repository();
    lattice(repo);
    const same = () => design(repo, 'amend', 'mid', '--gloss', 'same', ...BY);
    merge(repo, same, same);
    const out = show(repo);
    expect(out).toMatch(/0 diverged/);
    expect(out).not.toContain('diverged:');
    design(repo, 'amend', 'mid', '--gloss', 'onward', ...BY);
  });

  it('the same factors written in two orders converge, byte for byte', () => {
    const repo = repository();
    lattice(repo);
    design(repo, 'define', 'side', '--gloss', 'beside', ...BY);
    const written = merge(
      repo,
      () =>
        design(
          repo,
          'amend',
          'top',
          '--factors',
          'mid',
          '--factors',
          'side',
          ...BY,
        ),
      () =>
        design(
          repo,
          'amend',
          'top',
          '--factors',
          'side',
          '--factors',
          'mid',
          ...BY,
        ),
    );
    expect(written.left).toHaveLength(1);
    expect(written.left).toEqual(written.right);
    expect(show(repo)).not.toContain('diverged:');
    design(repo, 'amend', 'top', '--gloss', 'the root, onward', ...BY);
  });

  it('a version against a retraction drills to a line naming the retraction and what it withdrew', () => {
    const repo = repository();
    design(repo, 'define', 'leaf', '--gloss', 'first', ...BY);
    merge(
      repo,
      () => design(repo, 'amend', 'leaf', '--gloss', 'second', ...BY),
      () => design(repo, 'retract', 'leaf', ...BY),
    );
    const out = show(repo, [], 'leaf');
    expect(out).toContain('  version:\n    concept: leaf\n      gloss: second');
    expect(out).toContain(
      '  retraction, which withdrew:\n    concept: leaf\n      gloss: first',
    );
  });

  it('a diverged concept holding two anchors lists a plan realizing it once', () => {
    const repo = repository();
    design(repo, 'define', 'alpha', '--gloss', 'first', ...BY);
    const plan = (unit: string, ...more: string[]) =>
      dispatchPlan(
        ['add', unit, '--plan', 'pl', '--realizes', 'alpha', ...more, ...BY],
        { from: repo },
      );
    plan('u1', '--plan-realizes', 'alpha');
    plan('u2');
    merge(
      repo,
      () => design(repo, 'amend', 'alpha', '--anchor', 'alpha2', ...BY),
      () => design(repo, 'amend', 'alpha', '--gloss', 'other', ...BY),
    );
    const out = show(repo, [], 'alpha');
    expect(out).toMatch(/ {2}diverged: (alpha or alpha2|alpha2 or alpha)\n/);
    const realized = out.split('realized in:\n')[1] ?? '';
    expect(realized.match(/pl \(p-draft\)/g)).toHaveLength(1);
    expect(realized).toContain('u1');
    expect(realized).toContain('u2');
  });
});

describe('design — incoherence, repaired one write at a time', () => {
  it('two definitions of one anchor: listed, each identity beside the anchor, retracting one by identity resolves it', () => {
    const repo = repository();
    merge(
      repo,
      () => design(repo, 'define', 'twin', '--gloss', 'left', ...BY),
      () => design(repo, 'define', 'twin', '--gloss', 'right', ...BY),
    );
    const [left, right] = entities(repo).get('twin') as string[];
    const out = show(repo, ['twin']);
    expect(out).toContain(
      `incoherent: twin is held by 2 items: twin (identity ${left}) live, twin (identity ${right}) live`,
    );
    expect(out).toContain(`twin (identity ${left}) — left`);
    expect(out).toContain(`twin (identity ${right}) — right`);
    expect(refused(repo, 'retract', 'twin', ...BY)).toMatch(
      /held by 2 concepts .*identity/,
    );
    design(repo, 'retract', `twin (identity ${left})`, ...BY);
    expect(show(repo, ['twin'])).toMatch(/1 incoherent/);
    // The withdrawn concept keeps its anchor, so the name is still held twice
    // until the live one is renamed — the next ordinary write.
    design(
      repo,
      'amend',
      `twin (identity ${right})`,
      '--anchor',
      'twin2',
      ...BY,
    );
    const settled = show(repo);
    expect(settled).toMatch(/0 incoherent/);
    expect(settled).not.toMatch(IDENTITY);
  });

  it('a withdrawn concept keeping its anchor against a live namesake from another branch shows both identities', () => {
    const repo = repository();
    merge(
      repo,
      () => {
        design(repo, 'define', 'kept', '--gloss', 'withdrawn here', ...BY);
        design(repo, 'retract', 'kept', ...BY);
      },
      () => design(repo, 'define', 'kept', '--gloss', 'live there', ...BY),
    );
    const [withdrawn, live] = entities(repo).get('kept') as string[];
    const out = show(repo, ['kept']);
    expect(out).toContain(
      `incoherent: kept is held by 2 items: kept (identity ${withdrawn}) withdrawn, kept (identity ${live}) live`,
    );
    expect(show(repo, ['kept'], `kept (identity ${withdrawn})`)).toContain(
      `concept: kept (identity ${withdrawn}) — withdrawn`,
    );
  });

  it('a factor on a concept another branch withdrew is listed by its relation, and an ordinary write resolves it', () => {
    const repo = repository();
    design(repo, 'define', 'base', '--gloss', 'stands', ...BY);
    design(repo, 'define', 'user', '--gloss', 'uses nothing yet', ...BY);
    merge(
      repo,
      () => design(repo, 'retract', 'base', ...BY),
      () => design(repo, 'amend', 'user', '--factors', 'base', ...BY),
    );
    expect(show(repo)).toContain(
      'incoherent: user references withdrawn base by its factor',
    );
    design(repo, 'amend', 'user', '--factors', '', ...BY);
    expect(show(repo)).toMatch(/0 incoherent/);
  });

  it('REFUSES an identity given beside an anchor held once', () => {
    const repo = repository();
    design(repo, 'define', 'solo', '--gloss', 'alone', ...BY);
    const [solo] = entities(repo).get('solo') as string[];
    expect(
      refused(repo, 'amend', `solo (identity ${solo})`, '--gloss', 'x', ...BY),
    ).toMatch(/alone names it; drop the identity/);
    expect(show(repo)).not.toMatch(IDENTITY);
  });
});

describe('design — the lifecycle it joins plans by', () => {
  it('REFUSES to show a lattice a unit stands on when the plan lifecycle is absent, naming the deploy', () => {
    const repo = repository();
    design(repo, 'define', 'alpha', '--gloss', 'first', ...BY);
    expect(show(repo)).toMatch(/1 concept/);
    dispatchPlan(
      [
        'add',
        'u1',
        '--plan',
        'pl',
        '--realizes',
        'alpha',
        '--plan-realizes',
        'alpha',
        ...BY,
      ],
      { from: repo },
    );
    process.env[RUNTIME_CONFIG_ENV] = join(configDir, 'absent.json');
    try {
      expect(refused(repo, 'show')).toMatch(
        /plan lifecycle is absent .*cratylus deploy/,
      );
      expect(design(repo, 'trace', 'alpha')).toContain('trace: alpha');
    } finally {
      process.env[RUNTIME_CONFIG_ENV] = CONFIG;
    }
  });
});
