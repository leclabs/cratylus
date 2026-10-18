// A close whose removal of the closed period's files fails part-way leaves the
// journal as it was (decision 0315 (4)): the removed files restored from HEAD,
// the close removed, and the call refused. The failure is injected by making
// the removal of one file throw.

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';

/** The file whose removal fails, when one is named. */
let failing: string | undefined;
vi.mock('node:fs', async (original) => {
  const real = await original<typeof fs>();
  return {
    ...real,
    unlinkSync: (path: fs.PathLike) => {
      if (failing !== undefined && String(path).endsWith(failing))
        throw new Error(`cannot remove ${failing}`);
      real.unlinkSync(path);
    },
  };
});

let repo: string;
beforeEach(() => {
  repo = fs.mkdtempSync(join(tmpdir(), 'close-failure-'));
  execFileSync('git', ['init', '-q'], { cwd: repo });
});
afterEach(() => {
  failing = undefined;
  fs.rmSync(repo, { recursive: true, force: true });
});

const concepts = (...argv: string[]) => dispatchConcepts(argv, { from: repo });
const snapshot = () => {
  const dir = join(repo, 'design/journal');
  return Object.fromEntries(
    fs
      .readdirSync(dir)
      .sort()
      .map((name) => [name, fs.readFileSync(join(dir, name), 'utf8')]),
  );
};

it('restores the closed period and removes the close when a file cannot be removed', () => {
  concepts('context', 'booking', '--subject', 'Booking.');
  concepts(
    'define',
    'hold',
    '--context',
    'booking',
    '--wording',
    'A hold.',
    '--reason',
    'First.',
  );
  concepts('context', 'fleet', '--subject', 'Fleet.');
  for (const args of [
    ['add', '-A'],
    ['commit', '-q', '-m', 'journal'],
  ])
    execFileSync(
      'git',
      ['-c', 'user.name=t', '-c', 'user.email=t@e', ...args],
      { cwd: repo },
    );
  const before = snapshot();
  failing = Object.keys(before)[1];
  expect(() => concepts('close')).toThrow(
    /^concepts close: removing the closed period’s entries failed \(cannot remove .*\); they are restored from the commit at HEAD and the close removed, so the journal is as it was$/,
  );
  expect(snapshot()).toEqual(before);
  failing = undefined;
  expect(concepts('close')).toMatchObject({ kind: 'close', removed: 3 });
});
