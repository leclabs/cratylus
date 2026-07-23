// ─────────────────────────────────────────────────────────────────────────────
// @leclabs/agent-memory — the memory runtime-capability PLUGIN (was the standalone
// `memory` tool). The `.` export surface:
//   - `runtimePlugin`  — the RuntimePlugin the runtime loader (S3) registers.
//   - `AgentMemory`    — the MemoryStrategy implementation (bind a home explicitly).
//   - `seedTemplates`  — the memory store seed templates agent-forge (S6) imports.
//   - `main`/`runMain` — the argv dispatcher the `agent-runtime memory <verb>`
//                        surface (S3) delegates to; the tool ships NO `memory` bin.
// `seedTemplates` is also reachable at the `./seedTemplates` subpath.
// ─────────────────────────────────────────────────────────────────────────────

export { runtimePlugin } from './plugin.js';
export { AgentMemory, type AgentMemoryOptions } from './strategy.js';
export { seedTemplates } from './seeds.js';
export { main, runMain, VERSION, type CliResult } from './cli.js';
