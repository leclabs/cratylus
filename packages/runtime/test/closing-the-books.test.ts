// Closing the concept journal's books (decision 0314): one call appends a close
// entry bringing forward what stands and removes every other entry file, which
// version control keeps at the commit the close names. These hold that every
// reading of what stands answers the same after a close as before, that the
// history readings name the close, that each refusal changes nothing, that a
// later close carries again, that appending and a delivered context's identity
// survive a close, and that a close joins a line of work that appended.

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
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deliverContext } from '../src/capabilities/concepts/delivered.js';
import { JOURNAL } from '../src/capabilities/concepts/dispatch.js';
import { dispatchConcepts } from '../src/capabilities/concepts/index.js';
import { explain } from '../src/explanation.js';
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
/** Write `body` as an entry recorded by an earlier workflow; its id. */
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
const standing = () => STANDING.map((argv) => concepts(...argv));

/** The history readings, which name the latest close. */
const HISTORY = [
  ['history', 'hold', '--context', 'booking'],
  ['history', '--context', 'booking'],
  ['design', '--history'],
  ['decisions', '--history'],
];

/** A journal with history: purposes, two contexts one changed, superseded,
 *  competing and retired concepts, decisions superseded, deprecated, open,
 *  accepted by acceptance, recorded accepted and classified, and efficiency
 *  figures; each entry that stands, and each that does not, by its id. */
function seed() {
  const purposeFirst = idOf(concepts('purpose', '--statement', 'Book seats.'));
  const purpose = idOf(
    concepts('purpose', '--statement', 'Book and pay.', '--reason', 'Pay.'),
  );
  const bookingFirst = idOf(
    concepts('context', 'booking', '--subject', 'Booking.'),
  );
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
  const booking = idOf(
    concepts(
      'context',
      'booking',
      '--subject',
      'Booking seats.',
      '--reason',
      'Sharper.',
    ),
  );
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
  const holdFirst = worded('define', 'hold', 'booking', 'A hold.');
  const slot = worded('define', 'slot', 'booking', 'A slot.');
  // Each superseded after a later concept or context was first recorded, so
  // a close keeps the order the views list them in only by recording it.
  const hold = worded('supersede', 'hold', 'booking', 'A short hold.');
  const sibling = (wording: string) =>
    recorded({
      kind: 'supersede',
      context: 'booking',
      name: 'slot',
      wording,
      builtFrom: [],
      reason: 'A line of work.',
      supersedes: [slot],
    });
  const competing = [sibling('A wide slot.'), sibling('A narrow slot.')];
  const gone = [
    worded('define', 'gone', 'booking', 'Gone soon.'),
    idOf(
      concepts('retire', 'gone', '--context', 'booking', '--reason', 'Gone.'),
    ),
  ];
  const truck = worded('define', 'truck', 'fleet', 'A truck.');
  const d1 = decide('d1', 'open').id;
  const d1Accepted = idOf(concepts('accept', 'd1'));
  const d2 = decide('d2', 'accepted', '--supersedes', 'd1').id;
  const d3 = decide('d3', 'open').id;
  const d3Deprecated = idOf(concepts('deprecate', 'd3', '--reason', 'Done.'));
  const d4 = decide('d4', 'open').id;
  const d4Accepted = idOf(concepts('accept', 'd4', '--reason', 'Agreed.'));
  const d5 = decide('d5', 'open').id;
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
  });
  const classifiedFirst = recorded({
    kind: 'classify',
    decisionId: 'told',
    entry: told,
    decisionKind: 'meaning',
  });
  const classified = recorded({
    kind: 'classify',
    decisionId: 'told',
    entry: told,
    decisionKind: 'realization',
    reason: 'It constrains.',
  });
  const efficiency = recorded({
    kind: 'efficiency',
    context: 'booking',
    cut: 'c1',
    agentRuns: { total: 1, byRole: { builder: 1 } },
    rounds: 1,
    wholeCheckRuns: 1,
    tokens: null,
  });
  return {
    carried: [
      purpose,
      booking,
      fleet,
      hold,
      ...competing,
      truck,
      gone[1] as string,
      d2,
      d4,
      d4Accepted,
      d5,
      told,
      classified,
    ].sort(),
    dropped: [
      purposeFirst,
      bookingFirst,
      holdFirst,
      slot,
      gone[0] as string,
      d1,
      d1Accepted,
      d3,
      d3Deprecated,
      classifiedFirst,
      efficiency,
    ],
    bookingFirst,
    booking,
    fleet,
    holdFirst,
    slot,
    truck,
    goneFirst: gone[0] as string,
  };
}

/** The close entry the journal's one file holds. */
const closeFile = () => {
  const [name] = files();
  return JSON.parse(readFileSync(join(dir(), name as string), 'utf8')) as {
    id: string;
    kind: string;
    commit: string;
    broughtForward: { id: string }[];
    closed: string[];
    identities: Record<string, string[]>;
    resolved: Record<string, string | null>;
    concepts: Record<string, Record<string, string>>;
  };
};

describe('closing the books', () => {
  it('leaves the close alone, what stands as it was, and the closed period at its commit', () => {
    const {
      carried,
      dropped,
      bookingFirst,
      booking,
      fleet,
      holdFirst,
      slot,
      truck,
      goneFirst,
    } = seed();
    const head = commit();
    const before = standing();
    const contents = snapshot();
    for (const argv of HISTORY)
      expect(concepts(...argv), argv.join(' ')).not.toHaveProperty(
        'booksClosed',
      );

    const answer = concepts('close') as Record<string, unknown>;

    expect(files()).toEqual([`${answer.id}.json`]);
    expect(answer).toMatchObject({
      kind: 'close',
      commit: head,
      broughtForward: carried.length,
      closed: dropped.length,
      removed: Object.keys(contents).length,
    });
    const close = closeFile();
    expect(close.broughtForward.map((e) => e.id)).toEqual(carried);
    expect(close.closed).toEqual([...dropped].sort());
    // Each entry is brought forward verbatim, as its file held it.
    for (const entry of close.broughtForward)
      expect(entry).toEqual(JSON.parse(contents[`${entry.id}.json`] as string));
    expect(close.identities).toEqual({
      booking: [bookingFirst, booking],
      fleet: [fleet],
    });
    expect(close.resolved).toEqual({});
    expect(close.concepts).toEqual({
      booking: { hold: holdFirst, slot, gone: goneFirst },
      fleet: { truck },
    });
    // The same answers, each list in the same order.
    expect(JSON.stringify(standing())).toBe(JSON.stringify(before));
    for (const argv of HISTORY)
      expect(concepts(...argv), argv.join(' ')).toMatchObject({
        booksClosed: { entry: close.id, at: answer.at, commit: head },
      });
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

  it('is explained as closing, taking nothing', () => {
    expect(
      explain(JOURNAL).verbs.find((v) => v.name === 'close'),
    ).toMatchObject({
      concept: 'closing the books',
      effect: 'closes',
      parameters: [],
    });
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

  it('closes again after new entries, carrying again and removing the first close', () => {
    seed();
    commit();
    const first = idOf(concepts('close'));
    commit();
    const hold = idOf(
      concepts(
        'supersede',
        'hold',
        '--context',
        'booking',
        '--wording',
        'A brief hold.',
        '--reason',
        'Shorter.',
      ),
    );
    const head = commit();
    const before = standing();
    const answer = concepts('close') as Record<string, unknown>;
    expect(files()).toEqual([`${answer.id}.json`]);
    expect(answer).toMatchObject({ commit: head, removed: 2 });
    const ids = closeFile().broughtForward.map((e) => e.id);
    expect(ids).toContain(hold);
    expect(ids).not.toContain(first);
    expect(JSON.stringify(standing())).toBe(JSON.stringify(before));
    expect(concepts('history', 'hold', '--context', 'booking')).toMatchObject({
      booksClosed: { entry: answer.id, commit: head },
    });
  });

  it('appends after a close, past it, superseding, accepting and deprecating what it carried', () => {
    seed();
    commit();
    const close = idOf(concepts('close'));
    const hold = idOf(
      concepts(
        'supersede',
        'hold',
        '--context',
        'booking',
        '--wording',
        'A brief hold.',
        '--reason',
        'Shorter.',
      ),
    );
    expect(hold > close).toBe(true);
    concepts('accept', 'd5');
    concepts('deprecate', 'told', '--reason', 'Stated by the concepts.');
    const d6 = decide('d6', 'open', '--supersedes', 'd4').id;
    expect(files()).toHaveLength(5);
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
    // A concept retired before the close is brought back by a supersession.
    concepts(
      'supersede',
      'gone',
      '--context',
      'booking',
      '--wording',
      'Back again.',
      '--reason',
      'Needed.',
    );
    expect(
      (concepts('design', '--context', 'booking') as typeof design).contexts[0]
        ?.concepts,
    ).toContainEqual({ name: 'gone', wording: 'Back again.', builtFrom: [] });
  });

  it('keeps a delivered context’s identity, and the journal holding it, across a close', () => {
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
    concepts(
      'define',
      'part',
      '--context',
      'workflow',
      '--wording',
      'A part.',
      '--reason',
      'First.',
    );
    const delivered = deliverContext({
      from: repo,
      context: 'workflow',
      origin: 'cratylus',
      version: '1.0.0',
    });
    expect(delivered.identity).toBe(first);
    commit();
    concepts('close');
    expect(
      deliverContext({
        from: repo,
        context: 'workflow',
        origin: 'cratylus',
        version: '1.0.0',
      }),
    ).toEqual(delivered);
    // The journal still holds the context it delivers: shown among its own.
    const state = dispatchConcepts(['state'], {
      from: repo,
      delivered: [delivered],
    }) as Record<string, unknown>;
    expect(state).not.toHaveProperty('practice');
    expect(state.contexts).toMatchObject([{ name: 'workflow' }]);
  });

  it('joins a line of work that appended after the close’s base as the union of their files', () => {
    seed();
    commit();
    git('checkout', '-q', '-b', 'other');
    concepts(
      'supersede',
      'hold',
      '--context',
      'booking',
      '--wording',
      'A brief hold.',
      '--reason',
      'Shorter.',
    );
    decide('d7', 'open', '--supersedes', 'd5');
    commit('other');
    const joined = standing();
    git('checkout', '-q', 'main');
    concepts('close');
    commit('close');
    git('merge', '-q', '--no-ff', '--no-edit', 'other');
    expect(files()).toHaveLength(3);
    expect(JSON.stringify(standing())).toBe(JSON.stringify(joined));
    const decisions = concepts('decisions', '--history') as {
      decisions: { id: string; status: string }[];
    };
    expect(decisions.decisions).toContainEqual(
      expect.objectContaining({ id: 'd5', status: 'superseded' }),
    );
  });

  describe('reads what a close brings forward as it reads an entry file', () => {
    const close = (broughtForward: object[]) =>
      recorded({
        kind: 'close',
        commit: '0'.repeat(40),
        broughtForward,
        closed: [],
        identities: {},
        concepts: {},
        resolved: {},
      });
    const context = (id: string) => ({
      id,
      at: '2026-01-01T00:00:00.000Z',
      kind: 'context',
      name: 'booking',
      subject: 'Booking.',
      relation: '',
    });

    it('refuses a malformed entry of a known kind, naming the close’s file', () => {
      const id = ulid();
      const file = close([{ ...context(id), subject: 3 }]);
      expect(() => concepts('state')).toThrow(
        `concepts state: the entry ${id} brought forward by the journal entry design/journal/${file}.json is a context entry this runtime cannot read: subject is missing or malformed`,
      );
    });

    it('reads past an entry of a newer kind or value, counting it', () => {
      close([
        context(ulid()),
        { id: ulid(), at: '2026-01-01T00:00:00.000Z', kind: 'forecast' },
      ]);
      expect(concepts('state')).toMatchObject({
        contexts: [{ name: 'booking', subject: 'Booking.' }],
        uninterpreted: { kinds: { forecast: 1 } },
      });
    });

    it('reads an entry a file and a close both hold once', () => {
      const id = ulid();
      mkdirSync(dir(), { recursive: true });
      writeFileSync(join(dir(), `${id}.json`), JSON.stringify(context(id)));
      close([context(id)]);
      expect(concepts('history', '--context', 'booking')).toMatchObject({
        versions: [{ id }],
      });
    });
  });
});

describe('a close joined with another line of work', () => {
  const define = (name: string, verb = 'define', wording = `A ${name}.`) =>
    idOf(
      concepts(
        verb,
        name,
        '--context',
        'booking',
        '--wording',
        wording,
        '--reason',
        'Because.',
      ),
    );
  const standingIds = () =>
    (concepts('decisions') as { decisions: { entry: string }[] }).decisions.map(
      (d) => d.entry,
    );
  const join_ = (other: string) =>
    git('merge', '-q', '--no-ff', '--no-edit', other);

  beforeEach(() => {
    concepts('context', 'booking', '--subject', 'Booking.');
  });

  it('keeps a retirement one line closed competing with a version the other recorded', () => {
    define('x');
    commit('base');
    git('checkout', '-q', '-b', 'other');
    define('x', 'supersede', 'A wider x.');
    commit('other');
    git('checkout', '-q', 'main');
    concepts('retire', 'x', '--context', 'booking', '--reason', 'Gone.');
    commit('retire');
    concepts('close');
    commit('close');
    join_('other');
    expect(concepts('design', '--history')).toMatchObject({
      contexts: [
        {
          concepts: [],
          competing: [
            {
              name: 'x',
              versions: [
                { wording: 'A wider x.' },
                { retired: true, reason: 'Gone.' },
              ],
            },
          ],
        },
      ],
    });
  });

  it('never reads again a decision one close ended, though another carried it', () => {
    const d = decide('d', 'open').id;
    commit('base');
    git('checkout', '-q', '-b', 'other');
    concepts('close');
    commit('other close');
    git('checkout', '-q', 'main');
    concepts('deprecate', 'd', '--reason', 'Done.');
    commit('deprecate');
    concepts('close');
    commit('close');
    join_('other');
    expect(files()).toHaveLength(2);
    expect(standingIds()).not.toContain(d);
  });

  it('never reads again a superseded decision one close ended, carried by the other line', () => {
    const d1 = decide('d1', 'open').id;
    commit('base');
    git('checkout', '-q', '-b', 'other');
    concepts('close');
    commit('other close');
    git('checkout', '-q', 'main');
    decide('d2', 'open', '--supersedes', 'd1');
    concepts('deprecate', 'd2', '--reason', 'Done.');
    commit('d2');
    concepts('close');
    commit('close');
    join_('other');
    expect(standingIds()).not.toContain(d1);
    expect(standingIds()).toEqual([]);
  });

  it('binds a reference by name alone as it bound before the close', () => {
    const legacy = (id: string, body: object) =>
      writeFileSync(
        join(dir(), `${id}.json`),
        JSON.stringify({ id, at: '2026-01-01T00:00:00.000Z', ...body }),
      );
    const decision = {
      kind: 'decide',
      decisionId: 'd1',
      context: 'booking',
      title: 'T',
      situation: 'S',
      decision: 'D',
      consequences: 'C',
      status: 'open',
      supersedes: null,
    };
    legacy('01A00000000000000000000001', decision);
    legacy('01A00000000000000000000002', decision);
    legacy('01A00000000000000000000003', {
      ...decision,
      decisionId: 'd2',
      supersedes: 'd1',
    });
    legacy('01A00000000000000000000004', {
      kind: 'deprecate',
      decisionId: 'd1',
      entry: '01A00000000000000000000001',
      reason: 'Done.',
    });
    const before = concepts('decisions');
    expect(standingIds()).toEqual([
      '01A00000000000000000000002',
      '01A00000000000000000000003',
    ]);
    commit();
    concepts('close');
    expect(closeFile().resolved).toEqual({
      '01A00000000000000000000003': null,
    });
    expect(concepts('decisions')).toEqual(before);
  });

  it('keeps a delivered context the journal holds through a close of a joined context', () => {
    concepts('purpose', '--statement', 'Book.');
    commit('root');
    git('checkout', '-q', '-b', 'other');
    const theirs = idOf(
      concepts('context', 'workflow', '--subject', 'Theirs.', '--relation', ''),
    );
    concepts(
      'define',
      'part',
      '--context',
      'workflow',
      '--wording',
      'A part.',
      '--reason',
      'First.',
    );
    const delivered = deliverContext({
      from: repo,
      context: 'workflow',
      origin: 'cratylus',
      version: '1.0.0',
    });
    expect(delivered.identity).toBe(theirs);
    commit('theirs');
    git('checkout', '-q', 'main');
    const ours = idOf(
      concepts('context', 'workflow', '--subject', 'Ours.', '--relation', ''),
    );
    commit('ours');
    join_('other');
    const settled = idOf(
      concepts(
        'context',
        'workflow',
        '--subject',
        'Settled.',
        '--relation',
        '',
        '--reason',
        'Settle.',
      ),
    );
    commit('settled');
    const read = () =>
      dispatchConcepts(['state'], { from: repo, delivered: [delivered] });
    const before = read();
    expect(before).not.toHaveProperty('practice');
    concepts('close');
    expect(closeFile().identities.workflow).toEqual(
      [ours, theirs, settled].sort(),
    );
    expect(read()).toEqual(before);
  });

  it('keeps each concept’s order by its own recorded first version, whatever its name', () => {
    define('first');
    commit();
    concepts('close');
    commit();
    define('constructor');
    define('last');
    const order = () =>
      (
        concepts('design') as { contexts: { concepts: { name: string }[] }[] }
      ).contexts[0]?.concepts.map((c) => c.name);
    expect(order()).toEqual(
      ['booking', 'first', 'constructor', 'last'].slice(1),
    );
    commit();
    concepts('close');
    expect(
      Object.hasOwn(closeFile().concepts.booking ?? {}, 'constructor'),
    ).toBe(true);
    expect(order()).toEqual(['first', 'constructor', 'last']);
  });

  it('names closed again what an earlier close ended, so a line still carrying it cannot bring it back', () => {
    const d1 = decide('d1', 'open').id;
    commit('base');
    git('checkout', '-q', '-b', 'other');
    concepts('close');
    commit('other close');
    git('checkout', '-q', 'main');
    concepts('deprecate', 'd1', '--reason', 'Done.');
    commit('deprecate');
    concepts('close');
    commit('close');
    concepts('purpose', '--statement', 'Book.');
    commit('purpose');
    concepts('close');
    commit('close again');
    expect(closeFile().closed).toContain(d1);
    join_('other');
    expect(standingIds()).not.toContain(d1);
  });

  it('keeps a context’s identity and order through a close of two joined closes', () => {
    concepts('purpose', '--statement', 'Book.');
    commit('root');
    git('checkout', '-q', '-b', 'other');
    const theirs = idOf(
      concepts('context', 'shared', '--subject', 'Shared.', '--relation', ''),
    );
    commit('theirs');
    git('checkout', '-q', 'main');
    concepts('context', 'alpha', '--subject', 'Alpha.', '--relation', '');
    const ours = idOf(
      concepts('context', 'shared', '--subject', 'Shared.', '--relation', ''),
    );
    commit('ours');
    git('checkout', '-q', 'other');
    concepts('close');
    commit('their close');
    git('checkout', '-q', 'main');
    concepts('close');
    commit('our close');
    join_('other');
    const delivered = () =>
      deliverContext({
        from: repo,
        context: 'shared',
        origin: 'cratylus',
        version: '1.0.0',
      }).identity;
    const order = () =>
      (concepts('state') as { contexts: { name: string }[] }).contexts.map(
        (c) => c.name,
      );
    expect(delivered()).toBe(ours);
    expect(order()).toEqual(['booking', 'alpha', 'shared']);
    concepts('purpose', '--statement', 'Book more.', '--reason', 'More.');
    commit('purpose');
    concepts('close');
    expect(closeFile().identities.shared).toEqual([ours, theirs]);
    expect(delivered()).toBe(ours);
    expect(order()).toEqual(['booking', 'alpha', 'shared']);
  });
});
