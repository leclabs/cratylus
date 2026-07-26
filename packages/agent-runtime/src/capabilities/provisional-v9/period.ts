// ─────────────────────────────────────────────────────────────────────────────
// ⚠ PROVISIONAL PATH — `capabilities/provisional-v9/` is a PLACEHOLDER, not a
// name. See `ports/provisional-v9.ts` for the full notice.
//
// THE PERIOD ENGINE — the endogenous timing shared by every realization.
//
// Both host adapters (push · stream) differ ONLY in where a {@link Tick} goes
// once produced; producing it — schedule, jitter, drain, sample, idle-stop — is
// identical, so it lives here once. An adapter composes this and adds its
// transport. The {@link Clock} is injected, so a period is exercised
// deterministically in a test with no fake timers and no real sleeping.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Clock,
  GateConfig,
  HostStatus,
  PeriodConfig,
  PressureGate,
  Tick,
  TimerHandle,
} from '../../ports/provisional-v9.js';
import { type GateState, freshGateState, sampleGate } from './gate.js';
import type { EnvelopeStore } from './store.js';

/** Everything a period needs that it does not own. */
export interface PeriodDeps {
  store: EnvelopeStore;
  gate: PressureGate;
  gateConfig: GateConfig;
  clock: Clock;
  /** Randomness for jitter, in `[0, 1)`. Injected so jitter is testable. */
  random?: () => number;
}

/** The real time source. The default everywhere outside a test. */
export const systemClock: Clock = {
  now: () => Date.now(),
  schedule: (delayMs, fn) => setTimeout(fn, delayMs),
  cancel: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

/** One subscriber's private queue + parked reader. */
interface Subscriber {
  buffer: Tick[];
  waiting: ((r: IteratorResult<Tick>) => void) | undefined;
}

/**
 * A MULTICAST async handoff: the period pushes ticks in, and EVERY subscriber
 * pulls the full stream out. Multicast rather than one shared queue because an
 * adapter observes emissions to frame them onto its transport while the
 * capability's caller is also consuming `ticks()` — a single shared queue would
 * let those two silently split the stream, and each would see a `seq` with
 * holes. Buffers are unbounded and per-subscriber: a tick is small, and dropping
 * one would break `seq` continuity, which is the only temporal signal there is.
 */
class TickChannel {
  #subscribers = new Set<Subscriber>();
  #closed = false;

  push(tick: Tick): void {
    if (this.#closed) return;
    for (const sub of this.#subscribers) {
      const w = sub.waiting;
      if (w !== undefined) {
        sub.waiting = undefined;
        w({ value: tick, done: false });
      } else {
        sub.buffer.push(tick);
      }
    }
  }

  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    for (const sub of this.#subscribers) {
      const w = sub.waiting;
      if (w !== undefined) {
        sub.waiting = undefined;
        w({ value: undefined, done: true });
      }
    }
  }

  iterator(): AsyncIterableIterator<Tick> {
    const sub: Subscriber = { buffer: [], waiting: undefined };
    const subscribers = this.#subscribers;
    if (!this.#closed) subscribers.add(sub);
    const isClosed = () => this.#closed;
    return {
      [Symbol.asyncIterator]() {
        return this;
      },
      next(): Promise<IteratorResult<Tick>> {
        const buffered = sub.buffer.shift();
        if (buffered !== undefined) {
          return Promise.resolve({ value: buffered, done: false });
        }
        if (isClosed()) {
          subscribers.delete(sub);
          return Promise.resolve({ value: undefined, done: true });
        }
        return new Promise((resolve) => {
          sub.waiting = resolve;
        });
      },
      // Detaches THIS subscriber only — one consumer leaving must not stop the
      // period or end anyone else's stream.
      return(): Promise<IteratorResult<Tick>> {
        subscribers.delete(sub);
        sub.waiting = undefined;
        return Promise.resolve({ value: undefined, done: true });
      },
    };
  }
}

/**
 * The endogenous period. Emits a {@link Tick} every `periodMs` (± jitter),
 * each carrying whatever the store's atomic claim yielded and the gate's
 * SAMPLED verdict. Stops on {@link stop} or after `idleTicks` consecutive
 * emissions that claimed nothing and gated `false`.
 */
export class Period {
  readonly #deps: PeriodDeps;
  readonly #channel = new TickChannel();
  #config: PeriodConfig = { periodMs: 0 };
  #gateState: GateState = freshGateState();
  #timer: TimerHandle | undefined;
  #running = false;
  #emitted = 0;
  #idleRun = 0;

  constructor(deps: PeriodDeps) {
    this.#deps = deps;
  }

  configure(config: PeriodConfig): void {
    if (this.#running) {
      throw new Error('period: configure() while running — stop() first');
    }
    if (!(config.periodMs > 0)) {
      throw new Error(`period: periodMs must be > 0 (got ${config.periodMs})`);
    }
    const jitter = config.jitterRatio ?? 0;
    if (jitter < 0 || jitter >= 1) {
      throw new Error(`period: jitterRatio must be in [0, 1) (got ${jitter})`);
    }
    this.#config = config;
  }

  start(): void {
    if (this.#running) return;
    if (!(this.#config.periodMs > 0)) {
      throw new Error('period: start() before configure()');
    }
    this.#running = true;
    this.#gateState = freshGateState();
    this.#arm();
  }

  stop(): void {
    if (!this.#running) return;
    this.#running = false;
    if (this.#timer !== undefined) {
      this.#deps.clock.cancel(this.#timer);
      this.#timer = undefined;
    }
    this.#channel.close();
  }

  ticks(): AsyncIterableIterator<Tick> {
    return this.#channel.iterator();
  }

  async drain() {
    return this.#deps.store.claim();
  }

  async status(): Promise<HostStatus> {
    return {
      running: this.#running,
      periodMs: this.#config.periodMs,
      emitted: this.#emitted,
      pending: await this.#deps.store.pending(),
      idleRun: this.#idleRun,
    };
  }

  /** The next interval, jittered by ±`jitterRatio` around the nominal period. */
  #interval(): number {
    const { periodMs, jitterRatio = 0 } = this.#config;
    if (jitterRatio === 0) return periodMs;
    const random = this.#deps.random ?? Math.random;
    const swing = (random() * 2 - 1) * jitterRatio;
    return Math.max(1, Math.round(periodMs * (1 + swing)));
  }

  #arm(): void {
    this.#timer = this.#deps.clock.schedule(this.#interval(), () => {
      this.#timer = undefined;
      void this.#fire();
    });
  }

  /**
   * One emission: claim, SAMPLE the gate, publish, then re-arm. The claim is
   * awaited before the tick is published so a consumer never sees an emission
   * whose envelopes are still in flight.
   */
  async #fire(): Promise<void> {
    if (!this.#running) return;
    const claimed = await this.#deps.store.claim();
    if (!this.#running) return; // stopped while the claim was in flight
    const at = this.#deps.clock.now();
    this.#emitted += 1;
    const consolidate = sampleGate(
      this.#deps.gate,
      this.#deps.gateConfig,
      at,
      this.#gateState,
      this.#emitted,
    );
    const tick: Tick = { seq: this.#emitted, at, claimed, consolidate };
    this.#idleRun =
      claimed.length === 0 && !consolidate ? this.#idleRun + 1 : 0;
    this.#channel.push(tick);

    const limit = this.#config.idleTicks ?? 0;
    if (limit > 0 && this.#idleRun >= limit) {
      this.stop();
      return;
    }
    this.#arm();
  }
}
