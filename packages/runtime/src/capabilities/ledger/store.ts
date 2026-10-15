// ─────────────────────────────────────────────────────────────────────────────
// The LEDGER's store: the directory `design/ledger` at the top of the git
// repository holding the working directory, one entry per file, tracked and
// versioned with the branch, so a branch's entries arrive elsewhere only with
// its merge.
//
// An entry's file is named by its id, a ULID, and holds the entry as JSON. It
// is created exclusively and never overwritten, modified or deleted: the
// ledger only appends, so two branches that both appended merge in git as the
// union of their files. Entries are read only from this directory of the
// working tree and are ordered by their id, like the concept journal's, and
// like it the ledger reads past an entry of a kind this runtime does not know,
// written by a newer one, counting it by its kind so every reading can say
// what it left uninterpreted.
//
// Every entry carries a TRANSITION, its own id: appending an entry whose
// transition is already recorded is refused, and nothing is written. Appends
// are serialised across processes by a lock file under the repository's git
// common directory, so the same transition delivered twice at once is still
// recorded once.
//
// Entry kinds: `story` and `task` (one in flight, recorded by its verb or by
// the first dispatch naming it), `end` (how one ended: merged or dropped), and
// the harness's own `dispatched` and `returned`, written only through
// `cratylus lifecycle`. Nothing derived (what is in flight, what each cost) is
// ever stored; `fold.ts` computes it.
//
// HISTORY. Entries written while the ledger kept cuts (kinds `cut`, `freeze`,
// `integrate`, `submit`, `update`, `commit`, `check`, `verdict`, `reported`,
// and `dispatched` and `returned` naming a cut) are known history: never in
// flight, never counted, never reported as unknown. The one fact still read
// from them is which cuts were integrated, which keeps a decision recorded
// about such a cut deprecated, and its examples history, in the concept
// journal.
// ─────────────────────────────────────────────────────────────────────────────

import {
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { decodeTime, monotonicFactory, ulid } from '../../ulid.js';
import { ReadPast } from '../concepts/journal.js';
import { commonDirOf } from './git.js';

/** The ledger's place, relative to the top of the repository. */
export const LEDGER_DIR = 'design/ledger';

/** An entry's file name: its id, then `.json`. */
const ENTRY_FILE = /^([0-9A-HJKMNP-TV-Z]{26})\.json$/;

/** How a story or a task ended. */
export const OUTCOMES = ['merged', 'dropped'] as const;
export type Outcome = (typeof OUTCOMES)[number];

/** The lifecycle kinds: written only from the harness's agent events. */
export const LIFECYCLE_KINDS = ['dispatched', 'returned'] as const;

/** What is appended, before the ledger stamps it with its id and time. */
export type LedgerDraft = { readonly transition: string } & (
  | {
      readonly kind: 'story';
      readonly story: string;
      readonly contexts?: readonly string[];
    }
  | { readonly kind: 'task'; readonly task: string; readonly story?: string }
  | ({ readonly kind: 'end'; readonly outcome: Outcome } & (
      | { readonly story: string }
      | { readonly task: string }
    ))
  | {
      readonly kind: 'dispatched';
      readonly call: string;
      readonly agent: string;
      readonly role: string;
      readonly story?: string;
      readonly task?: string;
    }
  | {
      readonly kind: 'returned';
      readonly call: string;
      readonly agent: string;
      readonly tokens?: number;
    }
);

/** One entry of the ledger: a draft, its id and when it was appended. */
export type LedgerEntry = LedgerDraft & {
  readonly id: string;
  readonly at: string;
};

/** The kinds the ledger records now. */
const KINDS: readonly string[] = ['story', 'task', 'end', ...LIFECYCLE_KINDS];

/** The kinds of the cut-era entries, each naming its cut: known history. */
const CUT_KINDS: readonly string[] = [
  'cut',
  'freeze',
  'integrate',
  'submit',
  'update',
  'commit',
  'check',
  'verdict',
  'reported',
  ...LIFECYCLE_KINDS,
];

/** What one reading of the ledger holds. */
export interface LedgerReading {
  /** Every entry of a kind this runtime records, in append order. */
  readonly entries: readonly LedgerEntry[];
  /** The cuts the ledger's history records integrated. */
  readonly integratedCuts: ReadonlySet<string>;
  /** The entries of kinds this runtime does not know, read past. */
  readonly readPast: ReadPast;
}

/** The ledger of one working tree. */
export interface Ledger {
  /** The top of the git repository holding the ledger. */
  readonly root: string;
  /** What the ledger holds now. */
  read(): LedgerReading;
  /** Holding the ledger's lock, read what it holds, then append in order the
   *  drafts `plan` makes of that reading, so nothing appended between the
   *  reading and the writing can be missed. Refused, writing nothing, when
   *  `plan` throws or a draft's transition is already recorded. */
  appendAfter(
    plan: (reading: LedgerReading) => readonly LedgerDraft[],
  ): LedgerEntry[];
}

/** How long an append waits for another process's append, and when a lock
 *  left behind by a process that died is taken as stale. */
const LOCK_WAIT_MS = 20_000;
const LOCK_STALE_MS = 10_000;

/** A wait between attempts at the lock: blocks the thread without spinning. */
const PAUSE = new Int32Array(new SharedArrayBuffer(4));

/** The ledger of the git working tree whose top is `top`; `refuse` words a
 *  refusal as the caller's own. */
export function ledgerAt(
  top: string,
  refuse: (message: string) => Error,
): Ledger {
  const dir = join(top, LEDGER_DIR);
  /** What the ledger holds, every transition recorded and its last entry's
   *  id, whatever their kind. */
  const scan = () => {
    const names = existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true })
          .filter((d) => d.isFile() && ENTRY_FILE.test(d.name))
          .map((d) => d.name)
          .sort()
      : [];
    const entries: LedgerEntry[] = [];
    const integratedCuts = new Set<string>();
    const readPast = new ReadPast();
    const transitions = new Map<string, string>();
    for (const name of names) {
      const entry = entryAt(join(dir, name), name, refuse);
      transitions.set(entry.transition, entry.id);
      if (typeof entry.cut === 'string' && CUT_KINDS.includes(entry.kind)) {
        if (entry.kind === 'integrate') integratedCuts.add(entry.cut);
      } else if (KINDS.includes(entry.kind))
        entries.push(current(entry, name, refuse));
      else readPast.add(entry.kind);
    }
    return {
      reading: { entries, integratedCuts, readPast },
      transitions,
      last: names.at(-1)?.slice(0, -'.json'.length),
    };
  };

  /** The last reading, kept until this ledger next appends. */
  let cached: LedgerReading | undefined;

  /** Run `body` holding the repository's ledger lock. */
  const locked = <T>(body: () => T): T => {
    const held = join(commonDirOf(top), 'cratylus');
    const lock = join(held, 'ledger.lock');
    mkdirSync(held, { recursive: true });
    const deadline = Date.now() + LOCK_WAIT_MS;
    for (;;) {
      try {
        writeFileSync(lock, `${process.pid}\n`, { flag: 'wx' });
        break;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        try {
          if (Date.now() - statSync(lock).mtimeMs > LOCK_STALE_MS)
            rmSync(lock, { force: true });
        } catch {
          // Released between the attempt and the look.
        }
        if (Date.now() > deadline)
          throw refuse(
            `the ledger is held by another append (${lock}); nothing is written`,
          );
        Atomics.wait(PAUSE, 0, 0, 10);
      }
    }
    try {
      return body();
    } finally {
      rmSync(lock, { force: true });
    }
  };

  const appendAfter: Ledger['appendAfter'] = (plan) => {
    try {
      return locked(() => {
        const { reading, transitions, last } = scan();
        const drafts = plan(reading);
        const planned = new Set<string>();
        for (const draft of drafts) {
          const earlier = transitions.get(draft.transition);
          if (earlier !== undefined || planned.has(draft.transition))
            throw refuse(
              `the transition '${draft.transition}' is already recorded${earlier === undefined ? '' : ` (${LEDGER_DIR}/${earlier}.json)`}; the repeat is refused and nothing is written`,
            );
          planned.add(draft.transition);
        }
        mkdirSync(dir, { recursive: true });
        let previous = last;
        return drafts.map((draft) => {
          const id = mintAfter(previous);
          previous = id;
          const entry = {
            id,
            at: new Date(decodeTime(id)).toISOString(),
            ...draft,
          } as LedgerEntry;
          // Written aside, then linked into place: the entry appears whole
          // or not at all, and an id already taken is never overwritten.
          const aside = join(dir, `.${id}.partial`);
          writeFileSync(aside, `${JSON.stringify(entry, null, 2)}\n`, {
            flag: 'wx',
          });
          try {
            linkSync(aside, join(dir, `${id}.json`));
          } finally {
            unlinkSync(aside);
          }
          return entry;
        });
      });
    } finally {
      // Read afresh next time, whether the append was written or refused.
      cached = undefined;
    }
  };

  return {
    root: top,
    read() {
      cached ??= scan().reading;
      return cached;
    },
    appendAfter,
  };
}

/** A fresh id, past `last` when the ledger has one. */
function mintAfter(last: string | undefined): string {
  const id = ulid();
  if (last === undefined || id > last) return id;
  const after = decodeTime(last) + 1;
  return monotonicFactory(Math.random, () => after)();
}

/** An entry as read from its file, before its kind is known. */
type Read = Readonly<Record<string, unknown>> & {
  readonly id: string;
  readonly kind: string;
  readonly transition: string;
};

/** The entry in the file at `path`, named `name`, of whatever kind it names;
 *  refuses one that is not an entry of this ledger. */
function entryAt(
  path: string,
  name: string,
  refuse: (message: string) => Error,
): Read {
  const entry: unknown = (() => {
    try {
      return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
      throw refuse(`the ledger entry ${LEDGER_DIR}/${name} is not JSON`);
    }
  })();
  const isEntry =
    typeof entry === 'object' &&
    entry !== null &&
    'id' in entry &&
    entry.id === name.slice(0, -'.json'.length) &&
    'kind' in entry &&
    typeof entry.kind === 'string' &&
    entry.kind !== '' &&
    'transition' in entry &&
    typeof entry.transition === 'string';
  if (!isEntry)
    throw refuse(
      `the ledger entry ${LEDGER_DIR}/${name} is not an entry of this ledger`,
    );
  return entry as Read;
}

/** `entry`, of a kind the ledger records now, as that kind; refuses one
 *  missing a field its kind holds. */
function current(
  entry: Read,
  name: string,
  refuse: (message: string) => Error,
): LedgerEntry {
  const text = (field: string) => typeof entry[field] === 'string';
  const optional = (field: string) => entry[field] === undefined || text(field);
  const readable = ((): boolean => {
    switch (entry.kind) {
      case 'story':
        return (
          text('story') &&
          (entry.contexts === undefined ||
            (Array.isArray(entry.contexts) &&
              entry.contexts.every((c) => typeof c === 'string')))
        );
      case 'task':
        return text('task') && optional('story');
      case 'end':
        return (
          text('story') !== text('task') &&
          (OUTCOMES as readonly unknown[]).includes(entry.outcome)
        );
      case 'dispatched':
        return (
          text('call') &&
          text('agent') &&
          text('role') &&
          optional('story') &&
          optional('task')
        );
      default:
        return (
          text('call') &&
          text('agent') &&
          (entry.tokens === undefined || Number.isInteger(entry.tokens))
        );
    }
  })();
  if (!readable)
    throw refuse(
      `the ledger entry ${LEDGER_DIR}/${name} is a ${entry.kind} entry this runtime cannot read`,
    );
  return entry as unknown as LedgerEntry;
}
