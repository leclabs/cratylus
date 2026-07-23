// ─────────────────────────────────────────────────────────────────────────────
// The event-tap capability's CLAUDE HARNESS-MAPPING boundary.
//
// This is the ONE place the runtime-owned {@link LifecycleEvent} taxonomy is
// mapped onto the Claude-native settings.json vocabulary (native event names +
// the `hooks` block shape). It is a RELOCATED, minimal slice of what agent-forge's
// `adapters/claude/{events,write}.ts` + `core/engine/managed.ts` own for the BUILD
// path — carried here verbatim so the runtime capability owns its harness mapping
// and NEVER imports `@leclabs/agent-forge` (the runtime→forge DAG is never
// inverted). Only what the passive tap needs is relocated: the event maps, the
// key-scoped JSON merge, and the single-command hook-block shape — not forge's
// full `Hook` serialization (matchers, `if`, prompt-type, timeouts).
// ─────────────────────────────────────────────────────────────────────────────

import type { LifecycleEvent } from '../../events.js';

/**
 * Runtime lifecycle event → Claude Code native event name. The DESIGN.md §7
 * equivalence matrix, as owned by the Claude harness boundary. A lifecycle event
 * with NO Claude equivalent is absent from this map; the tap silently skips it on
 * install (a passive observer never fabricates a native binding).
 */
export const lifecycleToClaude: Partial<Record<LifecycleEvent, string>> = {
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
 * Reverse map: Claude native event name → runtime lifecycle event. Used by
 * `readCapture` (to lift a captured native record back to the neutral vocabulary)
 * and by `status` (to report which lifecycle events the tap is attached to).
 */
export const claudeToLifecycle: Record<string, LifecycleEvent> =
  Object.fromEntries(
    Object.entries(lifecycleToClaude).map(([lifecycle, claude]) => [
      claude,
      lifecycle as LifecycleEvent,
    ]),
  );

/**
 * The Claude `settings.json` `hooks` block shape: native-event → entries, each
 * entry an optional matcher + one-or-more hook commands. The tap only ever emits
 * a single `command` hook stamped with its own id, but foreign entries under the
 * same event use the full shape, so the type stays faithful to what may be read.
 */
export type ClaudeHooksBlock = Record<
  string,
  Array<{
    matcher?: string;
    if?: string;
    hooks: Array<{
      type: string;
      command?: string;
      prompt?: string;
      timeout?: number;
      /** The stable id a tap entry is stamped with, so teardown finds it. */
      id?: string;
      env?: Record<string, string>;
    }>;
  }>
>;

/**
 * Build the tap's own `hooks` block: one `command` entry per MAPPED lifecycle
 * event, each stamped with `tapId` so surgical teardown can find exactly it.
 * Unmapped events are skipped (returned in `skipped`) — never fabricated.
 */
export function buildTapBlock(
  events: LifecycleEvent[],
  command: string,
  tapId: string,
): { block: ClaudeHooksBlock; skipped: LifecycleEvent[] } {
  const block: ClaudeHooksBlock = {};
  const skipped: LifecycleEvent[] = [];
  for (const event of events) {
    const native = lifecycleToClaude[event];
    if (native === undefined) {
      skipped.push(event);
      continue;
    }
    const entries = block[native] ?? [];
    entries.push({ hooks: [{ type: 'command', command, id: tapId }] });
    block[native] = entries;
  }
  return { block, skipped };
}

/**
 * Key-scoped JSON merge (relocated from forge's `core/engine/managed.ts`): parse
 * `existing` (undefined/blank ⇒ `{}`), set the owned top-level keys, leave every
 * foreign key untouched. Returns the serialized document (2-space indent, trailing
 * newline). Throws on invalid JSON — a corrupt target must refuse, never be
 * clobbered. This is the passive-preservation primitive: a tap merges only the
 * `hooks` key it owns; permissions/env/etc. survive byte-untouched.
 */
export function mergeJsonKeys(
  existing: string | undefined,
  owned: Record<string, unknown>,
): string {
  const base: Record<string, unknown> =
    existing === undefined || existing.trim() === ''
      ? {}
      : (JSON.parse(existing) as Record<string, unknown>);
  const merged = { ...base, ...owned };
  return `${JSON.stringify(merged, null, 2)}\n`;
}
