import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join } from 'node:path';
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

/** Outcome of a {@link EpisodicStore.drain}. */
export interface DrainResult {
  /** Absolute archive path, or null when the raw log was empty (a no-op). */
  archived: string | null;
  /** Number of records archived. */
  records: number;
  /** Retained backup filenames, newest-first. */
  kept: string[];
  /** Pruned (deleted) backup filenames. */
  pruned: string[];
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

  /**
   * The absolute file a **routed dream target** with this (scope, path) resolves
   * to, on this host. This is the SCOPE-AWARE resolver: a `project:<key>` target
   * lands in that project's tree (`projectRoot(key)/path`). It is consumed ONLY by
   * the dreamer's `resolveTarget` (where distilled content graduates to a SELF/
   * MEMORY/AGENTS/vault instance) — **never** to locate the RAW capture log. Raw
   * capture is single-store and always home-anchored; see {@link rawFile}.
   */
  fileFor(scope: Scope, path?: string): string {
    return resolveFile(this.env, scope, path ?? DEFAULT_EPISODIC_PATH);
  }

  /**
   * The absolute RAW LOG file for this host — ALWAYS the agent's own home
   * (`agentHome()/path`), independent of any record's scope. Raw episodic capture
   * is **single-store** (ideas/memory.md): every encode/read/compact of the raw
   * log resolves here regardless of the record's `scope`, which is a routing TAG
   * (consumed by the dreamer), never a selector of the raw-store location. This is
   * the structural guarantee that capture never writes into a project working tree.
   */
  rawFile(path?: string): string {
    return resolveFile(this.env, 'user', path ?? DEFAULT_EPISODIC_PATH);
  }

  /**
   * Append one OPEN record to the home-anchored RAW LOG. Mints the ULID,
   * serializes to JSONL, and appends (creating parent dirs as needed). The
   * record still carries `input.scope` as its routing-tag field — but the file it
   * lands in is {@link rawFile}, the agent home, NOT `fileFor(scope, …)`. Returns
   * the written record.
   */
  encode(input: EncodeInput): EpisodicRecord {
    const rec: EpisodicRecord = {
      id: this.mintUlid(),
      scope: input.scope,
      ...(input.path !== undefined ? { path: input.path } : {}),
      body: input.body,
    };
    const file = this.rawFile(input.path);
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(file, `${serializeRecord(rec)}\n`, 'utf8');
    return rec;
  }

  /**
   * Read all records from the home-anchored RAW LOG, in file order. Returns an
   * empty array if the file does not exist. Blank lines are skipped.
   */
  read(path?: string): EpisodicRecord[] {
    const file = this.rawFile(path);
    if (!existsSync(file)) return [];
    return parseLines(readFileSync(file, 'utf8'));
  }

  /**
   * The dreamer's DRAIN: archive the raw log to `<home>/.bak/EPISODIC.<ULID>.jsonl`
   * (a verified copy), then CLEAR the raw log — run after consolidating into the
   * durable layers, so the archive is a recovery net for a bad consolidation, not a
   * permanent copy. Backups ROTATE: only the newest `keep` (default 5) are retained
   * and the rest pruned every drain, so `.bak/` is bounded — each archive is a single
   * dream-cycle of raw events (small, ~constant), and an old backup's recovery value
   * decays to zero once its dream is validated. A no-op when the raw log is empty.
   * Backup-and-verify precede the clear, so a crash mid-drain never loses data.
   */
  drain(opts?: { keep?: number; path?: string }): DrainResult {
    const keep = opts?.keep ?? 5;
    const file = this.rawFile(opts?.path);
    const count = this.read(opts?.path).length;
    if (count === 0)
      return { archived: null, records: 0, kept: [], pruned: [] };
    const bakDir = join(dirname(file), '.bak');
    const base = basename(file, '.jsonl');
    mkdirSync(bakDir, { recursive: true });
    const archive = join(bakDir, `${base}.${this.mintUlid()}.jsonl`);
    copyFileSync(file, archive);
    if (statSync(archive).size !== statSync(file).size)
      throw new Error(`drain: backup verification failed for ${archive}`);
    writeFileSync(file, '', 'utf8'); // clear: the raw is safely archived + verified
    const prefix = `${base}.`;
    const backups = readdirSync(bakDir)
      .filter((n) => n.startsWith(prefix) && n.endsWith('.jsonl'))
      .sort()
      .reverse(); // newest-first: the ULID in the name sorts chronologically
    const kept = backups.slice(0, keep);
    const pruned = backups.slice(keep);
    for (const n of pruned) rmSync(join(bakDir, n));
    return { archived: archive, records: count, kept, pruned };
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
 * A grouping key over a record's `(scope, path)` ROUTING-TAG fields, with `path`
 * normalized to {@link DEFAULT_EPISODIC_PATH} when absent. A NUL joins the two
 * parts so no scope/path containing a delimiter char can collide (a NUL cannot
 * legally appear in either). Records with an explicit default path and records
 * with none therefore key identically.
 *
 * NOTE: this is no longer a raw-STORE-location key. Raw capture is single-store
 * (always the agent home; see {@link EpisodicStore.rawFile}), so `(scope, path)`
 * is a record TAG, not a file selector. {@link groupByStore} below is therefore a
 * pure field-grouping (e.g. for batching records by routing tag) — it is not used
 * in `src/` and never selects a store file.
 */
const STORE_KEY_DELIM = '\u0000'; // NUL: cannot appear in a scope or path, so no delimiter collision
export function storeKey(scope: string, path?: string): string {
  return `${scope}${STORE_KEY_DELIM}${path ?? DEFAULT_EPISODIC_PATH}`;
}

/**
 * Group records by their `(scope, path)` routing-tag fields and order each group
 * by ULID. A pure field-grouping (not a store-location selector — raw capture is
 * single-store); kept as a dreamer-side batching convenience.
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
