import type { CanonicalEvent } from '../../core/hook/index.js';

/**
 * Canonical event → Copilot native event name (camelCase dialect).
 *
 * Ground truth: harness-landscape-research.RETURN.md §2 "GitHub Copilot" /
 * §3 "copilot adapter" #7 [CP4]. The documented set is exactly 12 events,
 * camelCase, distinct from Claude Code's PascalCase taxonomy this adapter
 * previously (wrongly) copied verbatim.
 *
 * `turn.fail` → `errorOccurred`: the canonical taxonomy has no dedicated
 * top-level "error" event; `errorOccurred` is Copilot's generic failure
 * notification, so the closest canonical fit is a failed turn (tool-scoped
 * failures already have their own documented home: `tool.use.fail` →
 * `postToolUseFailure`).
 */
export const canonicalToCopilot: Partial<Record<CanonicalEvent, string>> = {
  'session.start': 'sessionStart',
  'prompt.submit': 'userPromptSubmitted',
  'tool.use.pre': 'preToolUse',
  'tool.use.post': 'postToolUse',
  'tool.use.fail': 'postToolUseFailure',
  'permission.request': 'permissionRequest',
  'turn.end': 'agentStop',
  'turn.fail': 'errorOccurred',
  'subagent.start': 'subagentStart',
  'subagent.end': 'subagentStop',
  notification: 'notification',
  'context.compact.pre': 'preCompact',
};

export const copilotToCanonical: Record<string, CanonicalEvent> =
  Object.fromEntries(
    Object.entries(canonicalToCopilot).map(([canonical, copilot]) => [
      copilot,
      canonical as CanonicalEvent,
    ]),
  );
