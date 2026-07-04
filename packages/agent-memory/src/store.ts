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
import { hostname } from 'node:os';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  normalize,
  resolve,
  sep,
} from 'node:path';
import { shortHost } from './node.js';
import {
  type EpisodicRecord,
  type JsonValue,
  parseRecord,
  serializeRecord,
} from './record.js';
import { ulid as defaultUlid } from './ulid.js';

/** Default raw-log filename within the agent home. */
export const DEFAULT_EPISODIC_PATH = 'EPISODIC.jsonl';

/**
 * The derivation seam (SPEC D2): encode derives `{session?, host, cwd}` from
 * the process environment — the CALLER supplies none of them. Injectable for
 * tests; the default reads the real process.
 */
export interface DeriveEnv {
  /** Absolute working directory at capture. */
  cwd(): string;
  /** Short hostname. */
  host(): string;
  /** Harness session id, when the environment carries one. */
  session(): string | undefined;
}

/** The real process environment. */
export const defaultDerive: DeriveEnv = {
  cwd: () => process.cwd(),
  host: () => shortHost(hostname()),
  session: () => {
    const sid = process.env.CLAUDE_SESSION_ID;
    return sid !== undefined && sid.length > 0 ? sid : undefined;
  },
};

/** Input to {@link EpisodicStore.encode} — the caller's share: body + optional tags. */
export interface EncodeInput {
  body: JsonValue;
  /** Free refinement labels (SPEC D2/D4: refine, never route). */
  tags?: string[];
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
  /** Absolute path of the agent home — the ONLY base the raw log resolves under. */
  home: string;
  /** ULID source. Defaults to the process-wide monotonic factory; inject for tests. */
  ulid?: () => string;
  /** Derivation seam for `{session?, host, cwd}`. Defaults to the real process. */
  derive?: DeriveEnv;
}

/** Guard a home-relative path: relative, and never escaping the home via `..`. */
function assertSafeRelative(path: string): string {
  if (path.length === 0) throw new Error('Path must be non-empty');
  if (isAbsolute(path))
    throw new Error(`Path must be home-relative, not absolute: "${path}"`);
  const normalized = normalize(path);
  if (normalized === '..' || normalized.startsWith(`..${sep}`))
    throw new Error(`Path must not escape the agent home: "${path}"`);
  return normalized;
}

/**
 * The portable JSONL EPISODIC store — **single-store, append-only, derived**
 * (SPEC D2). Encode mints a ULID, derives `{session?, host, cwd}`, and appends
 * one OPEN record to the home-anchored raw log. Scope is never stored (it is
 * `node(cwd)`, computed at fold time); capture never writes into a repo.
 */
export class EpisodicStore {
  readonly home: string;
  private readonly mintUlid: () => string;
  private readonly derive: DeriveEnv;

  constructor(opts: EpisodicStoreOptions) {
    if (!isAbsolute(opts.home))
      throw new Error(`Agent home must be absolute: "${opts.home}"`);
    this.home = resolve(opts.home);
    this.mintUlid = opts.ulid ?? defaultUlid;
    this.derive = opts.derive ?? defaultDerive;
  }

  /**
   * The absolute RAW LOG file — ALWAYS under the agent home. Raw episodic
   * capture is single-store: every encode/read/drain resolves here. This is
   * the structural guarantee that capture never writes into a project tree.
   */
  rawFile(path?: string): string {
    return resolve(
      join(this.home, assertSafeRelative(path ?? DEFAULT_EPISODIC_PATH)),
    );
  }

  /**
   * Append one OPEN record to the raw log. Mints the ULID, derives
   * `{session?, host, cwd}` from the environment (never caller-supplied),
   * serializes to JSONL, and appends. Returns the written record.
   */
  encode(input: EncodeInput, path?: string): EpisodicRecord {
    const session = this.derive.session();
    const rec: EpisodicRecord = {
      id: this.mintUlid(),
      ...(session !== undefined ? { session } : {}),
      host: this.derive.host(),
      cwd: this.derive.cwd(),
      body: input.body,
      ...(input.tags !== undefined && input.tags.length > 0
        ? { tags: input.tags }
        : {}),
    };
    const file = this.rawFile(path);
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(file, `${serializeRecord(rec)}\n`, 'utf8');
    return rec;
  }

  /**
   * Read all records from the raw log, in file order. Returns an empty array
   * if the file does not exist. Blank lines are skipped.
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
   * and the rest pruned every drain, so `.bak/` is bounded. A no-op when the raw
   * log is empty. Backup-and-verify precede the clear, so a crash mid-drain never
   * loses data.
   */
  drain(opts?: {
    keep?: number;
    path?: string;
    retain?: (rec: EpisodicRecord) => boolean;
  }): DrainResult {
    const keep = opts?.keep ?? 5;
    const file = this.rawFile(opts?.path);
    const all = this.read(opts?.path);
    if (all.length === 0)
      return { archived: null, records: 0, kept: [], pruned: [] };
    const bakDir = join(dirname(file), '.bak');
    const base = basename(file, '.jsonl');

    // The drained/retained partition. Absent a predicate, the WHOLE log drains
    // (retain=∅) via the byte-exact copy path — back-compat is preserved. With a
    // predicate (memiso-1 liveness-aware drain), only the drained subset is
    // archived and the retained records are rewritten back into the live log.
    const retain = opts?.retain;
    const drained = retain === undefined ? all : all.filter((r) => !retain(r));
    if (drained.length === 0)
      return { archived: null, records: 0, kept: [], pruned: [] };

    mkdirSync(bakDir, { recursive: true });
    const archive = join(bakDir, `${base}.${this.mintUlid()}.jsonl`);
    if (retain === undefined) {
      // Fast path: archive the whole file by copy, verify by size, clear.
      copyFileSync(file, archive);
      if (statSync(archive).size !== statSync(file).size)
        throw new Error(`drain: backup verification failed for ${archive}`);
      writeFileSync(file, '', 'utf8'); // clear: raw is safely archived + verified
    } else {
      // Selective path: archive the drained records, verify the archive parses
      // back to the same count, then rewrite the live log with only the retained.
      const retained = all.filter((r) => retain(r));
      const archiveBody = drained.map((r) => serializeRecord(r)).join('\n');
      writeFileSync(archive, `${archiveBody}\n`, 'utf8');
      if (parseLines(readFileSync(archive, 'utf8')).length !== drained.length)
        throw new Error(`drain: backup verification failed for ${archive}`);
      const retainedBody = retained.map((r) => serializeRecord(r)).join('\n');
      writeFileSync(
        file,
        retained.length > 0 ? `${retainedBody}\n` : '',
        'utf8',
      );
    }
    const prefix = `${base}.`;
    const backups = readdirSync(bakDir)
      .filter((n) => n.startsWith(prefix) && n.endsWith('.jsonl'))
      .sort()
      .reverse(); // newest-first: the ULID in the name sorts chronologically
    const kept = backups.slice(0, keep);
    const pruned = backups.slice(keep);
    for (const n of pruned) rmSync(join(bakDir, n));
    return { archived: archive, records: drained.length, kept, pruned };
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
