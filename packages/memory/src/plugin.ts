// ─────────────────────────────────────────────────────────────────────────────
// memory's RUNTIME face — the `runtimePlugin` named export the runtime
// loader registers. It declares ONE capability: `memory`, provided as the
// runtime VERB-PORT ({@link memoryVerbPort}) — the argv→verb marshalling the kernel
// dispatches against (`<capability> <verb> [args]` → a verb bag consuming the
// kernel's `VerbArgs`). The verb-port re-presents the tested `memory` CLI, so
// `cratylus-run memory <verb>` IS the memory tool (home/name/$AGENT_HOME all
// resolve at call time, the c13e911 law). Addressing is by this imported binding.
//
// NB the port is NOT the raw typed {@link AgentMemory} (whose methods take
// DOMAIN-typed args, not the kernel's `VerbArgs`) — binding that directly is the
// gap the kernel's own tests could not see, because they exercised FAKE plugins;
// a dogfood against the real installed binary is what exposed it.
// AgentMemory stays the programmatic API (exported from the package index).
// ─────────────────────────────────────────────────────────────────────────────

import { defineRuntimePlugin } from '@cratylus/runtime';
import { memoryVerbPort } from './verb-port.js';

/** memory as a runtime capability plugin — provides the `memory` verb-port. */
export const runtimePlugin = defineRuntimePlugin({
  name: 'memory',
  memory: memoryVerbPort(),
});
