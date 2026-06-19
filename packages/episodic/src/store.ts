import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  type EpisodicRecord,
  type JsonValue,
  parseRecord,
  serializeRecord,
} from './record.js';
import { type HostEnv, type Scope, resolveFile } from './resolve.js';
import { ulid as defaultUlid } from './ulid.js';

/** Default store filename within a scope when a record carries no `path`. */
export const DEFAULT_EPISODIC_PATH = 'EPISODIC.jsonl';

/** Input to {@link encode} — everything except the machine-minted `id`. */
export interface EncodeInput {
  scope: Scope;
  /** Scope-relative path. Defaults to {@link DEFAULT_EPISODIC_PATH}. */
  path?: string;
  body: JsonValue;
}

export interface EpisodicStoreOptions {
  /** Host environment used to resolve (scope, path) → absolute file. */
  env: HostEnv;
  /** ULID source. Defaults to the process-wide monotonic factory; inject for tests. */
  ulid?: () => string;
}

/**
 * The portable JSONL EPISODIC store. Encode is **append-only**: each call mints
 * a ULID, builds an OPEN record `{id, scope, path?, body}`, and appends one JSONL
 * line to the file resolved from `(scope, path)`. No taxonomy is forced at
 * capture; the Dreamer routes later.
 */
export class EpisodicStore {
  private readonly env: HostEnv;
  private readonly mintUlid: () => string;

  constructor(opts: EpisodicStoreOptions) {
    this.env = opts.env;
    this.mintUlid = opts.ulid ?? defaultUlid;
  }

  /** The absolute file an encode with this (scope, path) would append to, on this host. */
  fileFor(scope: Scope, path?: string): string {
    return resolveFile(this.env, scope, path ?? DEFAULT_EPISODIC_PATH);
  }

  /**
   * Append one OPEN record. Mints the ULID, serializes to JSONL, and appends
   * (creating parent dirs as needed). Returns the written record.
   */
  encode(input: EncodeInput): EpisodicRecord {
    const rec: EpisodicRecord = {
      id: this.mintUlid(),
      scope: input.scope,
      ...(input.path !== undefined ? { path: input.path } : {}),
      body: input.body,
    };
    const file = this.fileFor(input.scope, input.path);
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(file, `${serializeRecord(rec)}\n`, 'utf8');
    return rec;
  }

  /**
   * Read all records from one (scope, path) store, in file order. Returns an
   * empty array if the file does not exist. Blank lines are skipped.
   */
  read(scope: Scope, path?: string): EpisodicRecord[] {
    const file = this.fileFor(scope, path);
    if (!existsSync(file)) return [];
    return parseLines(readFileSync(file, 'utf8'));
  }
}

/** Parse a JSONL blob into records, skipping blank lines, preserving order. */
export function parseLines(blob: string): EpisodicRecord[] {
  const out: EpisodicRecord[] = [];
  for (const line of blob.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    out.push(parseRecord(trimmed));
  }
  return out;
}

/**
 * The reconciliation key for a record's logical store: `(scope, path)` with
 * `path` normalized to {@link DEFAULT_EPISODIC_PATH} when absent. A NUL joins the
 * two parts so no scope/path containing a delimiter char can collide (a NUL
 * cannot legally appear in either). Records with an explicit default path and
 * records with none therefore key identically.
 */
const STORE_KEY_DELIM = '\u0000'; // NUL: cannot appear in a scope or path, so no delimiter collision
export function storeKey(scope: string, path?: string): string {
  return `${scope}${STORE_KEY_DELIM}${path ?? DEFAULT_EPISODIC_PATH}`;
}

/**
 * Group records by `(scope, path)` and order each group by ULID — the
 * reconciliation contract from ideas/memory.md.
 */
export function groupByStore(
  records: readonly EpisodicRecord[],
): Map<string, EpisodicRecord[]> {
  const groups = new Map<string, EpisodicRecord[]>();
  for (const rec of records) {
    const key = storeKey(rec.scope, rec.path);
    const bucket = groups.get(key);
    if (bucket) bucket.push(rec);
    else groups.set(key, [rec]);
  }
  for (const bucket of groups.values()) {
    bucket.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }
  return groups;
}
