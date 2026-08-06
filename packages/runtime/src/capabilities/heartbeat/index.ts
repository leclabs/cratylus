// The heartbeat capability: a periodic system event, and nothing else.
//
// The mailbox that used to live here — `EnvelopeStore`, `PushHost`, the frame stream — moved
// to `capabilities/provisional-mailbox/`. It is real, tested machinery whose ANCHOR has not
// been derived, which is exactly what the `provisional-` prefix is for. It was never part of
// this concept; a heartbeat that drains mail is a heartbeat doing a subscriber's job.

export type {
  Clock,
  HeartbeatHost,
  HostStatus,
  PeriodConfig,
  Tick,
  TimerHandle,
} from '../../ports/heartbeat.js';
export { Period, type PeriodDeps } from './period.js';
