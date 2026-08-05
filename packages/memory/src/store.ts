import { randomUUID } from 'node:crypto';
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
import { homedir, hostname } from 'node:os';
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
import { liveSessions } from './session.js';
import { ulid as defaultUlid } from './ulid.js';

/** Default raw-log filename within the agent home. */
export const DEFAULT_EPISODIC_PATH = 'EPISODIC.jsonl';

/**
 * The store home derived from a bare agent NAME: `~/.agents/<name>` (uv-tool
 * style — a per-name home under the user's `.agents`, independent of any host
 * `.claude/` layout). The CLI accepts `--name <name>` as sugar for this, so an
 * agent addresses its own memory by identity, not by path.
 */
export function homeForName(name: string): string {
  return join(homedir(), '.agents', name);
}

/**
 * Resolve the session id an `encode` binds. Precedence: an explicit `--session`
 * flag > {@link envSessionId} > the SOLE live session registered under
 * `<home>`. There is deliberately NO sessionless fallback — every event is bound
 * to a session at encode time.
 *
 * ABSENCE MINTS, AMBIGUITY THROWS. Zero live sessions yields a fresh id, which
 * the caller's register-if-absent heartbeat then registers — the same
 * mint-on-absence `session begin` performs. An ambiguous (>1) live set throws,
 * because picking one would silently split a session's records across two ids.
 *
 * NOTE on the mint branch: it was introduced to stop a *symptom* — "a nested
 * harness subprocess clears the current-session pointer, so the next `encode`
 * fails rather than re-binding." That diagnosis was wrong. Nothing cleared the
 * pointer; the env read simply never resolved, because this code read
 * a vendor variable nothing set (see {@link envSessionId}). With a name the
 * caller actually provides, minting is once again the rare genuine-absence path
 * it was meant to be, rather than the default on every invocation.
 */
export function resolveSession(
  home: string,
  opts?: { flag?: string; now?: number; stale?: number },
): string {
  const flag = opts?.flag;
  if (flag !== undefined && flag.length > 0) return flag;
  const env = envSessionId();
  if (env !== undefined) return env;
  const now = opts?.now ?? Date.now();
  const live =
    opts?.stale !== undefined
      ? [...liveSessions(home, now, opts.stale)]
      : [...liveSessions(home, now)];
  if (live.length === 1) return live[0] as string;
  if (live.length === 0) return randomUUID();
  throw new Error(
    `ambiguous session: ${live.length} live sessions under ${home} — pass --session <id>`,
  );
}

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

/** This package's session-id contract variable. Consistent with `$AGENT_HOME`
 *  and `$CRATYLUS_CONFIG` — the `AGENT_*` namespace this package owns. */
export const SESSION_ID_ENV = 'AGENT_SESSION_ID';
/** Indirection: names the variable to read `AGENT_SESSION_ID` from, for
 *  environments whose launcher cannot be modified. */
export const SESSION_ID_FROM_ENV = 'AGENT_SESSION_ID_FROM';

/**
 * The ambient session id, or `undefined`.
 *
 * **This package is harness-agnostic and reads exactly ONE name it owns:
 * `AGENT_SESSION_ID`.** It knows nothing of Claude Code, Cursor, Aider or any
 * other host, and no vendor variable may be added here. A library that reads
 * `CLAUDE_*` is coupled to one vendor; the next host would add a second name,
 * and the read becomes a registry of foreign harnesses maintained in the wrong
 * package.
 *
 * **Harness adaptation is the caller's job, at the boundary**, in one of:
 *  1. the projected runtime shim, which is emitted per-harness and is the only
 *     component entitled to name a vendor variable (forge
 *     `runtime-shim.ts`);
 *  2. an explicit id — `--session` / `opts.id` — which always wins;
 *  3. `AGENT_SESSION_ID_FROM=<VARNAME>`, an indirection (outranked by a direct
 *     `AGENT_SESSION_ID`) for environments whose
 *     launcher cannot be changed. The library learns no vendor names: it is
 *     told *which variable to read*, not *whose*.
 *
 * Historical note, kept because the failure was expensive and silent: this read
 * was `CLAUDE_SESSION_ID` for its whole life, a name Claude Code never sets. It
 * never resolved once. Every invocation therefore minted a fresh uuid, so each
 * was a *different* session; `lock acquire` recorded an id whose pid had exited
 * by the next call, and later write verbs refused with "held by another session"
 * — a phantom sibling that was really the caller. The `ABSENCE MINTS` branch was
 * added to paper over that under a wrong diagnosis, and humans and agents
 * worked around it by exporting the dead name by hand, which hid it further.
 * The first fix merely swapped in the correct vendor name; that traded a broken
 * coupling for a working one. This is the decoupled form.
 */
export function envSessionId(): string | undefined {
  const direct = process.env[SESSION_ID_ENV];
  if (direct !== undefined && direct.length > 0) return direct;
  const from = process.env[SESSION_ID_FROM_ENV];
  if (from !== undefined && from.length > 0) {
    const indirect = process.env[from];
    if (indirect !== undefined && indirect.length > 0) return indirect;
  }
  return undefined;
}

/**
 * The real process environment. `session()` is the RAW harness-env seam ONLY —
 * not the session authority: the CLI's `encode` resolves via
 * {@link resolveSession} (flag > env > sole-live) and injects it, so capture is
 * never sessionless. This default is the env-fallback that resolver consumes.
 */
export const defaultDerive: DeriveEnv = {
  cwd: () => process.cwd(),
  host: () => shortHost(hostname()),
  session: () => envSessionId(),
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
