// ─────────────────────────────────────────────────────────────────────────────
// The JOURNAL STORE: the directory `design/journal` at the top of the git
// repository holding the working directory, one entry per file.
//
// An entry's file is named by its id, a ULID, and holds the entry as JSON.
// Appending adds exactly one new file and changes no other; nothing is ever
// edited, moved or deleted, so two branches that both appended merge in git as
// the union of their files. Entries are read only from this directory of the
// working tree, never from another branch, ref, worktree or git history, and
// are ordered by their id. An entry of a kind this runtime does not know is
// read past and counted by its kind, so every reading can say what it left
// uninterpreted; an entry of a known kind that cannot be read is refused.
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
import { decodeTime, monotonicFactory, ulid } from '../../ulid.js';
import { type Draft, type Entry, isKind, unfit } from './entries.js';

/** The journal's place, relative to the top of the repository. */
export const JOURNAL_DIR = 'design/journal';

/** An entry's file name: its id, then `.json`. */
const ENTRY_FILE = /^([0-9A-HJKMNP-TV-Z]{26})\.json$/;

/** The concept journal of one working tree. */
export interface Journal {
  /** The top of the git repository holding the journal. */
  readonly root: string;
  /** Every entry of a kind this runtime knows, in append order. */
  entries(): readonly Entry[];
  /** Each kind of entry this runtime does not know, with how many entries of
   *  it were read past, in the order first met; empty when there are none. */
  unknownKinds(): ReadonlyMap<string, number>;
  /** Append `draft` as one new entry, stamped with its id and time. */
  append<D extends Draft>(draft: D): D & { id: string; at: string };
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
        readonly unknownKinds: ReadonlyMap<string, number>;
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
    const unknownKinds = new Map<string, number>();
    for (const name of names) {
      const read = readEntry(join(dir, name), name, refuse);
      if (typeof read === 'string')
        unknownKinds.set(read, (unknownKinds.get(read) ?? 0) + 1);
      else entries.push(read);
    }
    cached = {
      entries,
      unknownKinds,
      last: names.at(-1)?.slice(0, -'.json'.length),
    };
    return cached;
  };

  return {
    root: top,
    entries: () => load().entries,
    unknownKinds: () => load().unknownKinds,
    append(draft) {
      const id = mintAfter(load().last);
      const entry = {
        id,
        at: new Date(decodeTime(id)).toISOString(),
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

/** The entry in the file at `path`, named `name`, or the kind it is of when
 *  this runtime does not know that kind; refuses one that is not an entry of
 *  this journal, or of a known kind but lacking what that kind carries. */
function readEntry(
  path: string,
  name: string,
  refuse: (message: string) => Error,
): Entry | string {
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
  if (!isKind(entry.kind)) return entry.kind;
  const missing = unfit(entry as Record<string, unknown>, entry.kind);
  if (missing.length > 0)
    throw refuse(
      `the journal entry ${JOURNAL_DIR}/${name} is a ${entry.kind} entry this runtime cannot read: ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} missing or malformed`,
    );
  return entry as Entry;
}
