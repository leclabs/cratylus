// The concepts capability as a library: `dispatchConcepts` over a scratch git
// repository's journal. The command-line examples (cli `test/concept-journal`)
// bind the contract end to end; these hold what they do not reach: ids minted
// past the journal's last, a retirement among competing versions, flags given
// twice, a journal entry that is not one, and a working directory outside git.
// Entries of unknown kinds are held in `tolerant-reader.test.ts`.

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
import { ACTING_AGENT_ENV } from '../src/acting-agent.js';
import { deliverContext } from '../src/capabilities/concepts/delivered.js';
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

  it('records who appended an entry: the acting agent', () => {
    process.env[ACTING_AGENT_ENV] = 'keeper';
    try {
      expect(
        version('define', 'A hold lasts ten minutes.', 'First.'),
      ).toMatchObject({ kind: 'define', by: 'keeper' });
    } finally {
      Reflect.deleteProperty(process.env, ACTING_AGENT_ENV);
    }
  });

  it('names the maker git’s user when no agent is named', () => {
    version('define', 'A hold lasts ten minutes.', 'First.');
    execFileSync('git', ['config', 'user.name', 'stranger'], { cwd: repo });
    const changed = version(
      'supersede',
      'A hold lasts five minutes.',
      'Sharper.',
    ) as Record<string, unknown>;
    expect(changed).toMatchObject({ by: 'stranger' });
    expect(changed).not.toHaveProperty('warnings');
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

  it('refuses a version with no wording, asking for its correction', () => {
    for (const verb of ['define', 'supersede'])
      refused(
        [verb, 'hold', '--context', 'booking', '--reason', 'R.'],
        new RegExp(`^concepts ${verb}: give the correction with --wording`),
      );
  });

  it('refuses a flag given twice, retiring twice, and accepting a decision that is not open', () => {
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
    const standing = concepts('design') as { contexts: object[] };
    expect(standing.contexts[0]).not.toHaveProperty('retired');
    expect(concepts('design', '--history')).toMatchObject({
      contexts: [
        { concepts: [], retired: [{ name: 'hold', reason: 'Gone.' }] },
      ],
    });
    const back = concepts(
      'supersede',
      'hold',
      '--context',
      'booking',
      '--wording',
      'Back.',
      '--reason',
      'R.',
    );
    expect(concepts('design', '--history')).toMatchObject({
      contexts: [
        { concepts: [{ name: 'hold', wording: 'Back.' }], retired: [] },
      ],
    });
    expect(back).toMatchObject({ kind: 'supersede' });
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
    const file = join(
      repo,
      'design/journal',
      '01Z00000000000000000000009.json',
    );
    for (const body of [
      '{"id":"01Z00000000000000000000009"}',
      '{"id":"01Z00000000000000000000008","kind":"note"}',
      '{"id":"01Z00000000000000000000009","kind":7}',
    ]) {
      writeFileSync(file, body);
      expect(() => concepts('design')).toThrow(
        /^concepts design: the journal entry .*01Z00000000000000000000009\.json is not an entry/,
      );
    }
  });

  it('reads entries written before identities could be shared, by their names', () => {
    const dir = join(repo, 'design/journal');
    const legacy = (id: string, body: object) =>
      writeFileSync(
        join(dir, `${id}.json`),
        JSON.stringify({ id, at: '2026-01-01T00:00:00.000Z', ...body }),
      );
    const decision = (decisionId: string, supersedes: string | null) => ({
      kind: 'decide',
      decisionId,
      context: 'booking',
      title: 'T',
      situation: 'S',
      decision: 'D',
      consequences: 'C',
      status: 'open',
      supersedes,
    });
    legacy('01Z00000000000000000000001', decision('a', null));
    legacy('01Z00000000000000000000002', {
      kind: 'accept',
      decisionId: 'a',
    });
    legacy('01Z00000000000000000000003', decision('b', null));
    legacy('01Z00000000000000000000004', decision('c', 'b'));
    expect(concepts('decisions', '--history')).toMatchObject({
      decisions: [
        { entry: '01Z00000000000000000000001', id: 'a', status: 'accepted' },
        {
          entry: '01Z00000000000000000000003',
          id: 'b',
          status: 'superseded',
          supersededBy: ['c'],
        },
        { entry: '01Z00000000000000000000004', id: 'c', status: 'open' },
      ],
    });
    refused(['accept', 'a'], /^concepts accept: .*accepted/);
  });

  it('settles a competing context description with one superseding every current one', () => {
    writeFileSync(
      join(repo, 'design/journal', '01Z00000000000000000000001.json'),
      JSON.stringify({
        id: '01Z00000000000000000000001',
        at: '2026-01-01T00:00:00.000Z',
        kind: 'context',
        name: 'booking',
        subject: 'Other.',
        relation: '',
      }),
    );
    expect(concepts('design')).toMatchObject({
      contexts: [
        {
          name: 'booking',
          subject: null,
          relation: null,
          competingDescriptions: [
            { subject: 'Booking.', relation: '' },
            { subject: 'Other.', relation: '' },
          ],
        },
      ],
    });
    const settled = concepts(
      'context',
      'booking',
      '--subject',
      'Both.',
      '--reason',
      'Keep both branches in one settled description.',
    );
    expect(settled).toMatchObject({ supersedes: expect.any(Array) });
    expect(concepts('design')).toMatchObject({
      contexts: [{ subject: 'Both.', relation: '', competingDescriptions: [] }],
    });
    refused(
      ['context', 'booking', '--subject', 'Again.'],
      /^concepts context: .*already recorded/,
    );
  });

  it('records every new decision as realization, takes no kind, and reads recorded kinds as history', () => {
    const decide = (id: string, ...more: string[]) =>
      concepts(
        'decide',
        id,
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
        'open',
        ...more,
      ) as { id: string };
    refused(
      [
        'decide',
        'x',
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
        'open',
        '--kind',
        'meaning',
      ],
      /^concepts decide: it does not take --kind/,
    );
    refused(
      ['classify', 'x', '--kind', 'meaning'],
      /^concepts: unknown verb 'classify'/,
    );
    const recorded = decide('recorded');
    expect(recorded).toMatchObject({
      kind: 'decide',
      decisionKind: 'realization',
    });
    // Entries recorded before: a decision of meaning, then its classification.
    const dir = join(repo, 'design/journal');
    const write = (id: string, body: object) =>
      writeFileSync(
        join(dir, `${id}.json`),
        JSON.stringify({ id, at: '2026-01-01T00:00:00.000Z', ...body }),
      );
    write('01A00000000000000000000001', {
      kind: 'decide',
      decisionId: 'told',
      context: 'booking',
      title: 'T',
      situation: 'S',
      decision: 'D',
      consequences: 'C',
      status: 'open',
      supersedes: null,
      decisionKind: 'meaning',
    });
    write('01A00000000000000000000002', {
      kind: 'classify',
      decisionId: 'told',
      entry: '01A00000000000000000000001',
      decisionKind: 'realization',
      reason: 'It constrains.',
    });
    expect(concepts('decisions', '--history')).toMatchObject({
      decisions: [
        {
          id: 'told',
          kind: 'realization',
          kinds: [
            { entry: '01A00000000000000000000001', kind: 'meaning' },
            {
              entry: '01A00000000000000000000002',
              kind: 'realization',
              reason: 'It constrains.',
            },
          ],
        },
        {
          id: 'recorded',
          kind: 'realization',
          kinds: [{ entry: recorded.id, kind: 'realization' }],
        },
      ],
    });
    for (const decision of (concepts('decisions') as { decisions: object[] })
      .decisions)
      expect(Object.keys(decision)).not.toContain('kinds');
  });

  it('changes a context none of whose descriptions is current only by giving every field', () => {
    const [recorded] = journal();
    const id = (recorded as string).slice(0, -'.json'.length);
    writeFileSync(
      join(repo, 'design/journal', '01Z00000000000000000000001.json'),
      JSON.stringify({
        id: '01Z00000000000000000000001',
        at: '2026-01-01T00:00:00.000Z',
        kind: 'context',
        name: 'booking',
        subject: 'Other.',
        relation: '',
        reason: 'Crafted.',
        supersedes: [id, '01Z00000000000000000000001'],
      }),
    );
    expect(concepts('design')).toMatchObject({
      contexts: [{ subject: null, relation: null, competingDescriptions: [] }],
    });
    expect(concepts('leakage')).toEqual({ warnings: [] });
    refused(
      ['context', 'booking', '--subject', 'Again.', '--reason', 'Settle.'],
      /^concepts context: the bounded context 'booking' has no current description; give --relation/,
    );
    concepts(
      'context',
      'booking',
      '--subject',
      'Again.',
      '--relation',
      '',
      '--reason',
      'Settle.',
    );
    expect(concepts('design')).toMatchObject({
      contexts: [{ subject: 'Again.', relation: '' }],
    });
  });

  it('reads the design state from the journal alone, appending nothing', () => {
    concepts(
      'define',
      'hold',
      '--context',
      'booking',
      '--wording',
      'A seat kept aside.',
      '--reason',
      'First.',
    );
    concepts(
      'define',
      'seat',
      '--context',
      'booking',
      '--wording',
      'A place.',
      '--reason',
      'First.',
    );
    concepts('retire', 'seat', '--context', 'booking', '--reason', 'Gone.');
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
      'open',
    );
    concepts('context', 'other', '--subject', 'Other.');
    const before = journal();
    expect(concepts('state', '--context', 'booking')).toEqual({
      purpose: null,
      contexts: [
        {
          name: 'booking',
          subject: 'Booking.',
          relation: '',
          concepts: ['hold ≜ A seat kept aside.'],
          competing: [],
        },
      ],
    });
    expect(journal()).toEqual(before);
    expect(concepts('state')).toMatchObject({
      contexts: [{ name: 'booking' }, { name: 'other' }],
    });
    refused(
      ['state', '--history'],
      /^concepts state: it does not take --history/,
    );
    refused(['overview'], /^concepts: unknown verb 'overview'/);
  });

  it('records the project’s purpose, changes it only with a reason, and shows it first', () => {
    expect(Object.keys(concepts('state') as object)[0]).toBe('purpose');
    expect(concepts('state')).toMatchObject({ purpose: null });
    refused(
      ['purpose', '--statement', 'Seats.', '--reason', 'Why.'],
      /^concepts purpose: the project has no purpose recorded/,
    );
    const first = concepts('purpose', '--statement', 'Book seats.') as {
      id: string;
    };
    expect(first).toMatchObject({ kind: 'purpose', supersedes: [] });
    refused(
      ['purpose', '--statement', 'Again.'],
      /^concepts purpose: the project’s purpose is already recorded/,
    );
    expect(
      concepts('purpose', '--statement', 'Book and pay.', '--reason', 'Pay.'),
    ).toMatchObject({ kind: 'purpose', supersedes: [first.id] });
    const answer = concepts('state') as Record<string, unknown>;
    expect(Object.keys(answer)[0]).toBe('purpose');
    expect(answer.purpose).toBe('Book and pay.');
  });

  it('reports purposes recorded differently on merged branches as competing until one settles them', () => {
    for (const [n, statement] of [
      [1, 'Book seats.'],
      [2, 'Sell seats.'],
    ] as const) {
      const id = `01J0000000000000000000000${n}`;
      writeFileSync(
        join(repo, 'design/journal', `${id}.json`),
        JSON.stringify({
          id,
          at: '2026-01-01T00:00:00.000Z',
          kind: 'purpose',
          statement,
          supersedes: [],
        }),
      );
    }
    expect(concepts('state')).toMatchObject({
      purpose: null,
      competingPurposes: ['Book seats.', 'Sell seats.'],
    });
    concepts('purpose', '--statement', 'Book seats.', '--reason', 'Settle.');
    expect(concepts('state')).toMatchObject({ purpose: 'Book seats.' });
    expect(concepts('state')).not.toHaveProperty('competingPurposes');
  });

  it('shows only standing decisions, history when asked, and every example file', () => {
    /** The flags recording decision `id` in booking, accepted. */
    const decideFlags = (id: string) => [
      '--context',
      'booking',
      '--title',
      `${id} title`,
      '--situation',
      'S',
      '--decision',
      'D',
      '--consequences',
      'C',
      '--status',
      'accepted',
    ];
    const decide = (id: string, ...more: string[]) =>
      concepts('decide', id, ...decideFlags(id), ...more);
    type Listed = {
      decisions: {
        id: string;
        status: string;
        deprecation?: unknown;
        cut?: string;
      }[];
    };
    const decisions = (...flags: string[]): Listed['decisions'] => {
      const answer = concepts('decisions', ...flags) as Listed;
      return answer.decisions;
    };
    const listed = (...flags: string[]) =>
      decisions(...flags).map(({ id, status, deprecation }) => ({
        id,
        status,
        ...(deprecation === undefined ? {} : { deprecation }),
      }));
    // Decisions recorded by an earlier workflow name the cut they were about
    // or the example files they keep; no verb records either now, so each is
    // written as it was recorded, and each is read by its own status alone.
    const recorded = (n: number, id: string, fields: object) => {
      const entry = `01J${'0'.repeat(22)}${n}`;
      writeFileSync(
        join(repo, 'design/journal', `${entry}.json`),
        JSON.stringify({
          id: entry,
          at: '2026-01-01T00:00:00.000Z',
          kind: 'decide',
          decisionId: id,
          context: 'booking',
          title: `${id} title`,
          situation: 'S',
          decision: 'D',
          consequences: 'C',
          status: 'accepted',
          supersedes: null,
          ...fields,
        }),
      );
    };
    recorded(1, 'about', { cut: 'stalls' });
    recorded(2, 'keeper', { keeps: ['booking/seats'] });
    decide('rule');
    decide('old');
    decide('new', '--supersedes', 'old');
    refused(
      ['decide', 'cutting', ...decideFlags('cutting'), '--cut', 'seats'],
      /^concepts decide: it does not take --cut/,
    );
    refused(
      ['decide', 'keeping', ...decideFlags('keeping'), '--keeps', 'b/s'],
      /^concepts decide: it does not take --keeps/,
    );
    refused(
      ['deprecate', 'rule'],
      /^concepts deprecate: give why it no longer applies with --reason/,
    );
    refused(
      ['deprecate', 'old', '--reason', 'Done.'],
      /^concepts deprecate: the decision 'old' is superseded; only a standing decision is deprecated/,
    );
    const deprecated = concepts('deprecate', 'rule', '--reason', 'Done.') as {
      id: string;
    };
    expect(deprecated).toMatchObject({
      kind: 'deprecate',
      decisionId: 'rule',
      reason: 'Done.',
    });
    refused(
      ['deprecate', 'rule', '--reason', 'Again.'],
      /^concepts deprecate: the decision 'rule' is deprecated/,
    );
    expect(listed()).toEqual([
      { id: 'about', status: 'accepted' },
      { id: 'keeper', status: 'accepted' },
      { id: 'new', status: 'accepted' },
    ]);
    expect(listed('--history')).toEqual([
      { id: 'about', status: 'accepted' },
      { id: 'keeper', status: 'accepted' },
      {
        id: 'rule',
        status: 'deprecated',
        deprecation: { entry: deprecated.id, reason: 'Done.' },
      },
      { id: 'old', status: 'superseded' },
      { id: 'new', status: 'accepted' },
    ]);
    // The cut a recorded decision names is history, shown only when asked.
    expect(decisions().find((d) => d.id === 'about')).not.toHaveProperty('cut');
    expect(decisions('--history').find((d) => d.id === 'about')?.cut).toBe(
      'stalls',
    );
    // Standing decisions are read with the decisions reading alone.
    expect(JSON.stringify(concepts('state'))).not.toContain('title');

    // Every example file present is current.
    mkdirSync(join(repo, 'design/examples/booking'), { recursive: true });
    for (const [story, call] of [
      ['seats', 'holdSeat'],
      ['rows', 'holdRow'],
    ])
      writeFileSync(
        join(repo, 'design/examples/booking', `${story}.md`),
        `1. (hold) Given one, when held, then \`${call}()\` runs.\n`,
      );
    const answer = concepts('leakage') as {
      warnings: { passage: { kind: string; file?: string } }[];
    };
    expect(
      answer.warnings
        .filter((w) => w.passage.kind === 'example')
        .map((w) => w.passage.file)
        .sort(),
    ).toEqual([
      'design/examples/booking/rows.md',
      'design/examples/booking/seats.md',
    ]);
  });
});

describe('renaming a concept (0322)', () => {
  const recordAs = (verb: string, name: string, ...more: string[]) =>
    concepts(verb, name, '--context', 'booking', ...more) as Record<
      string,
      unknown
    >;
  const rename = (name: string, to: string, wording: string) =>
    recordAs(
      'supersede',
      name,
      '--rename',
      to,
      '--wording',
      wording,
      '--reason',
      `${to} is the nearer term.`,
    );
  const state = () =>
    (concepts('state') as { contexts: { concepts: string[] }[] }).contexts[0]
      ?.concepts;

  beforeEach(() => {
    concepts('context', 'booking', '--subject', 'Booking.');
    version('define', 'Lasts ten minutes.', 'First.');
    recordAs(
      'define',
      'reservation',
      '--wording',
      'Taken on a seat.',
      '--reason',
      'Seats are reserved.',
      '--built-from',
      'hold',
    );
  });

  it('reads the concept under its new name only, its history under either name, and its parts by the new name', () => {
    expect(rename('hold', 'claim', 'Lasts until paid.')).toMatchObject({
      kind: 'rename',
      name: 'claim',
      was: 'hold',
      wording: 'Lasts until paid.',
    });
    expect(state()).toEqual([
      'claim ≜ Lasts until paid.',
      'reservation ≜ Taken on a seat.',
    ]);
    expect(concepts('design')).toMatchObject({
      contexts: [
        {
          concepts: [
            { name: 'claim', wording: 'Lasts until paid.', builtFrom: [] },
            { name: 'reservation', builtFrom: ['claim'] },
          ],
        },
      ],
    });
    expect(JSON.stringify(concepts('design', '--history'))).not.toContain(
      '"hold"',
    );
    const history = concepts('history', 'claim', '--context', 'booking');
    expect(concepts('history', 'hold', '--context', 'booking')).toEqual(
      history,
    );
    expect(history).toMatchObject({
      name: 'claim',
      versions: [
        {
          kind: 'define',
          name: 'hold',
          wording: 'Lasts ten minutes.',
          reason: 'First.',
        },
        {
          kind: 'rename',
          name: 'claim',
          was: 'hold',
          wording: 'Lasts until paid.',
          reason: 'claim is the nearer term.',
        },
      ],
    });
    // A reference is kept as written in the history.
    expect(
      concepts('history', 'reservation', '--context', 'booking'),
    ).toMatchObject({ versions: [{ builtFrom: ['hold'] }] });
    // A verb naming the concept by an earlier name acts on it, under its name.
    expect(version('supersede', 'Lasts an hour.', 'Longer.')).toMatchObject({
      kind: 'supersede',
      name: 'claim',
    });
    expect(recordAs('retire', 'hold', '--reason', 'Dropped.')).toMatchObject({
      name: 'claim',
    });
  });

  it('keeps a name its concept’s: refusing it to a define and to another concept’s rename, and a rename to the current name', () => {
    rename('hold', 'claim', 'Lasts until paid.');
    rename('reservation', 'booking slot', 'Taken on a seat.');
    const define = (name: string) => [
      'define',
      name,
      '--context',
      'booking',
      '--wording',
      'New.',
      '--reason',
      'New.',
    ];
    const renaming = (name: string, to: string) => [
      'supersede',
      name,
      '--context',
      'booking',
      '--rename',
      to,
      '--wording',
      'New.',
      '--reason',
      'New.',
    ];
    refused(define('hold'), /name 'hold' is one the concept 'claim'/);
    refused(define('claim'), /already has the concept 'claim'/);
    refused(
      renaming('claim', 'booking slot'),
      /name 'booking slot' is one the concept 'booking slot'/,
    );
    refused(
      renaming('claim', 'reservation'),
      /name 'reservation' is one the concept 'booking slot'/,
    );
    refused(renaming('hold', 'claim'), /'claim' .* is already named 'claim'/);
    // Its own earlier name may be taken back.
    rename('claim', 'hold', 'Lasts ten minutes again.');
    expect(state()).toEqual([
      'hold ≜ Lasts ten minutes again.',
      'booking slot ≜ Taken on a seat.',
    ]);
  });

  /** Write a version recorded on another line of work, superseding the first
   *  version of `hold` unless it says otherwise. */
  const sibling = (id: string, body: object) =>
    writeFileSync(
      join(repo, 'design/journal', `${id}.json`),
      JSON.stringify({
        id,
        at: '2026-01-01T00:00:00.000Z',
        context: 'booking',
        wording: `${id.slice(-1)} wording.`,
        builtFrom: [],
        reason: 'Branch.',
        supersedes: [(journal()[1] as string).replace(/\.json$/, '')],
        ...body,
      }),
    );

  it('lists versions naming the concept differently as competing, under the name it had before them', () => {
    sibling('01Z00000000000000000000001', {
      kind: 'rename',
      name: 'claim',
      was: 'hold',
    });
    sibling('01Z00000000000000000000002', { kind: 'supersede', name: 'hold' });
    expect(concepts('design')).toMatchObject({
      contexts: [
        {
          concepts: [{ name: 'reservation', builtFrom: ['hold'] }],
          competing: [
            {
              name: 'hold',
              versions: [
                { name: 'claim', wording: '1 wording.' },
                { wording: '2 wording.' },
              ],
            },
          ],
        },
      ],
    });
    expect(
      (concepts('state') as { contexts: { competing: unknown[] }[] })
        .contexts[0]?.competing,
    ).toEqual([
      { name: 'hold', versions: ['claim ≜ 1 wording.', 'hold ≜ 2 wording.'] },
    ]);
    expect(rename('claim', 'claim', 'Settled.')).toMatchObject({
      was: 'hold',
      supersedes: ['01Z00000000000000000000001', '01Z00000000000000000000002'],
    });
    expect(state()).toEqual([
      'claim ≜ Settled.',
      'reservation ≜ Taken on a seat.',
    ]);
  });

  it.each([
    [
      'the rename first',
      ['01Z00000000000000000000001', '01Z00000000000000000000002'],
    ],
    [
      'the define first',
      ['01Z00000000000000000000002', '01Z00000000000000000000001'],
    ],
  ])(
    'joins a rename to a name and a define of it on another line into one concept, competing, %s',
    (_, [renameId, defineId]) => {
      sibling(renameId as string, {
        kind: 'rename',
        name: 'claim',
        was: 'hold',
      });
      sibling(defineId as string, {
        kind: 'define',
        name: 'claim',
        supersedes: [],
      });
      const design = concepts('design') as {
        contexts: {
          concepts: { name: string }[];
          competing: { name: string; versions: { name?: string }[] }[];
        }[];
      };
      expect(design.contexts[0]?.concepts.map((c) => c.name)).toEqual([
        'reservation',
      ]);
      // Every current version gives it one name, so it is listed under that.
      const [competing] = design.contexts[0]?.competing ?? [];
      expect(competing?.name).toBe('claim');
      expect(competing?.versions).toHaveLength(2);
      for (const v of competing?.versions ?? [])
        expect(v).not.toHaveProperty('name');
      expect(design.contexts[0]?.competing).toHaveLength(1);
      const history = concepts('history', 'claim', '--context', 'booking') as {
        versions: { kind: string }[];
      };
      expect(history.versions.map((v) => v.kind).sort()).toEqual([
        'define',
        'define',
        'rename',
      ]);
      expect(concepts('history', 'hold', '--context', 'booking')).toEqual(
        history,
      );
    },
  );

  it('lists competing versions at different depths under the latest version they all supersede', () => {
    rename('hold', 'claim', 'Lasts until paid.');
    version('supersede', 'Lasts an hour.', 'Longer.');
    sibling('01Z00000000000000000000001', { kind: 'supersede', name: 'hold' });
    expect(
      (concepts('state') as { contexts: { competing: unknown[] }[] })
        .contexts[0]?.competing,
    ).toEqual([
      {
        name: 'hold',
        versions: ['claim ≜ Lasts an hour.', 'hold ≜ 1 wording.'],
      },
    ]);
  });

  it('delivers a context holding a renamed concept under its current name, its references rewritten', () => {
    rename('hold', 'claim', 'Lasts until paid.');
    const delivered = deliverContext({
      from: repo,
      context: 'booking',
      origin: 'cratylus',
      version: '1.0.0',
      position: 0,
    });
    expect(delivered.concepts).toEqual([
      { name: 'claim', wording: 'Lasts until paid.', builtFrom: [] },
      {
        name: 'reservation',
        wording: 'Taken on a seat.',
        builtFrom: ['claim'],
      },
    ]);
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

describe('retiring a bounded context', () => {
  const retire = () =>
    concepts('retire', '--context', 'booking', '--reason', 'Dropped.') as {
      id: string;
      kind: string;
      supersedes: string[];
    };
  let described: string;
  beforeEach(() => {
    described = (
      concepts(
        'context',
        'booking',
        '--subject',
        'Booking.',
        '--relation',
        'Upstream.',
      ) as { id: string }
    ).id;
    concepts('context', 'fleet', '--subject', 'Fleet.');
    version('define', 'A hold lasts ten minutes.', 'First.');
    concepts(
      'decide',
      'd1',
      '--context',
      'booking',
      '--title',
      'Holds expire',
      '--situation',
      'S',
      '--decision',
      'D',
      '--consequences',
      'C',
      '--status',
      'accepted',
    );
    mkdirSync(join(repo, 'design/examples/booking'), { recursive: true });
    writeFileSync(
      join(repo, 'design/examples/booking/holds.md'),
      '1. (hold) Given one, when held, then `expire()` runs.\n',
    );
  });
  const names = (answer: unknown) =>
    (answer as { contexts: { name: string }[] }).contexts.map((c) => c.name);
  const decisions = (...argv: string[]) =>
    (concepts('decisions', ...argv) as { decisions: { id: string }[] })
      .decisions;

  it('records a retire-context entry superseding the current description', () => {
    expect(retire()).toMatchObject({
      kind: 'retire-context',
      context: 'booking',
      reason: 'Dropped.',
      supersedes: [described],
    });
  });

  it('leaves it out of every reading of the design, its history kept', () => {
    const retirement = retire();
    for (const reading of [['state'], ['design'], ['design', '--history']])
      expect(names(concepts(...reading)), reading.join(' ')).toEqual(['fleet']);
    expect(names(concepts('state', '--context', 'booking'))).toEqual([]);
    const leakage = concepts('leakage') as { warnings: unknown[] };
    expect(JSON.stringify(leakage.warnings)).not.toContain('booking');
    expect(decisions()).toEqual([]);
    expect(decisions('--history').map((d) => d.id)).toEqual(['d1']);
    expect(concepts('history', '--context', 'booking')).toMatchObject({
      versions: [
        { id: described, subject: 'Booking.' },
        {
          id: retirement.id,
          retired: true,
          reason: 'Dropped.',
          supersedes: [described],
        },
      ],
    });
    expect(concepts('history', 'hold', '--context', 'booking')).toMatchObject({
      versions: [{ kind: 'define' }],
    });
  });

  it('refuses recording into it, naming the remedy', () => {
    retire();
    const into =
      /^concepts \w+: .*'booking' is retired; bring it back with concepts context and a --reason/;
    refused(
      [
        'define',
        'slot',
        '--context',
        'booking',
        '--wording',
        'W',
        '--reason',
        'R',
      ],
      into,
    );
    refused(
      [
        'supersede',
        'hold',
        '--context',
        'booking',
        '--wording',
        'W',
        '--reason',
        'R',
      ],
      into,
    );
    refused(['retire', 'hold', '--context', 'booking', '--reason', 'R'], into);
    refused(
      [
        'decide',
        'd2',
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
        'open',
      ],
      into,
    );
  });

  it('a context change with a reason brings it back as it stood', () => {
    const retirement = retire();
    expect(
      concepts('context', 'booking', '--reason', 'Needed again.'),
    ).toMatchObject({
      subject: 'Booking.',
      relation: 'Upstream.',
      supersedes: [retirement.id, described],
    });
    expect(concepts('state', '--context', 'booking')).toMatchObject({
      contexts: [
        { name: 'booking', concepts: ['hold ≜ A hold lasts ten minutes.'] },
      ],
    });
    expect(decisions().map((d) => d.id)).toEqual(['d1']);
    expect(retire()).toMatchObject({ kind: 'retire-context' });
  });

  it('a retirement and a description both current compete until settled', () => {
    const retirement = retire();
    const elsewhere = '01Z00000000000000000000001';
    writeFileSync(
      join(repo, 'design/journal', `${elsewhere}.json`),
      JSON.stringify({
        id: elsewhere,
        at: '2026-01-01T00:00:00.000Z',
        kind: 'context',
        name: 'booking',
        subject: 'Booking elsewhere.',
        relation: 'Upstream.',
        reason: 'Another line of work.',
        supersedes: [described],
      }),
    );
    expect(names(concepts('state'))).toEqual(['booking', 'fleet']);
    expect(concepts('state', '--context', 'booking')).toMatchObject({
      contexts: [
        {
          subject: null,
          relation: null,
          competingDescriptions: [
            { retired: true, reason: 'Dropped.' },
            { subject: 'Booking elsewhere.', relation: 'Upstream.' },
          ],
          concepts: ['hold ≜ A hold lasts ten minutes.'],
        },
      ],
    });
    expect(decisions().map((d) => d.id)).toEqual(['d1']);
    // Retiring it again settles both: it is then retired.
    expect(retire().supersedes).toEqual([elsewhere, retirement.id]);
    expect(names(concepts('state'))).toEqual(['fleet']);
  });

  it('a description with a reason settles a competing retirement', () => {
    const retirement = retire();
    const elsewhere = '01Z00000000000000000000001';
    writeFileSync(
      join(repo, 'design/journal', `${elsewhere}.json`),
      JSON.stringify({
        id: elsewhere,
        at: '2026-01-01T00:00:00.000Z',
        kind: 'context',
        name: 'booking',
        subject: 'Booking elsewhere.',
        relation: 'Upstream.',
        reason: 'Another line of work.',
        supersedes: [described],
      }),
    );
    expect(
      concepts(
        'context',
        'booking',
        '--subject',
        'Booking.',
        '--reason',
        'Settled.',
      ),
    ).toMatchObject({ supersedes: [elsewhere, retirement.id, described] });
    expect(concepts('state', '--context', 'booking')).toMatchObject({
      contexts: [{ subject: 'Booking.', relation: 'Upstream.' }],
    });
    expect(concepts('state', '--context', 'booking')).not.toMatchObject({
      contexts: [{ competingDescriptions: expect.anything() }],
    });
  });

  it('refuses an unknown, an already retired or a delivered context', () => {
    refused(
      ['retire', '--context', 'nowhere', '--reason', 'R'],
      /no bounded context 'nowhere'/,
    );
    retire();
    refused(
      ['retire', '--context', 'booking', '--reason', 'R'],
      /'booking' is already retired/,
    );
    const delivered = {
      origin: 'cratylus',
      version: '3.2.1',
      context: 'workflow',
      identity: '01ARZ3NDEKTSV4RRFFQ69G5F00',
      position: 1,
      subject: 'How the work is done.',
      relation: '',
      concepts: [],
    };
    const before = journal();
    expect(() =>
      dispatchConcepts(
        ['retire', '--context', 'cratylus:workflow', '--reason', 'R'],
        { from: repo, delivered: [delivered] },
      ),
    ).toThrow(/^concepts retire: .*is delivered by cratylus .*read-only/);
    expect(journal()).toEqual(before);
  });
});
