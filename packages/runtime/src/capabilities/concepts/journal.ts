// ─────────────────────────────────────────────────────────────────────────────
// The JOURNAL STORE: the directory `design/journal` at the top of the git
// repository holding the working directory, one entry per file.
//
// An entry's file is named by its id, a ULID, and holds the entry as JSON.
// Appending adds exactly one new file and changes no other; no entry is ever
// edited or moved, so two branches that both appended merge in git as the
// union of their files. Closing the books is the one change that removes
// files: it writes one opening entry per current version of each standing
// item, then removes every other entry file, which version control keeps at
// the commit the openings name. Entries are read only from this directory of
// the working tree, never from another branch, ref, worktree or git history,
// and are ordered by their id. An entry of a kind this runtime does not know,
// or of a known kind holding a value it does not know, is read past and
// counted by its kind, so every reading can say what it left uninterpreted; an
// entry of a known kind that cannot be read is refused.
//
// A process mints its ids monotonically; an id is also minted past the
// journal's last file, so append order holds across the processes that
// appended. A close mints its openings at one moment, past every file, in the
// order it is given them.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  linkSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { makerAt } from '../../acting-agent.js';
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
  /** Every entry file's entry of a kind this runtime knows, in append order. */
  entries(): readonly Entry[];
  /** What was read past: entries of kinds this runtime does not know, or of a
   *  known kind holding a value it does not know. */
  readPast(): ReadPast;
  /** The id of every entry file the directory holds, in append order. */
  files(): readonly string[];
  /** Whether the journal's directory holds exactly what `commit` holds there:
   *  each file, hidden ones and those git ignores or is told to overlook
   *  included, with the same content, and nothing more or less. */
  matches(commit: string): boolean;
  /** Append `draft` as one new entry, stamped with its id, its time and, when
   *  known, who appended it. */
  append<D extends Draft>(
    draft: D,
  ): D & { id: string; at: string; by?: string };
  /** Close the books: write each of `openings`, in order, as one new entry
   *  stamped with one moment and, when known, who closed, then remove every
   *  other entry file; the openings, and how many files it removed. Where
   *  writing or removing fails, the journal is restored from HEAD, the
   *  openings written removed, and it refuses. */
  close(openings: readonly Draft[]): {
    readonly openings: readonly Entry[];
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
        readonly files: readonly string[];
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
    const files = names.map((name) => {
      const entry = readEntry(join(dir, name), name, refuse);
      if ('newer' in entry) readPast.add(entry.kind, entry.newer);
      else entries.push(entry);
      return entry.id;
    });
    cached = { entries, readPast, files };
    return cached;
  };

  const maker = makerAt(top);
  /** `draft` stamped with `id`, the moment `time` and, when known, who
   *  records it. */
  const stamped = <D extends Draft>(draft: D, id: string, time: number) => ({
    id,
    at: new Date(time).toISOString(),
    ...(maker === undefined ? {} : { by: maker }),
    ...draft,
  });
  /** Write `entry` as its own new file. */
  const place = (entry: { readonly id: string }) => {
    mkdirSync(dir, { recursive: true });
    // Written aside, then linked into place: the entry appears whole or not
    // at all, and an id already taken is never overwritten.
    const aside = join(dir, `.${entry.id}.partial`);
    writeFileSync(aside, `${JSON.stringify(entry, null, 2)}\n`, {
      flag: 'wx',
    });
    try {
      linkSync(aside, join(dir, `${entry.id}.json`));
    } finally {
      unlinkSync(aside);
    }
  };
  return {
    root: top,
    maker,
    entries: () => load().entries,
    readPast: () => load().readPast,
    files: () => load().files,
    matches(commit) {
      const git = (args: string[], input?: string) =>
        execFileSync('git', args, {
          cwd: top,
          encoding: 'utf8',
          input,
          stdio: ['pipe', 'pipe', 'ignore'],
        });
      // What the commit holds: each path with its mode and blob, read from its
      // tree, never from the index or what git status reports.
      const committed = new Map(
        git(['ls-tree', '-r', '-z', commit, '--', JOURNAL_DIR])
          .split('\0')
          .filter((line) => line !== '')
          .map((line) => {
            const tab = line.indexOf('\t');
            const [mode, , blob] = line.slice(0, tab).split(' ');
            return [line.slice(tab + 1), { mode, blob }];
          }),
      );
      const present = filesUnder(dir).map((file) => `${JOURNAL_DIR}/${file}`);
      if (present.length !== committed.size) return false;
      // Each a regular file, never followed through a link, of the mode its
      // tree entry records: executable or not.
      for (const path of present) {
        const stat = lstatSync(join(top, path));
        const mode = committed.get(path)?.mode;
        if (!stat.isFile()) return false;
        if (mode !== ((stat.mode & 0o100) === 0 ? '100644' : '100755'))
          return false;
      }
      if (present.length === 0) return true;
      // The bytes as they are, no filter of the repository's applied.
      const blobs = git(
        ['hash-object', '--no-filters', '--stdin-paths'],
        present.join('\n'),
      )
        .trim()
        .split('\n');
      return present.every((path, i) => committed.get(path)?.blob === blobs[i]);
    },
    append(draft) {
      const id = mintAfter(load().files.at(-1));
      const entry = stamped(draft, id, decodeTime(id));
      place(entry);
      cached = undefined;
      return entry;
    },
    close(drafts) {
      const period = load().files;
      const last = period.at(-1);
      const time = Math.max(
        Date.now(),
        last === undefined ? 0 : decodeTime(last) + 1,
      );
      const mint = monotonicFactory(Math.random, () => time);
      const openings = drafts.map((draft) => stamped(draft, mint(), time));
      cached = undefined;
      // The openings enter the journal, then every other entry file leaves
      // it; where either fails, the journal is put back as HEAD holds it.
      try {
        for (const opening of openings) place(opening);
        for (const id of period) unlinkSync(join(dir, `${id}.json`));
      } catch (failure) {
        execFileSync('git', ['checkout', 'HEAD', '--', JOURNAL_DIR], {
          cwd: top,
          stdio: 'ignore',
        });
        // Every opening, and any write of one left aside, leaves again.
        for (const { id } of openings)
          for (const file of [`${id}.json`, `.${id}.partial`])
            rmSync(join(dir, file), { force: true });
        throw refuse(
          `closing the books failed (${failure instanceof Error ? failure.message : String(failure)}); the journal is restored from the commit at HEAD and the openings written removed, so it is as it was`,
        );
      }
      return { openings: openings as Entry[], removed: period.length };
    },
  };
}

/** Every file under `dir`, by its path from it, hidden ones included; none
 *  where there is no such directory. */
function filesUnder(dir: string, within = ''): string[] {
  if (!existsSync(join(dir, within))) return [];
  return readdirSync(join(dir, within), { withFileTypes: true }).flatMap(
    (d) => {
      const path = within === '' ? d.name : `${within}/${d.name}`;
      return d.isDirectory() ? filesUnder(dir, path) : [path];
    },
  );
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

/** The entry in the file at `path`, named `name`, or, when this runtime does
 *  not know its kind or a value it holds, its id and kind with each value it
 *  does not know; refuses one that is not an entry of this journal, or of a
 *  known kind but lacking what that kind carries. */
function readEntry(
  path: string,
  name: string,
  refuse: (message: string) => Error,
): Read {
  const what = `the journal entry ${JOURNAL_DIR}/${name}`;
  const entry: unknown = (() => {
    try {
      return JSON.parse(readFileSync(path, 'utf8'));
    } catch {
      throw refuse(`${what} is not JSON`);
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
    throw refuse(`${what} is not an entry of this journal`);
  if (!isKind(entry.kind))
    return { id: entry.id as string, kind: entry.kind, newer: [] };
  const fields = entry as Record<string, unknown>;
  const missing = unfit(fields, entry.kind);
  if (missing.length > 0)
    throw refuse(
      `${what} is a ${entry.kind} entry this runtime cannot read: ${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} missing or malformed`,
    );
  const newer = newerValues(fields, entry.kind);
  return newer.length > 0
    ? { id: entry.id as string, kind: entry.kind, newer }
    : (entry as Entry);
}
