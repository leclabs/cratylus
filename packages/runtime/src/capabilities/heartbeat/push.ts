// ─────────────────────────────────────────────────────────────────────────────
// ⚠ PROVISIONAL PATH — `capabilities/heartbeat/` is a PLACEHOLDER, not a
// name. See `ports/heartbeat.ts` for the full notice.
//
// HOST ADAPTER 1 of 2 — the PUSH vector, for a LIVE session.
//
// Realizes the port over an MCP notification channel: an MCP server spawned over
// stdio pushes `notifications/claude/channel` into a session that is already
// running, which wakes it even when idle. Chosen when the session is the
// harness's, not ours. The transport is injected as a {@link FrameSink} so the
// adapter is exercised end-to-end with no child process and no live harness.
//
// Deployment constraints inherited from the channel mechanism (research
// preview): first-party auth only (API key / claude.ai — not Bedrock, Vertex, or
// Foundry), Team/Enterprise gated on `channelsEnabled`, and an off-allowlist
// channel needs `--dangerously-load-development-channels`. These bind the
// DEPLOYMENT, not this file; the sibling stream adapter exists because of them.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Envelope,
  HeartbeatHost,
  HostStatus,
  PeriodConfig,
  Tick,
} from '../../ports/heartbeat.js';
import { Period, type PeriodDeps } from './period.js';

/** The JSON-RPC method a channel notification is delivered under. */
export const CHANNEL_METHOD = 'notifications/claude/channel';

/**
 * Where serialized frames go. One call per frame, newline-framing left to the
 * sink so a test can collect structured frames instead of re-parsing a stream.
 */
export interface FrameSink {
  write(frame: string): void;
}

/** The JSON-RPC 2.0 notification a tick is carried in. */
export interface ChannelFrame {
  jsonrpc: '2.0';
  method: typeof CHANNEL_METHOD;
  params: {
    /** Names the pushing channel in the `<channel source=…>` the session sees. */
    source: string;
    /** The tick, verbatim. */
    tick: Tick;
  };
}

/** Adapter-specific settings; cadence stays on {@link HeartbeatHost.configure}. */
export interface PushHostOptions extends PeriodDeps {
  /** The channel's `source` label. */
  source: string;
  /** The transport frames are written to. */
  sink: FrameSink;
}

/**
 * The push realization. Every emission is serialized as a
 * {@link CHANNEL_METHOD} notification onto the sink AND published on
 * {@link ticks}, so a consumer may observe either surface. Writes are
 * best-effort: a sink that throws must not kill the period, because a dead
 * transport is a delivery failure, not a reason to stop keeping time.
 */
export class PushHost implements HeartbeatHost {
  readonly #period: Period;
  readonly #source: string;
  readonly #sink: FrameSink;
  #pumping = false;

  constructor(options: PushHostOptions) {
    const { source, sink, ...deps } = options;
    this.#period = new Period(deps);
    this.#source = source;
    this.#sink = sink;
  }

  configure(config: PeriodConfig): void {
    this.#period.configure(config);
  }

  start(): void {
    this.#period.start();
    if (!this.#pumping) {
      this.#pumping = true;
      void this.#pump();
    }
  }

  stop(): void {
    this.#period.stop();
  }

  ticks(): AsyncIterableIterator<Tick> {
    return this.#period.ticks();
  }

  drain(): Promise<Envelope[]> {
    return this.#period.drain();
  }

  status(): Promise<HostStatus> {
    return this.#period.status();
  }

  /** Frames every emission onto the transport until the period completes. */
  async #pump(): Promise<void> {
    for await (const tick of this.#period.ticks()) {
      const frame: ChannelFrame = {
        jsonrpc: '2.0',
        method: CHANNEL_METHOD,
        params: { source: this.#source, tick },
      };
      try {
        this.#sink.write(JSON.stringify(frame));
      } catch {
        // A broken transport must not stop the pacemaker.
      }
    }
    this.#pumping = false;
  }
}
