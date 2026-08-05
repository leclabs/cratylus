// The claude adapter's EVENT MAP — the projection's own, and definitionally so.
//
// A map from the corpus's vocabulary onto a vendor's is neither meaning nor
// mechanism: it is the deterministic translation between them, which is the whole
// charter of this package. So the map stays here while the NAMES it maps FROM went
// to the corpus (canon's `CANONICAL_EVENTS`, per `MODEL.md:22`) — forge receives
// those as DATA on the plugin, never as an import (ARCHITECTURE property 3).
//
// THIS MAP HAD A CLONE. `runtime/capabilities/event-tap/claude-serialize.ts` carried
// the same pairs byte-identically as `lifecycleToClaude`, under a header admitting
// they were "carried here verbatim" — a vendor map inside the package ARCHITECTURE
// says "knows no harness and no corpus". The runtime now READS its native map out of
// the host config this projection emits, so there is one map and one direction of
// authority: declare → project → consume.
//
// KEYS ARE NO LONGER COMPILE-CHECKED, and that is stated rather than hidden. With
// `EventName` open, a typo here is a key that maps nothing instead of a type error.
// `canon/test/event-vocabulary.test.ts` censuses every key of this map against the
// corpus tuple — the check moved from the compiler to a gate because the vocabulary
// moved to where it is signified.

import type { EventName } from '@cratylus/schema/hook';

/**
 * Canonical event → Claude Code event name. Lifted from DESIGN.md §7 equivalence
 * matrix.
 *
 * NINETEEN pairs, leaving 9 of the corpus's 28 harness-substrate events with no
 * Claude peer. Both figures are measured here rather than quoted forward: the filing
 * that ordered this repair said 18 and 10, the second being the union over BOTH
 * shipped adapters — a different quantity wearing this one's name.
 *
 * An event without a Claude equivalent is ABSENT from this map; emitting it yields a
 * warning + skip on write. Absent ≠ fabricated: an unmapped member is a real moment
 * this harness does not fire, which is the fidelity ladder's `declare` rung.
 */
export const canonicalToClaude: Readonly<Record<EventName, string>> = {
  'session.start': 'SessionStart',
  'session.end': 'SessionEnd',
  'prompt.submit': 'UserPromptSubmit',
  'turn.end': 'Stop',
  'turn.fail': 'StopFailure',
  'agent.idle': 'TeammateIdle',
  'tool.use.pre': 'PreToolUse',
  'tool.use.post': 'PostToolUse',
  'tool.use.fail': 'PostToolUseFailure',
  'subagent.start': 'SubagentStart',
  'subagent.end': 'SubagentStop',
  notification: 'Notification',
  'context.compact.pre': 'PreCompact',
  'context.compact.post': 'PostCompact',
  'file.change.external': 'FileChanged',
  'config.changed': 'ConfigChange',
  'instructions.loaded': 'InstructionsLoaded',
  'permission.request': 'PermissionRequest',
  'permission.deny': 'PermissionDenied',
};

/**
 * Reverse map: Claude event name → canonical event. Used by `read()`.
 */
export const claudeToCanonical: Readonly<Record<string, EventName>> =
  Object.fromEntries(
    Object.entries(canonicalToClaude).map(([canonical, claude]) => [
      claude,
      canonical,
    ]),
  );
