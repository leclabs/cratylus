// ─────────────────────────────────────────────────────────────────────────────
// ⚠ PROVISIONAL PATH — `capabilities/provisional-v9/` is a PLACEHOLDER, not a
// name. See `ports/provisional-v9.ts` for the full notice.
//
// THE SAMPLING GATE — the whole of the pressure-not-cadence rule, in one function.
//
// The period SAMPLES this gate; it never CLOCKS it. The distinction is the
// design: a cheap, frequent pulse looks at a regulator, and the regulator alone
// decides whether the expensive subharmonic work happens. Consolidation
// triggered every Nth emission would make cadence the cause, which four
// independent architectures reject — LIDA consolidates offline on a separate
// timescale from the 10 Hz cycle, CLS/wake-sleep gates replay on the sleep
// PHASE, Generative Agents reflect when Σ-importance crosses a threshold, and
// MemGPT compacts on token PRESSURE. The distributed-systems split is the same
// shape: heartbeat (cheap, frequent) decoupled from compaction (expensive, rare,
// threshold-triggered, jittered).
//
// The emission ordinal is passed to {@link sampleGate} and DELIBERATELY IGNORED.
// It is in the signature so that the law is executable rather than merely
// documented: `test/provisional-v9.test.ts` sweeps 64 consecutive ordinals at a
// fixed reading and asserts the verdict never changes.
// ─────────────────────────────────────────────────────────────────────────────

import type { GateConfig, PressureGate } from '../../ports/provisional-v9.js';

/** The mutable bookkeeping a sampler carries between emissions. */
export interface GateState {
  /** Clock reading at the last positive verdict, or `undefined` if none yet. */
  lastFiredAt: number | undefined;
}

/** A fresh sampler state. */
export function freshGateState(): GateState {
  return { lastFiredAt: undefined };
}

/**
 * Decide whether this emission should occasion consolidation.
 *
 * Positive only when the gate's own reading is at or above `threshold` and the
 * refractory window since the last positive verdict has elapsed. Pressure is
 * necessary; cadence is never sufficient.
 *
 * @param seq the emission ordinal — RECEIVED AND DELIBERATELY UNUSED. Reading it
 *   would be the exact defect this function exists to preclude.
 */
export function sampleGate(
  gate: PressureGate,
  config: GateConfig,
  now: number,
  state: GateState,
  seq: number,
): boolean {
  void seq;
  if (!(gate.read() >= config.threshold)) return false;

  const refractory = config.refractoryMs ?? 0;
  const last = state.lastFiredAt;
  if (refractory > 0 && last !== undefined && now - last < refractory) {
    return false;
  }
  state.lastFiredAt = now;
  return true;
}
