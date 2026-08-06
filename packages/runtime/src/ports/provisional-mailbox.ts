// ─────────────────────────────────────────────────────────────────────────────
// ⚠ PROVISIONAL PATH — `provisional-mailbox` is a PLACEHOLDER, not a name.
//
// The mechanism is real and tested; its ANCHOR is not derived. Under `cratylism` a name is
// found by cold verification, never coined, so the prefix stands until a derivation lands —
// and `capability-keyspace.test.ts` reads that prefix as "no anchor yet", which is why this
// port is deliberately absent from `CAPABILITIES` and from `RuntimePlugin`.
//
// WHAT IT IS: a durable single-consumer inbox. A producer DEPOSITS an envelope; a consumer
// CLAIMS everything waiting, atomically. Publication is `tmp → rename → ready`, because
// `rename(2)` is atomic within a filesystem and an append is not — POSIX guarantees
// non-interleaved writes for PIPES only, and declines to specify them for regular files.
// (macOS `PIPE_BUF` is 512 bytes, so even the folklore version of that guarantee is
// smaller than people assume.)
//
// IT WAS EXTRACTED FROM `heartbeat`, where it did not belong. The period used to CLAIM this
// store on every emission and hand the result out as `Tick.claimed` — which made a periodic
// event responsible for someone else's mail. A heartbeat emits; whoever wants an inbox
// drains one, on whatever schedule it likes, including on a tick.
//
// ⚠ SECURITY — `body` is UNTRUSTED CONTENT and may reach a model's context verbatim: an
// inbound store read into a live session is a prompt-injection surface. Producers MUST be
// gated as trusted-local (same user, same host, no network deposit path). The envelope
// carries `source` so a consumer can refuse what it did not expect; the store itself makes
// NO trust decision, because a store that authenticates is a store that can be argued with.
// ─────────────────────────────────────────────────────────────────────────────

/** One deposited message. */
export interface Envelope {
  /** Producer-supplied opaque payload. Untrusted. Never eval'd, never trusted. */
  body: unknown;
  /** Provenance label recorded at deposit — advisory, not an authentication. */
  source: string;
  /** Milliseconds since the epoch at deposit. */
  at: number;
}

/** A durable single-consumer inbox. */
export interface MailboxHost {
  /** Publish an envelope so a consumer can claim it. */
  deposit(envelope: Envelope): Promise<void>;
  /** Take everything waiting, atomically. Empty is the normal case. */
  claim(): Promise<Envelope[]>;
  /** How many envelopes are deposited and unclaimed. */
  pending(): Promise<number>;
}
