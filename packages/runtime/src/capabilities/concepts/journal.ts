// ─────────────────────────────────────────────────────────────────────────────
// The JOURNAL STORE: the directory `design/journal` at the top of the git
// repository holding the working directory, one entry per file.
//
// An entry's file is named by its id, a ULID, and holds the entry as JSON.
// Appending adds exactly one new file and changes no other; nothing is ever
// edited, moved or deleted, so two branches that both appended merge in git as
// the union of their files. Entries are read only from this directory of the
// working tree, never from another branch, ref, worktree or git history, and
// are ordered by their id. An entry of a kind this runtime does not know, or of
// a known kind holding a value it does not know, is read past and counted by
// its kind, so every reading can say what it left uninterpreted; an entry of a
// known kind that cannot be read is refused.
//
// A process mints its ids monotonically; an id is also minted past the
// journal's last, so append order holds across the processes that appended.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  linkSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { actingAgent } from '../../acting-agent.js';
import { decodeTime, monotonicFactory, ulid } from '../../ulid.js';
import {
  type Draft,
  type Entry,
  isKind,
  newerValues,
  unfit,
} from './entries.js';

/** The journal's place, relative to the top of the repository. */
export const JOURNAL_DIR = 'design/journal';

/** An entry's file name: its id, then `.json`. */
const ENTRY_FILE = /^([0-9A-HJKMNP-TV-Z]{26})\.json$/;

/** What a reading of a ledger read past, written by a newer runtime: each
 *  kind it left uninterpreted, with how many entries of it, and each value it
 *  does not know of a known kind's field, with how many entries hold it. The
 *  concept journal and the work package ledger read past the same way. */
export class ReadPast {
  readonly kinds = new Map<string, number>();
  /** By `<kind>.<field>`, each value with how many entries hold it. */
  readonly values = new Map<string, Map<string, number>>();

  /** Count one entry of `kind` read past; `newer` names the values of its
   *  fields this runtime does not know, none when the kind itself is new. */
  add(kind: string, newer: readonly (readonly [string, string])[] = []): void {
    count(this.kinds, kind, 1);
    for (const [field, value] of newer)
      count(this.#held(`${kind}.${field}`), value, 1);
  }

  /** This and `other` together. */
  with(other: ReadPast): ReadPast {
    const both = new ReadPast();
    for (const past of [this, other]) {
      for (const [kind, n] of past.kinds) count(both.kinds, kind, n);
      for (const [key, held] of past.values)
        for (const [value, n] of held) count(both.#held(key), value, n);
    }
    return both;
  }

  /** The values counted for `key`, `<kind>.<field>`. */
  #held(key: string): Map<string, number> {
    const held = this.values.get(key) ?? new Map<string, number>();
    this.values.set(key, held);
    return held;
  }

  /** What a reading answers beside its view of the rest: `undefined` when
   *  nothing was read past. */
  report():
    | {
        readonly kinds: Readonly<Record<string, number>>;
        readonly values?: Readonly<Record<string, Record<string, number>>>;
        readonly mayBeIncomplete: true;
        readonly reading: string;
      }
    | undefined {
    if (this.kinds.size === 0) return undefined;
    return {
      kinds: Object.fromEntries(this.kinds),
      ...(this.values.size > 0
        ? {
            values: Object.fromEntries(
              [...this.values].map(([key, held]) => [
                key,
                Object.fromEntries(held),
              ]),
            ),
          }
        : {}),
      mayBeIncomplete: true,
      reading: READ_PAST,
    };
  }
}

/** What a reading that read past entries says of how it was read. */
const READ_PAST =
  'Entries written by a newer runtime, of a kind this one does not know or of a known kind holding a value it does not know, were read past: this answer is worked out from the rest and may be incomplete; each such kind is counted, with each value not known. Recording still appends, leaving every entry as it was; an entry of a known kind that cannot be read is refused, naming it.';

/** Add `n` to the count of `key` in `counts`. */
function count(counts: Map<string, number>, key: string, n: number): void {
  counts.set(key, (counts.get(key) ?? 0) + n);
}

/** The concept journal of one working tree. */
export interface Journal {
  /** The top of the git repository holding the journal. */
  readonly root: string;
  /** Who appends to it: the acting agent, else git's user, when either is known. */
  readonly maker: string | undefined;
  /** Every entry of a kind this runtime knows, in append order. */
  entries(): readonly Entry[];
  /** What was read past: entries of kinds this runtime does not know, or of a
   *  known kind holding a value it does not know. */
  readPast(): ReadPast;
  /** Append `draft` as one new entry, stamped with its id, its time and, when
   *  known, who appended it. */
  append<D extends Draft>(
    draft: D,
  ): D & { id: string; at: string; by?: string };
}

/** The journal of the git repository holding `from`; `refuse` words a refusal
 *  as the calling verb's own. */
export function journalAt(
  from: string,
  refuse: (message: string) => Error,
): Journal {
  let top: string;
  try {
    top = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: from,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    throw refuse(
      `${from} is not inside a git repository; the journal is ${JOURNAL_DIR} at the top of one`,
    );
  }
  if (top === '')
    throw refuse(
      `${from} is not inside a git working tree; the journal is ${JOURNAL_DIR} at the top of one`,
    );
  const dir = join(top, JOURNAL_DIR);
  /** What the journal holds, read once until the next append. */
  let cached:
    | {
        readonly entries: readonly Entry[];
        readonly readPast: ReadPast;
        readonly last: string | undefined;
      }
    | undefined;

  const load = () => {
    if (cached !== undefined) return cached;
    const names = existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true })
          .filter((d) => d.isFile() && ENTRY_FILE.test(d.name))
          .map((d) => d.name)
          .sort()
      : [];
    const entries: Entry[] = [];
    const readPast = new ReadPast();
    for (const name of names) {
      const read = readEntry(join(dir, name), name, refuse);
      if ('newer' in read) readPast.add(read.kind, read.newer);
      else entries.push(read);
    }
    cached = {
      entries,
      readPast,
      last: names.at(-1)?.slice(0, -'.json'.length),
    };
    return cached;
  };

  const maker = actingAgent() ?? gitUser(top);
  return {
    root: top,
    maker,
    entries: () => load().entries,
    readPast: () => load().readPast,
    append(draft) {
      const id = mintAfter(load().last);
      const entry = {
        id,
        at: new Date(decodeTime(id)).toISOString(),
        ...(maker === undefined ? {} : { by: maker }),
        ...draft,
      };
      mkdirSync(dir, { recursive: true });
      // Written aside, then linked into place: the entry appears whole or not
      // at all, and an id already taken is never overwritten.
      const aside = join(dir, `.${id}.partial`);
      writeFileSync(aside, `${JSON.stringify(entry, null, 2)}\n`, {
        flag: 'wx',
      });
      try {
        linkSync(aside, join(dir, `${id}.json`));
      } finally {
        unlinkSync(aside);
      }
      cached = undefined;
      return entry;
    },
  };
}

/** A fresh id, past `last` when the journal has one. */
function mintAfter(last: string | undefined): string {
  const id = ulid();
  if (last === undefined || id > last) return id;
  const after = decodeTime(last) + 1;
  return monotonicFactory(Math.random, () => after)();
}

/** git's user name in the repository at `top`, when one is set. */
function gitUser(top: string): string | undefined {
  try {
    const name = execFileSync('git', ['config', 'user.name'], {
      cwd: top,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return name === '' ? undefined : name;
  } catch {
    return undefined;
  }
}

/** The entry in the file at `path`, named `name`, or, when this runtime does
 *  not know its kind or a value it holds, that kind with each value it does
 *  not know; refuses one that is not an entry of this journal, or of a known
 *  kind but lacking what that kind carries. */
function readEntry(
  path: string,
  name: string,
  refuse: (message: string) => Error,
): Entry | { kind: string; newer: [string, string][] } {
  const entry: unknown = (() => {
    try {
      return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
      throw refuse(`the journal entry ${JOURNAL_DIR}/${name} is not JSON`);
    }
  })();
  // Its file names its id, and it names its kind; one without both is no entry.
  if (
    typeof entry !== 'object' ||
    entry === null ||
    !('id' in entry) ||
    entry.id !== name.slice(0, -'.json'.length) ||
    !('kind' in entry) ||
    typeof entry.kind !== 'string' ||
    entry.kind === ''
  )
    throw refuse(
      `the journal entry ${JOURNAL_DIR}/${name} is not an entry of this journal`,
    );
  if (!isKind(entry.kind)) return { kind: entry.kind, newer: [] };
  const fields = entry as Record<string, unknown>;
  const missing = unfit(fields, entry.kind);
  if (missing.length > 0)
    throw refuse(
      `the journal entry ${JOURNAL_DIR}/${name} is a ${entry.kind} entry this runtime cannot read: ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} missing or malformed`,
    );
  const newer = newerValues(fields, entry.kind);
  return newer.length > 0 ? { kind: entry.kind, newer } : (entry as Entry);
}
