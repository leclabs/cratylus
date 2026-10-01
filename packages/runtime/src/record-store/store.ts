// ─────────────────────────────────────────────────────────────────────────────
// THE RECORD STORE — records as files in the repository.
//
// Layout: `<repository root>/records/<domain>/<record id>.json`. One directory per
// domain under one records root, one file per record, named by its record id. A
// record id is a ULID, so two branches never mint the same file name, and a branch
// merge is the union of two sets of files: it never conflicts. What a merge CAN
// produce — two heads of one entity, a reference to an entity the other branch
// withdrew — is state the fold reports (`fold.ts`), never an error here. On one
// branch every write names only current heads, so its history stays linear and
// divergence arises only from merges.
//
// A record is never edited, moved or deleted once written: `write` refuses a record
// id whose file exists. The commit-time and CI half of that law is the immutability
// gate's, which reads the root from `RECORDS_ROOT` below.
//
// A PLAN'S LINE. A bound plan's records live on its one line: the branch
// `plan/<plan>`, held by a worktree of the repository. Reading is the union of the
// records of the checkout the store was built from and of every worktree holding a
// `plan/*` branch, which is sound because records are immutable files named by
// ULID — a record in two checkouts is one record, and a union never conflicts. The
// store only provides the line: which writes belong on it is the reading's
// (`capabilities/plan/reading.ts`). A write lands where `persist` is told, by
// default in the checkout the store was built from. The store commits nothing.
//
// Records are machine-written bytes: `RECORDS_ROOT` is in biome's `files.ignore`, so
// no formatter ever owns them.
//
// Internal to the runtime: exported through neither the `.` barrel nor a subpath.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import {
  constants,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { ulid } from '../ulid.js';
import { fold } from './fold.js';
import type { Envelope, Operation, Record, RecordId } from './record.js';

/** The records root, relative to the repository root: the one directory holding
 *  every record, one subdirectory per domain. Declared once, here. */
export const RECORDS_ROOT = 'records';

/** The branch prefix of a plan's line: the line of plan `p` is `plan/p`. */
const LINE_PREFIX = 'plan/';

/** A plan's line: its branch, and the worktree holding it. */
export interface Line {
  readonly plan: string;
  readonly branch: string;
  /** Absolute path of the worktree holding the branch. */
  readonly path: string;
}

/**
 * A failure of the store itself rather than of a domain's law: the directory is
 * not inside a repository (`outside`); a stored record cannot be read as the
 * record its file name says it is (`damaged`, with its `path`); the records
 * a write was checked against moved before it landed (`moved`); or a plan's
 * line cannot be written to or cut (`line`, its message saying how to restore
 * it). The store words the message for a reader of the store; a caller meeting
 * agents speaks it in its domain's words from `kind`, `domain` and `path`.
 */
export class StoreFault extends Error {
  constructor(
    message: string,
    readonly kind: 'outside' | 'damaged' | 'moved' | 'line',
    readonly domain?: string,
    readonly path?: string,
  ) {
    super(message);
    this.name = 'StoreFault';
  }
}

/** `args` run as git in `cwd`, its output trimmed; a failure throws with git's
 *  own words as the message. */
function git(cwd: string, ...args: string[]): string {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const said =
      error instanceof Error && 'stderr' in error ? String(error.stderr) : '';
    throw new Error(said.trim() || String(error));
  }
}

/** Whether the commit `ancestor` is `tip` or reachable from it. */
function contains(cwd: string, ancestor: string, tip: string): boolean {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, tip], {
      cwd,
      stdio: 'ignore',
    });
    return true;
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 1)
      return false;
    throw error;
  }
}

/** Every worktree of the repository holding `cwd`, the main one first, each with
 *  the branch it holds (none when detached). */
function worktrees(cwd: string): { path: string; branch?: string }[] {
  return git(cwd, 'worktree', 'list', '--porcelain')
    .split(/\n\s*\n/)
    .flatMap((block) => {
      const rows = block.split('\n');
      const path = rows.find((r) => r.startsWith('worktree '))?.slice(9);
      if (path === undefined || !existsSync(path)) return [];
      const branch = rows
        .find((r) => r.startsWith('branch refs/heads/'))
        ?.slice('branch refs/heads/'.length);
      return [{ path: realpathSync(path), branch }];
    });
}

/** The record the file `name` at `path` holds, as `text`; refuses what is not
 *  the record its name says. */
function recordOf<P>(
  name: string,
  path: string,
  domain: string,
  text: string,
): Record<P> {
  const damaged = (why: string): never => {
    throw new StoreFault(
      `record store: ${path} ${why}`,
      'damaged',
      domain,
      path,
    );
  };
  let record: Record<P> | undefined;
  try {
    record = JSON.parse(text) as Record<P>;
  } catch {
    return damaged('is not a readable record');
  }
  if (`${record?.envelope?.id}.json` !== name)
    damaged(`carries record id ${record?.envelope?.id}`);
  return record as Record<P>;
}

/** The records in one domain directory `dir` of `domain`, in record-id order. */
function readDomain<P>(dir: string, domain: string): Record<P>[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
  return names
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      const path = join(dir, name);
      return recordOf<P>(name, path, domain, readFileSync(path, 'utf8'));
    });
}

/** The records of `domain` committed on `branch`, in record-id order: what a
 *  line holds for a reader when no worktree does. */
function readBranch<P>(
  cwd: string,
  branch: string,
  domain: string,
): Record<P>[] {
  const tree = `${branch}:${RECORDS_ROOT}/${domain}`;
  let names: string[];
  try {
    names = git(cwd, 'ls-tree', '--name-only', tree)
      .split('\n')
      .filter((name) => name.endsWith('.json'));
  } catch {
    return [];
  }
  if (names.length === 0) return [];
  const out = execFileSync('git', ['cat-file', '--batch'], {
    cwd,
    input: `${names.map((name) => `${tree}/${name}`).join('\n')}\n`,
    maxBuffer: 1 << 30,
  });
  const records: Record<P>[] = [];
  let at = 0;
  for (const name of names) {
    const header = out.subarray(at, out.indexOf('\n', at)).toString();
    const size = Number(header.split(' ')[2]);
    const body = at + header.length + 1;
    records.push(
      recordOf<P>(
        name,
        `${tree}/${name}`,
        domain,
        out.subarray(body, body + size).toString('utf8'),
      ),
    );
    at = body + size + 1;
  }
  return records;
}

/**
 * The records of one repository. Construct it from any directory inside the
 * repository (default: the working directory); it resolves the repository root
 * itself, through git.
 *
 * Reading persists nothing. Writing adds exactly one file per record and never
 * touches another.
 */
export class RecordStore {
  /** Absolute path of the checkout this store was built from. */
  readonly top: string;
  /** Absolute path of that checkout's records root. */
  readonly root: string;
  /** The worktree holding each plan line, in branch order; the checkout this
   *  store was built from is among them when it holds one. */
  readonly lines: readonly Line[];
  /** The main worktree: the checkout a line's worktree is named after. */
  readonly main: string;
  /** Every branch of a plan line, held by a worktree or not. */
  readonly #branches: readonly string[];

  constructor(from: string = process.cwd()) {
    let top: string;
    try {
      top = git(from, 'rev-parse', '--show-toplevel');
    } catch {
      throw new StoreFault(
        `record store: ${from} is not inside a git repository`,
        'outside',
      );
    }
    this.top = realpathSync(top);
    this.root = join(this.top, RECORDS_ROOT);
    const held = worktrees(this.top);
    this.main = held[0]?.path ?? this.top;
    this.#branches = git(
      this.top,
      'for-each-ref',
      '--format=%(refname:short)',
      `refs/heads/${LINE_PREFIX}`,
    )
      .split('\n')
      .filter((b) => b !== '');
    this.lines = held
      .flatMap(({ path, branch }) =>
        branch?.startsWith(LINE_PREFIX)
          ? [{ plan: branch.slice(LINE_PREFIX.length), branch, path }]
          : [],
      )
      .sort((a, b) => (a.branch < b.branch ? -1 : 1));
  }

  #dir(domain: string, top: string = this.top): string {
    if (!/^[^/\\.][^/\\]*$/.test(domain))
      throw new Error(
        `record store: domain ${JSON.stringify(domain)} is not one directory name`,
      );
    return join(top, RECORDS_ROOT, domain);
  }

  /** Every record of `domain`, in record-id order: those of this checkout, of
   *  every plan line's worktree and, for a line no worktree holds, those
   *  committed on its branch, a record held twice being one. A domain never
   *  written is empty. */
  read<P>(domain: string): Record<P>[] {
    const records = new Map<RecordId, Record<P>>();
    const held = new Set(this.lines.map((l) => l.branch));
    const found = [
      ...[
        this.top,
        ...this.lines.map((l) => l.path).filter((p) => p !== this.top),
      ].map((top) => readDomain<P>(this.#dir(domain, top), domain)),
      ...this.#branches
        .filter((b) => !held.has(b))
        .map((b) => readBranch<P>(this.top, b, domain)),
    ];
    for (const r of found.flat())
      if (!records.has(r.envelope.id)) records.set(r.envelope.id, r);
    return [...records.values()].sort((a, b) =>
      a.envelope.id < b.envelope.id ? -1 : 1,
    );
  }

  /** The line of plan `plan`: its branch, whether the branch exists, and the
   *  worktree holding it when one does. */
  line(plan: string): { branch: string; exists: boolean; path?: string } {
    const branch = `${LINE_PREFIX}${plan}`;
    return {
      branch,
      exists: this.#branches.includes(branch),
      path: this.lines.find((l) => l.plan === plan)?.path,
    };
  }

  /** Where the worktree of the line of `plan` belongs. */
  #lineAt(plan: string): string {
    return `${this.main}.plan-${plan}`;
  }

  /** The refusal of a bound plan whose line no worktree holds, saying what is
   *  missing, the worktree of a line that exists or the line itself, and not
   *  how to make it. */
  lineless(plan: string): StoreFault {
    const { exists } = this.line(plan);
    return new StoreFault(
      exists
        ? `the line of plan ${plan} has no worktree, so nothing was written`
        : `plan ${plan} is bound and its line does not exist, so nothing was written`,
      'line',
    );
  }

  /**
   * Where the work of `commit` was built, as far as the repository says: it
   * is `unresolved` when no commit answers to the name; `main` when the HEAD of
   * the main worktree contains it, so it was built in that checkout, whatever
   * branch the checkout is on; `line` when the line of `plan` already contains
   * it, so it was built in the line's own worktree; `adrift` when its history
   * does not run from the line, sharing none with it or holding a commit the
   * main checkout has and the line lacks, so it was cut from elsewhere; and
   * `apart` otherwise, built in a worktree of its own off the line. Changes
   * nothing.
   */
  builtIn(
    plan: string,
    commit: string,
  ): 'unresolved' | 'main' | 'line' | 'adrift' | 'apart' {
    let id: string;
    try {
      id = git(
        this.top,
        'rev-parse',
        '--verify',
        '--quiet',
        '--end-of-options',
        `${commit}^{commit}`,
      );
    } catch {
      return 'unresolved';
    }
    const head = git(this.main, 'rev-parse', 'HEAD');
    if (contains(this.top, id, head)) return 'main';
    const { branch, exists } = this.line(plan);
    if (!exists) return 'apart';
    const tip = `refs/heads/${branch}`;
    if (contains(this.top, id, tip)) return 'line';
    return this.#offLine(id, tip, head) ? 'apart' : 'adrift';
  }

  /** Whether the history of commit `id` runs from the line at `tip`: it shares
   *  history with the line, and everything it shares with the main checkout at
   *  `head` the line holds too, so it was not cut from where main went on. */
  #offLine(id: string, tip: string, head: string): boolean {
    try {
      git(this.top, 'merge-base', id, tip);
    } catch {
      return false;
    }
    let shared: string[];
    try {
      shared = git(this.top, 'merge-base', '--all', id, head).split('\n');
    } catch {
      return true;
    }
    return shared.every((base) => contains(this.top, base, tip));
  }

  /**
   * The line of `plan`, cut if it does not exist: the branch `plan/<plan>` from
   * the HEAD of this checkout, in a worktree named after the main one. The
   * worktree that already holds the branch is used as it stands. Refuses a
   * branch no worktree holds.
   */
  cut(plan: string): Line {
    const { branch, exists, path } = this.line(plan);
    if (path !== undefined) return { plan, branch, path };
    if (exists) throw this.lineless(plan);
    const at = this.#lineAt(plan);
    try {
      git(this.top, 'worktree', 'add', '-b', branch, at, 'HEAD');
    } catch (error) {
      throw new StoreFault(
        `the line of plan ${plan} could not be cut: ${error instanceof Error ? error.message : String(error)}`,
        'line',
      );
    }
    return { plan, branch, path: realpathSync(at) };
  }

  /** Move onto `line` each record, named by domain and id, this checkout holds:
   *  the file is copied there when the line lacks it, and then no longer stands
   *  here — nor in this checkout's index — unless the HEAD of this checkout
   *  tracks it, since a committed record is never removed from a checkout.
   *  A record the line holds already, byte for byte, is taken off this
   *  checkout the same way. Nothing is moved when this checkout is the line's. */
  move(
    line: Line,
    records: readonly { readonly domain: string; readonly id: RecordId }[],
  ): void {
    if (line.path === this.top) return;
    const listed = (...args: string[]): ReadonlySet<string> =>
      new Set(
        git(this.top, ...args, '--', RECORDS_ROOT)
          .split('\n')
          .map((name) => join(this.top, name)),
      );
    let committed: ReadonlySet<string> | undefined;
    const taken: string[] = [];
    for (const { domain, id } of records) {
      const from = join(this.#dir(domain), `${id}.json`);
      const to = join(this.#dir(domain, line.path), `${id}.json`);
      if (!existsSync(from)) continue;
      if (existsSync(to)) {
        if (!readFileSync(from).equals(readFileSync(to))) continue;
      } else {
        mkdirSync(this.#dir(domain, line.path), { recursive: true });
        copyFileSync(from, to, constants.COPYFILE_EXCL);
      }
      committed ??= listed('ls-tree', '-r', '--name-only', 'HEAD');
      if (!committed.has(from)) taken.push(from);
    }
    if (taken.length === 0) return;
    const staged = listed('ls-files');
    const unstage = taken.filter((from) => staged.has(from));
    if (unstage.length > 0)
      git(this.top, 'rm', '-q', '-f', '--cached', '--', ...unstage);
    for (const from of taken) rmSync(from);
  }

  /**
   * Write one record into `domain`. Refuses a record id whose file exists; a
   * `create` that names anything, or whose entity already has records; an
   * `amend` or `retract` naming nothing; a named id that is unknown, belongs to
   * another entity, or is not a current head of this one; a write to a settled
   * entity that leaves one of its converged heads unnamed, which would turn
   * convergence into divergence on one branch; and a `retract` naming no
   * version, which would withdraw nothing.
   */
  write<P>(domain: string, record: Record<P>): void {
    const { id, entity, operation, supersedes } = record.envelope;
    const refuse = (why: string): never => {
      throw new StoreFault(
        `record store: ${operation} ${id} refused — ${why}`,
        'moved',
        domain,
      );
    };
    const rewrite = 'that record exists, and a record is never rewritten';
    const records = this.read<P>(domain);
    const known = new Map(records.map((r) => [r.envelope.id, r] as const));
    if (known.has(id)) refuse(rewrite);
    if (operation === 'create' && supersedes.length > 0)
      refuse('a first version names nothing');
    if (operation !== 'create' && supersedes.length === 0)
      refuse('it names no head');
    if ((operation === 'retract') !== (record.payload === null))
      refuse('a retraction, and only a retraction, carries no payload');
    const folded = fold(records).get(entity);
    const heads = folded?.heads;
    if (operation === 'create' && heads)
      refuse(`entity ${entity} already has records in ${domain}`);
    for (const named of supersedes) {
      const target = known.get(named);
      if (!target) refuse(`${named} is no record of ${domain}`);
      else if (target.envelope.entity !== entity)
        refuse(
          `${named} is a record of entity ${target.envelope.entity}, not ${entity}`,
        );
      else if (!heads?.includes(target))
        refuse(`${named} is not a head of entity ${entity}`);
    }
    if (
      folded &&
      !folded.diverged &&
      folded.heads.some((h) => !supersedes.includes(h.envelope.id))
    )
      refuse(
        `entity ${entity}'s heads have converged, and a write names every one of them`,
      );
    if (
      operation === 'retract' &&
      supersedes.every(
        (named) => known.get(named)?.envelope.operation === 'retract',
      )
    )
      refuse(`it names no version of entity ${entity}, so withdraws nothing`);
    this.persist(domain, record, () => refuse(rewrite));
  }

  /** Put one checked record on disk, in the records of the checkout at `top`
   *  (default: the one this store was built from), calling `exists` when its
   *  file is there already. */
  protected persist<P>(
    domain: string,
    record: Record<P>,
    exists: () => never,
    top: string = this.top,
  ): void {
    const dir = this.#dir(domain, top);
    mkdirSync(dir, { recursive: true });
    try {
      writeFileSync(
        join(dir, `${record.envelope.id}.json`),
        `${JSON.stringify(record, null, 2)}\n`,
        { flag: 'wx' },
      );
    } catch (error) {
      // A concurrent writer can land the same id between the read and here.
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') exists();
      throw error;
    }
  }

  #append<P>(
    domain: string,
    entity: string,
    operation: Operation,
    supersedes: readonly RecordId[],
    payload: P | null,
    by: Pick<Envelope, 'author' | 'reason' | 'cause'>,
  ): Record<P> {
    const record: Record<P> = {
      envelope: {
        id: ulid(),
        entity,
        operation,
        supersedes,
        author: by.author,
        time: new Date().toISOString(),
        reason: by.reason,
        cause: by.cause,
      },
      payload,
    };
    this.write(domain, record);
    return record;
  }

  /** Write a new entity's first version, minting the entity's identity. */
  create<P>(
    domain: string,
    payload: P,
    by: Pick<Envelope, 'author' | 'reason' | 'cause'>,
  ): Record<P> {
    return this.#append(domain, ulid(), 'create', [], payload, by);
  }

  /** A supersession: a new whole-state version of `entity` replacing the named
   *  current `heads` of it. Naming a retraction reinstates the entity. */
  supersede<P>(
    domain: string,
    entity: string,
    heads: readonly RecordId[],
    payload: P,
    by: Pick<Envelope, 'author' | 'reason' | 'cause'>,
  ): Record<P> {
    return this.#append(domain, entity, 'amend', heads, payload, by);
  }

  /** A retraction: withdraw `entity` with no successor version, naming every
   *  head it withdraws; the retraction becomes its head. `write` refuses an
   *  entity with no records, or one already withdrawn. */
  retract(
    domain: string,
    entity: string,
    by: Pick<Envelope, 'author' | 'reason' | 'cause'>,
  ): Record<never> {
    const heads = fold(this.read(domain)).get(entity)?.heads ?? [];
    return this.#append<never>(
      domain,
      entity,
      'retract',
      heads.map((h) => h.envelope.id),
      null,
      by,
    );
  }

  /** A reconciliation: one new whole-state version superseding every head of a
   *  diverged `entity`, a retraction among them included. Its operation is
   *  `amend`. Refuses an entity that has not diverged, converged heads
   *  included: those are settled, and an ordinary supersession names them. */
  reconcile<P>(
    domain: string,
    entity: string,
    payload: P,
    by: Pick<Envelope, 'author' | 'reason' | 'cause'>,
  ): Record<P> {
    const folded = fold(this.read(domain)).get(entity);
    if (!folded?.diverged)
      throw new StoreFault(
        `record store: reconcile refused — entity ${entity} has not diverged in ${domain}, and only divergence is reconciled`,
        'moved',
        domain,
      );
    return this.supersede(
      domain,
      entity,
      folded.heads.map((h) => h.envelope.id),
      payload,
      by,
    );
  }
}

/**
 * A store whose writes are held back: each is checked as `RecordStore.write`
 * checks it, against the records on disk and the writes held before it, and
 * every read sees them, but nothing reaches disk until `flush`. A caller that
 * must refuse a whole act when any part of it fails — a later write, or the
 * view of what it wrote — stages the act, and flushes only once all of it
 * stands, so a refused act has written nothing.
 */
export class StagedStore extends RecordStore {
  readonly #held: { readonly domain: string; readonly record: Record }[] = [];

  /** Whether any write is held. */
  get holding(): boolean {
    return this.#held.length > 0;
  }

  override read<P>(domain: string): Record<P>[] {
    const held = this.#held
      .filter((h) => h.domain === domain)
      .map((h) => h.record as Record<P>);
    return [...super.read<P>(domain), ...held].sort((a, b) =>
      a.envelope.id < b.envelope.id ? -1 : 1,
    );
  }

  protected override persist<P>(domain: string, record: Record<P>): void {
    this.#held.push({ domain, record: record as Record });
  }

  /** The writes held, in the order they were written. */
  get held(): readonly { readonly domain: string; readonly record: Record }[] {
    return this.#held;
  }

  /** Put every held write on disk, in the order it was written: in the checkout
   *  `into` names for it, else in the one this store was built from. */
  flush(
    into: (domain: string, record: Record) => string | undefined = () =>
      undefined,
  ): void {
    for (const { domain, record } of this.#held.splice(0))
      super.persist(
        domain,
        record,
        () => {
          throw new StoreFault(
            `record store: ${record.envelope.id} refused — that record exists, and a record is never rewritten`,
            'moved',
            domain,
          );
        },
        into(domain, record),
      );
  }
}
