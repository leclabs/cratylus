import { describe, expect, it } from 'vitest';
import {
  decodeTime,
  isValidUlid,
  monotonicFactory,
  ulid,
} from '../src/ulid.js';

describe('ulid', () => {
  it('mints a 26-char Crockford-base32 id', () => {
    const id = ulid();
    expect(id).toHaveLength(26);
    expect(isValidUlid(id)).toBe(true);
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it('encodes the supplied clock time so ids sort by time lexicographically', () => {
    const t1 = 1_700_000_000_000;
    const t2 = 1_700_000_001_000;
    const a = monotonicFactory(
      () => 0,
      () => t1,
    )();
    const b = monotonicFactory(
      () => 0,
      () => t2,
    )();
    expect(a < b).toBe(true);
    expect(decodeTime(a)).toBe(t1);
    expect(decodeTime(b)).toBe(t2);
  });

  it('is strictly monotonic within the same millisecond (randomness increments)', () => {
    const frozen = monotonicFactory(
      () => 0,
      () => 1_700_000_000_000,
    );
    const ids = Array.from({ length: 1000 }, () => frozen());
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i]! > ids[i - 1]!).toBe(true);
    }
    // All share the same time prefix since the clock is frozen.
    const prefix = ids[0]!.slice(0, 10);
    expect(ids.every((id) => id.startsWith(prefix))).toBe(true);
  });

  it('stays monotonic even if the clock ticks backward', () => {
    let now = 1_700_000_000_005;
    const factory = monotonicFactory(
      () => 0,
      () => now,
    );
    const a = factory();
    now = 1_700_000_000_000; // clock regresses
    const b = factory();
    expect(b > a).toBe(true);
  });

  it('keeps sort order across a real-time batch (mint order == sort order)', () => {
    const ids = Array.from({ length: 5000 }, () => ulid());
    const sorted = [...ids].sort();
    expect(sorted).toEqual(ids);
  });

  it('round-trips the timestamp via decodeTime', () => {
    const now = Date.now();
    const id = monotonicFactory(Math.random, () => now)();
    expect(decodeTime(id)).toBe(now);
  });

  it('rejects malformed ids', () => {
    expect(isValidUlid('too-short')).toBe(false);
    expect(isValidUlid('I'.repeat(26))).toBe(false); // I is excluded from the alphabet
    expect(() => decodeTime('nope')).toThrow();
  });
});
