// ─────────────────────────────────────────────────────────────────────────────
// The event-tap runtime CAPABILITY — a `RuntimePlugin` providing the passive
// {@link EventTapHost} observer, reached via `cratylus-run eventTap <verb>`.
//
// Packaged as a capability MODULE of `@cratylus/runtime` (a subpath export,
// not a standalone `@cratylus/*` package) — see the shard's package-vs-module
// decision. It depends on NOTHING from `@cratylus/forge`: the runtime→forge DAG is
// never inverted. It no longer "provides its own Claude harness mapping" either —
// that sentence described a byte-identical copy of forge's map. The map arrives as
// configuration the projection emitted (ARCHITECTURE property 4).
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
import { loadRuntimeConfig } from '../../runtime-config.js';
import { EventTapHostClaude } from './claude.js';

export { EventTapHostClaude, EVENT_TAP_ID } from './claude.js';
export {
  dispatchEventTap,
  type EventTapDispatchOpts,
  type EventTapResult,
  type EventTapVerb,
} from './dispatch.js';
export {
  buildEventTapBlock,
  type ClaudeHooksBlock,
  mergeJsonKeys,
  reverseNativeEvents,
} from './claude-serialize.js';

/**
 * The event-tap capability's runtime face. `eventTap` is the Claude realization,
 * bound with no settings override so it is host-portable (the path resolves from
 * `$CLAUDE_SETTINGS_PATH` or the cwd default at call time). The kernel binds this
 * `RuntimePlugin` and dispatches `eventTap <verb>` to {@link dispatchEventTap}.
 *
 * Its native event map comes from the host config the projection emitted, and is
 * `{}` on a host that has never been deployed to — an empty map attaches nothing,
 * which is the correct floor for a PASSIVE observer with no vocabulary to observe.
 * The verb surface refuses out loud before reaching this instance, so an operator
 * gets the diagnosis rather than the silence.
 */
export const runtimePlugin: RuntimePlugin = defineRuntimePlugin({
  name: 'event-tap',
  eventTap: new EventTapHostClaude(
    undefined,
    loadRuntimeConfig()?.events?.native ?? {},
  ),
});
