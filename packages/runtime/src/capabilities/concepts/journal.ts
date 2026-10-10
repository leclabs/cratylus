// ─────────────────────────────────────────────────────────────────────────────
// The JOURNAL STORE: the directory `design/journal` at the top of the git
// repository holding the working directory, one entry per file.
//
// An entry's file is named by its id, a ULID, and holds the entry as JSON.
// Appending adds exactly one new file and changes no other; nothing is ever
// edited, moved or deleted, so two branches that both appended merge in git as
// the union of their files. Entries are read only from this directory of the
// working tree, never from another branch, ref, worktree or git history, and
// are ordered by their id.
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
import { type Draft, type Entry, KINDS } from './entries.js';

/** The journal's place, relative to the top of the repository. */
export const JOURNAL_DIR = 'design/journal';

/** An entry's file name: its id, then `.json`. */
const ENTRY_FILE = /^([0-9A-HJKMNP-TV-Z]{26})\.json$/;

/** The concept journal of one working tree. */
export interface Journal {
  /** Every entry, in append order. */
  entries(): readonly Entry[];
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
  let cached: readonly Entry[] | undefined;

  const entries = (): readonly Entry[] => {
    if (cached !== undefined) return cached;
    const names = existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true })
          .filter((d) => d.isFile() && ENTRY_FILE.test(d.name))
          .map((d) => d.name)
          .sort()
      : [];
    cached = names.map((name) => read(join(dir, name), name, refuse));
    return cached;
  };

  return {
    entries,
    append(draft) {
      const last = entries().at(-1)?.id;
      const id = mintAfter(last);
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

/** The entry in the file at `path`, named `name`; refuses one that is not an
 *  entry of this journal. */
function read(
  path: string,
  name: string,
  refuse: (message: string) => Error,
): Entry {
  const entry: unknown = (() => {
    try {
      return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
      throw refuse(`the journal entry ${JOURNAL_DIR}/${name} is not JSON`);
    }
  })();
  // Its file names its id; a kind the journal does not record is no entry.
  const isEntry =
    typeof entry === 'object' &&
    entry !== null &&
    'id' in entry &&
    entry.id === name.slice(0, -'.json'.length) &&
    'kind' in entry &&
    KINDS.some((kind) => kind === entry.kind);
  if (!isEntry)
    throw refuse(
      `the journal entry ${JOURNAL_DIR}/${name} is not an entry of this journal`,
    );
  // Appended only by this module and never edited: its id and kind vouch for
  // the rest of its shape.
  const appended = entry as Entry;
  return appended;
}
