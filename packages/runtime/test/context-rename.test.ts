// Renaming a bounded context: `context <context> --reason … --rename <name>`
// appends a `rename-context` entry, a description carrying the name it renames
// (`was`). The context stays one through its names, as a concept does (0322):
// its identity, concepts, decisions and history stay with it, every reading
// shows it under its current name only, every verb naming a context takes any
// name it has had, a name stays its context's, lines of work joined after a
// rename fold to one context whatever the entry order, a delivered context is
// matched by identity and projected under its current name, and a close opens
// it under its current name with its identity.

import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Command } from 'commander';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CLI_BIN } from '../src/bin-name.js';
import { deliverContext } from '../src/capabilities/concepts/delivered.js';
import { JOURNAL } from '../src/capabilities/concepts/dispatch.js';
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';
import { explain } from '../src/explanation.js';
import { capabilityCommands } from '../src/main.js';

let sandbox: string;
let repo: string;
beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'context-rename-'));
  repo = join(sandbox, 'repo');
  mkdirSync(repo);
  git('init', '-q', '-b', 'main');
});
afterEach(() => rmSync(sandbox, { recursive: true, force: true }));

function git(...args: string[]): string {
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
    { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  ).trim();
}
const commit = () => {
  git('add', '-A');
  git('commit', '-q', '--allow-empty', '-m', 'journal');
  return git('rev-parse', 'HEAD');
};
type Entry = Record<string, unknown> & { id: string; kind: string };
const concepts = (...argv: string[]) =>
  dispatchConcepts(argv, { from: repo }) as Record<string, unknown>;
const dir = () => join(repo, 'design/journal');
const files = () => readdirSync(dir()).sort();
const entryFiles = () =>
  files().map(
    (name) => JSON.parse(readFileSync(join(dir(), name), 'utf8')) as Entry,
  );
const refused = (argv: string[], words: RegExp) => {
  const before = files();
  expect(() => concepts(...argv)).toThrow(words);
  expect(files()).toEqual(before);
};
/** Write `body` as an entry recorded on another line of work. */
const sibling = (id: string, body: object) =>
  writeFileSync(
    join(dir(), `${id}.json`),
    JSON.stringify({ id, at: '2026-01-01T00:00:00.000Z', ...body }),
  );
const rename = (from: string, to: string, ...more: string[]) =>
  concepts(
    'context',
    from,
    '--reason',
    `${to} is the nearer name.`,
    '--rename',
    to,
    ...more,
  );
const decide = (id: string, where: string) =>
  concepts(
    'decide',
    id,
    '--context',
    where,
    '--title',
    `T ${id}`,
    '--situation',
    'S',
    '--decision',
    'D',
    '--consequences',
    'C',
    '--status',
    'accepted',
  );
const worded = (verb: string, name: string, where: string) =>
  concepts(
    verb,
    name,
    '--context',
    where,
    '--wording',
    `A ${name}.`,
    '--reason',
    'Because.',
  );
const names = (answer: unknown) =>
  (answer as { contexts: { name: string }[] }).contexts.map((c) => c.name);
const deliver = (context: string) =>
  deliverContext({
    from: repo,
    context,
    origin: 'cratylus',
    version: '1.0.0',
    position: 0,
  });

/** The id of booking's first description, its identity. */
let described: string;
beforeEach(() => {
  described = (
    concepts(
      'context',
      'booking',
      '--subject',
      'Seats for a show.',
      '--relation',
      'Stands alone.',
    ) as { id: string }
  ).id;
  concepts('context', 'fleet', '--subject', 'Vehicles.');
  worded('define', 'hold', 'booking');
  decide('d1', 'booking');
});

describe('renaming a bounded context', () => {
  it('records a rename-context description carrying the name it renames, its subject and relation kept', () => {
    expect(rename('booking', 'reservation')).toMatchObject({
      kind: 'rename-context',
      name: 'reservation',
      was: 'booking',
      subject: 'Seats for a show.',
      relation: 'Stands alone.',
      reason: 'reservation is the nearer name.',
      supersedes: [described],
    });
  });

  it('reads it under the new name only, its concepts, decisions, subject, relation and history with it', () => {
    rename('booking', 'reservation');
    expect(names(concepts('state'))).toEqual(['reservation', 'fleet']);
    expect(concepts('state', '--context', 'reservation')).toMatchObject({
      contexts: [
        {
          name: 'reservation',
          subject: 'Seats for a show.',
          relation: 'Stands alone.',
          concepts: ['hold ≜ A hold.'],
        },
      ],
    });
    for (const reading of [
      ['state'],
      ['design'],
      ['design', '--history'],
      ['decisions'],
      ['decisions', '--history'],
    ])
      expect(
        JSON.stringify(concepts(...reading)),
        reading.join(' '),
      ).not.toMatch(/"booking"/);
    expect(
      (concepts('decisions') as { decisions: unknown[] }).decisions,
    ).toMatchObject([{ id: 'd1', context: 'reservation' }]);
    const history = concepts('history', '--context', 'reservation');
    expect(concepts('history', '--context', 'booking')).toEqual(history);
    expect(history).toEqual({
      context: 'reservation',
      versions: [
        expect.objectContaining({
          id: described,
          name: 'booking',
          subject: 'Seats for a show.',
        }),
        expect.objectContaining({
          name: 'reservation',
          was: 'booking',
          reason: 'reservation is the nearer name.',
          supersedes: [described],
        }),
      ],
    });
    expect((history.versions as object[])[0]).not.toHaveProperty('was');
    expect(concepts('history', 'hold', '--context', 'booking')).toMatchObject({
      context: 'reservation',
      versions: [{ kind: 'define', name: 'hold' }],
    });
  });

  it('keeps its identity: a release projects it under its current name, named by any', () => {
    rename('booking', 'reservation');
    for (const name of ['booking', 'reservation'])
      expect(deliver(name)).toMatchObject({
        context: 'reservation',
        identity: described,
        subject: 'Seats for a show.',
        concepts: [{ name: 'hold' }],
      });
  });

  it('takes its current name or any it had in every verb naming a context, recording under the current one', () => {
    mkdirSync(join(repo, 'design/examples/booking'), { recursive: true });
    writeFileSync(
      join(repo, 'design/examples/booking/holds.md'),
      '1. (hold) Given one, when held, then `expire()` runs.\n',
    );
    rename('booking', 'reservation');
    expect(worded('define', 'seat', 'booking')).toMatchObject({
      context: 'reservation',
    });
    expect(worded('supersede', 'hold', 'booking')).toMatchObject({
      context: 'reservation',
    });
    expect(decide('d2', 'booking')).toMatchObject({ context: 'reservation' });
    expect(
      concepts('retire', 'seat', '--context', 'booking', '--reason', 'Gone.'),
    ).toMatchObject({ context: 'reservation' });
    for (const name of ['booking', 'reservation']) {
      for (const verb of ['state', 'design'])
        expect(names(concepts(verb, '--context', name)), verb).toEqual([
          'reservation',
        ]);
      expect(
        (
          concepts('decisions', '--context', name) as {
            decisions: { id: string }[];
          }
        ).decisions.map((d) => d.id),
      ).toEqual(['d1', 'd2']);
      expect(
        (concepts('leakage', '--context', name) as { warnings: unknown[] })
          .warnings,
      ).toContainEqual(
        expect.objectContaining({
          passage: expect.objectContaining({ kind: 'example' }),
        }),
      );
    }
    expect(
      concepts('context', 'booking', '--reason', 'Wider.', '--subject', 'All.'),
    ).toMatchObject({ kind: 'context', name: 'reservation', subject: 'All.' });
    expect(
      concepts('retire', '--context', 'booking', '--reason', 'Dropped.'),
    ).toMatchObject({ kind: 'retire-context', context: 'reservation' });
    expect(
      concepts('context', 'booking', '--reason', 'Needed again.'),
    ).toMatchObject({ kind: 'context', name: 'reservation' });
    expect(names(concepts('state'))).toEqual(['reservation', 'fleet']);
  });

  it('keeps a name its context’s: refusing another context’s name, current or earlier, and its own current name, changing nothing', () => {
    rename('booking', 'reservation');
    const renaming = (from: string, to: string) => [
      'context',
      from,
      '--reason',
      'R.',
      '--rename',
      to,
    ];
    refused(
      renaming('reservation', 'fleet'),
      /^concepts context: the name 'fleet' is one the bounded context 'fleet' has or has had/,
    );
    refused(
      renaming('fleet', 'booking'),
      /the name 'booking' is one the bounded context 'reservation' has or has had/,
    );
    refused(
      renaming('booking', 'reservation'),
      /the bounded context 'reservation' is already named 'reservation'/,
    );
    refused(renaming('reservation', ' '), /the new name is empty/);
    refused(
      ['context', 'reservation', '--rename', 'stay'],
      /'reservation' is already recorded; give --reason/,
    );
    refused(
      ['context', 'booking', '--subject', 'New.'],
      /the name 'booking' is one the bounded context 'reservation' has had/,
    );
    refused(
      ['context', 'nowhere', '--rename', 'somewhere'],
      /no bounded context 'nowhere' to rename/,
    );
    refused(
      renaming('nowhere', 'somewhere'),
      /no bounded context 'nowhere'; record it without --reason first/,
    );
    // Its own earlier name may be taken back.
    expect(rename('reservation', 'booking')).toMatchObject({
      name: 'booking',
      was: 'reservation',
    });
    expect(names(concepts('state'))).toEqual(['booking', 'fleet']);
    expect(deliver('reservation').identity).toBe(described);
  });
});

describe('a delivered context matched by identity', () => {
  /** A delivered context the journal holds its own copy of, under `name`. */
  const deliveredAs = (name: string) => ({
    origin: 'cratylus',
    version: '2.0.0',
    context: name,
    identity: described,
    position: 0,
    subject: 'Seats for a show.',
    relation: 'Stands alone.',
    concepts: [],
  });
  const practice = (answer: unknown) =>
    (
      answer as {
        practice?: { contexts: { name: string; readOnly?: boolean }[] };
      }
    ).practice?.contexts;

  it('reads the project’s own copy in the place of a delivered context the origin renamed', () => {
    for (const verb of ['state', 'design']) {
      const answer = dispatchConcepts([verb], {
        from: repo,
        delivered: [deliveredAs('reservation')],
      });
      expect(practice(answer), verb).toEqual([
        expect.objectContaining({ name: 'booking' }),
      ]);
      expect(practice(answer)?.[0]).not.toHaveProperty('readOnly');
      expect(names(answer)).toEqual(['fleet']);
    }
  });

  it('reads the project’s own copy, renamed, in the delivered context’s place', () => {
    rename('booking', 'reservation');
    const answer = dispatchConcepts(['state'], {
      from: repo,
      delivered: [deliveredAs('booking')],
    });
    expect(practice(answer)).toEqual([
      expect.objectContaining({ name: 'reservation' }),
    ]);
    expect(names(answer)).toEqual(['fleet']);
  });
});

describe('lines of work joined after a rename', () => {
  it.each([
    [
      'the rename first',
      ['01Z00000000000000000000001', '01Z00000000000000000000002'],
    ],
    [
      'the other line first',
      ['01Z00000000000000000000002', '01Z00000000000000000000001'],
    ],
  ])(
    'fold to one context, its descriptions competing under the name they share, %s',
    (_, [renameId, otherId]) => {
      sibling(renameId as string, {
        kind: 'rename-context',
        name: 'reservation',
        was: 'booking',
        subject: 'Seats for a show.',
        relation: 'Stands alone.',
        reason: 'Nearer.',
        supersedes: [described],
      });
      sibling(otherId as string, {
        kind: 'context',
        name: 'booking',
        subject: 'Seats elsewhere.',
        relation: 'Stands alone.',
        reason: 'Another line of work.',
        supersedes: [described],
      });
      sibling('01Z00000000000000000000003', {
        kind: 'define',
        context: 'booking',
        name: 'seat',
        wording: 'A seat.',
        builtFrom: [],
        reason: 'Another line of work.',
        supersedes: [],
      });
      expect(names(concepts('state'))).toEqual(['booking', 'fleet']);
      const [booking] = (
        concepts('state', '--context', 'reservation') as {
          contexts: {
            name: string;
            subject: string | null;
            competingDescriptions: object[];
            concepts: string[];
          }[];
        }
      ).contexts;
      expect(booking).toMatchObject({
        name: 'booking',
        subject: null,
        concepts: ['hold ≜ A hold.', 'seat ≜ A seat.'],
      });
      expect(booking?.competingDescriptions).toHaveLength(2);
      expect(booking?.competingDescriptions).toEqual(
        expect.arrayContaining([
          {
            name: 'reservation',
            subject: 'Seats for a show.',
            relation: 'Stands alone.',
          },
          { subject: 'Seats elsewhere.', relation: 'Stands alone.' },
        ]),
      );
      expect(concepts('history', '--context', 'reservation')).toEqual(
        concepts('history', '--context', 'booking'),
      );
      // Settling them under the new name names the context by it alone.
      expect(
        rename('booking', 'reservation', '--subject', 'Seats for a show.'),
      ).toMatchObject({
        was: 'booking',
        supersedes: [
          '01Z00000000000000000000001',
          '01Z00000000000000000000002',
        ],
      });
      expect(names(concepts('state'))).toEqual(['reservation', 'fleet']);
      expect(concepts('state', '--context', 'booking')).toMatchObject({
        contexts: [
          {
            name: 'reservation',
            subject: 'Seats for a show.',
            concepts: ['hold ≜ A hold.', 'seat ≜ A seat.'],
          },
        ],
      });
    },
  );

  it.each([
    [
      'the rename first',
      ['01Z00000000000000000000001', '01Z00000000000000000000002'],
    ],
    [
      'the new context first',
      ['01Z00000000000000000000002', '01Z00000000000000000000001'],
    ],
  ])(
    'joins a rename to a name and a context recorded under it into one context, %s',
    (_, [renameId, recordId]) => {
      sibling(renameId as string, {
        kind: 'rename-context',
        name: 'reservation',
        was: 'booking',
        subject: 'Seats for a show.',
        relation: 'Stands alone.',
        reason: 'Nearer.',
        supersedes: [described],
      });
      sibling(recordId as string, {
        kind: 'context',
        name: 'reservation',
        subject: 'Seats for a show.',
        relation: 'Stands alone.',
      });
      expect(concepts('state')).toMatchObject({
        contexts: [
          {
            name: 'reservation',
            subject: 'Seats for a show.',
            concepts: ['hold ≜ A hold.'],
          },
          { name: 'fleet' },
        ],
      });
    },
  );
});

describe('closing the books on a renamed context', () => {
  it('opens it under its current name only, its identity, concepts and decisions kept', () => {
    rename('booking', 'reservation');
    const head = commit();
    concepts('close');
    const opened = entryFiles();
    expect(opened.map((e) => e.kind)).not.toContain('rename-context');
    expect(opened).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'context',
          name: 'reservation',
          identity: described,
          reason: 'reservation is the nearer name.',
          broughtForward: head,
        }),
        expect.objectContaining({
          kind: 'define',
          context: 'reservation',
          name: 'hold',
        }),
        expect.objectContaining({
          kind: 'decide',
          context: 'reservation',
          decisionId: 'd1',
        }),
      ]),
    );
    expect(JSON.stringify(opened)).not.toMatch(/"booking"/);
    expect(
      opened.find((e) => e.kind === 'context' && e.name === 'reservation'),
    ).not.toHaveProperty('was');
    expect(() => concepts('history', '--context', 'booking')).toThrow(
      /no bounded context 'booking'/,
    );
    expect(deliver('reservation').identity).toBe(described);
  });

  it('is refused, changing nothing, while competing descriptions give the context different names, naming the remedy', () => {
    sibling('01Z00000000000000000000001', {
      kind: 'rename-context',
      name: 'reservation',
      was: 'booking',
      subject: 'Seats for a show.',
      relation: 'Stands alone.',
      reason: 'Nearer.',
      supersedes: [described],
    });
    sibling('01Z00000000000000000000002', {
      kind: 'context',
      name: 'booking',
      subject: 'Seats elsewhere.',
      relation: 'Stands alone.',
      reason: 'Another line of work.',
      supersedes: [described],
    });
    commit();
    refused(
      ['close'],
      /^concepts close: the bounded context 'booking' has competing descriptions that name it differently.*settle them with concepts context and a --reason first, giving --rename/,
    );
    rename('booking', 'reservation', '--subject', 'Seats for a show.');
    commit();
    concepts('close');
    expect(
      entryFiles()
        .filter((e) => e.kind === 'context')
        .map((e) => e.name),
    ).toEqual(['reservation', 'fleet']);
  });
});

describe('the explanation of renaming a context', () => {
  it('declares the new name as a parameter of the context verb, and its help is drawn from it', async () => {
    const rename = explain(JOURNAL)
      .verbs.find((v) => v.name === 'context')
      ?.parameters.find((p) => p.name === 'rename');
    expect(rename).toMatchObject({
      required: false,
      schema: { type: 'string' },
    });
    const out: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((s) => {
      out.push(String(s));
      return true;
    });
    const exitCode = process.exitCode;
    try {
      const host = new Command(CLI_BIN).enablePositionalOptions();
      for (const command of capabilityCommands()) host.addCommand(command);
      await host.parseAsync(['concepts', 'context', '--help'], {
        from: 'user',
      });
    } finally {
      process.exitCode = exitCode;
      vi.restoreAllMocks();
    }
    expect(out.join('')).toContain('--rename <value>');
    expect(out.join('')).toContain(rename?.description);
  });
});
