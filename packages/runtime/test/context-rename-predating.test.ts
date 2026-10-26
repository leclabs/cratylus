// A runtime that predates renaming a bounded context (0297): it does not know
// the kind `rename-context`, so it reads such an entry past in every reading,
// works out its answer from the rest, says its answer may be incomplete, and
// still appends, leaving every entry as it was. The runtime here is this one
// with `rename-context` taken out of the kinds it knows.

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
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type * as Entries from '../src/capabilities/concepts/entries.js';
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';
import { ulid } from '../src/ulid.js';

vi.mock('../src/capabilities/concepts/entries.js', async (importOriginal) => {
  const known = await importOriginal<typeof Entries>();
  return {
    ...known,
    isKind: (kind: unknown) => kind !== 'rename-context' && known.isKind(kind),
  };
});

let repo: string;
beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'context-rename-predating-'));
  execFileSync('git', ['init', '-q'], { cwd: repo });
});
afterEach(() => rmSync(repo, { recursive: true, force: true }));

const concepts = (...argv: string[]) =>
  dispatchConcepts(argv, { from: repo }) as Record<string, unknown>;
const dir = () => join(repo, 'design/journal');
const files = () =>
  Object.fromEntries(
    readdirSync(dir())
      .sort()
      .map((name) => [name, readFileSync(join(dir(), name), 'utf8')]),
  );

it('reads a rename-context entry past in every reading and says its answer may be incomplete', () => {
  const described = (
    concepts('context', 'booking', '--subject', 'Seats for a show.') as {
      id: string;
    }
  ).id;
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
  // As a runtime that knows renaming wrote it.
  const id = ulid();
  writeFileSync(
    join(dir(), `${id}.json`),
    JSON.stringify({
      id,
      at: '2026-10-26T00:00:00.000Z',
      kind: 'rename-context',
      name: 'reservation',
      was: 'booking',
      subject: 'Seats for a show.',
      relation: '',
      reason: 'Nearer.',
      supersedes: [described],
    }),
  );
  for (const argv of [
    ['state'],
    ['design'],
    ['history', '--context', 'booking'],
    ['history', 'hold', '--context', 'booking'],
    ['decisions'],
    ['leakage'],
  ])
    expect(concepts(...argv), argv.join(' ')).toMatchObject({
      uninterpreted: {
        kinds: { 'rename-context': 1 },
        mayBeIncomplete: true,
        reading: expect.stringMatching(/read past.*may be incomplete/),
      },
    });
  // Its answer is worked out from the rest.
  expect(concepts('state')).toMatchObject({
    contexts: [{ name: 'booking', concepts: ['hold ≜ A hold.'] }],
  });
  // It still appends, leaving every entry as it was.
  const before = files();
  concepts(
    'define',
    'seat',
    '--context',
    'booking',
    '--wording',
    'A seat.',
    '--reason',
    'Second.',
  );
  const after = files();
  for (const [name, bytes] of Object.entries(before))
    expect(after[name]).toBe(bytes);
  expect(Object.keys(after)).toHaveLength(Object.keys(before).length + 1);
});
