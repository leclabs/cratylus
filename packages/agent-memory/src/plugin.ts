// ─────────────────────────────────────────────────────────────────────────────
// agent-memory's RUNTIME face — the `runtimePlugin` named export the runtime
// loader (S3) registers. It declares ONE capability: `memory`, an {@link AgentMemory}
// instance implementing the `MemoryStrategy` port. The instance is BINDINGLESS,
// so every verb resolves the deployment's `$AGENT_HOME` at call time (the home()
// law). Addressing is by this imported binding, never a string id.
// ─────────────────────────────────────────────────────────────────────────────

import { defineRuntimePlugin } from '@leclabs/agent-runtime';
import { AgentMemory } from './strategy.js';

/** agent-memory as a runtime capability plugin — provides the `memory` strategy. */
export const runtimePlugin = defineRuntimePlugin({
  name: 'memory',
  memory: new AgentMemory(),
});
