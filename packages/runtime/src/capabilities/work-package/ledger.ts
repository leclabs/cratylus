// ─────────────────────────────────────────────────────────────────────────────
// The LEDGER: the directory `design/ledger` at the top of the git repository
// holding the working directory, one entry per file, tracked and versioned with
// the branch, so a branch's entries arrive elsewhere only with its merge.
//
// An entry's file is named by its id, a ULID, and holds the entry as JSON. It
// is created exclusively and never overwritten, modified or deleted (the
// pre-commit immutability gate holds the same law), so two branches that both
// appended merge in git as the union of their files. Entries are read only from
// this directory of the working tree and are ordered by their id, like the
// concept journal's, and like it the ledger reads past an entry of a kind this
// runtime does not know, written by a newer one, counting it by its kind so
// every reading can say what it left uninterpreted.
//
// Every entry carries a TRANSITION, its own id: appending an entry whose
// transition is already recorded is refused, and nothing is written. Appends
// are serialised across processes by a lock file under the repository's git
// common directory, so the same transition delivered twice at once is still
// recorded once.
//
// Entry kinds: `cut` (the cut's record, by `open`); `submit`, `update`,
// `commit`, `check` (the work package verbs); and the LIFECYCLE kinds
// `dispatched`, `returned`, `verdict`, `reported`, written only from the
// harness's own agent events through `cratylus lifecycle`. Nothing derived
// (status, phase, readiness, figures) is ever stored; `fold.ts` computes it.
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

/** The fields of a work package a submission sets and an update replaces. */
export interface PackageFields {
  readonly outputs: readonly string[];
  readonly concepts: readonly string[];
  readonly dependsOn: readonly string[];
  readonly needs: readonly string[];
}

/** One commit a builder made as its package's. */
export interface CommitRecord {
  readonly sha: string;
  readonly message: string;
  readonly paths: readonly string[];
}

/** One assayer's verdict on one concept of one work package. */
export interface ConceptVerdict {
  readonly workPackage: string;
  readonly concept: string;
  readonly passes: boolean;
  readonly evidence: string;
  readonly finding?: string;
}

/** The lifecycle kinds: written only from the harness's agent events. */
export const LIFECYCLE_KINDS = [
  'dispatched',
  'returned',
  'verdict',
  'reported',
] as const;

/** What is appended, before the ledger stamps it with its id and time. */
export type LedgerDraft = {
  readonly transition: string;
  readonly cut: string;
} & (
  | {
      readonly kind: 'cut';
      readonly branch: string;
      readonly contexts: readonly string[];
      readonly architects: Readonly<Record<string, string>>;
    }
  | ({ readonly kind: 'submit'; readonly workPackage: string } & PackageFields)
  | {
      readonly kind: 'update';
      readonly workPackage: string;
      readonly changes: Partial<PackageFields>;
    }
  | {
      readonly kind: 'commit';
      readonly workPackage: string;
      readonly commit: CommitRecord;
    }
  | { readonly kind: 'check'; readonly failures: readonly string[] }
  | {
      readonly kind: 'dispatched';
      readonly workPackage?: string;
      readonly role: string;
      readonly run: string;
    }
  | {
      readonly kind: 'returned';
      readonly workPackage?: string;
      readonly role: string;
      readonly run: string;
      readonly tokens?: number;
    }
  | {
      readonly kind: 'verdict';
      readonly assayer: string;
      readonly run: string;
      readonly verdicts: readonly ConceptVerdict[];
      readonly hardeningNotes: readonly unknown[];
    }
  | {
      readonly kind: 'reported';
      readonly run: string;
      readonly report: unknown;
    }
);

/** One entry of the ledger: a draft, its id and when it was appended. */
export type LedgerEntry = LedgerDraft & {
  readonly id: string;
  readonly at: string;
};

/** The kinds the ledger records. */
const KINDS: readonly string[] = [
  'cut',
  'submit',
  'update',
  'commit',
  'check',
  ...LIFECYCLE_KINDS,
];

/** The ledger of one working tree. */
export interface Ledger {
  /** The top of the git repository holding the ledger. */
  readonly root: string;
  /** Every entry of a kind this runtime knows, in append order. */
  entries(): readonly LedgerEntry[];
  /** The entries of kinds this runtime does not know, read past. */
  readPast(): ReadPast;
  /** Append `draft` as one new entry; refused, writing nothing, when its
   *  transition is already recorded. */
  append<D extends LedgerDraft>(draft: D): D & { id: string; at: string };
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
  /** What the ledger holds: its entries of known kinds, what it read past,
   *  every transition recorded and its last entry's id, whatever their kind. */
  const read = () => {
    const names = existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true })
          .filter((d) => d.isFile() && ENTRY_FILE.test(d.name))
          .map((d) => d.name)
          .sort()
      : [];
    const entries: LedgerEntry[] = [];
    const readPast = new ReadPast();
    const transitions = new Map<string, string>();
    for (const name of names) {
      const entry = entryAt(join(dir, name), name, refuse);
      transitions.set(entry.transition, entry.id);
      if (KINDS.includes(entry.kind)) entries.push(entry as LedgerEntry);
      else readPast.add(entry.kind);
    }
    return {
      entries,
      readPast,
      transitions,
      last: names.at(-1)?.slice(0, -'.json'.length),
    };
  };

  /** The last reading, kept until this ledger next appends. */
  let cached:
    | { readonly entries: readonly LedgerEntry[]; readonly readPast: ReadPast }
    | undefined;
  const reading = () => {
    cached ??= read();
    return cached;
  };

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

  return {
    root: top,
    entries: () => reading().entries,
    readPast: () => reading().readPast,
    append(draft) {
      return locked(() => {
        const { transitions, last } = read();
        const earlier = transitions.get(draft.transition);
        if (earlier !== undefined)
          throw refuse(
            `the transition '${draft.transition}' is already recorded (${LEDGER_DIR}/${earlier}.json); the repeat is refused and nothing is written`,
          );
        const id = mintAfter(last);
        const entry = {
          id,
          at: new Date(decodeTime(id)).toISOString(),
          ...draft,
        };
        mkdirSync(dir, { recursive: true });
        // Written aside, then linked into place: the entry appears whole or
        // not at all, and an id already taken is never overwritten.
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
      });
    },
  };
}

/** A fresh id, past `last` when the ledger has one. */
function mintAfter(last: string | undefined): string {
  const id = ulid();
  if (last === undefined || id > last) return id;
  const after = decodeTime(last) + 1;
  return monotonicFactory(Math.random, () => after)();
}

/** The entry in the file at `path`, named `name`, of whatever kind it names;
 *  refuses one that is not an entry of this ledger. */
function entryAt(
  path: string,
  name: string,
  refuse: (message: string) => Error,
): { readonly id: string; readonly kind: string; readonly transition: string } {
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
    typeof entry.transition === 'string' &&
    'cut' in entry &&
    typeof entry.cut === 'string';
  if (!isEntry)
    throw refuse(
      `the ledger entry ${LEDGER_DIR}/${name} is not an entry of this ledger`,
    );
  // Appended only by a runtime and never edited: its id, kind, transition and
  // cut vouch for the rest of its shape.
  return entry as { id: string; kind: string; transition: string };
}
