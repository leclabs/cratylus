// ─────────────────────────────────────────────────────────────────────────────
// The runtime-owned lifecycle-event taxonomy — RUNTIME-NATIVE (FORK-1).
//
// A LIFECYCLE EVENT is a harness-neutral moment an observer can be attached to
// (session start, turn end, tool use, …). This vocabulary is OWNED HERE, by the
// runtime host: it is the single canonical set every runtime port speaks, never
// re-invented per target. The BUILD host (agent-forge) keeps its own build-time
// event catalog and MAPS onto this taxonomy in a later shard — so this leaf has
// ZERO dependency on forge/canon/memory and imports nothing.
//
// DRY single source: the literal tuple is the one authority; the `LifecycleEvent`
// union is DERIVED from it, so the type and the runtime-iterable set never drift.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Every lifecycle event, in canonical order — the one authority for the
 * vocabulary. A `readonly` tuple so it is both runtime-iterable (a consumer may
 * enumerate/validate against it) and the source the {@link LifecycleEvent} union
 * is derived from. Dotted `domain.action[.phase]` names read as a taxonomy.
 */
export const LIFECYCLE_EVENTS = [
  'session.start',
  'session.resume',
  'session.end',
  'prompt.submit',
  'turn.end',
  'turn.fail',
  'agent.idle',
  'model.request.pre',
  'model.response.post',
  'tool.use.pre',
  'tool.use.post',
  'tool.use.fail',
  'file.edit.post',
  'file.read.pre',
  'file.change.external',
  'shell.exec.pre',
  'shell.exec.post',
  'mcp.exec.pre',
  'mcp.exec.post',
  'subagent.start',
  'subagent.end',
  'permission.request',
  'permission.deny',
  'notification',
  'context.compact.pre',
  'context.compact.post',
  'config.changed',
  'instructions.loaded',
] as const;

/**
 * A single lifecycle moment in the harness-neutral vocabulary — one of
 * {@link LIFECYCLE_EVENTS}. The union is derived from the tuple, so it is
 * exhaustive by construction. Every runtime port that names an event (e.g.
 * {@link import('./ports/event-tap.js').EventTapHost}) speaks this type.
 */
export type LifecycleEvent = (typeof LIFECYCLE_EVENTS)[number];
