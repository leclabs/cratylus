import type { CanonicalEvent } from '../../core/index.js';

/**
 * Canonical event → Gemini CLI event name.
 *
 * Gemini exposes 11 hook events (per April 2026 docs). It also reads
 * CLAUDE_PROJECT_DIR as a compatibility alias, but the native event names
 * are distinct (BeforeAgent/AfterAgent rather than UserPromptSubmit/Stop).
 */
export const canonicalToGemini: Partial<Record<CanonicalEvent, string>> = {
  'session.start': 'SessionStart',
  'session.end': 'SessionEnd',
  'prompt.submit': 'BeforeAgent',
  'turn.end': 'AfterAgent',
  'model.request.pre': 'BeforeModel',
  'model.response.post': 'AfterModel',
  'tool.use.pre': 'BeforeTool',
  'tool.use.post': 'AfterTool',
  'context.compact.pre': 'PreCompress',
  notification: 'Notification',
  // BeforeToolSelection [GM4][GM8] gates the model's tool CHOICE, a distinct
  // phase from tool.use.pre's per-call gate (already BeforeTool) — no
  // canonical event names this exactly. permission.request is the closest
  // existing pre-execution gate; this is an approximate binding (inference,
  // not confirmed 1:1 semantics) but is bidirectionally exercised (write +
  // reimport) like every other mapped event, so it is listed in
  // `capabilities.hooks.supported` (index.ts) rather than a silent extra.
  'permission.request': 'BeforeToolSelection',
};

export const geminiToCanonical: Record<string, CanonicalEvent> =
  Object.fromEntries(
    Object.entries(canonicalToGemini).map(([canonical, gemini]) => [
      gemini,
      canonical as CanonicalEvent,
    ]),
  );
