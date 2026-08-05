// ─────────────────────────────────────────────────────────────────────────────
// ⚠ PROVISIONAL PATH — `ports/provisional-v9.ts` is a PLACEHOLDER, not a name.
//
// This file realizes the mechanism of the endogenous-pacemaker capability while
// its ANCHOR is still undiscovered. The capability, stated here so this header
// leans on no other document: an endogenous pulse on a cadence that SAMPLES a
// pressure/salience gate to decide whether a cognitive cycle runs — it never
// CLOCKS one. Under `cratylism` a name is derived by cold verification, never
// coined — so the capability, the `RuntimePlugin` port field, and the skill
// directory are DELIBERATELY unnamed here. `provisional-v9` encodes only the
// shard that produced the file; it asserts nothing about the concept and is not
// a candidate signifier. It is expected to be `git mv`'d once /signify derives
// the anchor — where `⊥` is a legal answer, and a ⊥ leaves this path standing
// rather than licensing a coinage.
//
// Deliberately NOT done here, and deliberately NOT to be done by a later editor
// before the derivation lands:
//   · not added to `loader.ts`'s `CAPABILITIES`
//   · not added as a field on `plugin.ts`'s `RuntimePlugin`
//   · not added to `package.json#exports` or `tsup.config.ts` entries
//   · no `packages/canon/src/skills/<name>/`
// Nothing outside `cratylus-run` imports it, which is what keeps the eventual
// rename a `git mv` plus an identifier sweep.
//
// COLLISION NOTICE for the derivation: the word `heartbeat` is ALREADY BOUND in
// this runtime — `ports/memory.ts` uses it as a session-LEASE verb
// (`'register' | 'heartbeat' | 'release'`), which is the liveness sense, not the
// scheduling/wake-pulse sense this capability carries. Two concepts under one
// sign in one runtime is a defect; flagged, not resolved here.
//
// SHAPE: copied from `ports/event-tap.ts` — a pure INTERFACE surface, no
// implementation. Each runtime target supplies one realization; a runtime domain
// module codes against this port.
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
 * One deposited item awaiting claim by a {@link ProvisionalV9Host.drain}.
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
 * The regulator the period SAMPLES. This is the whole of O3: consolidation is
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
 * target supplies exactly one realization (per O2 the two known vectors are an
 * MCP push channel for a live session, and an async-generator stream for a
 * headless driver — one port, N adapters, selected per deployment).
 */
export interface ProvisionalV9Host {
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
