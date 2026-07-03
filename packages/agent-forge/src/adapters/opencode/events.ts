import type { CanonicalEvent } from '../../core/index.js';

/**
 * Canonical event → OpenCode plugin event name — ONLY the [OC5]-verified
 * subset (`tool.execute.before`/`after`, `session.created`, `file.edited`).
 * The wider plugin surface (session.deleted, session.idle,
 * permission.asked/replied, tui.toast.show, file.watcher.updated,
 * command.executed, session.compacted) is UNVERIFIED in current opencode
 * plugin docs and stays excluded until re-verified — mapping an unverified
 * name (and the `agent.idle`/`turn.end` → `session.idle` collision that came
 * with it) is a fabrication risk, not a documented dialect.
 */
export const canonicalToOpencode: Partial<Record<CanonicalEvent, string>> = {
  'session.start': 'session.created',
  'tool.use.pre': 'tool.execute.before',
  'tool.use.post': 'tool.execute.after',
  'file.edit.post': 'file.edited',
};

export const opencodeToCanonical: Record<string, CanonicalEvent> =
  Object.fromEntries(
    Object.entries(canonicalToOpencode).map(([canonical, oc]) => [
      oc,
      canonical as CanonicalEvent,
    ]),
  );
