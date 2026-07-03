import type { CanonicalEvent } from '../../core/index.js';

/**
 * Canonical event → Kilo plugin lifecycle-hook name.
 *
 * INFERENCE, not independently verified: [KL6] (plugins doc) confirms
 * `@kilocode/plugin` carries "tool-call interception" + "events" but the
 * ledger holds no verified event-name list (unlike opencode's [OC5] four
 * confirmed names). Kilo is documented as a 2026 rebuild on an
 * opencode-derived runtime (RETURN §0 consolidation events), so this map
 * reuses opencode's [OC5]-verified native names as the best-available,
 * disclosed inference — never fabricated beyond that lineage. Re-verify
 * against Kilo's own plugin-event docs before treating this as ground truth;
 * narrow or correct on re-verification, same discipline as opencode's own
 * unverified-name exclusion.
 */
export const canonicalToKilo: Partial<Record<CanonicalEvent, string>> = {
  'session.start': 'session.created',
  'tool.use.pre': 'tool.execute.before',
  'tool.use.post': 'tool.execute.after',
  'file.edit.post': 'file.edited',
};

export const kiloToCanonical: Record<string, CanonicalEvent> =
  Object.fromEntries(
    Object.entries(canonicalToKilo).map(([canonical, native]) => [
      native,
      canonical as CanonicalEvent,
    ]),
  );
