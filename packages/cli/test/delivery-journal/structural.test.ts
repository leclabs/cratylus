import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { success } from '../capability-port/fixture.js';
import {
  type Host,
  type TemporaryRepository,
  assertKnownViews,
  entry,
  fifteen,
  firstReason,
  host,
  id,
  knownJournal,
  laterReason,
  query,
  reportsUnknown,
  snapshot,
  temporaryRepository,
  ten,
  unchangedFiles,
  unknownEntry,
  views,
} from './fixture.js';

let installed: Host;
let journal: TemporaryRepository;
beforeAll(() => {
  installed = host();
});
afterAll(() => {
  installed?.dispose();
});
beforeEach(() => {
  journal = temporaryRepository();
});
afterEach(() => {
  journal.dispose();
});

const knownViews = [
  ['design', '--history'],
  ['history', 'reservation', '--context', 'workflow'],
  ['history', '--context', 'workflow'],
  ['decisions', '--history'],
];

describe('delivery: older concept journal readers', () => {
  it.each(['design', 'history'])(
    'intent-based delegation/1 — %s reads past an unknown entry without inventing its meaning',
    (view) => {
      knownJournal(journal.root);
      unknownEntry(journal.root, 4);
      const value = query(
        installed,
        journal.root,
        view,
        ...(view === 'history'
          ? ['reservation', '--context', 'workflow']
          : ['--history']),
      );
      if (view === 'design') {
        expect(value).toMatchObject({
          contexts: [
            {
              name: 'workflow',
              concepts: [
                { name: 'reservation', wording: fifteen, reason: laterReason },
              ],
              competing: [],
              retired: [],
            },
          ],
        });
      } else {
        expect(value).toMatchObject({
          versions: [
            { id: id(3), wording: ten, reason: firstReason },
            { id: id(5), wording: fifteen, reason: laterReason },
          ],
        });
      }
      expect(JSON.stringify([value.contexts, value.versions])).not.toContain(
        'INVENTED MEANING',
      );
      reportsUnknown(value, { annotation: 1 });
    },
  );

  it.each([
    {
      label: 'decision status',
      kind: 'decide',
      fields: { status: 'deferred' },
    },
    {
      label: 'decision kind',
      kind: 'decide',
      fields: { decisionKind: 'policy' },
    },
    {
      label: 'classification kind',
      kind: 'classify',
      fields: { decisionKind: 'policy' },
    },
  ])(
    'intent-based delegation/1 — every view reads past an unknown $label inside a known entry kind',
    ({ kind, fields }) => {
      knownJournal(journal.root);
      const baselines = views.map((args) =>
        query(installed, journal.root, ...args),
      );
      entry(
        journal.root,
        4,
        kind === 'decide'
          ? {
              kind,
              decisionId: 'future-choice',
              context: 'workflow',
              title: 'A newer decision',
              situation: 'A newer writer knows another value.',
              decision: 'INVENTED MEANING FROM AN UNINTERPRETED ENTRY',
              consequences: 'Not interpreted by this reader.',
              status: 'open',
              supersedes: null,
              ...fields,
            }
          : {
              kind,
              decisionId: 'reservation-time',
              entry: id(8),
              ...fields,
            },
      );
      const before = snapshot(journal.root);
      for (const [index, args] of views.entries()) {
        const result = installed.command(['concepts', ...args], journal.root);
        expect.soft(result.code, `${args.join(' ')}: ${result.stderr}`).toBe(0);
        if (result.code !== 0) continue;
        const value = JSON.parse(result.stdout) as Record<string, unknown>;
        // Compare only the known view, allowing additional diagnostic fields.
        for (const [key, expected] of Object.entries(baselines[index]!))
          if (key !== 'warnings')
            expect.soft(value[key], key).toEqual(expected);
        reportsUnknown(value, { [kind]: 1 });
      }
      expect(snapshot(journal.root)).toEqual(before);
    },
  );

  it.each(views.map((args) => ({ label: args.join(' '), args })))(
    'intent-based delegation/2 — $label reports every unknown kind and count on both requests',
    ({ args }) => {
      knownJournal(journal.root);
      const baseline = query(installed, journal.root, ...args);
      unknownEntry(journal.root, 2);
      unknownEntry(journal.root, 4, 'review');
      unknownEntry(journal.root, 6);
      const before = snapshot(journal.root);
      // Request twice even when the first response refuses the journal.
      const results = [1, 2].map(() =>
        installed.command(['concepts', ...args], journal.root),
      );
      for (const [index, result] of results.entries()) {
        expect
          .soft(result.code, `request ${index + 1}: ${result.stderr}`)
          .toBe(0);
        if (result.code !== 0) continue;
        const value = JSON.parse(result.stdout) as Record<string, unknown>;
        // Existing view data is unchanged; report fields are not prescribed.
        for (const [key, expected] of Object.entries(baseline)) {
          if (
            ![
              'contexts',
              'versions',
              'decisions',
              'warnings',
              'context',
              'name',
            ].includes(key)
          )
            continue;
          if (key === 'warnings' && Array.isArray(expected)) {
            expect(value[key]).toEqual(expect.arrayContaining(expected));
          } else expect(value[key], key).toEqual(expected);
        }
        reportsUnknown(value, { annotation: 2, review: 1 });
      }
      expect(snapshot(journal.root)).toEqual(before);
    },
  );

  it('intent-based delegation/2 — report assertions reject missing warnings and missing or miscounted kinds without fixing field names', () => {
    const counts = { annotation: 2, review: 1 };
    const golden = [
      {
        kinds: { annotation: 2, review: 1 },
        notice: 'The view may be incomplete.',
      },
      {
        skipped: [
          { type: 'annotation', amount: 2 },
          { type: 'review', amount: 1 },
        ],
        mayBeIncomplete: true,
      },
      { notice: 'annotation: two; review: one; view may be incomplete.' },
    ];
    for (const value of golden) reportsUnknown(value, counts);
    for (const negative of [
      { kinds: { annotation: 2, review: 1 } },
      {
        kinds: { annotation: 1, review: 1 },
        notice: 'The view may be incomplete.',
      },
      { kinds: { annotation: 2 }, notice: 'The view may be incomplete.' },
      { notice: 'annotation: one, review: two; view may be incomplete.' },
    ]) {
      expect(() => reportsUnknown(negative, counts)).toThrow();
    }
  });

  it('intent-based delegation/3 — append preserves every old byte and the next view reports unknown entries', () => {
    knownJournal(journal.root);
    unknownEntry(journal.root, 4);
    const before = snapshot(journal.root);
    const result = installed.command(
      [
        'concepts',
        'define',
        'receipt',
        '--context',
        'workflow',
        '--wording',
        'A receipt records the reservation.',
        '--reason',
        'Keep proof of the reservation.',
      ],
      journal.root,
    );
    const after = snapshot(journal.root);
    unchangedFiles(before, after);
    success(result);
    expect(Object.keys(after).filter((name) => !(name in before))).toHaveLength(
      1,
    );
    const value = query(installed, journal.root, 'design', '--history');
    expect(value).toMatchObject({
      contexts: [
        {
          concepts: [
            { name: 'reservation', wording: fifteen },
            {
              name: 'receipt',
              wording: 'A receipt records the reservation.',
              reason: 'Keep proof of the reservation.',
            },
          ],
        },
      ],
    });
    reportsUnknown(value, { annotation: 1 });
  });

  it('intent-based delegation/4 — malformed known entry is refused by identity, not hidden by an unknown kind', () => {
    knownJournal(journal.root);
    unknownEntry(journal.root, 2);
    entry(journal.root, 4, {
      kind: 'define',
      context: 'workflow',
      name: 'malformed',
      builtFrom: [],
      reason: 'The required wording is absent.',
      supersedes: [],
    });
    const before = snapshot(journal.root);
    const result = installed.command(['concepts', 'design'], journal.root);
    expect(result.code).not.toBe(0);
    expect(
      `${result.stderr}\n${result.stdout}`,
      'refusal names the unreadable known entry',
    ).toContain(id(4));
    expect(snapshot(journal.root)).toEqual(before);
  });

  it('intent-based delegation/5 — understood journals retain their meanings and histories without warnings or writes', () => {
    knownJournal(journal.root);
    const before = snapshot(journal.root);
    assertKnownViews(
      knownViews.map((args) => query(installed, journal.root, ...args)),
    );
    expect(snapshot(journal.root), 'reading never appends anything').toEqual(
      before,
    );
  });

  it('intent-based delegation/5 — negative variants fail for stale meanings, reordered history, open acceptance, false warnings and reading writes', () => {
    knownJournal(journal.root);
    const golden = knownViews.map((args) =>
      query(installed, journal.root, ...args),
    );
    assertKnownViews(golden);
    const variants: [string, (values: Record<string, unknown>[]) => void][] = [
      [
        'stale meaning',
        (values) => {
          values[0] = {
            contexts: [
              {
                name: 'workflow',
                concepts: [{ name: 'reservation', wording: ten }],
              },
            ],
          };
        },
      ],
      [
        'reordered concept history',
        (values) => {
          values[1]!.versions = [
            ...(values[1]!.versions as unknown[]),
          ].reverse();
        },
      ],
      [
        'reordered context history',
        (values) => {
          values[2]!.versions = [
            ...(values[2]!.versions as unknown[]),
          ].reverse();
        },
      ],
      [
        'unaccepted decision',
        (values) => {
          values[3]!.decisions = [{ id: 'reservation-time', status: 'open' }];
        },
      ],
      [
        'false unknown-kind report',
        (values) => {
          values[0]!.notice =
            'Unknown kind annotation: 1; view may be incomplete.';
        },
      ],
    ];
    for (const [reason, mutate] of variants) {
      const negative = structuredClone(golden);
      mutate(negative);
      expect(() => assertKnownViews(negative), reason).toThrow();
    }
    const before = snapshot(journal.root);
    const appendedWhileReading = {
      ...before,
      [`${id(10)}.json`]: 'unexpected write',
    };
    expect(() =>
      expect(appendedWhileReading, 'reading never appends anything').toEqual(
        before,
      ),
    ).toThrow();
  });
});
