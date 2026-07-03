import type { CanonicalEvent } from '../../core/index.js';

/**
 * Canonical event → Codex CLI event name. Documented set (7 events, PascalCase):
 * PreToolUse, PostToolUse, PreCompact, PostCompact, SessionStart,
 * UserPromptSubmit, Stop [CX4]. `PermissionRequest` is NOT documented and is
 * never mapped; hooks live in `hooks.json` / `[hooks]` tables — there is no
 * documented `[features] codex_hooks` gate.
 */
export const canonicalToCodex: Partial<Record<CanonicalEvent, string>> = {
  'session.start': 'SessionStart',
  'prompt.submit': 'UserPromptSubmit',
  'tool.use.pre': 'PreToolUse',
  'tool.use.post': 'PostToolUse',
  'context.compact.pre': 'PreCompact',
  'context.compact.post': 'PostCompact',
  'turn.end': 'Stop',
};

export const codexToCanonical: Record<string, CanonicalEvent> =
  Object.fromEntries(
    Object.entries(canonicalToCodex).map(([canonical, codex]) => [
      codex,
      canonical as CanonicalEvent,
    ]),
  );
