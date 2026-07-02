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
 * The dream lock (plans/scoped-memory-v2 SPEC D5): `${AGENT_HOME}/dream.lock`
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

function tryCreate(file: string, now: number): boolean {
  try {
    const fd = openSync(file, 'wx'); // O_EXCL: fails if the lock exists
    try {
      writeSync(
        fd,
        `${JSON.stringify({ pid: process.pid, host: hostname(), at: new Date(now).toISOString() })}\n`,
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
): LockAcquireResult {
  mkdirSync(home, { recursive: true });
  const file = lockPath(home);
  if (tryCreate(file, now)) return { acquired: true, stolen: false };

  let ageMs: number;
  try {
    // Clamp: fs timestamp granularity can put mtime a hair past `now`.
    ageMs = Math.max(0, now - statSync(file).mtimeMs);
  } catch {
    // Raced away between create-fail and stat: retry once.
    return tryCreate(file, now)
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
    if (tryCreate(file, now)) {
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
