import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  LOCK_FILE,
  STALE_MS,
  acquireLock,
  lockStatus,
  releaseLock,
} from '../src/lock.js';

let home: string;

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), 'dream-lock-'));
});
afterEach(() => {
  rmSync(home, { recursive: true, force: true });
});

describe('dream.lock (SPEC D5)', () => {
  it('acquires via O_EXCL and records holder metadata', () => {
    const r = acquireLock(home);
    expect(r).toMatchObject({ acquired: true, stolen: false });
    expect(existsSync(join(home, LOCK_FILE))).toBe(true);
    const s = lockStatus(home);
    expect(s.held).toBe(true);
    expect(s.holder).toContain(String(process.pid));
  });

  it('a second acquire CONFLICTS while the lock is live', () => {
    expect(acquireLock(home).acquired).toBe(true);
    const r = acquireLock(home);
    expect(r.acquired).toBe(false);
    expect(r.stolen).toBe(false);
    expect(r.ageMs).toBeGreaterThanOrEqual(0);
  });

  it('stale boundary is STRICT at the 2h constant: age == 2h conflicts, age > 2h steals', () => {
    expect(acquireLock(home).acquired).toBe(true);
    const mtime = statSync(join(home, LOCK_FILE)).mtimeMs;

    // Exactly at the constant: NOT stale (strict >).
    const atBoundary = acquireLock(home, mtime + STALE_MS);
    expect(atBoundary.acquired).toBe(false);

    // One ms past: stale — stolen, and the steal re-acquires.
    const past = acquireLock(home, mtime + STALE_MS + 1);
    expect(past.acquired).toBe(true);
    expect(past.stolen).toBe(true);
    expect(past.ageMs).toBeGreaterThan(STALE_MS);
    // The new lock is live again: an immediate acquire conflicts.
    expect(acquireLock(home).acquired).toBe(false);
  });

  it('release is idempotent; status reports free after', () => {
    acquireLock(home);
    expect(releaseLock(home)).toEqual({ released: true });
    expect(releaseLock(home)).toEqual({ released: false });
    expect(lockStatus(home)).toEqual({ held: false });
  });

  it('the constant is 2 hours', () => {
    expect(STALE_MS).toBe(2 * 60 * 60 * 1000);
  });
});
