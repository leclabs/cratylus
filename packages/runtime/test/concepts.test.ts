// The concepts capability as a library: `dispatchConcepts` over a scratch git
// repository's journal. The command-line examples (cli `test/concept-journal`)
// bind the contract end to end; these hold what they do not reach: ids minted
// past the journal's last, a retirement among competing versions, flags given
// twice, a journal entry that is not one, and a working directory outside git.

import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';

let sandbox: string;
let repo: string;
beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'concepts-'));
  repo = join(sandbox, 'repo');
  mkdirSync(join(repo, 'nested'), { recursive: true });
  execFileSync('git', ['init', '-q'], { cwd: repo });
});
afterEach(() => rmSync(sandbox, { recursive: true, force: true }));

const concepts = (...argv: string[]) =>
  dispatchConcepts(argv, { from: join(repo, 'nested') });
const journal = () => readdirSync(join(repo, 'design/journal')).sort();
const refused = (argv: string[], words: RegExp) => {
  const before = journal();
  expect(() => concepts(...argv)).toThrow(words);
  expect(journal()).toEqual(before);
};
const version = (verb: string, wording: string, reason: string) =>
  concepts(
    verb,
    'hold',
    '--context',
    'booking',
    '--wording',
    wording,
    '--reason',
    reason,
  );

describe('the concept journal as a library', () => {
  beforeEach(() => {
    concepts('context', 'booking', '--subject', 'Booking.');
  });

  it('keeps the journal at the top of the repository, one file per entry', () => {
    version('define', 'A hold lasts ten minutes.', 'First.');
    expect(journal()).toHaveLength(2);
    for (const name of journal())
      expect(name).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}\.json$/);
  });

  it('mints each id past the journal’s last, even one from a later clock', () => {
    const ahead = '01Z00000000000000000000000';
    writeFileSync(
      join(repo, 'design/journal', `${ahead}.json`),
      JSON.stringify({
        id: ahead,
        at: '9999-01-01T00:00:00.000Z',
        kind: 'context',
        name: 'later',
        subject: 'From a skewed clock.',
        relation: '',
      }),
    );
    version('define', 'A hold.', 'First.');
    const minted = journal().at(-1) as string;
    expect(minted > `${ahead}.json`).toBe(true);
    expect(journal()).toHaveLength(3);
  });

  it('reports a retirement among competing versions, and a supersession resolves them', () => {
    version('define', 'A hold.', 'First.');
    const first = (journal().at(-1) as string).replace(/\.json$/, '');
    const dir = join(repo, 'design/journal');
    const sibling = (id: string, body: object) =>
      writeFileSync(
        join(dir, `${id}.json`),
        JSON.stringify({
          id,
          at: '2026-01-01T00:00:00.000Z',
          context: 'booking',
          name: 'hold',
          supersedes: [first],
          ...body,
        }),
      );
    sibling('01Z00000000000000000000001', {
      kind: 'retire',
      reason: 'Left drops it.',
    });
    sibling('01Z00000000000000000000002', {
      kind: 'supersede',
      wording: 'A hold lasts longer.',
      builtFrom: [],
      reason: 'Right keeps it.',
    });
    expect(concepts('design')).toMatchObject({
      contexts: [
        {
          concepts: [],
          retired: [],
          competing: [
            {
              name: 'hold',
              versions: [
                { retired: true, reason: 'Left drops it.' },
                {
                  wording: 'A hold lasts longer.',
                  builtFrom: [],
                  reason: 'Right keeps it.',
                },
              ],
            },
          ],
        },
      ],
    });
    const resolved = version('supersede', 'A hold settles.', 'Both agree.');
    expect(resolved).toMatchObject({
      supersedes: ['01Z00000000000000000000001', '01Z00000000000000000000002'],
    });
    expect(concepts('design')).toMatchObject({
      contexts: [{ competing: [], concepts: [{ name: 'hold' }] }],
    });
  });

  it('refuses a flag given twice, a retired concept, and accepting a decision that is not open', () => {
    version('define', 'A hold.', 'First.');
    refused(
      [
        'supersede',
        'hold',
        '--context',
        'booking',
        '--wording',
        'One.',
        '--wording',
        'Two.',
        '--reason',
        'R.',
      ],
      /^concepts supersede: --wording is given 2 times/,
    );
    concepts('retire', 'hold', '--context', 'booking', '--reason', 'Gone.');
    refused(
      ['retire', 'hold', '--context', 'booking', '--reason', 'Again.'],
      /^concepts retire: .*retired/,
    );
    refused(
      [
        'supersede',
        'hold',
        '--context',
        'booking',
        '--wording',
        'Back.',
        '--reason',
        'R.',
      ],
      /^concepts supersede: .*retired/,
    );
    refused(
      [
        'define',
        'hold',
        '--context',
        'booking',
        '--wording',
        'Anew.',
        '--reason',
        'R.',
      ],
      /^concepts define: .*already has/,
    );
    concepts(
      'decide',
      'd',
      '--context',
      'booking',
      '--title',
      'T',
      '--situation',
      'S',
      '--decision',
      'D',
      '--consequences',
      'C',
      '--status',
      'accepted',
    );
    refused(['accept', 'd'], /^concepts accept: .*accepted/);
    refused(['accept', 'absent'], /^concepts accept: /);
  });

  it('refuses an unknown context or concept in a query', () => {
    refused(['design', '--context', 'absent'], /^concepts design: /);
    refused(
      ['history', 'absent', '--context', 'booking'],
      /^concepts history: /,
    );
    refused(['state', '--context', 'absent'], /^concepts state: /);
  });

  it('refuses a journal entry that is not one, rather than reading past it', () => {
    writeFileSync(
      join(repo, 'design/journal', '01Z00000000000000000000009.json'),
      '{"id":"01Z00000000000000000000009","kind":"note"}',
    );
    expect(() => concepts('design')).toThrow(
      /^concepts design: the journal entry .* is not an entry/,
    );
  });
});

it('refuses a working directory outside any git repository', () => {
  const outside = mkdtempSync(join(tmpdir(), 'concepts-outside-'));
  try {
    expect(() => dispatchConcepts(['design'], { from: outside })).toThrow(
      /^concepts design: .*not inside a git repository/,
    );
  } finally {
    rmSync(outside, { recursive: true, force: true });
  }
});
