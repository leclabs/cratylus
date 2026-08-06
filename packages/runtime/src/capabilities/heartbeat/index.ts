// ─────────────────────────────────────────────────────────────────────────────
// ⚠ PROVISIONAL PATH — `capabilities/heartbeat/` is a PLACEHOLDER, not a
// name. See `ports/heartbeat.ts` for the full notice: the anchor for this
// capability is undiscovered and is /signify's to derive; `⊥` (no sign exists) is a
// legal answer there. `heartbeat` is a placeholder path and asserts nothing
// about the concept.
//
// THE CAPABILITY MODULE — mechanism only, DELIBERATELY UNREGISTERED.
//
// The sibling `capabilities/event-tap/index.ts` ends by exporting a
// `runtimePlugin`. This one CANNOT, and its absence is the point: a
// `RuntimePlugin` needs both a `name` (the dispatch word a user types) and a
// port FIELD on the `RuntimePlugin` interface, and both are anchors that must be
// derived rather than coined. So `loader.ts` and `plugin.ts` are untouched,
// nothing outside `cratylus-run` imports this, and the whole capability stays
// mechanism until the name exists. Completing the registration is the FIRST step
// after the derivation lands, not before.
//
// Still owed after /signify, in one pass:
//   1. `git mv` this directory and `../../ports/heartbeat.ts`
//   2. rename the `HeartbeatHost` port interface
//   3. add the port field to `plugin.ts`'s `RuntimePlugin`
//   4. add the capability to `loader.ts`'s `CAPABILITIES`
//   5. add a `dispatch.ts` verb surface (see `event-tap/dispatch.ts`)
//   6. add `package.json#exports` + `tsup.config.ts` entries
//   7. create the skill under `packages/canon/src/skills/<name>/`
//   8. re-check the dimension: `dimensions/trigger/scheduled-trigger.ts` already
//      exists and is selected by ZERO agents — if it is the right value, no new
//      dimension coinage is owed.
// ─────────────────────────────────────────────────────────────────────────────

export type {
  Clock,
  Envelope,
  GateConfig,
  HostStatus,
  PeriodConfig,
  PressureGate,
  HeartbeatHost,
  Tick,
  TimerHandle,
} from '../../ports/heartbeat.js';
export {
  type GateState,
  freshGateState,
  sampleGate,
} from './gate.js';
export { Period, type PeriodDeps, systemClock } from './period.js';
export {
  CHANNEL_METHOD,
  type ChannelFrame,
  type FrameSink,
  PushHost,
  type PushHostOptions,
} from './push.js';
export { EnvelopeStore, type StoreLayout } from './store.js';
export {
  defaultRender,
  StreamHost,
  type StreamHostOptions,
  type StreamMessage,
} from './stream.js';
