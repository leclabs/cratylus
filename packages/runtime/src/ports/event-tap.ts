// ─────────────────────────────────────────────────────────────────────────────
// The event-tap capability PORT — a harness-neutral observer contract.
//
// Lifted verbatim from the build host's runtime port (forge's
// `runtime/event-tap/port.ts`), with the single change FORK-1 mandates: the event
// vocabulary is the runtime-owned {@link LifecycleEvent} taxonomy, NOT a forge
// import. This file is a pure INTERFACE surface — no implementation. Each runtime
// target (a claude host, a codex host, …) supplies exactly one implementation as
// a runtime plugin's `eventTap`; a runtime domain module codes against this port.
// ─────────────────────────────────────────────────────────────────────────────

import type { LifecycleEvent } from '../events.js';

/**
 * The destination a tap deposits into. PASSIVE by contract: a tap observes and
 * records, and MUST NOT block, deny, or mutate the host's control flow — it
 * emits nothing on its output channel and always yields success.
 */
export interface CaptureSink {
  /**
   * Absolute path of the append-only stream captures are written to, one
   * record per line.
   */
  path: string;
}

/**
 * One captured lifecycle occurrence. Observation order is carried by position
 * in {@link EventTapHost.readCapture}'s result — the meaningful temporal signal
 * — so no fabricated timestamp is invented.
 */
export interface CaptureRow {
  /** Which lifecycle event fired, in the neutral vocabulary. */
  event: LifecycleEvent;
  /** The verbatim occurrence payload the host surfaced. */
  payload: unknown;
}

/** Whether a tap is currently attached, and to which lifecycle events. */
export interface TapStatus {
  attached: boolean;
  events: LifecycleEvent[];
}

/**
 * Harness-neutral port: attach a passive observer to a set of lifecycle events,
 * read back what it captured, and detach it cleanly (zero residue). The
 * dependency-inversion contract a runtime domain module codes against; each
 * target supplies exactly one implementation.
 */
export interface EventTapHost {
  installTap(events: LifecycleEvent[], sink: CaptureSink): void;
  removeTap(): void;
  readCapture(): CaptureRow[];
  status(): TapStatus;
}
