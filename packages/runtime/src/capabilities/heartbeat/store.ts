// ─────────────────────────────────────────────────────────────────────────────
// ⚠ PROVISIONAL PATH — `capabilities/heartbeat/` is a PLACEHOLDER, not a
// name. See `ports/heartbeat.ts` for the full notice: the anchor for this
// capability is undiscovered and is /signify's to derive; `heartbeat`
// encodes only the shard that produced these files.
//
// THE INBOUND STORE — the afferent side, claimed on each emission.
//
// EXACTLY-ONCE UNDER CONCURRENCY, and the design is entirely about that word.
// The obvious implementation — one append-log, claimed by read-then-delete — is
// wrong twice over, and the falsifier in `test/heartbeat.test.ts` measures
// both: a deposit landing between the read and the unlink is DESTROYED, and two
// claims racing each other both read the file and each returns every envelope,
// so the same inbound message is delivered twice. Measured on that naive
// revision: 189 of 320 envelopes duplicated, and two concurrent drainers
// returned 400 envelopes for 200 deposits.
//
// So a claim is never a read. Each envelope is ONE FILE and the claim is a
// RENAME, which the filesystem makes atomic and winner-take-all:
//
//   dir/tmp/    a deposit being written — invisible to a claim, so a partial
//               write is never read
//   dir/ready/  a complete deposit, made visible by an atomic rename out of tmp
//   dir/claim/  won by exactly one drainer, again by rename; the loser's rename
//               fails ENOENT because the source is already gone
//
// The destination name in `claim/` is unique per drainer, because a POSIX rename
// over an existing path succeeds silently — two drainers targeting one
// destination would both "win" and one would clobber the other. Uniqueness is
// what makes the losing rename fail instead.
//
// A deposit racing a claim is therefore DELAYED, never lost: its rename into
// `ready/` either precedes the claim's directory listing (claimed now) or
// follows it (claimed next). Nothing in between can eat it.
// ─────────────────────────────────────────────────────────────────────────────

import { randomBytes } from 'node:crypto';
import {
  mkdir,
  readFile,
  readdir,
  rename,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import type { Envelope } from '../../ports/heartbeat.js';

/** Where a store keeps its state on disk. */
export interface StoreLayout {
  /** Directory the store owns outright. Created on demand. */
  dir: string;
}

/** Monotonic within a process, so same-millisecond deposits still sort FIFO. */
let depositSeq = 0;
let claimSeq = 0;

function token(): string {
  return randomBytes(6).toString('hex');
}

/**
 * A durable, multi-producer, multi-consumer inbound store. Producers
 * {@link deposit}; the period {@link claim}s. Trust is the CALLER's problem —
 * see the security note on {@link Envelope}. The store performs no
 * authentication by design: a store that can be argued with is not a store.
 */
export class EnvelopeStore {
  readonly #tmp: string;
  readonly #ready: string;
  readonly #claimed: string;
  #prepared: Promise<void> | undefined;

  constructor(layout: StoreLayout) {
    this.#tmp = join(layout.dir, 'tmp');
    this.#ready = join(layout.dir, 'ready');
    this.#claimed = join(layout.dir, 'claim');
  }

  /** Create the three directories once per instance. */
  #prepare(): Promise<void> {
    this.#prepared ??= (async () => {
      await mkdir(this.#tmp, { recursive: true });
      await mkdir(this.#ready, { recursive: true });
      await mkdir(this.#claimed, { recursive: true });
    })();
    return this.#prepared;
  }

  /**
   * Deposit one envelope. Safe from any number of concurrent producers, in this
   * process or any other: the payload is written under `tmp/` and only becomes
   * visible to a claim by an atomic rename, so no claim ever sees a half-written
   * envelope.
   */
  async deposit(body: unknown, source: string, at: number): Promise<void> {
    await this.#prepare();
    const name = `${String(at).padStart(15, '0')}-${String(++depositSeq).padStart(9, '0')}-${token()}.json`;
    const staged = join(this.#tmp, name);
    await writeFile(
      staged,
      JSON.stringify({ body, source, at } satisfies Envelope),
      'utf8',
    );
    await rename(staged, join(this.#ready, name));
  }

  /**
   * Claim everything deposited and not yet claimed. Exactly-once: an envelope is
   * returned to one caller and no other, and a deposit racing this call is
   * delayed to the next claim rather than destroyed.
   */
  async claim(): Promise<Envelope[]> {
    await this.#prepare();
    let names: string[];
    try {
      names = await readdir(this.#ready);
    } catch {
      return [];
    }
    names.sort();

    const out: Envelope[] = [];
    for (const name of names) {
      // Unique destination — see the header: a shared one would let both
      // drainers' renames succeed, and the claim would stop being exclusive.
      const mine = join(this.#claimed, `${process.pid}-${++claimSeq}-${name}`);
      try {
        await rename(join(this.#ready, name), mine);
      } catch {
        continue; // another drainer claimed it first
      }
      try {
        const text = await readFile(mine, 'utf8');
        out.push(JSON.parse(text) as Envelope);
      } catch {
        // Unreadable or corrupt: drop it rather than crash the period. It can
        // only get here by outside interference — the write/rename pair makes a
        // torn file unreachable.
      } finally {
        await unlink(mine).catch(() => {});
      }
    }
    return out;
  }

  /** How many envelopes are deposited and unclaimed. */
  async pending(): Promise<number> {
    await this.#prepare();
    try {
      return (await readdir(this.#ready)).length;
    } catch {
      return 0;
    }
  }
}
