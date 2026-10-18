// ─────────────────────────────────────────────────────────────────────────────
// The JOURNAL STORE: the directory `design/journal` at the top of the git
// repository holding the working directory, one entry per file.
//
// An entry's file is named by its id, a ULID, and holds the entry as JSON.
// Appending adds exactly one new file and changes no other; no entry is ever
// edited or moved, so two branches that both appended merge in git as the
// union of their files. Closing the books is the one change that removes
// files: it appends a close entry bringing forward what stands, then removes
// every other entry file, which version control keeps at the commit the close
// names. Entries are read only from this directory of the working tree, never
// from another branch, ref, worktree or git history: each entry file, and each
// entry a close in it brings forward, one per id (the same id is the same
// entry), ordered by their id. An entry of a kind this runtime does not know,
// or of a known kind holding a value it does not know, is read past and
// counted by its kind, so every reading can say what it left uninterpreted; an
// entry of a known kind that cannot be read is refused.
//
// A process mints its ids monotonically; an id is also minted past the
// journal's last file, so append order holds across the processes that
// appended.
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
import { makerAt } from '../../acting-agent.js';
import { decodeTime, monotonicFactory, ulid } from '../../ulid.js';
import {
  type CloseEntry,
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

/** An entry's id: a ULID. */
const ENTRY_ID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

/** What a reading of the journal read past, written by a newer runtime: each
 *  kind it left uninterpreted, with how many entries of it, and each value it
 *  does not know of a known kind's field, with how many entries hold it. */
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
  /** Every entry of a kind this runtime knows, in append order: each entry
   *  file's, and each a close brings forward, one per id. */
  entries(): readonly Entry[];
  /** What was read past: entries of kinds this runtime does not know, or of a
   *  known kind holding a value it does not know. */
  readPast(): ReadPast;
  /** The entry files the directory holds, each by its id with its kind, in
   *  append order. */
  files(): readonly { readonly id: string; readonly kind: string }[];
  /** Append `draft` as one new entry, stamped with its id, its time and, when
   *  known, who appended it. */
  append<D extends Draft>(
    draft: D,
  ): D & { id: string; at: string; by?: string };
  /** Close the books: append `draft` as `append` does, then remove every other
   *  entry file; the close entry, and how many files it removed. */
  close(draft: Draft<CloseEntry>): {
    readonly entry: CloseEntry;
    readonly removed: number;
  };
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
  /** What the journal holds, read once until the next change. */
  let cached:
    | {
        readonly entries: readonly Entry[];
        readonly readPast: ReadPast;
        readonly files: readonly { id: string; kind: string }[];
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
    // Each entry by its id: a file's first, then each a close brings forward
    // that no file or earlier close holds, since the same id is the same entry.
    const read = new Map<string, Read>();
    const files = names.map((name) => {
      const entry = readEntry(join(dir, name), name, refuse);
      read.set(entry.id, entry);
      return { id: entry.id, kind: entry.kind };
    });
    for (const name of names) {
      const close = read.get(name.slice(0, -'.json'.length)) as Read;
      if (close.kind !== 'close' || 'newer' in close) continue;
      for (const [at, carried] of (
        close as CloseEntry
      ).broughtForward.entries()) {
        const id: unknown = Reflect.get(carried, 'id');
        const what = `the entry ${typeof id === 'string' ? id : `#${at + 1}`} brought forward by the journal entry ${JOURNAL_DIR}/${name}`;
        const entry = entryOf(carried, what, undefined, refuse);
        if (entry.kind === 'close')
          throw refuse(`${what} is a close entry; a close brings none forward`);
        if (!read.has(entry.id)) read.set(entry.id, entry);
      }
    }
    const entries: Entry[] = [];
    const readPast = new ReadPast();
    for (const id of [...read.keys()].sort()) {
      const entry = read.get(id) as Read;
      if ('newer' in entry) readPast.add(entry.kind, entry.newer);
      else entries.push(entry);
    }
    cached = { entries, readPast, files };
    return cached;
  };

  const maker = makerAt(top);
  /** Append `draft` as one new entry, past the journal's last file. */
  const put = <D extends Draft>(draft: D) => {
    const id = mintAfter(load().files.at(-1)?.id);
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
    return entry;
  };
  return {
    root: top,
    maker,
    entries: () => load().entries,
    readPast: () => load().readPast,
    files: () => load().files,
    append(draft) {
      const entry = put(draft);
      cached = undefined;
      return entry;
    },
    close(draft) {
      const closed = load().files;
      const entry = put(draft);
      // Every other entry file leaves the journal, the close alone staying.
      for (const { id } of closed) unlinkSync(join(dir, `${id}.json`));
      cached = undefined;
      return { entry: entry as CloseEntry, removed: closed.length };
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

/** An entry as read: one this runtime reads, or, where it does not know its
 *  kind or a value it holds, its id and kind with each value it does not know. */
type Read =
  | Entry
  | { id: string; kind: string; newer: [field: string, value: string][] };

/** The entry in the file at `path`, named `name`, as read; refuses one that is
 *  not JSON, or as `entryOf` refuses. */
function readEntry(
  path: string,
  name: string,
  refuse: (message: string) => Error,
): Read {
  const entry: unknown = (() => {
    try {
      return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
      throw refuse(`the journal entry ${JOURNAL_DIR}/${name} is not JSON`);
    }
  })();
  return entryOf(
    entry,
    `the journal entry ${JOURNAL_DIR}/${name}`,
    name.slice(0, -'.json'.length),
    refuse,
  );
}

/** `entry`, described as `what`, as read; `id` the id its file names it by,
 *  none for an entry a close brings forward, whose id is then any ULID. Refuses
 *  one that is not an entry of this journal, or of a known kind but lacking
 *  what that kind carries. */
function entryOf(
  entry: unknown,
  what: string,
  id: string | undefined,
  refuse: (message: string) => Error,
): Read {
  // It names its id, the one its file names, and its kind; one without both is no entry.
  if (
    typeof entry !== 'object' ||
    entry === null ||
    !('id' in entry) ||
    typeof entry.id !== 'string' ||
    (id === undefined ? !ENTRY_ID.test(entry.id) : entry.id !== id) ||
    !('kind' in entry) ||
    typeof entry.kind !== 'string' ||
    entry.kind === ''
  )
    throw refuse(`${what} is not an entry of this journal`);
  if (!isKind(entry.kind)) return { id: entry.id, kind: entry.kind, newer: [] };
  const fields = entry as Record<string, unknown>;
  const missing = unfit(fields, entry.kind);
  if (missing.length > 0)
    throw refuse(
      `${what} is a ${entry.kind} entry this runtime cannot read: ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} missing or malformed`,
    );
  const newer = newerValues(fields, entry.kind);
  return newer.length > 0
    ? { id: entry.id, kind: entry.kind, newer }
    : (entry as Entry);
}
