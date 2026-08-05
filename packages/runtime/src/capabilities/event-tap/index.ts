// ─────────────────────────────────────────────────────────────────────────────
// The event-tap runtime CAPABILITY — a `RuntimePlugin` providing the passive
// {@link EventTapHost} observer, reached via `cratylus-run tap <verb>`.
//
// Packaged as a capability MODULE of `@cratylus/runtime` (a subpath export,
// not a standalone `@cratylus/*` package) — see the shard's package-vs-module
// decision. It provides its own Claude harness mapping and depends on NOTHING
// from `@cratylus/forge`: the runtime→forge DAG is never inverted.
//
// The kernel (S3) registers `runtimePlugin` and routes `tap <verb>` to
// {@link dispatchTap} (the verb surface that parses the tap's own flags).
// ─────────────────────────────────────────────────────────────────────────────

import { type RuntimePlugin, defineRuntimePlugin } from '../../plugin.js';
import { EventTapHostClaude } from './claude.js';

export { EventTapHostClaude, TAP_ID } from './claude.js';
export { dispatchTap, type TapResult, type TapVerb } from './dispatch.js';
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
 * `RuntimePlugin` and dispatches `tap <verb>` to {@link dispatchTap}.
 */
export const runtimePlugin: RuntimePlugin = defineRuntimePlugin({
  name: 'event-tap',
  eventTap: new EventTapHostClaude(),
});
