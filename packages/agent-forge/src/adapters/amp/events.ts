import type { CanonicalEvent } from '../../core/index.js';

/**
 * Canonical event → Amp plugin `on()` event name — ONLY the documented
 * subset [AM2][AM7]: `session.start`, `tool.call`, `tool.result`,
 * `agent.start`, `agent.end`. Amp's plugin API is TS-native, not a payload
 * schema this adapter translates — every other canonical event has no
 * verified Amp counterpart and stays unmapped rather than guessed.
 */
export const canonicalToAmp: Partial<Record<CanonicalEvent, string>> = {
  'session.start': 'session.start',
  'tool.use.pre': 'tool.call',
  'tool.use.post': 'tool.result',
  'subagent.start': 'agent.start',
  'subagent.end': 'agent.end',
};

export const ampToCanonical: Record<string, CanonicalEvent> =
  Object.fromEntries(
    Object.entries(canonicalToAmp).map(([canonical, amp]) => [
      amp,
      canonical as CanonicalEvent,
    ]),
  );
