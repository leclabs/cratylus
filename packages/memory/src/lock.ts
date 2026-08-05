import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  statSync,
  unlinkSync,
  writeSync,
} from 'node:fs';
import { hostname } from 'node:os';
import { join } from 'node:path';

/**
 * The dream lock: `${AGENT_HOME}/dream.lock`
 * serializes the shared home partition {SEMANTIC, PROCEDURAL, drain} across
 * same-host sessions of one agent. O_EXCL creation is the mutual exclusion;
 * a lock older than {@link STALE_MS} (2h) is stale — a crashed dream never
 * wedges the ritual forever — and is stolen on the next acquire.
 */

/** Lock filename within the agent home. */
export const LOCK_FILE = 'dream.lock';

/** Stale threshold: a lock strictly older than 2 hours may be stolen. */
export const STALE_MS = 2 * 60 * 60 * 1000;

export interface LockAcquireResult {
  acquired: boolean;
  /** True when a stale lock was removed to acquire. */
  stolen: boolean;
  /** Age of the pre-existing lock (ms), when one was found. */
  ageMs?: number;
  /** The holder metadata of a conflicting lock, when readable. */
  holder?: string;
}

export interface LockStatus {
  held: boolean;
  ageMs?: number;
  holder?: string;
}

const lockPath = (home: string): string => join(home, LOCK_FILE);

function readHolder(file: string): string | undefined {
  try {
    const text = readFileSync(file, 'utf8').trim();
    return text.length > 0 ? text : undefined;
  } catch {
    return undefined;
  }
}

function tryCreate(file: string, now: number, session?: string): boolean {
  try {
    const fd = openSync(file, 'wx'); // O_EXCL: fails if the lock exists
    try {
      writeSync(
        fd,
        `${JSON.stringify({
          pid: process.pid,
          host: hostname(),
          ...(session !== undefined ? { session } : {}),
          at: new Date(now).toISOString(),
        })}\n`,
        null,
        'utf8',
      );
    } finally {
      closeSync(fd);
    }
    return true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'EEXIST') return false;
    throw e;
  }
}

/**
 * Acquire the dream lock. Returns `{acquired: true}` on success (with
 * `stolen: true` when a stale lock was cleared first); `{acquired: false}`
 * with the holder's age when a live lock blocks.
 */
export function acquireLock(
  home: string,
  now: number = Date.now(),
  session?: string,
): LockAcquireResult {
  mkdirSync(home, { recursive: true });
  const file = lockPath(home);
  if (tryCreate(file, now, session)) return { acquired: true, stolen: false };

  let ageMs: number;
  try {
    // Clamp: fs timestamp granularity can put mtime a hair past `now`.
    ageMs = Math.max(0, now - statSync(file).mtimeMs);
  } catch {
    // Raced away between create-fail and stat: retry once.
    return tryCreate(file, now, session)
      ? { acquired: true, stolen: false }
      : { acquired: false, stolen: false };
  }
  const holder = readHolder(file);
  if (ageMs > STALE_MS) {
    try {
      unlinkSync(file);
    } catch {
      /* raced away — fall through to the retry */
    }
    if (tryCreate(file, now, session)) {
      return {
        acquired: true,
        stolen: true,
        ageMs,
        ...(holder !== undefined ? { holder } : {}),
      };
    }
    // Another session won the steal race.
    return {
      acquired: false,
      stolen: false,
      ageMs,
      ...(holder !== undefined ? { holder } : {}),
    };
  }
  return {
    acquired: false,
    stolen: false,
    ageMs,
    ...(holder !== undefined ? { holder } : {}),
  };
}

/** Release the dream lock. Idempotent: releasing an absent lock is a no-op. */
export function releaseLock(home: string): { released: boolean } {
  const file = lockPath(home);
  if (!existsSync(file)) return { released: false };
  unlinkSync(file);
  return { released: true };
}

/** The session id recorded in a held lock, when the holder wrote one. */
export function holderSession(home: string): string | undefined {
  const raw = readHolder(lockPath(home));
  if (raw === undefined) return undefined;
  try {
    const parsed = JSON.parse(raw) as { session?: unknown };
    return typeof parsed.session === 'string' ? parsed.session : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The guard that makes the dream cell's `lock-precondition` true of the code:
 * `acquire(lock) before any write to {SEMANTIC · PROCEDURAL} ∨ any drain`.
 *
 * The lock is held by an agent SESSION, not a process — the agent acquires it in
 * one CLI invocation and writes in later ones, so every holder pid is already
 * dead and pid-liveness cannot decide ownership. Session identity can.
 *
 * Unheld ⇒ acquire for the duration and hand back the release. Held by MY
 * session ⇒ proceed and release nothing, so an explicit `lock acquire` still
 * spans the whole ritual. Held by ANOTHER session ⇒ refuse: that is the case
 * that silently corrupted the shared partition.
 *
 * Returns the release to run when the write completes.
 */
export function guardPartitionWrite(
  home: string,
  session: string,
  now: number = Date.now(),
): () => void {
  const status = lockStatus(home, now);
  if (status.held) {
    const holder = holderSession(home);
    if (holder === session) return () => {};
    if (status.ageMs !== undefined && status.ageMs <= STALE_MS) {
      throw new Error(
        `dream.lock is held by another session${
          holder !== undefined ? ` (${holder})` : ''
        } — refusing to write the shared partition. Wait, or steal a stale lock via \`memory lock acquire\`.`,
      );
    }
  }
  const got = acquireLock(home, now, session);
  if (!got.acquired) {
    throw new Error(
      `dream.lock could not be acquired${
        got.holder !== undefined ? ` (held by ${got.holder})` : ''
      } — refusing to write the shared partition.`,
    );
  }
  return () => {
    releaseLock(home);
  };
}

/** Inspect the dream lock without touching it. */
export function lockStatus(home: string, now: number = Date.now()): LockStatus {
  const file = lockPath(home);
  let ageMs: number;
  try {
    ageMs = Math.max(0, now - statSync(file).mtimeMs);
  } catch {
    return { held: false };
  }
  const holder = readHolder(file);
  return { held: true, ageMs, ...(holder !== undefined ? { holder } : {}) };
}
