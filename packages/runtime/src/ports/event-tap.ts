// ─────────────────────────────────────────────────────────────────────────────
// The event-tap capability PORT — a harness-neutral observer contract.
//
// Lifted verbatim from the build host's runtime port (forge's
// `runtime/event-tap/port.ts`). An event is named by {@link EventName} — a NAME,
// with no taxonomy behind it here: which names are valid is a corpus fact this host
// reads from its config. This file is a pure INTERFACE surface — no implementation. Each runtime
// target (a claude host, a codex host, …) supplies exactly one implementation as
// a runtime plugin's `eventTap`; a runtime domain module codes against this port.
// ─────────────────────────────────────────────────────────────────────────────

import type { EventName } from '../events.js';

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
  event: EventName;
  /** The verbatim occurrence payload the host surfaced. */
  payload: unknown;
}

/** Whether a tap is currently attached, and to which lifecycle events. */
export interface EventTapStatus {
  attached: boolean;
  events: EventName[];
}

/**
 * Harness-neutral port: attach a passive observer to a set of lifecycle events,
 * read back what it captured, and detach it cleanly (zero residue). The
 * dependency-inversion contract a runtime domain module codes against; each
 * target supplies exactly one implementation.
 *
 * The methods are BARE (`install`, not `installTap`): the receiver already
 * carries the sign, so re-spelling it in the member is stutter — which is why
 * `readCapture`/`status` were already bare and the other two were not.
 */
export interface EventTapHost {
  install(events: EventName[], sink: CaptureSink): void;
  remove(): void;
  readCapture(): CaptureRow[];
  status(): EventTapStatus;
}
