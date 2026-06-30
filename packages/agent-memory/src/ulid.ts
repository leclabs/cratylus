/**
 * ULID — Universally Unique Lexicographically Sortable Identifier.
 *
 * 128 bits, Crockford base32, 26 chars: 10 chars of 48-bit millisecond
 * timestamp + 16 chars of 80-bit randomness. Encoded MSB-first so the string
 * sorts lexicographically by time — the property EPISODIC relies on to order
 * events within a `(scope, path)` group (see ideas/memory.md, EPISODIC schema).
 *
 * Monotonic within a millisecond: if two ULIDs are minted in the same ms, the
 * randomness of the second is the first's incremented by one, preserving total
 * ordering of mint sequence. Dependency-free so the reference library carries no
 * supply-chain surface; UUIDv7 is an acceptable equivalent per the spec.
 */

// Crockford base32 alphabet (excludes I, L, O, U to avoid ambiguity).
const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = ENCODING.length; // 32
const TIME_LEN = 10;
const RANDOM_LEN = 16;
// 48-bit timestamp ceiling: Crockford base32 ^ 10 - 1.
const MAX_TIME = 281_474_976_710_655; // 2^48 - 1

type PRNG = () => number;

/** Random function in [0, 1). Injectable for deterministic tests. */
export type RandomFn = PRNG;

const defaultRandom: PRNG = Math.random;

function encodeTime(now: number, len: number): string {
  if (!Number.isInteger(now))
    throw new Error(`ULID time must be an integer: ${now}`);
  if (now < 0) throw new Error(`ULID time must be non-negative: ${now}`);
  if (now > MAX_TIME) throw new Error(`ULID time exceeds 48 bits: ${now}`);
  let out = '';
  let t = now;
  for (let i = len - 1; i >= 0; i--) {
    const mod = t % ENCODING_LEN;
    out = ENCODING[mod] + out;
    t = (t - mod) / ENCODING_LEN;
  }
  return out;
}

function encodeRandom(len: number, prng: PRNG): string {
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ENCODING[Math.floor(prng() * ENCODING_LEN)];
  }
  return out;
}

/** Increment a Crockford base32 string by 1, MSB-first. Throws on overflow. */
function incrementBase32(str: string): string {
  const chars = str.split('');
  let i = chars.length - 1;
  while (i >= 0) {
    const idx = ENCODING.indexOf(chars[i] as string);
    if (idx === -1)
      throw new Error(`Invalid base32 char in ULID randomness: ${chars[i]}`);
    if (idx === ENCODING_LEN - 1) {
      chars[i] = ENCODING[0] as string; // carry
      i--;
    } else {
      chars[i] = ENCODING[idx + 1] as string;
      return chars.join('');
    }
  }
  throw new Error('ULID randomness overflow within the same millisecond');
}

/**
 * A monotonic ULID factory. Each call returns a 26-char ULID; calls within the
 * same millisecond are strictly increasing. Construct one factory per logical
 * clock (typically one per process) so monotonicity holds across all mints.
 */
export function monotonicFactory(
  prng: RandomFn = defaultRandom,
  clock: () => number = Date.now,
): () => string {
  let lastTime = -1;
  let lastRandom = '';
  return function ulid(): string {
    const now = clock();
    if (now <= lastTime) {
      // Same (or backward) clock tick: bump randomness to keep strict order.
      lastRandom = incrementBase32(lastRandom);
    } else {
      lastTime = now;
      lastRandom = encodeRandom(RANDOM_LEN, prng);
    }
    return encodeTime(lastTime, TIME_LEN) + lastRandom;
  };
}

/** Process-wide monotonic ULID source. */
const globalUlid = monotonicFactory();

/** Mint a monotonic ULID from the process-wide source. */
export function ulid(): string {
  return globalUlid();
}

/** Extract the 48-bit millisecond timestamp encoded in a ULID. */
export function decodeTime(id: string): number {
  if (id.length !== TIME_LEN + RANDOM_LEN)
    throw new Error(`Malformed ULID (expected 26 chars): ${id}`);
  const timePart = id.slice(0, TIME_LEN);
  let time = 0;
  for (const char of timePart) {
    const idx = ENCODING.indexOf(char);
    if (idx === -1)
      throw new Error(`Invalid base32 char in ULID time: ${char}`);
    time = time * ENCODING_LEN + idx;
  }
  return time;
}

/** True if `id` is a syntactically valid 26-char Crockford-base32 ULID. */
export function isValidUlid(id: string): boolean {
  if (id.length !== TIME_LEN + RANDOM_LEN) return false;
  for (const char of id) {
    if (ENCODING.indexOf(char) === -1) return false;
  }
  return true;
}
