// ─────────────────────────────────────────────────────────────────────────────
// HEARTBEAT — a periodic system event. That is the whole of it.
//
// THE ANCHOR, cold-decoded with zero project context: *"a signal sent out at regular,
// repeating intervals to prove that something is still alive and working … regular pulses =
// alive."* Nothing in that decode is about what anyone does in response, and neither is
// anything here.
//
// WHAT THIS PORT USED TO CARRY, AND WHY IT NO LONGER DOES. It held a `PressureGate`, a
// `GateConfig`, an `EnvelopeStore` drain, `Tick.claimed`, `Tick.consolidate`, and an
// idle-stop that counted emissions which "claimed nothing and gated false". Every one of
// those is a SUBSCRIBER's concern wearing the emitter's clothes:
//
//   · the gate answered "should the expensive work run?" — a question about consolidation,
//     using a `threshold` in a unit this runtime cannot interpret, for work it does not own.
//     `memory` already answers it, better, as `consolidationOwed()`.
//   · the drain answered "what mail arrived?" — a mailbox's question. Moved out intact.
//   · idle-stop answered "should I give up because nothing is happening?" — and a heartbeat
//     has no notion of nothing happening. Whether silence means stop is the subscriber's
//     judgement about its own work.
//
// The design rule that motivated all of it — cadence must never be the CAUSE of expensive
// work — is not lost; it is made structural. A subscriber that decides on `seq` is making
// that mistake in its own code, where it is visible, rather than being handed a verdict
// computed on its behalf. An emitter that cannot decide cannot be the cause.
//
// ON THE COLLISION WITH `ports/memory.ts`, which binds `heartbeat` as a session-lease verb
// (`register | heartbeat | release`): there is no collision, because there is no second
// concept. Both are a periodic signal from a live thing. Once this port stopped carrying a
// policy, the two readings became the same reading at two scopes — which is what the cold
// decode said all along, and what the earlier "two concepts under one sign" notice got wrong.
//
// SHAPE: copied from `ports/event-tap.ts` — a pure INTERFACE surface, no implementation.
// Each runtime target supplies one realization; a runtime domain module codes against it.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * An opaque handle returned by {@link Clock.schedule}, cancellable via
 * {@link Clock.cancel}. Deliberately `unknown` so a host may back it with a
 * `NodeJS.Timeout`, a numeric id, or a test double, with no leakage either way.
 */
export type TimerHandle = unknown;

/** Time and scheduling, injected so a test can drive the period without waiting. */
export interface Clock {
  /** Milliseconds since the epoch. */
  now(): number;
  /** Run `fn` after `delayMs`, returning a cancellable handle. */
  schedule(delayMs: number, fn: () => void): TimerHandle;
  /** Cancel a pending {@link schedule}; a no-op if it already ran. */
  cancel(handle: TimerHandle): void;
}

/**
 * One emission — the event itself, and nothing about what it is for.
 *
 * `seq` carries the temporal signal by POSITION, so nothing about the cadence has to be
 * inferred from `at`, which jitter perturbs by design.
 */
export interface Tick {
  /** 1-based monotonic ordinal within a single run. */
  seq: number;
  /** Milliseconds since the epoch at emission, per the injected {@link Clock}. */
  at: number;
}

/** How often the period fires. */
export interface PeriodConfig {
  /** Nominal interval between emissions, in milliseconds. Must be > 0. */
  periodMs: number;
  /**
   * Fraction of `periodMs` to randomize each interval by, in `[0, 1)`. Spreads a fleet of
   * hosts so whatever expensive work their subscribers do never synchronizes across the
   * fleet — the standard heartbeat decoupling. Default `0` (no jitter).
   *
   * Jitter belongs HERE and not to a subscriber, because it is a property of the emission
   * schedule rather than of any response to it.
   */
  jitterRatio?: number;
}

/** What a host reports about itself. */
export interface HostStatus {
  /** Whether the period is currently emitting. */
  running: boolean;
  /** The configured nominal interval, in milliseconds. */
  periodMs: number;
  /** Emissions produced so far in this run. */
  emitted: number;
}

/**
 * The heartbeat capability: configure a period, start it, stop it, observe it.
 *
 * There is no `drain`, no gate and no auto-stop. A subscriber that wants mail, a threshold,
 * or a reason to give up owns all three — this emits, and that is all it does.
 */
export interface HeartbeatHost {
  /** Set the period. Legal while stopped; a running host must be stopped first. */
  configure(config: PeriodConfig): void;
  /** Begin emitting. Idempotent. */
  start(): void;
  /** Stop emitting and cancel any pending schedule. Idempotent. */
  stop(): void;
  /** The emissions, in order. */
  ticks(): AsyncIterableIterator<Tick>;
  /** A snapshot of this host's own state. */
  status(): Promise<HostStatus>;
}
