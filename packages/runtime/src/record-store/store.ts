// ─────────────────────────────────────────────────────────────────────────────
// THE RECORD STORE — records as files in the repository.
//
// Layout: `<repository root>/records/<domain>/<record id>.json`. One directory per
// domain under one records root, one file per record, named by its record id. A
// record id is a ULID, so two branches never mint the same file name, and a branch
// merge is the union of two sets of files: it never conflicts. What a merge CAN
// produce — two heads of one entity, a reference to an entity the other branch
// retracted — is state the fold reports (`fold.ts`), never an error here.
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

/** The records in one domain directory `dir`, in record-id order. */
function readDomain<P>(dir: string): Record<P>[] {
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
      const record = JSON.parse(
        readFileSync(join(dir, name), 'utf8'),
      ) as Record<P>;
      if (`${record.envelope?.id}.json` !== name)
        throw new Error(
          `record store: ${join(dir, name)} carries record id ${record.envelope?.id}`,
        );
      return record;
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
      throw new Error(`record store: ${from} is not inside a git repository`);
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
    return readDomain<P>(this.#dir(domain));
  }

  /**
   * Write one record into `domain`. Refuses a record id whose file exists, a
   * `create` that supersedes anything, an `amend` or `retract` naming no version,
   * and a named id that is unknown, a retraction, or a version of another entity.
   */
  write<P>(domain: string, record: Record<P>): void {
    const dir = this.#dir(domain);
    const { id, entity, operation, supersedes } = record.envelope;
    const refuse = (why: string): never => {
      throw new Error(`record store: ${operation} ${id} refused — ${why}`);
    };
    if (operation === 'create' && supersedes.length > 0)
      refuse('a first version supersedes nothing');
    if (operation !== 'create' && supersedes.length === 0)
      refuse('it names no version');
    if ((operation === 'retract') !== (record.payload === null))
      refuse('a retraction, and only a retraction, carries no payload');
    if (supersedes.length > 0) {
      const known = new Map(
        readDomain<P>(dir).map((r) => [r.envelope.id, r] as const),
      );
      for (const named of supersedes) {
        const version = known.get(named);
        if (!version) refuse(`${named} is no record of ${domain}`);
        else if (version.envelope.operation === 'retract')
          refuse(`${named} is a retraction, not a version`);
        else if (version.envelope.entity !== entity)
          refuse(
            `${named} is a version of entity ${version.envelope.entity}, not ${entity}`,
          );
      }
    }
    mkdirSync(dir, { recursive: true });
    try {
      writeFileSync(
        join(dir, `${id}.json`),
        `${JSON.stringify(record, null, 2)}\n`,
        { flag: 'wx' },
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST')
        refuse('that record exists, and a record is never rewritten');
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
   *  earlier `versions` of it. */
  supersede<P>(
    domain: string,
    entity: string,
    versions: readonly RecordId[],
    payload: P,
    by: Pick<Envelope, 'author' | 'reason' | 'cause'>,
  ): Record<P> {
    return this.#append(domain, entity, 'amend', versions, payload, by);
  }

  /** A retraction: withdraw `entity` with no successor, naming every head it
   *  withdraws. Refuses an entity with no head. */
  retract(
    domain: string,
    entity: string,
    by: Pick<Envelope, 'author' | 'reason' | 'cause'>,
  ): Record<never> {
    const heads = fold(this.read(domain)).get(entity)?.heads ?? [];
    if (heads.length === 0)
      throw new Error(
        `record store: retract refused — entity ${entity} has no head in ${domain}`,
      );
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
   *  diverged `entity`. Its operation is `amend`. Refuses an entity that has not
   *  diverged. */
  reconcile<P>(
    domain: string,
    entity: string,
    payload: P,
    by: Pick<Envelope, 'author' | 'reason' | 'cause'>,
  ): Record<P> {
    const heads = fold(this.read(domain)).get(entity)?.heads ?? [];
    if (heads.length < 2)
      throw new Error(
        `record store: reconcile refused — entity ${entity} has ${heads.length} head(s) in ${domain}, and only divergence is reconciled`,
      );
    return this.supersede(
      domain,
      entity,
      heads.map((h) => h.envelope.id),
      payload,
      by,
    );
  }
}
