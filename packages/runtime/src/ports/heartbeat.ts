// ─────────────────────────────────────────────────────────────────────────────
// HEARTBEAT — the endogenous pulse.
//
// THE ANCHOR, and how it was derived. Cold decode, zero project context:
//
//   "a signal sent out at regular, repeating intervals to prove that something is
//    still alive and working … regular pulses = alive; irregular or absent pulses =
//    something's wrong."
//
// That is this capability's `Period`: self-emitted, periodic, intrinsic. Nothing external
// triggers it, which is what `endogenous` was reaching for.
//
// THE RESIDUE, STATED RATHER THAN EXPLAINED AWAY. `heartbeat` carries the CADENCE and not
// the gate. An anchor whose residue is ∅ IS σ*; this one is an approximation, and the
// shortfall is exactly the half that `PressureGate` already names. `Tick.consolidate` is the
// one seam where the two meet — the pulse SAMPLES the gate and reports its verdict; it never
// clocks a cycle, and `consolidate` stays false on every tick while pressure sits below
// threshold, however many elapse.
//
// THE FIRST DERIVATION RETURNED ⊥, AND BOTH OF ITS ERRORS ARE WORTH KEEPING.
//
//   1. `heartbeat` was disqualified A PRIORI on the occupancy collision below and never
//      reached the oracle. Occupancy is a question about THIS corpus and cannot answer what
//      a sign MEANS. Skipping the test on those grounds is how a search returns ⊥ with the
//      answer sitting untried in its own candidate list.
//   2. The concept was stated as a BUNDLE — "a pulse on a cadence that samples a gate to
//      decide whether a cycle runs" — and no sign names a bundle, because a bundle is not a
//      concept. The search found precisely this and misread it: `poll` returned the cadence
//      cleanly and lost the gate, `homeostat` returned the gate and lost the cadence. Two
//      signs each naming one half cleanly is evidence about the CUT, not about the vocabulary.
//
// OCCUPANCY, restated rather than dismissed. `ports/memory.ts` binds `heartbeat` as a
// session-lease verb (`register | heartbeat | release`). Under the cold decode these are not
// two concepts: both are "a regular pulse from a live thing" — one proves a session is alive,
// one is the agent's own cycle. That is polysemy at two scopes, which a sign is entitled to.
// If they ever must be told apart, the distinguishing word belongs on the SCOPE
// (`session-heartbeat`), never on the concept.
//
// SHAPE: copied from `ports/event-tap.ts` — a pure INTERFACE surface, no implementation.
// Each runtime target supplies one realization; a runtime domain module codes against this
// port.
//
// WIRED WITH THE RENAME, because the keyspace gate required it and was right to. The old
// header withheld `CAPABILITIES`, the `RuntimePlugin` field and the exports until the anchor
// landed — sound, and it kept the rename to a `git mv` plus a sweep. But
// `capability-keyspace.test.ts` holds a biconditional: a `ports/<b>.ts` is in the keyspace
// IFF `<b>` is NOT `provisional-`-prefixed. The prefix was standing in for "no capability
// registration yet", so dropping it without registering left this port in neither state and
// turned the gate's own exemption leg DARK — it asserts at least one exempt module exists,
// precisely so the exemption cannot be a spelling nobody uses.
//
// Still withheld: `package.json#exports`, `tsup.config.ts` entries and
// `packages/canon/src/skills/heartbeat/`. Those publish a surface, and nothing consumes this
// capability yet — a shipped export with no consumer is a promise with no caller.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * An opaque handle returned by {@link Clock.schedule}, cancellable via
 * {@link Clock.cancel}. Deliberately `unknown` so a host may back it with a
 * `NodeJS.Timeout`, a numeric id, or a test double, with no leakage either way.
 */
export type TimerHandle = unknown;

/**
 * The time source a realization pulses against. INJECTED rather than reached
 * for, so a period is exercised deterministically in a test without fake timers
 * and without sleeping real seconds.
 */
export interface Clock {
  /** Milliseconds since the epoch. */
  now(): number;
  /** Run `fn` after `delayMs`, returning a cancellable handle. */
  schedule(delayMs: number, fn: () => void): TimerHandle;
  /** Cancel a pending {@link schedule}; a no-op if it already ran. */
  cancel(handle: TimerHandle): void;
}

/**
 * One deposited item awaiting claim by a {@link HeartbeatHost.drain}.
 *
 * ⚠ SECURITY — `body` is UNTRUSTED CONTENT and reaches a model's context
 * verbatim: an inbound store read into a live session is a prompt-injection
 * surface. Producers MUST be gated as trusted-local (same user, same host, no
 * network deposit path). The transport deliberately carries `source` so a
 * consumer can refuse an envelope it did not expect; the store itself performs
 * NO trust decision, because a store that authenticates is a store that can be
 * argued with.
 */
export interface Envelope {
  /** Producer-supplied opaque payload. Untrusted. Never eval'd, never trusted. */
  body: unknown;
  /** Provenance label recorded at deposit — advisory, not an authentication. */
  source: string;
  /** Milliseconds since the epoch at deposit. */
  at: number;
}

/**
 * One emission of the endogenous period — what the capability's consumer
 * observes. `seq` carries the temporal signal by position, so nothing about the
 * cadence is inferred from `at` (which a jittered period perturbs by design).
 */
export interface Tick {
  /** 1-based monotonic ordinal within a single run. */
  seq: number;
  /** Milliseconds since the epoch at emission, per the injected {@link Clock}. */
  at: number;
  /** Envelopes this emission's drain claimed. Empty is the normal case. */
  claimed: Envelope[];
  /**
   * The gate's verdict at this instant — see {@link PressureGate}. SAMPLED on
   * the emission, never CLOCKED by it: this is `false` on every tick while
   * pressure sits below threshold, no matter how many ticks elapse.
   */
  consolidate: boolean;
}

/** How often the period fires, and when it gives up. */
export interface PeriodConfig {
  /** Nominal interval between emissions, in milliseconds. Must be > 0. */
  periodMs: number;
  /**
   * Fraction of `periodMs` to randomize each interval by, in `[0, 1)`. Spreads
   * a fleet of hosts so their expensive subharmonic work does not synchronize —
   * the standard heartbeat/compaction decoupling. Default `0` (no jitter).
   */
  jitterRatio?: number;
  /**
   * Stop automatically after this many CONSECUTIVE emissions that claimed
   * nothing and gated `false`. `0` (default) never auto-stops.
   */
  idleTicks?: number;
}

/** What a realization reports about itself, derived from live state. */
export interface HostStatus {
  /** Whether the period is currently emitting. */
  running: boolean;
  /** The configured nominal interval, in milliseconds. */
  periodMs: number;
  /** Emissions produced so far in this run. */
  emitted: number;
  /** Envelopes deposited and not yet claimed. */
  pending: number;
  /** Length of the current run of idle emissions (see {@link PeriodConfig.idleTicks}). */
  idleRun: number;
}

/**
 * The regulator the period SAMPLES. The whole rule is this: consolidation is
 * governed by pressure/salience crossing a threshold — never by the period's
 * frequency. Four independent architectures converge here (LIDA's offline
 * consolidation, CLS/wake-sleep phase gating, Generative Agents' Σ-importance
 * reflection, MemGPT's token-pressure trigger), so the pulse is cheap and
 * frequent while the work it may occasion is expensive, rare, and
 * threshold-triggered.
 */
export interface PressureGate {
  /** The current pressure reading. Unit is the gate's own; compared to a threshold. */
  read(): number;
}

/** How a {@link PressureGate} reading becomes a verdict. */
export interface GateConfig {
  /** A reading strictly BELOW this never yields a positive verdict. */
  threshold: number;
  /**
   * Minimum milliseconds between two positive verdicts. Keeps a gate parked
   * above threshold from firing on every emission while the expensive work it
   * triggers is still draining the pressure. Default `0`.
   */
  refractoryMs?: number;
}

/**
 * Harness-neutral port: configure a period, emit ticks on it, atomically claim
 * whatever was deposited since the last emission, and report live status. The
 * dependency-inversion contract a runtime domain module codes against; each
 * target supplies exactly one realization. The two known vectors are an MCP push
 * channel for a live session and an async-generator stream for a headless driver —
 * one port, N adapters, selected per deployment.
 */
export interface HeartbeatHost {
  /** Set the cadence. Must be called before {@link start}; may be re-called while stopped. */
  configure(config: PeriodConfig): void;
  /** Begin emitting on the configured period. Idempotent while already running. */
  start(): void;
  /** Stop emitting and release the pending timer. Idempotent. Ends {@link ticks}. */
  stop(): void;
  /**
   * The emission stream. Consuming it yields each {@link Tick} in `seq` order;
   * it completes when {@link stop} is called or `idleTicks` is reached.
   * MULTICAST: every call returns an independent stream that sees every
   * emission, so an adapter framing ticks onto a transport and a caller
   * consuming them do not split the sequence between them. Abandoning one
   * stream detaches only that consumer.
   */
  ticks(): AsyncIterableIterator<Tick>;
  /**
   * Atomically claim every envelope deposited since the last claim. ATOMIC means
   * exactly-once under concurrent producers AND concurrent drainers: no deposit
   * is destroyed by a claim racing it, and no envelope is returned to two
   * callers. A read-then-delete is NOT sufficient and is what this contract
   * exists to forbid.
   */
  drain(): Promise<Envelope[]>;
  /** Live status, derived from real state — correct across separate invocations. */
  status(): Promise<HostStatus>;
}
