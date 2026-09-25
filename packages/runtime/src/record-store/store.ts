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
// Records are machine-written bytes: `RECORDS_ROOT` is in biome's `files.ignore`, so
// no formatter ever owns them.
//
// Internal to the runtime: exported through neither the `.` barrel nor a subpath.
// ─────────────────────────────────────────────────────────────────────────────

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ulid } from '../ulid.js';
import { fold } from './fold.js';
import type { Envelope, Operation, Record, RecordId } from './record.js';

/** The records root, relative to the repository root: the one directory holding
 *  every record, one subdirectory per domain. Declared once, here. */
export const RECORDS_ROOT = 'records';

/**
 * A failure of the store itself rather than of a domain's law: the directory is
 * not inside a repository (`outside`); a stored record cannot be read as the
 * record its file name says it is (`damaged`, with its `path`); or the records
 * a write was checked against moved before it landed (`moved`). The store
 * words the message for a reader of the store; a caller meeting agents speaks
 * it in its domain's words from `kind`, `domain` and `path`.
 */
export class StoreFault extends Error {
  constructor(
    message: string,
    readonly kind: 'outside' | 'damaged' | 'moved',
    readonly domain?: string,
    readonly path?: string,
  ) {
    super(message);
    this.name = 'StoreFault';
  }
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
        record = JSON.parse(readFileSync(path, 'utf8')) as Record<P>;
      } catch {
        return damaged('is not a readable record');
      }
      if (`${record?.envelope?.id}.json` !== name)
        damaged(`carries record id ${record?.envelope?.id}`);
      return record as Record<P>;
    });
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
  /** Absolute path of the records root. */
  readonly root: string;

  constructor(from: string = process.cwd()) {
    let top: string;
    try {
      top = execFileSync('git', ['rev-parse', '--show-toplevel'], {
        cwd: from,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      throw new StoreFault(
        `record store: ${from} is not inside a git repository`,
        'outside',
      );
    }
    this.root = join(top, RECORDS_ROOT);
  }

  #dir(domain: string): string {
    if (!/^[^/\\.][^/\\]*$/.test(domain))
      throw new Error(
        `record store: domain ${JSON.stringify(domain)} is not one directory name`,
      );
    return join(this.root, domain);
  }

  /** Every record of `domain`, in record-id order. A domain never written is empty. */
  read<P>(domain: string): Record<P>[] {
    return readDomain<P>(this.#dir(domain), domain);
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

  /** Put one checked record on disk, calling `exists` when its file is there
   *  already. */
  protected persist<P>(
    domain: string,
    record: Record<P>,
    exists: () => never,
  ): void {
    const dir = this.#dir(domain);
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

  /** Put every held write on disk, in the order it was written. */
  flush(): void {
    for (const { domain, record } of this.#held.splice(0))
      super.persist(domain, record, () => {
        throw new StoreFault(
          `record store: ${record.envelope.id} refused — that record exists, and a record is never rewritten`,
          'moved',
          domain,
        );
      });
  }
}
