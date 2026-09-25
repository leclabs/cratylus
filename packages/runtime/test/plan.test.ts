// The `plan` capability, driven at its verb surface over temporary git
// repositories this file builds itself: a plan proposed by its first unit,
// bound, revised, shown by name and closed for good; the plan and unit laws —
// and those spanning them — refusing a write on one branch, and writing
// nothing when they do; incoherence a merge leaves, repaired one write at a
// time; pins kept until a revise re-pins, drift and suspicion; readiness, the
// frontier and the lifecycle's one step. The lifecycle arrives through
// `$AGENT_RUNTIME_CONFIG`, in states invented here.

import { describe, expect, it } from 'vitest';
import { dispatchDesign } from '../src/capabilities/design/dispatch.js';
import { dispatchPlan } from '../src/capabilities/plan/dispatch.js';
import {
  BY,
  IDENTITY,
  configured,
  entitiesNamed,
  everyRecord,
  merge,
  records,
  refusal,
  repository,
  spoken,
  under,
} from './verb-surface.js';

configured();

const plan = (repo: string, ...argv: string[]): string =>
  dispatchPlan(argv, { from: repo });
const design = (repo: string, ...argv: string[]): string =>
  dispatchDesign(argv, { from: repo });

const refused = (repo: string, ...argv: string[]): string =>
  refusal(repo, () => plan(repo, ...argv));

/** `plan show`, held to what a reader may be shown; `shared` are the names
 *  held more than once. */
const show = (
  repo: string,
  shared: readonly string[] = [],
  ...argv: string[]
) => spoken(repo, plan(repo, 'show', ...argv), shared);

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

/** Every concept `concepts` defines, as `--plan-realizes` flags. */
const EVERY = ['c1', 'c2', 'base', 'leaf'].flatMap((c) => [
  '--plan-realizes',
  c,
]);

/** Add `unit` to `into`, realizing `concept`; a new plan is proposed
 *  realizing every concept. */
function add(
  repo: string,
  unit: string,
  into: string,
  concept = 'c1',
  ...more: string[]
): string {
  const proposing = entitiesNamed(repo, 'plan', (p) => p.name, into).length
    ? []
    : EVERY;
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

/** The marks on unit `unit`'s line in plan `of`'s whole view. */
const marks = (repo: string, of: string, unit: string) =>
  (show(repo, [], of).match(new RegExp(` {4}${unit} — (.*?) · realizes`)) ??
    [])[1];

describe('plan — proposed by its first unit, bound, shown, revised and closed', () => {
  it('the first add proposes a plan with its concepts; binding another returns it; any plan is shown by name, whole', () => {
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
      'plan alpha (p-draft) · realizes c1, c2 — units in wave order:\n  wave 0:\n    u1 — u-new, frontier · realizes c1',
    );
    expect(plan(repo, 'bind', 'alpha', ...BY).split('\n')[0]).toMatch(
      /^plan alpha \(p-held\) at /,
    );
    add(repo, 'v1', 'beta', 'c2');
    expect(plan(repo, 'bind', 'beta', ...BY).split('\n')[0]).toMatch(
      /^plan beta \(p-held\) at /,
    );
    expect(show(repo).split('\n')[0]).toMatch(/^plan beta \(p-held\) at /);
    expect(show(repo, [], 'alpha').split('\n')[0]).toMatch(
      /^plan alpha \(p-draft\) at /,
    );
    expect(show(repo, [], 'u1')).toContain('unit: u1 — u-new, frontier');
  });

  it('close is final: the plan stays readable, its units show no frontier and are never written again', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'a', 'done');
    add(repo, 'b', 'done', 'c1', '--deps', 'a');
    plan(repo, 'advance', 'a', '--to', 'u-mid', ...BY);
    const closed = plan(repo, 'close', 'done', ...BY);
    expect(closed).toContain('plan done (p-over) · realizes');
    expect(closed).toMatch(/0 frontier/);
    expect(marks(repo, 'done', 'a')).toBe('u-mid');
    for (const write of [
      ['advance', 'a', '--to', 'u-done'],
      ['revise', 'a', '--intent', 'more'],
      ['retract', 'b'],
      ['add', 'c', '--plan', 'done', '--realizes', 'c1'],
    ])
      expect(refused(repo, ...write, ...BY)).toMatch(
        /plan "done" is p-over, which is final, and its units are never written again/,
      );
    expect(refused(repo, 'revise', 'done', '--name', 'renamed', ...BY)).toMatch(
      /p-over, which is final/,
    );
    expect(refused(repo, 'bind', 'done', ...BY)).toMatch(
      /p-held is a move backwards/,
    );
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
    expect(show(repo, [], 'beta')).toContain('u1 — u-new');
  });

  it('revise renames a plan and changes its concepts, its state unchanged; REFUSES a state and a taken name, a closed one included', () => {
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
    expect(revised).toContain('plan delta (p-draft) · realizes c1, c2 — units');
    expect(
      refused(repo, 'revise', 'delta', '--state', 'p-held', ...BY),
    ).toMatch(/revise never sets a state — `plan bind` and `plan close`/);
    add(repo, 'x1', 'closed-one');
    plan(repo, 'close', 'closed-one', ...BY);
    expect(
      refused(repo, 'revise', 'delta', '--name', 'closed-one', ...BY),
    ).toMatch(/another live plan is named closed-one/);
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
      'unit: b (withdrawn) — u-new',
    );
    plan(repo, 'retract', 'a', ...BY);
    expect(show(repo, [], 'pl')).toMatch(/0 units/);
  });
});

describe('plan — the laws spanning plan and unit', () => {
  it('a unit realizes one of its plan’s concepts: add, a unit revise and a plan revise that break it REFUSE', () => {
    const repo = repository();
    concepts(repo);
    plan(
      repo,
      'add',
      'a',
      '--plan',
      'narrow',
      '--realizes',
      'c1',
      '--plan-realizes',
      'c1',
      ...BY,
    );
    expect(
      refused(repo, 'add', 'b', '--plan', 'narrow', '--realizes', 'c2', ...BY),
    ).toMatch(
      /the new unit would realize "c2", which its plan "narrow" does not realize/,
    );
    expect(
      refused(
        repo,
        'add',
        'x',
        '--plan',
        'fresh',
        '--realizes',
        'c2',
        '--plan-realizes',
        'c1',
        ...BY,
      ),
    ).toMatch(/which its plan "fresh" would not realize/);
    expect(records(repo, 'plan')).toHaveLength(1);
    expect(
      refused(repo, 'revise', 'a', '--realizes', 'c2', '--repin', ...BY),
    ).toMatch(/"a" would realize "c2", which its plan "narrow" does not/);
    expect(
      refused(repo, 'revise', 'narrow', '--realizes', 'c2', ...BY),
    ).toMatch(/"a" would realize "c1", which its plan "narrow" would not/);
  });

  it('a merge that breaks it lists it; unrelated and repairing writes pass', () => {
    const repo = repository();
    concepts(repo);
    plan(
      repo,
      'add',
      'a',
      '--plan',
      'pl',
      '--realizes',
      'c1',
      '--plan-realizes',
      'c1',
      '--plan-realizes',
      'c2',
      ...BY,
    );
    merge(
      repo,
      'unit',
      () => plan(repo, 'revise', 'pl', '--realizes', 'c1', ...BY),
      () => plan(repo, 'add', 'b', '--plan', 'pl', '--realizes', 'c2', ...BY),
    );
    expect(show(repo, [], 'pl')).toContain(
      'incoherent: b realizes c2, which its plan pl does not',
    );
    plan(repo, 'revise', 'a', '--intent', 'unrelated', ...BY);
    plan(repo, 'retract', 'b', ...BY);
    expect(show(repo, [], 'pl')).toMatch(/0 incoherent/);
  });

  it('REFUSES adding a unit to a diverged plan, pointing to reconcile, and writes nothing', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'a', 'pl');
    merge(
      repo,
      'plan',
      () => plan(repo, 'revise', 'pl', '--name', 'pl-left', ...BY),
      () => plan(repo, 'revise', 'pl', '--name', 'pl-right', ...BY),
    );
    const whole = show(repo, [], 'pl-left');
    expect(whole).toContain('plan pl-left (diverged) — units in wave order:');
    expect(whole).not.toMatch(/pl-left \(p-draft\)(?! ·)/);
    expect(
      refused(repo, 'add', 'b', '--plan', 'pl-left', '--realizes', 'c1', ...BY),
    ).toMatch(
      /plan "pl-left" has diverged; `plan reconcile pl-left` settles it/,
    );
    plan(repo, 'reconcile', 'pl-left', '--name', 'pl', ...BY);
    add(repo, 'b', 'pl');
  });

  it('a write refused in its second part leaves its first part unwritten', () => {
    const repo = repository();
    concepts(repo);
    const before = everyRecord(repo);
    refused(
      repo,
      'add',
      'x',
      '--plan',
      'proposed',
      '--realizes',
      'c2',
      '--plan-realizes',
      'c1',
      ...BY,
    );
    expect(everyRecord(repo)).toEqual(before);
    expect(show(repo, [], 'proposed')).toContain(
      'nothing live, withdrawn or diverged is named proposed',
    );
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
    expect(show(repo, [], 'r')).toContain('incoherent: cycle among A, B, C');
    plan(repo, 'revise', 'D', '--intent', 'unrelated', ...BY);
    plan(repo, 'revise', 'D', '--deps', 'E', ...BY);
    expect(refused(repo, 'revise', 'E', '--deps', 'D', ...BY)).toMatch(
      /D, E would form a dependency cycle/,
    );
    plan(repo, 'revise', 'A', '--deps', '', ...BY);
    expect(show(repo, [], 'r')).toMatch(/0 incoherent/);
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
    expect(show(repo).split('\n')[0]).toMatch(
      /^plan one \(p-held\) at .*0 incoherent/,
    );
  });

  it('a dependency on a unit another branch withdrew is listed by its relation, and keeps the unit off the frontier, however far along', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'A', 'pl');
    add(repo, 'B', 'pl');
    plan(repo, 'advance', 'B', '--to', 'u-mid', ...BY);
    plan(repo, 'advance', 'B', '--to', 'u-done', ...BY);
    merge(
      repo,
      'unit',
      () => plan(repo, 'retract', 'B', ...BY),
      () => {
        plan(repo, 'revise', 'A', '--deps', 'B', ...BY);
        plan(repo, 'advance', 'A', '--to', 'u-mid', ...BY);
      },
    );
    expect(show(repo, [], 'pl')).toContain(
      'incoherent: A references withdrawn B by its dependency',
    );
    expect(marks(repo, 'pl', 'A')).toBe('u-mid');
    plan(repo, 'revise', 'A', '--deps', '', ...BY);
    expect(show(repo, [], 'pl')).toMatch(/0 incoherent/);
    expect(marks(repo, 'pl', 'A')).toBe('u-mid, frontier');
  });

  it('a diverged unit keeps its place in its wave, marked, and its dependents keep theirs', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'a', 'pl');
    add(repo, 'b', 'pl', 'c1', '--deps', 'a');
    merge(
      repo,
      'unit',
      () => plan(repo, 'revise', 'a', '--intent', 'left', ...BY),
      () => plan(repo, 'revise', 'a', '--intent', 'right', ...BY),
    );
    expect(show(repo, [], 'pl')).toContain(
      [
        '  wave 0:',
        '    a — diverged, 2 versions',
        '  wave 1:',
        '    b — u-new · realizes c1 · deps a',
      ].join('\n'),
    );
  });

  it('two units given one name in one plan: each identity beside the name, and the printed form addresses one', () => {
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
      (p) => p.spec?.name,
      'dup',
    );
    expect(show(repo, ['dup'], 'pl')).toContain(
      `incoherent: dup is held by 2 items: dup (identity ${left}) live, dup (identity ${right}) live`,
    );
    const held = refusal(repo, () => plan(repo, 'retract', 'dup', ...BY), [
      'dup',
    ]);
    expect(held).toMatch(/the unit name "dup" is held by 2 units/);
    const [printedForm] = held.match(/dup \(identity [0-9A-Z]{26}\)/) ?? [];
    expect(printedForm).toBe(`dup (identity ${left})`);
    plan(repo, 'retract', printedForm as string, ...BY);
    const settled = show(repo, [], 'pl');
    expect(settled).toMatch(/0 incoherent/);
    expect(settled).not.toMatch(IDENTITY);
    const [first] = entitiesNamed(repo, 'unit', (p) => p.spec?.name, 'first');
    expect(
      refusal(
        repo,
        () =>
          plan(
            repo,
            'advance',
            `first (identity ${first})`,
            '--to',
            'u-mid',
            ...BY,
          ),
        ['first'],
      ),
    ).toMatch(/alone addresses it; drop the identity/);
  });
});

describe('plan — what must be resolved first', () => {
  it('names what moved, lists only its own plan’s items, and never asks of a closed plan’s units', () => {
    const repo = repository();
    concepts(repo);
    design(repo, 'define', 'same', '--gloss', 'shared', ...BY);
    add(repo, 'u', 'p', 'leaf');
    plan(
      repo,
      'revise',
      'p',
      '--realizes',
      'leaf',
      '--realizes',
      'same',
      ...BY,
    );
    plan(repo, 'add', 'v', '--plan', 'p', '--realizes', 'same', ...BY);
    plan(
      repo,
      'add',
      'w',
      '--plan',
      'q',
      '--realizes',
      'same',
      '--plan-realizes',
      'same',
      ...BY,
    );
    plan(
      repo,
      'add',
      'z',
      '--plan',
      'done',
      '--realizes',
      'same',
      '--plan-realizes',
      'same',
      ...BY,
    );
    plan(repo, 'close', 'done', ...BY);
    dispatchPlan(['bind', 'q', ...BY], { from: repo });
    design(repo, 'amend', 'base', '--gloss', 'moved', ...BY);
    merge(
      repo,
      'design',
      () => design(repo, 'amend', 'same', '--gloss', 'left', ...BY),
      () => design(repo, 'amend', 'same', '--gloss', 'right', ...BY),
    );
    const p = show(repo, [], 'p');
    expect(p).toContain('  drifted: v — same diverged since pinned');
    expect(p).toContain(
      '  suspect: u — beneath leaf, base amended since pinned',
    );
    expect(p).not.toContain('w —');
    expect(p).not.toContain('drifted: w');
    expect(show(repo, [], 'q')).toContain(
      '  drifted: w — same diverged since pinned',
    );
    expect(show(repo, [], 'q')).not.toContain('drifted: v');
    const done = show(repo, [], 'done');
    expect(done).toContain('resolve first: none');
    expect(done).toContain('    z — u-new, drifted · realizes same');
  });

  it('a diverged plan reads as diverged wherever it is named, and versions drawn alike show what differs', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'a', 'p');
    merge(
      repo,
      'plan',
      () => {
        plan(repo, 'revise', 'p', '--realizes', 'c1', ...BY);
        plan(repo, 'revise', 'a', '--intent', 'left', ...BY);
      },
      () => {
        plan(repo, 'bind', 'p', ...BY);
        plan(repo, 'revise', 'a', '--intent', 'right', ...BY);
      },
    );
    const out = show(repo, [], 'p');
    expect(out.split('\n')[0]).toMatch(/^plan p \(diverged\) at /);
    expect(out).toContain('plan p (diverged) — units in wave order:');
    expect(out).toContain('    a — diverged, 2 versions');
    expect(out).toMatch(
      /version written by test at \S+:\n {6}unit: a — u-new\n {8}plan: p \(diverged\)/,
    );
    expect(out).toContain('      intent: left');
    expect(out).toContain('      intent: right');
    expect(design(repo, 'show', 'c1')).toContain(
      '    - p (diverged): a (diverged)',
    );
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
        'gone',
        ...BY,
      ),
    ).toMatch(/pin: take on gone refused — it is withdrawn/);
    add(repo, 'a', 'pl', 'leaf');
    add(repo, 'b', 'pl', 'c1', '--deps', 'a');
    plan(repo, 'bind', 'pl', ...BY);
    expect(show(repo)).toContain(
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
    const repin = () => plan(repo, 'revise', 'u', '--repin', ...BY);
    expect(marks(repo, 'pl', 'u')).toBe('u-new, frontier');
    design(repo, 'amend', 'base', '--gloss', 'beneath, amended', ...BY);
    expect(marks(repo, 'pl', 'u')).toBe('u-new, frontier, suspect');
    repin();
    expect(marks(repo, 'pl', 'u')).toBe('u-new, frontier');
    design(repo, 'amend', 'leaf', '--gloss', 'above, amended', ...BY);
    expect(marks(repo, 'pl', 'u')).toBe('u-new, frontier, drifted');
    repin();
    merge(
      repo,
      'design',
      () => design(repo, 'amend', 'leaf', '--gloss', 'left', ...BY),
      () => design(repo, 'amend', 'leaf', '--gloss', 'right', ...BY),
    );
    expect(marks(repo, 'pl', 'u')).toBe('u-new, frontier, drifted');
    design(repo, 'reconcile', 'leaf', '--gloss', 'settled', ...BY);
    repin();
    design(repo, 'retract', 'leaf', ...BY);
    expect(marks(repo, 'pl', 'u')).toBe('u-new, frontier, drifted');
    expect(show(repo, [], 'pl')).toMatch(/0 incoherent/);
  });

  it('a revise keeps the pin, so editing a spec never clears a drift; only --repin with a reason retakes it', () => {
    const repo = repository();
    concepts(repo);
    add(repo, 'u', 'pl', 'c1');
    design(repo, 'amend', 'c1', '--gloss', 'one, amended', ...BY);
    plan(repo, 'revise', 'u', '--intent', 'edited', ...BY);
    expect(marks(repo, 'pl', 'u')).toBe('u-new, frontier, drifted');
    expect(refused(repo, 'revise', 'u', '--realizes', 'c2', ...BY)).toMatch(
      /give --repin, with a --reason/,
    );
    expect(
      refused(
        repo,
        'revise',
        'u',
        '--repin',
        '--author',
        't',
        '--reason',
        '',
        '--cause',
        'c',
      ),
    ).toMatch(/a re-pin says why; give a --reason/);
    plan(repo, 'revise', 'u', '--repin', ...BY);
    expect(marks(repo, 'pl', 'u')).toBe('u-new, frontier');
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
    expect(marks(repo, 'pl', 'b')).toBe('u-new, frontier');
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
    const deps = merge(
      repo,
      'unit',
      () => plan(repo, 'revise', 'c', '--deps', 'a', '--deps', 'b', ...BY),
      () => plan(repo, 'revise', 'c', '--deps', 'b', '--deps', 'a', ...BY),
    );
    expect(deps.left).toHaveLength(1);
    expect(deps.left).toEqual(deps.right);
    const out = show(repo, [], 'pl');
    expect(out).toMatch(/0 diverged/);
    expect(out).not.toContain('diverged:');
    plan(repo, 'revise', 'pl', '--name', 'pl2', ...BY);
    plan(repo, 'revise', 'c', '--intent', 'onward', ...BY);
  });

  it('REFUSES every verb when the plan lifecycle is absent or malformed, naming the deploy, and writes nothing', () => {
    const repo = repository();
    concepts(repo);
    const add = [
      'add',
      'a',
      '--plan',
      'pl',
      '--realizes',
      'c1',
      '--plan-realizes',
      'c1',
      ...BY,
    ];
    expect(under(undefined, () => refused(repo, 'show'))).toMatch(
      /plan lifecycle is absent .*`cratylus deploy`/,
    );
    expect(
      under({ configuration: { other: {} } }, () => refused(repo, ...add)),
    ).toMatch(/plan lifecycle is absent/);
    expect(
      under(
        {
          configuration: {
            plan: { plan: { states: ['s'], exclusive: 'x', final: 's' } },
          },
        },
        () => refused(repo, 'show'),
      ),
    ).toMatch(/plan lifecycle is malformed: .*`cratylus deploy`/);
    expect(records(repo, 'plan')).toEqual([]);
  });
});
