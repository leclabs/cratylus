// ─────────────────────────────────────────────────────────────────────────────
// The event-tap runtime CAPABILITY — a `RuntimePlugin` providing the passive
// {@link EventTapHost} observer, reached via `cratylus-run eventTap <verb>`.
//
// Packaged as a capability MODULE of `@cratylus/runtime` (a subpath export,
// not a standalone `@cratylus/*` package) — see the shard's package-vs-module
// decision. It provides its own Claude harness mapping and depends on NOTHING
// from `@cratylus/forge`: the runtime→forge DAG is never inverted.
//
// The kernel (S3) registers `runtimePlugin` and routes `eventTap <verb>` to
// {@link dispatchEventTap} (the verb surface that parses the tap's own flags).
//
// ONE SIGN, TWO REGISTERS: `event-tap` (the plugin `name:`, the dir basename, the
// port module) and `eventTap` (the keyspace member, the dispatch word) are the
// kebab/camel faces of a single anchor. The abbreviation `tap` is NOT a third
// sign and is not accepted anywhere — see `dispatch.ts`'s header.
// ─────────────────────────────────────────────────────────────────────────────

import { type RuntimePlugin, defineRuntimePlugin } from '../../plugin.js';
import { EventTapHostClaude } from './claude.js';

export { EventTapHostClaude, EVENT_TAP_ID } from './claude.js';
export {
  dispatchEventTap,
  type EventTapResult,
  type EventTapVerb,
} from './dispatch.js';
export {
  buildTapBlock,
  type ClaudeHooksBlock,
  claudeToLifecycle,
  lifecycleToClaude,
  mergeJsonKeys,
} from './claude-serialize.js';

/**
 * The event-tap capability's runtime face. `eventTap` is the Claude realization,
 * bound with no settings override so it is host-portable (the path resolves from
 * `$CLAUDE_SETTINGS_PATH` or the cwd default at call time). The kernel binds this
 * `RuntimePlugin` and dispatches `eventTap <verb>` to {@link dispatchEventTap}.
 */
export const runtimePlugin: RuntimePlugin = defineRuntimePlugin({
  name: 'event-tap',
  eventTap: new EventTapHostClaude(),
});
