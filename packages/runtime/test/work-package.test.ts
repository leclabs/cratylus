// `dispatchWorkPackage` driven over scratch git repositories it builds itself:
// the dependency graph's levels and cycles, the refusals that keep packages from
// colliding, a refused commit that stages nothing, the rounds of the whole
// check, and the explanation's verbs anchored in cratylus's own live design.

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

const repositoryRoot = fileURLToPath(new URL('../../..', import.meta.url));
const scratch: string[] = [];
afterAll(() => {
  for (const d of scratch) rmSync(d, { recursive: true, force: true });
});

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();

/** A repository whose cut `booking/delivery` has one example per concept. */
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
  dispatchWorkPackage([verb, '--cut', 'booking/delivery', ...args], {
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
          dispatchWorkPackage(['levels', '--cut', 'booking/absent'], {
            from: repo,
          });
        } catch (error) {
          return (error as Error).message;
        }
      })(),
    ).toMatch(
      /^workPackage levels: .*design\/examples\/booking\/absent\.md is missing/,
    );
  });

  it('REFUSES a concept with no example, an unknown dependency and an unowned need', () => {
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
      refused(
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
    ).toMatch(/'base\/a\.ts' is owned by 'base', which 'x' does not depend on/);
    expect(
      refused(repo, 'submit', 'x', '--concept', 'window', '--output', '../x'),
    ).toContain("'../x'");
  });

  it('REFUSES an output inside another package’s directory', () => {
    const repo = repository('delivery');
    wp(repo, 'submit', 'a', '--concept', 'delivery', '--output', 'src/');
    const message = refused(
      repo,
      'submit',
      'b',
      '--concept',
      'delivery',
      '--output',
      'src/b.ts',
    );
    for (const name of ["'src/b.ts'", "'src/'", "'a'", "'b'"])
      expect(message).toContain(name);
  });

  it('REFUSES a commit git refuses, leaving the index as it was', () => {
    const repo = repository('delivery');
    wp(repo, 'submit', 'a', '--concept', 'delivery', '--output', 'a/');
    wp(repo, 'dispatch');
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

  it('REFUSES to record figures for a context the journal lacks', () => {
    const repo = repository('delivery');
    expect(refused(repo, 'record')).toContain("'booking'");
  });
});

describe('the whole check', () => {
  it('closes a round per run and flags one that resolves nothing', () => {
    const repo = repository('delivery');
    wp(repo, 'check', '--failure', 'a');
    wp(repo, 'check', '--failure', 'a', '--failure', 'b');
    wp(repo, 'run', '--role', 'builder', '--tokens', '7');
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
      cut: 'booking/delivery',
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
