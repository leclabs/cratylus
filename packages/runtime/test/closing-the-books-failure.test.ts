// A close whose writing of its openings or removal of the closed period's
// files fails part-way leaves the journal as it was (decision 0316 (5)): the
// removed files restored from HEAD, the openings written removed, and the call
// refused. The failure is injected by making one write or one removal throw.

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';

/** The file whose removal fails, when one is named. */
let failingRemoval: string | undefined;
/** The number of entries written aside before the next such write fails,
 *  when one is to fail. */
let writesBeforeFailing: number | undefined;
vi.mock('node:fs', async (original) => {
  const real = await original<typeof fs>();
  return {
    ...real,
    unlinkSync: (path: fs.PathLike) => {
      if (failingRemoval !== undefined && String(path).endsWith(failingRemoval))
        throw new Error(`cannot remove ${failingRemoval}`);
      real.unlinkSync(path);
    },
    writeFileSync: (...args: Parameters<typeof fs.writeFileSync>) => {
      if (
        writesBeforeFailing !== undefined &&
        String(args[0]).endsWith('.partial')
      ) {
        if (writesBeforeFailing === 0) throw new Error('cannot write');
        writesBeforeFailing -= 1;
      }
      real.writeFileSync(...args);
    },
  };
});

let repo: string;
beforeEach(() => {
  repo = fs.mkdtempSync(join(tmpdir(), 'close-failure-'));
  execFileSync('git', ['init', '-q'], { cwd: repo });
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
});
afterEach(() => {
  failingRemoval = undefined;
  writesBeforeFailing = undefined;
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
const REFUSAL =
  /^concepts close: closing the books failed \(cannot (remove .*|write)\); the journal is restored from the commit at HEAD and the openings written removed, so it is as it was$/;

it('restores the closed period and removes the openings when a file cannot be removed', () => {
  const before = snapshot();
  failingRemoval = Object.keys(before)[1];
  expect(() => concepts('close')).toThrow(REFUSAL);
  expect(snapshot()).toEqual(before);
  failingRemoval = undefined;
  expect(concepts('close')).toMatchObject({ openings: 3, removed: 3 });
});

it('removes the openings written when one cannot be written', () => {
  const before = snapshot();
  writesBeforeFailing = 2;
  expect(() => concepts('close')).toThrow(REFUSAL);
  expect(snapshot()).toEqual(before);
});
