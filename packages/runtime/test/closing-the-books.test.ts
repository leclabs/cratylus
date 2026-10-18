// Closing the concept journal's books as event sourcing practises it
// (decision 0316): one call opens a new period with one opening entry per
// current version of each standing item, of the item's own kind, superseding
// nothing and naming the commit at HEAD that holds the closed period, and
// removes every other entry file, which version control keeps. These hold that
// the journal then holds its openings and nothing else, that every reading of
// what stands answers as before, that the history readings name the close and
// mark its openings, that each refusal changes nothing, that a later close
// opens again with nothing growing, that the command closes, that appending
// and a delivered context's identity survive a close, and that a line of work
// that branched before a close joins it.

import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  unlinkSync,
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
import { ulid } from '../src/ulid.js';

let sandbox: string;
let repo: string;
beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'close-'));
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
const commit = (message = 'journal') => {
  git('add', '-A');
  git('commit', '-q', '--allow-empty', '-m', message);
  return git('rev-parse', 'HEAD');
};
const concepts = (...argv: string[]) => dispatchConcepts(argv, { from: repo });
const dir = () => join(repo, 'design/journal');
const files = () => readdirSync(dir()).sort();
/** Every file of the journal with its content. */
const snapshot = () =>
  Object.fromEntries(
    files().map((name) => [name, readFileSync(join(dir(), name), 'utf8')]),
  );
/** Every entry the journal's files hold, in id order. */
const entryFiles = () =>
  files().map(
    (name) =>
      JSON.parse(readFileSync(join(dir(), name), 'utf8')) as Record<
        string,
        unknown
      > & { id: string; kind: string },
  );
/** Write `body` as an entry recorded by an earlier workflow or another line
 *  of work; its id. */
const recorded = (body: object): string => {
  const id = ulid();
  mkdirSync(dir(), { recursive: true });
  writeFileSync(
    join(dir(), `${id}.json`),
    JSON.stringify({ id, at: '2026-01-01T00:00:00.000Z', ...body }),
  );
  return id;
};
const decide = (id: string, status: string, ...more: string[]) =>
  concepts(
    'decide',
    id,
    '--context',
    'booking',
    '--title',
    `T ${id}`,
    '--situation',
    'S',
    '--decision',
    'D',
    '--consequences',
    'C',
    '--status',
    status,
    ...more,
  ) as { id: string };
const idOf = (entry: unknown) => (entry as { id: string }).id;
const worded = (verb: string, name: string, where: string, wording: string) =>
  idOf(
    concepts(
      verb,
      name,
      '--context',
      where,
      '--wording',
      wording,
      '--reason',
      'Because.',
    ),
  );

/** The readings of what stands, which a close leaves as they were. */
const STANDING = [
  ['state'],
  ['state', '--context', 'fleet'],
  ['design'],
  ['design', '--context', 'booking'],
  ['decisions'],
  ['decisions', '--open'],
  ['decisions', '--context', 'booking'],
];
/** `value` without what a close renews or leaves in the closed period: the
 *  entry ids it names, and the example files a decision's entry was recorded
 *  keeping, which an opening decision does not carry. */
const renewed = (value: unknown): unknown =>
  Array.isArray(value)
    ? value.map(renewed)
    : typeof value === 'object' && value !== null
      ? Object.fromEntries(
          Object.entries(value)
            .filter(([key]) => key !== 'entry' && key !== 'keeps')
            .map(([key, v]) => [key, renewed(v)]),
        )
      : value;
const standing = () => STANDING.map((argv) => renewed(concepts(...argv)));

/** The history readings, which name the latest close. */
const HISTORY = [
  ['history', 'hold', '--context', 'booking'],
  ['history', '--context', 'booking'],
  ['design', '--history'],
  ['decisions', '--history'],
];

/** The fields an opening of each kind may hold: none grows with the number
 *  of closes or of the entries a period held. */
const FIELDS: Record<string, readonly string[]> = {
  purpose: ['statement', 'reason', 'supersedes'],
  context: ['name', 'subject', 'relation', 'reason', 'identity', 'supersedes'],
  define: ['context', 'name', 'wording', 'builtFrom', 'reason', 'supersedes'],
  retire: ['context', 'name', 'reason', 'supersedes'],
  decide: [
    'decisionId',
    'context',
    'title',
    'situation',
    'decision',
    'consequences',
    'status',
    'supersedes',
    'decisionKind',
  ],
};

/** A journal with history: purposes, a context changed and one whose
 *  descriptions compete, superseded, competing (a retirement among them) and
 *  retired concepts, decisions superseded, deprecated, open, accepted by
 *  acceptance, recorded accepted and classified, and efficiency figures. */
function seed() {
  concepts('purpose', '--statement', 'Book seats.');
  concepts('purpose', '--statement', 'Book and pay.', '--reason', 'Pay.');
  const booking = idOf(concepts('context', 'booking', '--subject', 'Booking.'));
  const fleet = idOf(
    concepts(
      'context',
      'fleet',
      '--subject',
      'Fleet.',
      '--relation',
      'Beside.',
    ),
  );
  concepts(
    'context',
    'booking',
    '--subject',
    'Booking seats.',
    '--reason',
    'Sharper.',
  );
  for (const subject of ['Trucks.', 'Vans.'])
    recorded({
      kind: 'context',
      name: 'fleet',
      subject,
      relation: 'Beside.',
      reason: 'A line of work.',
      supersedes: [fleet],
    });
  worded('define', 'hold', 'booking', 'A hold.');
  const slot = worded('define', 'slot', 'booking', 'A slot.');
  worded('supersede', 'hold', 'booking', 'A short hold.');
  for (const wording of ['A wide slot.', 'A narrow slot.'])
    recorded({
      kind: 'supersede',
      context: 'booking',
      name: 'slot',
      wording,
      builtFrom: [],
      reason: 'A line of work.',
      supersedes: [slot],
    });
  worded('define', 'gone', 'booking', 'Gone soon.');
  concepts('retire', 'gone', '--context', 'booking', '--reason', 'Gone.');
  const lane = worded('define', 'lane', 'booking', 'A lane.');
  recorded({
    kind: 'supersede',
    context: 'booking',
    name: 'lane',
    wording: 'A fast lane.',
    builtFrom: [],
    reason: 'A line of work.',
    supersedes: [lane],
  });
  recorded({
    kind: 'retire',
    context: 'booking',
    name: 'lane',
    reason: 'Another line of work.',
    supersedes: [lane],
  });
  concepts(
    'define',
    'truck',
    '--context',
    'fleet',
    '--wording',
    'A truck.',
    '--reason',
    'Because.',
    '--built-from',
    'hold',
  );
  decide('d1', 'open');
  concepts('accept', 'd1');
  decide('d2', 'accepted', '--supersedes', 'd1');
  decide('d3', 'open');
  concepts('deprecate', 'd3', '--reason', 'Done.');
  decide('d4', 'open');
  concepts('accept', 'd4', '--reason', 'Agreed.');
  decide('d5', 'open');
  const told = recorded({
    kind: 'decide',
    decisionId: 'told',
    context: 'booking',
    title: 'Told',
    situation: 'S',
    decision: 'D',
    consequences: 'C',
    status: 'open',
    supersedes: null,
    decisionKind: 'meaning',
    keeps: ['booking/1'],
  });
  recorded({
    kind: 'classify',
    decisionId: 'told',
    entry: told,
    decisionKind: 'realization',
    reason: 'It constrains.',
  });
  recorded({
    kind: 'efficiency',
    context: 'booking',
    cut: 'c1',
    agentRuns: { total: 1, byRole: { builder: 1 } },
    rounds: 1,
    wholeCheckRuns: 1,
    tokens: null,
  });
  return { booking, fleet };
}

/** What a close of `seed`'s journal opens, in order. */
const OPENED = (booking: string, fleet: string) => [
  { kind: 'purpose', statement: 'Book and pay.', reason: 'Pay.' },
  {
    kind: 'context',
    name: 'booking',
    subject: 'Booking seats.',
    relation: '',
    reason: 'Sharper.',
    identity: booking,
  },
  { kind: 'context', name: 'fleet', subject: 'Trucks.', identity: fleet },
  { kind: 'context', name: 'fleet', subject: 'Vans.', identity: fleet },
  {
    kind: 'define',
    context: 'booking',
    name: 'hold',
    wording: 'A short hold.',
    builtFrom: [],
    reason: 'Because.',
  },
  { kind: 'define', name: 'slot', wording: 'A wide slot.' },
  { kind: 'define', name: 'slot', wording: 'A narrow slot.' },
  { kind: 'define', name: 'lane', wording: 'A fast lane.' },
  { kind: 'retire', name: 'lane', reason: 'Another line of work.' },
  {
    kind: 'define',
    context: 'fleet',
    name: 'truck',
    wording: 'A truck.',
    builtFrom: ['hold'],
  },
  {
    kind: 'decide',
    decisionId: 'd2',
    title: 'T d2',
    status: 'accepted',
    supersedes: null,
    decisionKind: 'realization',
  },
  { kind: 'decide', decisionId: 'd4', status: 'accepted' },
  { kind: 'decide', decisionId: 'd5', status: 'open' },
  {
    kind: 'decide',
    decisionId: 'told',
    status: 'open',
    decisionKind: 'realization',
  },
];

describe('closing the books', () => {
  it('leaves one opening per current version of each standing item, what stands as it was, and the closed period at its commit', () => {
    const { booking, fleet } = seed();
    const head = commit();
    const before = standing();
    const contents = snapshot();
    for (const argv of HISTORY)
      expect(concepts(...argv), argv.join(' ')).not.toHaveProperty(
        'booksClosed',
      );

    const answer = concepts('close') as Record<string, unknown>;

    const openings = entryFiles();
    expect(openings).toMatchObject(OPENED(booking, fleet));
    expect(answer).toEqual({
      at: openings[0]?.at,
      ...(openings[0]?.by === undefined ? {} : { by: openings[0].by }),
      commit: head,
      openings: openings.length,
      removed: Object.keys(contents).length,
    });
    // Nothing else stays: every file is an opening, none an earlier entry.
    expect(files()).toEqual(openings.map((o) => `${o.id}.json`));
    const last = Object.keys(contents).sort().at(-1) as string;
    for (const opening of openings) {
      expect(`${opening.id}.json` > last).toBe(true);
      expect(opening.at).toBe(answer.at);
      expect(opening.broughtForward).toBe(head);
      expect(opening.supersedes).toEqual(opening.kind === 'decide' ? null : []);
      expect(
        Object.keys(opening).filter(
          (key) =>
            !['id', 'at', 'by', 'kind', 'broughtForward'].includes(key) &&
            !FIELDS[opening.kind]?.includes(key),
        ),
        opening.kind,
      ).toEqual([]);
    }
    // The same answers, each list in the same order, competing versions still
    // competing.
    expect(standing()).toEqual(before);
    expect(concepts('design', '--context', 'booking')).toMatchObject({
      contexts: [
        {
          competing: [
            { name: 'slot', versions: [{}, {}] },
            {
              name: 'lane',
              versions: [{ wording: 'A fast lane.' }, { retired: true }],
            },
          ],
        },
      ],
    });
    expect(concepts('state', '--context', 'fleet')).toMatchObject({
      contexts: [{ subject: null, competingDescriptions: [{}, {}] }],
    });
    // The history readings name the close and mark each opening they list.
    for (const argv of HISTORY)
      expect(concepts(...argv), argv.join(' ')).toMatchObject({
        booksClosed: { at: answer.at, commit: head },
      });
    expect(concepts('history', 'hold', '--context', 'booking')).toMatchObject({
      versions: [{ kind: 'define', broughtForward: head }],
    });
    expect(concepts('history', '--context', 'booking')).toEqual({
      context: 'booking',
      versions: [
        expect.objectContaining({
          subject: 'Booking seats.',
          broughtForward: head,
        }),
      ],
      booksClosed: expect.anything(),
    });
    for (const d of (
      concepts('decisions', '--history') as {
        decisions: Record<string, unknown>[];
      }
    ).decisions)
      expect(d.broughtForward).toBe(head);
    for (const argv of [['state'], ['design'], ['decisions'], ['leakage']])
      expect(concepts(...argv)).not.toHaveProperty('booksClosed');
    for (const [name, content] of Object.entries(contents))
      expect(
        execFileSync('git', ['show', `${head}:design/journal/${name}`], {
          cwd: repo,
          encoding: 'utf8',
        }),
      ).toBe(content);
  });

  it('is explained as closing, taking nothing, and closes from the command', async () => {
    expect(
      explain(JOURNAL).verbs.find((v) => v.name === 'close'),
    ).toMatchObject({
      concept: 'closing the books',
      effect: 'closes',
      parameters: [],
    });
    concepts('context', 'booking', '--subject', 'Booking.');
    const head = commit();
    const out: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((s) => {
      out.push(String(s));
      return true;
    });
    const cwd = process.cwd();
    try {
      process.chdir(repo);
      const host = new Command(CLI_BIN).enablePositionalOptions();
      for (const command of capabilityCommands()) host.addCommand(command);
      await host.parseAsync(['concepts', 'close'], { from: 'user' });
    } finally {
      process.chdir(cwd);
      vi.restoreAllMocks();
    }
    expect(JSON.parse(out.join(''))).toMatchObject({
      commit: head,
      openings: 1,
      removed: 1,
    });
    expect(entryFiles()).toMatchObject([
      { kind: 'context', broughtForward: head },
    ]);
  });

  describe('refuses, changing nothing', () => {
    const refused = (words: RegExp) => {
      const before = snapshot();
      expect(() => concepts('close')).toThrow(words);
      expect(snapshot()).toEqual(before);
    };

    it('outside a git repository', () => {
      const outside = join(sandbox, 'outside');
      mkdirSync(outside);
      expect(() => dispatchConcepts(['close'], { from: outside })).toThrow(
        /^concepts close: .* is not inside a git repository/,
      );
    });

    it('with no commit at HEAD', () => {
      seed();
      refused(/^concepts close: the repository has no commit at HEAD/);
    });

    it('while an entry is uncommitted, changed or removed', () => {
      seed();
      commit();
      concepts('context', 'later', '--subject', 'Later.');
      refused(
        /^concepts close: design\/journal differs from the commit at HEAD/,
      );
      commit();
      const [first] = files();
      const changed = join(dir(), first as string);
      writeFileSync(changed, `${readFileSync(changed, 'utf8')}\n`);
      refused(/commit the journal first$/);
      git('checkout', '--', '.');
      unlinkSync(join(dir(), first as string));
      refused(/a file is uncommitted, changed, removed, ignored or overlooked/);
    });

    it('while an entry file is ignored', () => {
      seed();
      const ignored = recorded({
        kind: 'context',
        name: 'hidden',
        subject: 'Hidden.',
        relation: '',
      });
      writeFileSync(
        join(repo, '.gitignore'),
        `/design/journal/${ignored}.json\n`,
      );
      commit();
      refused(/a file is uncommitted, changed, removed, ignored or overlooked/);
    });

    it.each(['--assume-unchanged', '--skip-worktree'])(
      'while a changed entry is marked %s',
      (mark) => {
        seed();
        commit();
        const [first] = files();
        const path = `design/journal/${first as string}`;
        git('update-index', mark, path);
        writeFileSync(
          join(repo, path),
          `${readFileSync(join(repo, path), 'utf8')}\n`,
        );
        expect(git('status', '--porcelain')).toBe('');
        refused(
          /^concepts close: design\/journal differs from the commit at HEAD/,
        );
      },
    );

    it('while an entry is replaced by a link to the same bytes', () => {
      seed();
      commit();
      const [first] = files();
      const path = join(dir(), first as string);
      const copy = join(sandbox, 'copy.json');
      writeFileSync(copy, readFileSync(path));
      unlinkSync(path);
      symlinkSync(copy, path);
      refused(
        /^concepts close: design\/journal differs from the commit at HEAD/,
      );
    });

    it('while an entry is made executable', () => {
      seed();
      commit();
      const [first] = files();
      chmodSync(join(dir(), first as string), 0o755);
      refused(
        /^concepts close: design\/journal differs from the commit at HEAD/,
      );
    });

    it('while a clean filter maps a changed entry back to what HEAD holds', () => {
      seed();
      commit();
      const [first] = files();
      const path = `design/journal/${first as string}`;
      git('config', 'filter.trim.clean', "sed -e 's/ *$//'");
      writeFileSync(
        join(repo, '.gitattributes'),
        'design/journal/*.json filter=trim\n',
      );
      const content = readFileSync(join(repo, path), 'utf8');
      writeFileSync(join(repo, path), content.replace('}\n', '}  \n'));
      // Through the filter, the changed entry hashes as HEAD holds it.
      expect(git('hash-object', path)).toBe(git('rev-parse', `HEAD:${path}`));
      refused(
        /^concepts close: design\/journal differs from the commit at HEAD/,
      );
    });

    it('while it reads past entries of a newer runtime', () => {
      seed();
      recorded({ kind: 'forecast', context: 'booking' });
      commit();
      refused(
        /^concepts close: the journal holds entries written by a newer runtime.*close it with that runtime$/,
      );
    });

    it('with no entry', () => {
      commit('root');
      expect(() => concepts('close')).toThrow(
        /^concepts close: the journal holds no entry/,
      );
    });

    it('with nothing recorded since the latest close', () => {
      seed();
      commit();
      concepts('close');
      commit();
      refused(
        /^concepts close: nothing is recorded since the journal’s latest close/,
      );
    });
  });

  it('closes again after one more change, opening again with nothing grown', () => {
    const { booking, fleet } = seed();
    commit();
    concepts('close');
    const first = entryFiles();
    commit();
    worded('supersede', 'hold', 'booking', 'A brief hold.');
    const head = commit();
    const before = standing();
    const answer = concepts('close') as Record<string, unknown>;
    const second = entryFiles();
    expect(answer).toMatchObject({
      commit: head,
      openings: first.length,
      removed: first.length + 1,
    });
    expect(second).toMatchObject(
      OPENED(booking, fleet).map((o) =>
        o.kind === 'define' && o.name === 'hold'
          ? { ...o, wording: 'A brief hold.' }
          : o,
      ),
    );
    expect(standing()).toEqual(before);
    // Each opening of an unchanged item is the first close's, but for its id,
    // its moment and the commit it names.
    const bare = ({
      id: _id,
      at: _at,
      broughtForward: _commit,
      ...rest
    }: Record<string, unknown>) => rest;
    second.forEach((opening, i) => {
      expect(opening.broughtForward).toBe(head);
      if (opening.name !== 'hold')
        expect(bare(opening)).toEqual(
          bare(first[i] as Record<string, unknown>),
        );
    });
    expect(concepts('history', 'hold', '--context', 'booking')).toMatchObject({
      versions: [{ wording: 'A brief hold.', broughtForward: head }],
      booksClosed: { at: answer.at, commit: head },
    });
  });

  it('appends after a close, past its openings, superseding, accepting and deprecating what it opened', () => {
    seed();
    commit();
    concepts('close');
    const last = files().at(-1) as string;
    const hold = worded('supersede', 'hold', 'booking', 'A brief hold.');
    expect(`${hold}.json` > last).toBe(true);
    concepts('accept', 'd5');
    concepts('deprecate', 'told', '--reason', 'Stated by the concepts.');
    const d6 = decide('d6', 'open', '--supersedes', 'd4').id;
    const design = concepts('design', '--context', 'booking') as {
      contexts: { concepts: { name: string; wording: string }[] }[];
    };
    expect(design.contexts[0]?.concepts).toContainEqual({
      name: 'hold',
      wording: 'A brief hold.',
      builtFrom: [],
    });
    const decisions = concepts('decisions', '--history') as {
      decisions: { id: string; status: string; entry: string }[];
    };
    expect(
      Object.fromEntries(decisions.decisions.map((d) => [d.id, d.status])),
    ).toEqual({
      d2: 'accepted',
      d4: 'superseded',
      d5: 'accepted',
      told: 'deprecated',
      d6: 'open',
    });
    expect(decisions.decisions.at(-1)?.entry).toBe(d6);
    // A concept retired before the close is not carried: it returns by define.
    expect(() => worded('supersede', 'gone', 'booking', 'Back.')).toThrow(
      /has no concept 'gone'/,
    );
    worded('define', 'gone', 'booking', 'Back again.');
    expect(
      (concepts('design', '--context', 'booking') as typeof design).contexts[0]
        ?.concepts,
    ).toContainEqual({ name: 'gone', wording: 'Back again.', builtFrom: [] });
  });

  it('compares a version only with versions it replaces: an opening replaces none', () => {
    concepts('context', 'booking', '--subject', 'Booking.');
    worded('define', 'hold', 'booking', 'A hold.');
    worded('supersede', 'hold', 'booking', 'A hold. And more.');
    const extending = () =>
      (concepts('leakage') as { warnings: { rule: string }[] }).warnings.filter(
        (w) => w.rule === 'only extends the version it replaces',
      );
    expect(extending()).toHaveLength(1);
    commit();
    concepts('close');
    expect(extending()).toEqual([]);
  });

  it('keeps a delivered context’s identity, and the journal holding it, across closes', () => {
    const first = idOf(
      concepts(
        'context',
        'workflow',
        '--subject',
        'Earlier.',
        '--relation',
        '',
      ),
    );
    concepts(
      'context',
      'workflow',
      '--subject',
      'Current.',
      '--reason',
      'Sharper.',
    );
    worded('define', 'part', 'workflow', 'A part.');
    const deliver = () =>
      deliverContext({
        from: repo,
        context: 'workflow',
        origin: 'cratylus',
        version: '1.0.0',
      });
    const delivered = deliver();
    expect(delivered.identity).toBe(first);
    commit();
    concepts('close');
    expect(deliver()).toEqual(delivered);
    commit();
    worded('define', 'piece', 'workflow', 'A piece.');
    commit();
    concepts('close');
    expect(deliver().identity).toBe(first);
    expect(entryFiles()[0]).toMatchObject({ kind: 'context', identity: first });
    // The journal still holds the context it delivers: shown among its own.
    const state = dispatchConcepts(['state'], {
      from: repo,
      delivered: [delivered],
    }) as Record<string, unknown>;
    expect(state).not.toHaveProperty('practice');
    expect(state.contexts).toMatchObject([{ name: 'workflow' }]);
  });
});

describe('a close joined with a line of work that branched before it', () => {
  const join_ = (other: string) =>
    git('merge', '-q', '--no-ff', '--no-edit', other);
  /** Record on a branch `other` from here what `work` records, close on
   *  `main`, and join `other`. */
  const branchedThenClosed = (work: () => void) => {
    commit('base');
    git('checkout', '-q', '-b', 'other');
    work();
    commit('other');
    git('checkout', '-q', 'main');
    concepts('close');
    commit('close');
    join_('other');
  };

  beforeEach(() => {
    concepts('context', 'booking', '--subject', 'Booking.');
  });

  it('reads a version superseding a closed one as competing with its opening, until one settles them', () => {
    worded('define', 'x', 'booking', 'An x.');
    branchedThenClosed(() => worded('supersede', 'x', 'booking', 'A wider x.'));
    expect(concepts('design')).toMatchObject({
      contexts: [
        {
          concepts: [],
          competing: [
            {
              name: 'x',
              versions: [{ wording: 'A wider x.' }, { wording: 'An x.' }],
            },
          ],
        },
      ],
    });
    worded('supersede', 'x', 'booking', 'A settled x.');
    expect(concepts('design')).toMatchObject({
      contexts: [{ concepts: [{ name: 'x', wording: 'A settled x.' }] }],
    });
  });

  it('binds an acceptance, deprecation or supersession of a closed decision entry by its name', () => {
    for (const id of ['d', 'e', 'f']) decide(id, 'open');
    branchedThenClosed(() => {
      concepts('accept', 'd');
      concepts('deprecate', 'e', '--reason', 'Done.');
      decide('g', 'open', '--supersedes', 'f');
    });
    const decisions = concepts('decisions', '--history') as {
      decisions: { id: string; status: string; supersededBy: string[] }[];
    };
    expect(
      Object.fromEntries(decisions.decisions.map((d) => [d.id, d.status])),
    ).toEqual({ d: 'accepted', e: 'deprecated', f: 'superseded', g: 'open' });
  });

  it('binds none where two decisions share the name', () => {
    const decision = {
      kind: 'decide',
      decisionId: 'd',
      context: 'booking',
      title: 'T',
      situation: 'S',
      decision: 'D',
      consequences: 'C',
      status: 'open',
      supersedes: null,
    };
    const one = recorded(decision);
    recorded(decision);
    branchedThenClosed(() =>
      recorded({ kind: 'accept', decisionId: 'd', entry: one }),
    );
    expect(
      (
        concepts('decisions') as { decisions: { status: string }[] }
      ).decisions.map((d) => d.status),
    ).toEqual(['open', 'open']);
  });

  it('keeps a context’s identity when a change joined from that line is its earliest entry', () => {
    const first = idOf(
      concepts('context', 'workflow', '--subject', 'Ours.', '--relation', ''),
    );
    worded('define', 'part', 'workflow', 'A part.');
    const delivered = deliverContext({
      from: repo,
      context: 'workflow',
      origin: 'cratylus',
      version: '1.0.0',
    });
    branchedThenClosed(() =>
      concepts(
        'context',
        'workflow',
        '--subject',
        'Theirs.',
        '--reason',
        'Theirs.',
      ),
    );
    const state = dispatchConcepts(['state', '--context', 'workflow'], {
      from: repo,
      delivered: [delivered],
    });
    expect(state).not.toHaveProperty('practice');
    expect(state).toMatchObject({
      contexts: [
        {
          name: 'workflow',
          subject: null,
          competingDescriptions: [{ subject: 'Theirs.' }, { subject: 'Ours.' }],
        },
      ],
    });
    concepts(
      'context',
      'workflow',
      '--subject',
      'Settled.',
      '--reason',
      'Settle.',
    );
    expect(
      deliverContext({
        from: repo,
        context: 'workflow',
        origin: 'cratylus',
        version: '1.0.0',
      }).identity,
    ).toBe(first);
  });
});
