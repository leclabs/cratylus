// `dispatchWorkPackage` driven over scratch git repositories it builds itself:
// the dependency graph's levels and cycles, the refusals that keep packages from
// colliding, a commit outside a package's outputs made with a warning, the
// rounds of the whole check, and the explanation's verbs anchored in cratylus's
// own live design.

import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';
import { WORK_PACKAGE } from '../src/capabilities/work-package/dispatch.js';
import { dependencyGraph } from '../src/capabilities/work-package/graph.js';
import { dispatchWorkPackage } from '../src/capabilities/work-package/index.js';
import { explain } from '../src/explanation.js';
import { appendLifecycle } from '../src/lifecycle/index.js';

const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url));
const scratch: string[] = [];
afterAll(() => {
  for (const d of scratch) rmSync(d, { recursive: true, force: true });
});

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();

/** A repository whose cut `delivery` has one example per concept, in the
 *  context `booking`. */
function repository(...concepts: string[]): string {
  const repo = join(mkdtempSync(join(tmpdir(), 'work-package-')), 'repo');
  scratch.push(join(repo, '..'));
  mkdirSync(join(repo, 'design/examples/booking'), { recursive: true });
  git(repo, 'init', '-q', '-b', 'main');
  git(repo, 'config', 'user.name', 'test');
  git(repo, 'config', 'user.email', 'test@example.com');
  git(repo, 'config', 'commit.gpgsign', 'false');
  git(repo, 'config', 'core.hooksPath', '/dev/null');
  writeFileSync(
    join(repo, 'design/examples/booking/delivery.md'),
    concepts.map((c, i) => `${i + 1}. (${c}) **Given** ${c}.\n`).join('\n'),
  );
  return repo;
}

const wp = (repo: string, verb: string, ...args: string[]) =>
  dispatchWorkPackage([verb, '--cut', 'delivery', ...args], {
    from: repo,
  });

const refused = (repo: string, verb: string, ...args: string[]): string => {
  try {
    wp(repo, verb, ...args);
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error(`workPackage ${verb} was not refused`);
};

/** Open the cut `delivery`, as its architect does before any dispatch: the
 *  ledger records lifecycle events only for an opened cut. */
const opened = (repo: string) =>
  wp(
    repo,
    'open',
    '--branch',
    'feature/delivery',
    '--architect',
    'booking=lex',
  );

/** The harness reports `name`'s builder dispatched, as the binding does. */
const dispatched = (repo: string, name: string) =>
  appendLifecycle(repo, {
    kind: 'dispatched',
    transition: `${name}-dispatched`,
    cut: 'delivery',
    workPackage: name,
    role: 'builder',
    run: name,
  });

describe('the dependency graph', () => {
  it('computes levels as 1 plus the longest chain below', () => {
    const graph = dependencyGraph([
      { name: 'A', dependsOn: [] },
      { name: 'B', dependsOn: [] },
      { name: 'C', dependsOn: ['A'] },
      { name: 'E', dependsOn: ['C', 'B'] },
    ]);
    expect(graph.cycles).toEqual([]);
    expect(graph.levels).toEqual([['A', 'B'], ['C'], ['E']]);
    expect([...graph.dependencies('E')].sort()).toEqual(['A', 'B', 'C']);
  });

  it('FLAGS a cycle by its packages and gives no levels', () => {
    const graph = dependencyGraph([
      { name: 'A', dependsOn: ['B'] },
      { name: 'B', dependsOn: ['A'] },
      { name: 'C', dependsOn: [] },
    ]);
    expect(graph.cycles).toEqual([['A', 'B']]);
    expect(graph.levels).toBeNull();
  });
});

describe('workPackage refusals', () => {
  it('REFUSES a cut without its examples file, naming the path', () => {
    const repo = repository('delivery');
    expect(
      (() => {
        try {
          dispatchWorkPackage(['levels', '--cut', 'absent'], {
            from: repo,
          });
        } catch (error) {
          return (error as Error).message;
        }
      })(),
    ).toMatch(
      /^workPackage levels: .*no design\/examples\/<context>\/absent\.md exists/,
    );
  });

  it('REFUSES a concept with no example, an unknown dependency and a malformed path', () => {
    const repo = repository('delivery', 'window');
    wp(repo, 'submit', 'base', '--concept', 'delivery', '--output', 'base/');
    expect(
      refused(repo, 'submit', 'x', '--concept', 'nope', '--output', 'x'),
    ).toContain("'nope'");
    expect(
      refused(
        repo,
        'submit',
        'x',
        '--concept',
        'window',
        '--output',
        'x',
        '--depends-on',
        'ghost',
      ),
    ).toContain("'ghost'");
    expect(
      refused(repo, 'submit', 'x', '--concept', 'window', '--output', '../x'),
    ).toContain("'../x'");
  });

  it('WARNS of a need owned by a package not depended on, recording the package', () => {
    const repo = repository('delivery', 'window');
    wp(repo, 'submit', 'base', '--concept', 'delivery', '--output', 'base/');
    expect(
      wp(
        repo,
        'submit',
        'x',
        '--concept',
        'window',
        '--output',
        'x',
        '--needs',
        'base/a.ts',
      ),
    ).toMatchObject({
      package: { name: 'x', needs: ['base/a.ts'] },
      warnings: [
        expect.stringMatching(
          /'base\/a\.ts' is owned by 'base', which 'x' does not depend on/,
        ),
      ],
    });
  });

  it('WARNS of an output inside another package’s directory, recording the package', () => {
    const repo = repository('delivery');
    wp(repo, 'submit', 'a', '--concept', 'delivery', '--output', 'src/');
    const answer = wp(
      repo,
      'submit',
      'b',
      '--concept',
      'delivery',
      '--output',
      'src/b.ts',
    ) as { package: { name: string }; warnings: string[] };
    expect(answer.package.name).toBe('b');
    for (const name of ["'src/b.ts'", "'src/'", "'a'", "'b'"])
      expect(answer.warnings.join('\n')).toContain(name);
  });

  it('REFUSES a commit git refuses, leaving the index as it was', () => {
    const repo = repository('delivery');
    wp(repo, 'submit', 'a', '--concept', 'delivery', '--output', 'a/');
    opened(repo);
    dispatched(repo, 'a');
    writeFileSync(join(repo, 'staged.txt'), 'staged\n');
    git(repo, 'add', 'staged.txt');
    const index = git(repo, 'ls-files', '--stage');
    expect(
      refused(
        repo,
        'commit',
        'a',
        '--message',
        'nothing',
        '--path',
        'a/missing.txt',
      ),
    ).toMatch(/^workPackage commit: git refused the commit/);
    expect(git(repo, 'ls-files', '--stage')).toBe(index);
    expect(wp(repo, 'history', 'a')).toMatchObject({ commits: [] });
  });

  it('WARNS of a directory path that commits another package’s file, and of a package no builder was dispatched for, committing it', () => {
    const repo = repository('delivery');
    wp(repo, 'submit', 'a', '--concept', 'delivery', '--output', 'src/reserve');
    wp(
      repo,
      'submit',
      'b',
      '--concept',
      'delivery',
      '--output',
      'src/reserve/x.ts',
      '--depends-on',
      'a',
    );
    mkdirSync(join(repo, 'src/reserve'), { recursive: true });
    writeFileSync(join(repo, 'src/reserve/x.ts'), 'theirs\n');
    expect(
      wp(repo, 'commit', 'a', '--message', 'mine', '--path', 'src/reserve'),
    ).toMatchObject({
      warnings: [
        "the work package 'a' has no builder dispatched by the harness",
        "outside the outputs of 'a': 'src/reserve/x.ts' (an output of 'b')",
      ],
    });
    expect(git(repo, 'ls-tree', '-r', '--name-only', 'HEAD')).toBe(
      'src/reserve/x.ts',
    );
    expect(wp(repo, 'history', 'a')).toMatchObject({
      commits: [{ message: 'mine' }],
    });
  });

  it('reads a path with glob characters literally, committing only that file', () => {
    const repo = repository('delivery');
    wp(repo, 'submit', 'a', '--concept', 'delivery', '--output', 'a[b].ts');
    wp(
      repo,
      'submit',
      'b',
      '--concept',
      'delivery',
      '--output',
      'ab.ts',
      '--depends-on',
      'a',
    );
    opened(repo);
    dispatched(repo, 'a');
    writeFileSync(join(repo, 'a[b].ts'), 'mine\n');
    writeFileSync(join(repo, 'ab.ts'), 'theirs\n');
    wp(repo, 'commit', 'a', '--message', 'mine', '--path', 'a[b].ts');
    expect(git(repo, 'ls-tree', '-r', '--name-only', 'HEAD')).toBe('a[b].ts');
    expect(git(repo, 'ls-files', '--stage', '--', 'ab.ts')).toBe('');
  });

  it('REPORTS an example that names no concept as unowned, by its ref', () => {
    const repo = repository('delivery');
    writeFileSync(
      join(repo, 'design/examples/booking/delivery.md'),
      '1. (delivery) **Given** delivery.\n\n2. **Given** no concept.\n',
    );
    wp(repo, 'submit', 'a', '--concept', 'delivery', '--output', 'a/');
    expect(wp(repo, 'inventory')).toMatchObject({
      unserved: [],
      unowned: ['booking/2'],
    });
    expect(wp(repo, 'levels')).toMatchObject({
      levels: [{ level: 1, packages: [{ name: 'a', state: 'submitted' }] }],
    });
  });

  it('REFUSES to record figures for a context the journal lacks', () => {
    const repo = repository('delivery');
    expect(refused(repo, 'record')).toContain("'booking'");
  });
});

describe('the whole check', () => {
  it('closes a round per run and flags one that resolves nothing', () => {
    const repo = repository('delivery');
    opened(repo);
    wp(repo, 'check', '--failure', 'a');
    wp(repo, 'check', '--failure', 'a', '--failure', 'b');
    appendLifecycle(repo, {
      kind: 'returned',
      transition: 'fix-returned',
      cut: 'delivery',
      role: 'builder',
      run: 'fix',
      tokens: 7,
    });
    expect(wp(repo, 'check', '--failure', 'b')).toMatchObject({
      round: 3,
      wholeCheckRuns: 3,
      rounds: [
        { round: 1, noProgress: false, resolved: [] },
        { round: 2, noProgress: true, resolved: [] },
        { round: 3, noProgress: false, resolved: ['a'] },
      ],
    });
    expect(wp(repo, 'efficiency')).toEqual({
      cut: 'delivery',
      agentRuns: { total: 1, byRole: { builder: 1 } },
      rounds: 3,
      wholeCheckRuns: 3,
      tokens: 7,
      noProgressRounds: [2],
    });
  });
});

describe('the work package capability explains itself', () => {
  it('acts on live concepts of cratylus’s own workflow design', () => {
    const design = dispatchConcepts(['design', '--context', 'workflow'], {
      from: repositoryRoot,
    }) as { contexts: { concepts: { name: string }[] }[] };
    const live = design.contexts.flatMap((c) => c.concepts.map((v) => v.name));
    const explained = explain(WORK_PACKAGE);
    expect(explained.name).toBe('work package');
    expect(
      explained.verbs
        .filter((v) => !live.includes(v.concept))
        .map((v) => v.name),
    ).toEqual([]);
  });
});
