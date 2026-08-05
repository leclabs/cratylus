// ─────────────────────────────────────────────────────────────────────────────
// The runtime-plugin contract — a capability package's RUNTIME face.
//
// A RUNTIME-PLUGIN is the runtime half of a capability package: it PROVIDES the
// capability-port implementations the running host binds against (a memory
// strategy, an event-tap host, …). It is a STANDALONE interface, distinct from
// the build host's `AgentPlugin` (FORK-2): a capability package exposes TWO named
// exports — `buildPlugin` (its `AgentPlugin` build face) and `runtimePlugin` (its
// `RuntimePlugin` runtime face) — never one dual-hook object. That keeps the BUILD
// DAG and the RUNTIME DAG decomplected: forge consumes `buildPlugin`; the
// runtime loader consumes `runtimePlugin`; neither reaches across.
//
// ADDRESSING IS BY IMPORTED BINDING, NEVER A STRING ID: a consumer wires a runtime
// plugin in by passing the imported object. `name` is only the namespace SEGMENT
// for reporting / per-plugin uniqueness, not an address others resolve against.
//
// CONTRACT ONLY — no loader logic. The runtime loader lands in a later shard.
// ─────────────────────────────────────────────────────────────────────────────

import type { EventTapHost } from './ports/event-tap.js';
import type { MemoryStrategy } from './ports/memory.js';

/**
 * A runtime-plugin: a capability package's declaration of which runtime capability
 * PORTS it provides. Every field is optional so a plugin may provide only memory,
 * only an event tap, or any mix — a package provides exactly the ports its
 * capability covers. The running host binds each provided port by the IMPORTED
 * binding (`runtimePlugin.memory`, `runtimePlugin.eventTap`), never a string id.
 */
export interface RuntimePlugin {
  /** The namespace segment — reporting + per-plugin uniqueness. NOT an address. */
  readonly name: string;
  /** The memory capability this package provides, as a {@link MemoryStrategy}. */
  readonly memory?: MemoryStrategy;
  /** The event-tap capability this package provides, as an {@link EventTapHost}. */
  readonly eventTap?: EventTapHost;
}

/**
 * Declare a runtime-plugin. Identity factory: returns its argument unchanged so a
 * consumer addresses the plugin (and its ports) by the IMPORTED BINDING, never a
 * string id. Mirrors the build host's `defineAgentPlugin`; a capability package's
 * `runtimePlugin` named export is the result of calling this.
 */
export function defineRuntimePlugin(plugin: RuntimePlugin): RuntimePlugin {
  return plugin;
}
