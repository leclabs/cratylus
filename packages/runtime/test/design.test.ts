// The `design` capability, driven at its verb surface over temporary git
// repositories this file builds itself: the lattice shown root to primitive, the
// design's laws refusing a write on one branch — and writing nothing — a
// concept's trace, divergence and convergence across a real merge, a diverged
// concept keeping its place in the lattice, incoherence and its repair by
// ordinary writes, identities shown and accepted only beside an anchor held more
// than once, and the design shown on a host without the plan lifecycle.

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { dispatchDesign } from '../src/capabilities/design/dispatch.js';
import { dispatchPlan } from '../src/capabilities/plan/dispatch.js';
import {
  BY,
  IDENTITY,
  commit,
  configured,
  entitiesNamed,
  everyRecord,
  git,
  merge,
  records,
  refusal,
  repository,
  spoken,
  under,
} from './verb-surface.js';

configured();

const design = (repo: string, ...argv: string[]): string =>
  dispatchDesign(argv, { from: repo });

const refused = (repo: string, ...argv: string[]): string =>
  refusal(repo, () => design(repo, ...argv));

/** `design show`, held to what a reader may be shown; `shared` are the anchors
 *  held more than once. */
const show = (
  repo: string,
  shared: readonly string[] = [],
  ...argv: string[]
) => spoken(repo, design(repo, 'show', ...argv), shared);

/** The entities first defined under `anchor`, in the order written. */
const holders = (repo: string, anchor: string): string[] =>
  entitiesNamed(repo, 'design', (p) => p.anchor, anchor);

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
  it('define, show root to primitive, amend, show one concept in full; the header says when writes are uncommitted', () => {
    const repo = repository();
    const head = () => git(repo, 'rev-parse', '--short', 'HEAD').trim();
    expect(show(repo).split('\n')[0]).toBe(
      `design at ${head()}: 0 concepts · 0 unplaced · 0 diverged · 0 incoherent`,
    );
    lattice(repo);
    const whole = show(repo).split('\n');
    expect(whole[0]).toBe(
      `design at ${head()}: 3 concepts · 0 unplaced · 0 diverged · 0 incoherent (this state includes writes made since ${head()} and not yet committed)`,
    );
    const at = (anchor: string) =>
      whole.findIndex((l) => l.startsWith(`  ${anchor} — `));
    expect(at('top')).toBeLessThan(at('mid'));
    expect(at('mid')).toBeLessThan(at('prim'));
    commit(repo);
    expect(show(repo).split('\n')[0]).toBe(
      `design at ${head()}: 3 concepts · 0 unplaced · 0 diverged · 0 incoherent`,
    );
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

  it('REFUSES each write that would break a design law on one branch, and writes nothing', () => {
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
    const trace = spoken(repo, design(repo, 'trace', 'mid'));
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
  it('two amendments diverge: listed before the body and kept in place, amend refuses naming reconcile, reconcile settles', () => {
    const repo = repository();
    lattice(repo);
    merge(
      repo,
      'design',
      () => design(repo, 'amend', 'mid', '--gloss', 'left', ...BY),
      () => design(repo, 'amend', 'mid', '--gloss', 'right', ...BY),
    );
    const out = show(repo).split('\n');
    const diverged = out.indexOf('  diverged: mid');
    expect(diverged).toBeGreaterThan(0);
    expect(out[0]).toMatch(/1 diverged/);
    expect(diverged).toBeLessThan(out.indexOf('lattice, root to primitive:'));
    const place = (line: string) => out.findIndex((l) => l.startsWith(line));
    expect(place('  top — ')).toBeLessThan(
      place('  mid — diverged, 2 versions'),
    );
    expect(place('  mid — diverged, 2 versions')).toBeLessThan(
      place('  prim — '),
    );
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
    merge(repo, 'design', same, same);
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
      'design',
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
      'design',
      () => design(repo, 'amend', 'leaf', '--gloss', 'second', ...BY),
      () => design(repo, 'retract', 'leaf', ...BY),
    );
    const out = show(repo, [], 'leaf');
    expect(out).toMatch(
      /\n {2}version written by test at \S+:\n {4}concept: leaf\n {6}gloss: second/,
    );
    expect(out).toMatch(
      /\n {2}retraction written by test at \S+, which withdrew:\n {4}concept: leaf\n {6}gloss: first/,
    );
    expect(show(repo)).toContain(
      '  leaf — diverged, 1 version and a retraction',
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
      'design',
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

describe('design — reconcile', () => {
  it('REFUSES a concept that has not diverged in the design’s words, never as a concurrent change', () => {
    const repo = repository();
    design(repo, 'define', 'settled', '--gloss', 'one', ...BY);
    const said = refused(repo, 'reconcile', 'settled', '--gloss', 'x', ...BY);
    expect(said).toMatch(/has not diverged/);
    expect(said).not.toMatch(/changed while this write was being made/);
  });
});

describe('design — incoherence, repaired one write at a time', () => {
  it('two definitions of one anchor: listed, each identity beside the anchor, and the printed form addresses one', () => {
    const repo = repository();
    merge(
      repo,
      'design',
      () => design(repo, 'define', 'twin', '--gloss', 'left', ...BY),
      () => design(repo, 'define', 'twin', '--gloss', 'right', ...BY),
    );
    const [left, right] = holders(repo, 'twin');
    const out = show(repo, ['twin']);
    expect(out).toContain(
      `incoherent: twin is held by 2 items: twin (identity ${left}) live, twin (identity ${right}) live`,
    );
    expect(out).toContain(`twin (identity ${left}) — left`);
    expect(out).toContain(`twin (identity ${right}) — right`);
    const held = refusal(repo, () => design(repo, 'retract', 'twin', ...BY), [
      'twin',
    ]);
    expect(held).toMatch(/the concept name "twin" is held by 2 concepts/);
    // The form the refusal prints is the form accepted, exactly.
    const [printedForm] = held.match(/twin \(identity [0-9A-Z]{26}\)/) ?? [];
    expect(printedForm).toBe(`twin (identity ${left})`);
    design(repo, 'retract', printedForm as string, ...BY);
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
      'design',
      () => {
        design(repo, 'define', 'kept', '--gloss', 'withdrawn here', ...BY);
        design(repo, 'retract', 'kept', ...BY);
      },
      () => design(repo, 'define', 'kept', '--gloss', 'live there', ...BY),
    );
    const [withdrawn, live] = holders(repo, 'kept');
    expect(show(repo, ['kept'])).toContain(
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
      'design',
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
    const [solo] = holders(repo, 'solo');
    expect(
      refusal(
        repo,
        () =>
          design(
            repo,
            'amend',
            `solo (identity ${solo})`,
            '--gloss',
            'x',
            ...BY,
          ),
        ['solo'],
      ),
    ).toMatch(/alone addresses it; drop the identity/);
    expect(show(repo)).not.toMatch(IDENTITY);
  });
});

describe('design — when the store itself fails', () => {
  it('says plainly that the directory is outside a repository, and names a damaged entry to repair', () => {
    const outside = mkdtempSync(join(tmpdir(), 'no-repository-'));
    expect(() => design(outside, 'show')).toThrow(
      /^design: this directory is not inside a git repository; run it from inside the repository/,
    );
    const repo = repository();
    design(repo, 'define', 'alpha', '--gloss', 'first', ...BY);
    const [file] = records(repo, 'design');
    const path = join(repo, 'records', 'design', file as string);
    writeFileSync(path, '{ torn');
    let said = '';
    try {
      design(repo, 'show');
    } catch (error) {
      said = (error as Error).message;
    }
    expect(said).toBe(
      `design: a stored design entry is damaged: ${path} — restore it from version control (\`git checkout -- ${path}\`); a stored entry is never edited`,
    );
  });
});

describe('design — on a host without the plan lifecycle', () => {
  it('shows and writes the design, saying the plans standing on it wait for a deploy', () => {
    const repo = repository();
    design(repo, 'define', 'alpha', '--gloss', 'first', ...BY);
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
    under(undefined, () => {
      const before = everyRecord(repo).length;
      const amended = spoken(
        repo,
        design(repo, 'amend', 'alpha', '--gloss', 'second', ...BY),
      );
      expect(everyRecord(repo)).toHaveLength(before + 1);
      expect(amended).toContain(
        'plans standing on each concept: unavailable until `cratylus deploy`',
      );
      const out = show(repo);
      expect(out).toContain('  alpha — second');
      expect(out).not.toContain('realized in');
      expect(show(repo, [], 'alpha')).toContain(
        '  realized in: unavailable until `cratylus deploy`',
      );
      expect(design(repo, 'trace', 'alpha')).toContain('trace: alpha');
    });
    expect(show(repo)).toContain('realized in pl (p-draft): u1');
  });
});
