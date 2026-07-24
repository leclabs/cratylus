import type { CanonicalEvent } from '../../core/hook/index.js';

/**
 * Cline's documented hook event set is exactly 6 names — no
 * `TaskComplete`/`PreCompact` (fabricated; not in the dialect) [CL2].
 */
export const canonicalToCline: Partial<Record<CanonicalEvent, string>> = {
  'session.start': 'TaskStart',
  'session.resume': 'TaskResume',
  'turn.fail': 'TaskCancel',
  'prompt.submit': 'UserPromptSubmit',
  'tool.use.pre': 'PreToolUse',
  'tool.use.post': 'PostToolUse',
};

export const clineToCanonical: Record<string, CanonicalEvent> =
  Object.fromEntries(
    Object.entries(canonicalToCline).map(([c, n]) => [
      n as string,
      c as CanonicalEvent,
    ]),
  );

/**
 * Marker comment line embedding the agent-forge hook `id` inside a generated
 * `.clinerules/hooks/<EventName>` script, so a reimport recovers it (mirrors
 * the cursor adapter's embedded-`id` reimport preservation) — never part of
 * the documented Cline hook contract itself, just this adapter's own
 * round-trip bookkeeping for the exec line that follows it.
 */
export const CLINE_HOOK_ID_MARKER = '# agent-forge:';
