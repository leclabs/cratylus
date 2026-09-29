// ─────────────────────────────────────────────────────────────────────────────
// The event-tap runtime CAPABILITY — a `RuntimePlugin` providing the passive
// {@link EventTapHost} observer, reached via `cratylus eventTap <verb>`.
//
// Packaged as a capability MODULE of `@cratylus/runtime` (a subpath export,
// not a standalone `@cratylus/*` package) — see the shard's package-vs-module
// decision. It depends on NOTHING from `@cratylus/forge`: the runtime→forge DAG is
// never inverted. It no longer "provides its own Claude harness mapping" either —
// that sentence described a byte-identical copy of forge's map. The map arrives as
// configuration the projection emitted (ARCHITECTURE property 4).
//
// The kernel registers `runtimePlugin` and routes `eventTap <verb>` to
// {@link dispatchEventTap} (the verb surface that parses the tap's own flags).
//
// ONE SIGN, TWO REGISTERS: `event-tap` (the plugin `name:`, the dir basename, the
// port module) and `eventTap` (the keyspace member, the dispatch word) are the
// kebab/camel faces of a single anchor. The abbreviation `tap` is NOT a third
// sign and is not accepted anywhere — see `dispatch.ts`'s header.
// ─────────────────────────────────────────────────────────────────────────────

import { type RuntimePlugin, defineRuntimePlugin } from '../../plugin.js';
import { loadRuntimeConfig, nativeEventsOf } from '../../runtime-config.js';
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

/** The Claude realization, built on first use and kept — see {@link runtimePlugin}. */
let claude: EventTapHostClaude | undefined;
function claudeHost(): EventTapHostClaude {
  claude ??= new EventTapHostClaude(
    undefined,
    nativeEventsOf(loadRuntimeConfig(), EventTapHostClaude.harness),
  );
  return claude;
}

/**
 * The event-tap capability's runtime face. `eventTap` is the Claude realization,
 * bound with no settings override so it is host-portable (the path resolves from
 * `$CLAUDE_SETTINGS_PATH` or the cwd default at call time). The kernel binds this
 * `RuntimePlugin` and dispatches `eventTap <verb>` to {@link dispatchEventTap}.
 *
 * Its native event map is Claude's stanza of the host config the projection
 * emitted, asked for by name; a host with no Claude stanza is refused, naming the
 * install and deploy that write one. The realization is built on the port's first
 * call, not when this module loads: the kernel imports this module for every
 * command, and a host that never deployed for Claude must still run every command
 * that is not the tap.
 */
export const runtimePlugin: RuntimePlugin = defineRuntimePlugin({
  name: 'event-tap',
  eventTap: {
    install: (events, sink) => claudeHost().install(events, sink),
    remove: () => claudeHost().remove(),
    readCapture: () => claudeHost().readCapture(),
    status: () => claudeHost().status(),
  },
});
