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
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';
import { dispatchWorkPackage } from '../src/capabilities/work-package/index.js';
import { appendLifecycle } from '../src/lifecycle/index.js';

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

  it('names one maker for the record and the freeze: git’s user when no agent is named', () => {
    version('define', 'A hold lasts ten minutes.', 'First.');
    mkdirSync(join(repo, 'design/examples/booking'), { recursive: true });
    writeFileSync(
      join(repo, 'design/examples/booking/seats.md'),
      '1. (hold) Given a seat, when held, then it is kept aside.\n',
    );
    dispatchWorkPackage(
      [
        'open',
        '--cut',
        'seats',
        '--branch',
        'b',
        '--architect',
        'booking=keeper',
      ],
      { from: repo },
    );
    const asGitUser = (name: string) => {
      execFileSync('git', ['config', 'user.name', name], { cwd: repo });
      return version('supersede', 'A hold lasts five minutes.', 'Sharper.');
    };
    const architect = asGitUser('keeper') as Record<string, unknown>;
    expect(architect).toMatchObject({ by: 'keeper' });
    expect(architect).not.toHaveProperty('warnings');
    expect(asGitUser('stranger')).toMatchObject({
      by: 'stranger',
      warnings: [
        { freeze: ['seats'], message: expect.stringContaining("'stranger'") },
      ],
    });
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
    expect(concepts('design')).toMatchObject({
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

  it('records a decision’s kind on it or by classification, the latest governing', () => {
    const decide = (id: string, ...kind: string[]) =>
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
        ...kind,
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
        'other',
      ],
      /^concepts decide: the kind is 'other'/,
    );
    const told = decide('told', '--kind', 'meaning');
    const untold = decide('untold');
    refused(
      ['classify', 'absent', '--kind', 'meaning'],
      /^concepts classify: /,
    );
    refused(['classify', 'untold'], /^concepts classify: give the kind/);
    refused(
      ['classify', 'untold', '--kind', 'both'],
      /^concepts classify: the kind is 'both'/,
    );
    refused(
      ['classify', 'untold', '--kind', 'meaning', '--reason', ' '],
      /^concepts classify: the reason is empty/,
    );
    refused(
      ['classify', 'told', '--kind', 'realization'],
      /^concepts classify: .*already recorded as meaning; give --reason/,
    );
    const first = concepts('classify', 'untold', '--kind', 'realization') as {
      id: string;
    };
    expect(first).toMatchObject({
      kind: 'classify',
      decisionId: 'untold',
      entry: untold.id,
      decisionKind: 'realization',
    });
    expect(first).not.toHaveProperty('reason');
    refused(
      ['classify', 'untold', '--kind', 'meaning'],
      /^concepts classify: .*already recorded as realization; give --reason/,
    );
    const again = concepts(
      'classify',
      told.id,
      '--kind',
      'realization',
      '--reason',
      'It constrains.',
    ) as { id: string };
    expect(concepts('decisions')).toMatchObject({
      decisions: [
        {
          id: 'told',
          kind: 'realization',
          kinds: [
            { entry: told.id, kind: 'meaning' },
            { entry: again.id, kind: 'realization', reason: 'It constrains.' },
          ],
        },
        {
          id: 'untold',
          kind: 'realization',
          kinds: [{ entry: first.id, kind: 'realization' }],
        },
      ],
    });
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

  it('computes the overview from the journal and the ledger, appending nothing', () => {
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
    concepts('context', 'other', '--subject', 'Other.');
    mkdirSync(join(repo, 'design/examples/booking'), { recursive: true });
    writeFileSync(
      join(repo, 'design/examples/booking/seats.md'),
      '1. (hold) Given a seat, when held, then it is kept aside.\n',
    );
    const from = join(repo, 'nested');
    dispatchWorkPackage(
      [
        'open',
        '--cut',
        'seats',
        '--branch',
        'feature/seats',
        '--architect',
        'booking=desk',
      ],
      { from },
    );
    const overview = () =>
      concepts('overview', '--context', 'booking') as {
        contexts: {
          context: string;
          cutsInFlight: unknown[];
          account: string;
        }[];
      };
    expect(overview().contexts[0]?.cutsInFlight).toEqual([]);
    appendLifecycle(from, {
      kind: 'dispatched',
      transition: 'seats-lead',
      cut: 'seats',
      role: 'lead',
      run: 'lead',
    });
    const before = journal();
    expect(overview()).toMatchObject({
      contexts: [
        {
          context: 'booking',
          subject: 'Booking.',
          cutsInFlight: [
            { cut: 'seats', phase: 'in flight', branch: 'feature/seats' },
          ],
        },
      ],
    });
    expect(overview().contexts[0]?.account).toContain(
      'Hold means: A seat kept aside.',
    );
    expect(journal()).toEqual(before);
    expect(concepts('overview')).toMatchObject({
      contexts: [{ context: 'booking' }, { context: 'other' }],
    });
    refused(
      ['overview', '--context', 'absent'],
      /^concepts overview: the journal has no bounded context 'absent'/,
    );
  });

  it('records the project’s purpose, changes it only with a reason, and shows it first', () => {
    expect(Object.keys(concepts('overview') as object)[0]).toBe('purpose');
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
    for (const view of ['overview', 'state']) {
      const answer = concepts(view) as Record<string, unknown>;
      expect(Object.keys(answer)[0]).toBe('purpose');
      expect(answer.purpose).toBe('Book and pay.');
    }
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
    expect(concepts('overview')).toMatchObject({
      purpose: null,
      competingPurposes: ['Book seats.', 'Sell seats.'],
    });
    concepts('purpose', '--statement', 'Book seats.', '--reason', 'Settle.');
    expect(concepts('overview')).toMatchObject({ purpose: 'Book seats.' });
    expect(concepts('overview')).not.toHaveProperty('competingPurposes');
  });

  it('shows only standing decisions and examples, history when asked', () => {
    const decide = (id: string, ...more: string[]) =>
      concepts(
        'decide',
        id,
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
        ...more,
      ) as { id: string };
    const listed = (...flags: string[]) =>
      (
        concepts('decisions', ...flags) as {
          decisions: { id: string; status: string; deprecation?: unknown }[];
        }
      ).decisions.map(({ id, status, deprecation }) => ({
        id,
        status,
        ...(deprecation === undefined ? {} : { deprecation }),
      }));
    decide('rule');
    decide('old');
    decide('new', '--supersedes', 'old');
    const about = decide('about', '--cut', 'seats');
    expect(about).toMatchObject({ cut: 'seats' });
    decide('keeper', '--keeps', 'booking/seats');
    refused(
      ['deprecate', 'rule'],
      /^concepts deprecate: give why it no longer applies with --reason/,
    );
    refused(
      ['deprecate', 'old', '--reason', 'Done.'],
      /^concepts deprecate: the decision 'old' is superseded; only a standing decision is deprecated/,
    );
    refused(
      [
        'decide',
        'bad',
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
        '--keeps',
        'seats',
      ],
      /^concepts decide: the kept example file 'seats' is not one/,
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
      { id: 'new', status: 'accepted' },
      { id: 'about', status: 'accepted' },
      { id: 'keeper', status: 'accepted' },
    ]);
    expect(listed('--history')).toEqual([
      {
        id: 'rule',
        status: 'deprecated',
        deprecation: { entry: deprecated.id, reason: 'Done.' },
      },
      { id: 'old', status: 'superseded' },
      { id: 'new', status: 'accepted' },
      { id: 'about', status: 'accepted' },
      { id: 'keeper', status: 'accepted' },
    ]);

    // The cut a decision was about, integrated, deprecates it; its examples
    // are history unless a standing decision keeps them.
    mkdirSync(join(repo, 'design/examples/booking'), { recursive: true });
    writeFileSync(
      join(repo, 'design/examples/booking/seats.md'),
      '1. (hold) Given a seat, when held, then `holdSeat()` runs.\n',
    );
    writeFileSync(
      join(repo, 'design/examples/booking/rows.md'),
      '1. (hold) Given a row, when held, then `holdRow()` runs.\n',
    );
    const git = (...args: string[]) =>
      execFileSync(
        'git',
        ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args],
        { cwd: repo },
      );
    git('add', '-A');
    git('commit', '-qm', 'examples');
    const from = join(repo, 'nested');
    for (const cut of ['seats', 'rows']) {
      dispatchWorkPackage(
        [
          'open',
          '--cut',
          cut,
          '--branch',
          `feature/${cut}`,
          '--architect',
          'booking=desk',
        ],
        { from },
      );
      dispatchWorkPackage(['integrate', '--cut', cut], { from });
    }
    expect(listed()).toEqual([
      { id: 'new', status: 'accepted' },
      { id: 'keeper', status: 'accepted' },
    ]);
    expect(listed('--history')).toContainEqual({
      id: 'about',
      status: 'deprecated',
      deprecation: { cut: 'seats' },
    });
    expect(concepts('state')).toMatchObject({
      contexts: [
        {
          decisions: {
            accepted: [
              { id: 'new', title: 'new title', kind: null },
              { id: 'keeper', title: 'keeper title', keeps: ['booking/seats'] },
            ],
            open: [],
          },
        },
      ],
    });
    const state = concepts('state', '--history') as {
      contexts: { decisions: Record<string, { id: string }[]> }[];
    };
    expect(state.contexts[0]?.decisions.deprecated?.map((d) => d.id)).toEqual([
      'rule',
      'about',
    ]);
    expect(state.contexts[0]?.decisions.superseded?.map((d) => d.id)).toEqual([
      'old',
    ]);
    const files = (...flags: string[]) =>
      (
        concepts('leakage', ...flags) as {
          warnings: { passage: { kind: string; file?: string } }[];
        }
      ).warnings
        .filter((w) => w.passage.kind === 'example')
        .map((w) => w.passage.file);
    expect(files()).toEqual(['design/examples/booking/seats.md']);
    expect(files('--history')).toEqual([
      'design/examples/booking/rows.md',
      'design/examples/booking/seats.md',
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
