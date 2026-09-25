// The immutability gate, driven over temporary git repositories it builds itself:
// staged changes (the pre-commit reading) and commit ranges (the CI reading) that
// modify, delete, rename or retype a record must refuse, naming the path; additions,
// changes outside the records root, and a merge of two branches' records must pass.

import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  changes,
  immutabilityGate,
} from '../src/record-store/immutability-gate.js';
import { RECORDS_ROOT } from '../src/record-store/store.js';
import { ulid } from '../src/ulid.js';

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
  ).trim();
}

/** A repository whose first commit holds one record; returns it and the record's path. */
function repositoryWithRecord(): { repo: string; record: string } {
  const repo = mkdtempSync(join(tmpdir(), 'immutability-gate-'));
  git(repo, 'init', '-q', '-b', 'main');
  const record = put(repo, `${RECORDS_ROOT}/concept/${ulid()}.json`, '{"v":1}');
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'first record');
  return { repo, record };
}

/** Write `bytes` at repository-relative `path`; returns `path`. */
function put(repo: string, path: string, bytes: string): string {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), bytes);
  return path;
}

/** What the gate refuses of the staged changes, and of the same change once committed. */
function refusedStagedAndCommitted(repo: string): {
  staged: string[];
  committed: string[];
} {
  git(repo, 'add', '-A');
  const staged = immutabilityGate(changes(undefined, repo));
  git(repo, 'commit', '-q', '--no-verify', '-m', 'change');
  const committed = immutabilityGate(changes('HEAD~1..HEAD', repo));
  return { staged, committed };
}

describe('immutability gate', () => {
  it('a modified record REFUSES, naming its path', () => {
    const { repo, record } = repositoryWithRecord();
    put(repo, record, '{"v":2}');
    expect(refusedStagedAndCommitted(repo)).toEqual({
      staged: [record],
      committed: [record],
    });
  });

  it('a deleted record REFUSES, naming its path', () => {
    const { repo, record } = repositoryWithRecord();
    rmSync(join(repo, record));
    expect(refusedStagedAndCommitted(repo)).toEqual({
      staged: [record],
      committed: [record],
    });
  });

  it('a renamed record REFUSES, naming the record it removed', () => {
    const { repo, record } = repositoryWithRecord();
    const moved = `${RECORDS_ROOT}/concept/${ulid()}.json`;
    git(repo, 'mv', record, moved);
    expect(refusedStagedAndCommitted(repo)).toEqual({
      staged: [record],
      committed: [record],
    });
  });

  it('a type-changed record REFUSES, naming its path', () => {
    const { repo, record } = repositoryWithRecord();
    rmSync(join(repo, record));
    symlinkSync('elsewhere.json', join(repo, record));
    expect(refusedStagedAndCommitted(repo)).toEqual({
      staged: [record],
      committed: [record],
    });
  });

  it('an added record passes', () => {
    const { repo } = repositoryWithRecord();
    const added = put(repo, `${RECORDS_ROOT}/concept/${ulid()}.json`, '{}');
    git(repo, 'add', '-A');
    expect(changes(undefined, repo)).toEqual([{ status: 'A', path: added }]);
    expect(refusedStagedAndCommitted(repo)).toEqual({
      staged: [],
      committed: [],
    });
  });

  it('the first commit of a repository, all additions, passes', () => {
    const repo = mkdtempSync(join(tmpdir(), 'immutability-gate-'));
    git(repo, 'init', '-q', '-b', 'main');
    put(repo, `${RECORDS_ROOT}/concept/${ulid()}.json`, '{}');
    git(repo, 'add', '-A');
    expect(immutabilityGate(changes(undefined, repo))).toEqual([]);
  });

  it('a change outside the records root is ignored', () => {
    const { repo } = repositoryWithRecord();
    const beside = put(repo, `${RECORDS_ROOT}-old/concept/x.json`, '{"v":1}');
    const readme = put(repo, 'README.md', 'one\n');
    git(repo, 'add', '-A');
    git(repo, 'commit', '-q', '-m', 'outside');
    put(repo, beside, '{"v":2}');
    rmSync(join(repo, readme));
    git(repo, 'add', '-A');
    expect(changes(undefined, repo).map((c) => c.status)).toEqual(['D', 'M']);
    expect(refusedStagedAndCommitted(repo)).toEqual({
      staged: [],
      committed: [],
    });
  });

  it('a merge commit bringing records from two branches passes', () => {
    const { repo } = repositoryWithRecord();
    const branch = (name: string): string => {
      git(repo, 'checkout', '-q', '-b', name, 'main');
      const added = put(repo, `${RECORDS_ROOT}/concept/${ulid()}.json`, name);
      git(repo, 'add', '-A');
      git(repo, 'commit', '-q', '-m', name);
      return added;
    };
    const left = branch('left');
    const right = branch('right');
    git(repo, 'checkout', '-q', 'left');
    const before = git(repo, 'rev-parse', 'HEAD');
    git(repo, 'merge', '-q', '--no-commit', 'right');
    expect(changes(undefined, repo)).toEqual([{ status: 'A', path: right }]);
    expect(immutabilityGate(changes(undefined, repo))).toEqual([]);
    git(repo, 'commit', '-q', '--no-edit');
    expect(
      git(repo, 'rev-list', '--parents', '-n', '1', 'HEAD').split(' '),
    ).toHaveLength(3);
    expect(immutabilityGate(changes(`${before}..HEAD`, repo))).toEqual([]);
    expect(immutabilityGate(changes('main...HEAD', repo))).toEqual([]);
    expect(
      changes('main...HEAD', repo)
        .map((c) => c.path)
        .sort(),
    ).toEqual([left, right].sort());
  });
});
