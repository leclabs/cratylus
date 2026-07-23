import type { CanonicalEvent } from '../../core/index.js';

/**
 * A lifecycle moment an observer can be attached to — the harness-neutral
 * event vocabulary (session start, turn end, tool use, …). Anchored to the
 * canonical event catalog so the vocabulary is shared across the fleet, never
 * re-invented per target.
 */
export type LifecycleEvent = CanonicalEvent;

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
export interface Record {
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
  readCapture(): Record[];
  status(): TapStatus;
}
